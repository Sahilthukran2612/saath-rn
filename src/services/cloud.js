// Cloud sync client for Saath. It talks plain HTTP to a Supabase-compatible server (Auth + PostgREST,
// see docs/supabase/schema.sql), so the server address is configuration, not code. If the default
// domain is ever blocked again, point EXPO_PUBLIC_SAATH_API_URL at a custom domain or proxy.
//
// Status: written and tested against a mocked fetch. NOT run against a real Supabase project yet.
// Nothing here ever throws or blocks the app: offline-first means a failed call just means "try later".
import { validPhone } from '../logic';

const TIMEOUT_MS = 8000;
export const BATCH_MAX = 50;

// Read at call time so tests (and a rebuilt app) can change it.
export const cloudConfig = () => ({
  url: String(process.env.EXPO_PUBLIC_SAATH_API_URL || '').replace(/\/+$/, ''),
  key: String(process.env.EXPO_PUBLIC_SAATH_ANON_KEY || ''),
});

export const isConfigured = (cfg = cloudConfig()) => Boolean(cfg.url && cfg.key);

export const toE164 = (phone) => `+91${String(phone).replace(/\D/g, '').slice(-10)}`;

async function call(cfg, path, { method = 'GET', body, token, prefer } = {}, fetchImpl = fetch) {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetchImpl(`${cfg.url}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        apikey: cfg.key,
        Authorization: `Bearer ${token || cfg.key}`,
        ...(prefer ? { Prefer: prefer } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: ctl.signal,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      // empty body (for example 201 with return=minimal)
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null }; // no network, timeout, or blocked
  } finally {
    clearTimeout(timer);
  }
}

const sessionOf = (d) => ({ access: d.access_token, refresh: d.refresh_token, userId: d.user?.id ?? null });

export async function requestOtp(cfg, phone, fetchImpl) {
  if (!isConfigured(cfg) || !validPhone(phone)) return { ok: false, reason: 'invalid' };
  const r = await call(cfg, '/auth/v1/otp', { method: 'POST', body: { phone: toE164(phone), create_user: true } }, fetchImpl);
  return r.ok ? { ok: true } : { ok: false, reason: r.status === 0 ? 'network' : 'rejected' };
}

// Check the SMS code, then find or create this person's household. Returns what to keep in state.
export async function signIn(cfg, phone, code, fetchImpl, personName = '') {
  if (!isConfigured(cfg) || !validPhone(phone)) return { ok: false, reason: 'invalid' };
  const v = await call(
    cfg,
    '/auth/v1/verify',
    { method: 'POST', body: { type: 'sms', phone: toE164(phone), token: String(code).trim() } },
    fetchImpl
  );
  if (!v.ok || !v.data?.access_token) return { ok: false, reason: v.status === 0 ? 'network' : 'code' };
  const s = sessionOf(v.data);
  const found = await call(cfg, `/rest/v1/households?select=id&person_user_id=eq.${s.userId}`, { token: s.access }, fetchImpl);
  let householdId = found.ok ? found.data?.[0]?.id : null;
  if (!householdId) {
    const made = await call(
      cfg,
      '/rest/v1/households',
      { method: 'POST', token: s.access, prefer: 'return=representation', body: { person_user_id: s.userId, person_name: personName } },
      fetchImpl
    );
    householdId = made.ok ? made.data?.[0]?.id : null;
  }
  if (!householdId) return { ok: false, reason: 'household' };
  return { ok: true, cloud: { phone: String(phone).replace(/\D/g, '').slice(-10), ...s, householdId } };
}

export async function refreshSession(cfg, refresh, fetchImpl) {
  const r = await call(cfg, '/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: refresh } }, fetchImpl);
  return r.ok && r.data?.access_token ? { ok: true, session: sessionOf(r.data) } : { ok: false };
}

const row = (householdId, e) => ({
  household_id: householdId,
  event_type: e.eventType,
  kind: e.kind,
  detail: e.detail || null,
});

// Send waiting events in one request, so they arrive together or not at all. A 401 means the token
// ran out: refresh once and retry. Returns the ids that were accepted and any new tokens to keep.
export async function flush(cfg, cloud, outbox, fetchImpl) {
  const batch = outbox.slice(0, BATCH_MAX);
  if (!isConfigured(cfg) || !cloud?.access || !cloud?.householdId || batch.length === 0) {
    return { sentIds: [], session: null };
  }
  const send = (token) =>
    call(cfg, '/rest/v1/events', { method: 'POST', token, prefer: 'return=minimal', body: batch.map((e) => row(cloud.householdId, e)) }, fetchImpl);
  let r = await send(cloud.access);
  let session = null;
  if (r.status === 401 && cloud.refresh) {
    const n = await refreshSession(cfg, cloud.refresh, fetchImpl);
    if (n.ok) {
      session = n.session;
      r = await send(session.access);
    }
  }
  return { sentIds: r.ok ? batch.map((e) => e.id) : [], session };
}

// ---- Circle side: join with a code, list the circles I am in, read their events ----

// Run an authorised call; on 401 refresh once and retry. Returns the result and any new tokens.
async function withAuth(cfg, cloud, run, fetchImpl) {
  if (!isConfigured(cfg) || !cloud?.access) return { res: { ok: false, status: 0, data: null }, session: null };
  let res = await run(cloud.access);
  let session = null;
  if (res.status === 401 && cloud.refresh) {
    const n = await refreshSession(cfg, cloud.refresh, fetchImpl);
    if (n.ok) {
      session = n.session;
      res = await run(session.access);
    }
  }
  return { res, session };
}

// The person's own name, shown to their circle. Best effort.
export async function setPersonName(cfg, cloud, name, fetchImpl) {
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) =>
      call(cfg, `/rest/v1/households?id=eq.${cloud.householdId}`, { method: 'PATCH', token, body: { person_name: String(name || '') } }, fetchImpl),
    fetchImpl
  );
  return { ok: res.ok, session };
}

// Publish an invite made on this phone so the invited person's phone can accept it.
export async function createInvite(cfg, cloud, inv, fetchImpl) {
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) =>
      call(
        cfg,
        '/rest/v1/invites',
        { method: 'POST', token, prefer: 'return=minimal', body: { household_id: cloud.householdId, name: inv.name, role: inv.role, code: inv.code } },
        fetchImpl
      ),
    fetchImpl
  );
  // 409 means the code is already there (sent before, reply lost): count that as done
  return { ok: res.ok || res.status === 409, session };
}

export async function acceptInvite(cfg, cloud, code, fetchImpl) {
  const clean = String(code || '').trim();
  if (clean.length < 4) return { ok: false, reason: 'invalid', session: null };
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) => call(cfg, '/rest/v1/rpc/accept_invite', { method: 'POST', token, body: { invite_code: clean } }, fetchImpl),
    fetchImpl
  );
  if (res.ok) return { ok: true, householdId: res.data, session };
  return { ok: false, reason: res.status === 0 ? 'network' : 'invalid', session };
}

export async function listCircles(cfg, cloud, fetchImpl) {
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) => call(cfg, '/rest/v1/my_circles?select=household_id,role,dial,time_off,person_name', { token }, fetchImpl),
    fetchImpl
  );
  return { ok: res.ok && Array.isArray(res.data), circles: Array.isArray(res.data) ? res.data : [], session };
}

export async function fetchFeed(cfg, cloud, householdId, fetchImpl) {
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) =>
      call(
        cfg,
        `/rest/v1/events?household_id=eq.${encodeURIComponent(householdId)}&select=id,event_type,kind,detail,created_at&order=created_at.desc&limit=30`,
        { token },
        fetchImpl
      ),
    fetchImpl
  );
  return { ok: res.ok && Array.isArray(res.data), events: Array.isArray(res.data) ? res.data : [], session };
}