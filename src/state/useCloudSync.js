import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useStore } from './store';
import { setupPush } from '../services/push';
import { sanitizePlan } from '../carePlan';
import { readingsToPush } from '../readingsSync';
import { looksAfterOthers } from '../who';
import {
  cloudConfig,
  createInvite,
  fetchFeed,
  fetchLatestPlan,
  fetchReadings,
  pushReadings,
  flush,
  isConfigured,
  listCircles,
  listMembers,
  saveDeviceToken,
  setPersonName,
} from '../services/cloud';

const POLL_MS = 30000;

// The Send now button asks for a pass right away instead of waiting for the next 30 seconds.
const listeners = new Set();
export const requestSync = () => listeners.forEach((f) => f());

// One sync pass at a time, in order (refresh tokens rotate, so two passes must never race):
// 1. send waiting events, 2. publish new invites, 3. share my name, 4. read the circles I am in
// and their latest events. Quiet when offline, signed out, or with no server configured.
export default function useCloudSync() {
  const { state, dispatch } = useStore();
  const { access, householdId } = state.cloud;
  const waiting = state.outbox.length;
  const unsent = state.invites.filter((i) => i.status === 'pending' && !i.cloud).length;
  const name = state.profile.name;
  const busy = useRef(false);
  const pushTried = useRef('');
  const restored = useRef('');
  const latest = useRef(state);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    latest.current = state;
  });

  useEffect(() => {
    const f = () => setTick((n) => n + 1);
    listeners.add(f);
    return () => listeners.delete(f);
  }, []);

  useEffect(() => {
    if (!access) return undefined;
    const h = setInterval(() => setTick((n) => n + 1), POLL_MS);
    return () => clearInterval(h);
  }, [access]);

  useEffect(() => {
    const cfg = cloudConfig();
    if (!state.hydrated || !isConfigured(cfg) || !access || busy.current) return;
    if (AppState.currentState === 'background') return; // only skip while the app is truly in the background
    busy.current = true;
    (async () => {
      let cloud = latest.current.cloud;
      const keep = (session) => {
        if (!session) return;
        cloud = { ...cloud, ...session };
        dispatch({ type: 'CLOUD_SET', patch: session });
      };

      const out = latest.current.outbox;
      if (out.length && householdId) {
        const r = await flush(cfg, cloud, out);
        keep(r.session);
        if (r.sentIds.length) dispatch({ type: 'OUTBOX_SENT', ids: r.sentIds });
      }

      for (const inv of latest.current.invites.filter((i) => i.status === 'pending' && !i.cloud)) {
        let r;
        try {
          r = await createInvite(cfg, cloud, inv);
        } catch {
          r = { ok: false, status: 'net' }; // no connection: the invite stays waiting
        }
        keep(r.session);
        if (r.ok) dispatch({ type: 'INVITE_SYNCED', id: inv.id });
        keep({ inviteFail: r.ok ? null : r.status || 'net' });
      }

      const nm = latest.current.profile.name;
      if (householdId && nm && cloud.sentName !== nm) {
        const r = await setPersonName(cfg, cloud, nm);
        keep(r.session);
        if (r.ok) keep({ sentName: nm });
      }

      if (householdId) {
        const m = await listMembers(cfg, cloud);
        keep(m.session);
        if (m.ok) dispatch({ type: 'JOINED_SET', members: m.members });
      }

      // Sugar readings for a doctor: sent only while a doctor who joined my circle is at Full (src/readingsSync.js).
      {
        const rows = readingsToPush(latest.current);
        if (rows.length) {
          const r = await pushReadings(cfg, cloud, rows);
          keep(r.session);
          if (r.ok) dispatch({ type: 'READINGS_SYNCED', at: Date.parse(rows[rows.length - 1].at) });
        }
      }

      // The newest care plan a clinician in my circle published for me. It is applied by itself and shown with who set it.
      if (householdId) {
        const p = await fetchLatestPlan(cfg, cloud, householdId);
        keep(p.session);
        const clean = p.ok && p.row ? sanitizePlan(p.row.plan) : null;
        if (clean)
          dispatch({
            type: 'PLAN_APPLY',
            plan: clean,
            version: p.row.created_at,
            author: p.row.author_name,
            at: Date.now(),
          });
      }

      // My own sugar readings, once per run: on a new phone, or after the data was cleared, they come back from the
      // server. Only for the person's own household, never for someone who only looks after others.
      if (householdId && restored.current !== householdId && !looksAfterOthers(latest.current)) {
        const r = await fetchReadings(cfg, cloud, householdId);
        keep(r.session);
        if (r.ok) {
          restored.current = householdId;
          dispatch({ type: 'READINGS_RESTORE', readings: r.readings });
        }
      }

      // This phone's push address, once per app run and language: so alerts arrive with Saath closed.
      const lang = latest.current.lang;
      if (pushTried.current !== lang) {
        pushTried.current = lang;
        const p = await setupPush();
        if (p.ok) {
          const saved = await saveDeviceToken(cfg, cloud, p.token, lang);
          keep(saved.session);
          keep(saved.ok ? { pushToken: p.token, pushState: 'on' } : { pushState: 'error' });
        } else {
          keep({ pushState: p.reason });
        }
      }

      const c = await listCircles(cfg, cloud);
      keep(c.session);
      if (c.ok) {
        dispatch({ type: 'CIRCLES_SET', circles: c.circles });
        for (const circle of c.circles) {
          const f = await fetchFeed(cfg, cloud, circle.household_id);
          keep(f.session);
          if (f.ok) dispatch({ type: 'FEED_SET', id: circle.household_id, events: f.events });
        }
      }
    })()
      .catch(() => {
        // a failed pass is simply tried again on the next tick
      })
      .finally(() => {
        busy.current = false;
      });
  }, [state.hydrated, access, householdId, waiting, unsent, name, tick, dispatch]);
}
