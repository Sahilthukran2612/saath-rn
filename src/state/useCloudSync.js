import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useStore } from './store';
import { setupPush } from '../services/push';
import {
  cloudConfig,
  createInvite,
  fetchFeed,
  flush,
  isConfigured,
  listCircles,
  listMembers,
  saveDeviceToken,
  setPersonName,
} from '../services/cloud';

const POLL_MS = 30000;

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
  const latest = useRef(state);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    latest.current = state;
  });

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
        const r = await createInvite(cfg, cloud, inv);
        keep(r.session);
        if (r.ok) dispatch({ type: 'INVITE_SYNCED', id: inv.id });
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
