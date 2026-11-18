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

// Find this person's household, or make it. Shared by both ways of signing in.
async function ensureHousehold(cfg, s, personName, fetchImpl) {
  const found = await call(cfg, `/rest/v1/households?select=id,person_name&person_user_id=eq.${s.userId}`, { token: s.access }, fetchImpl);
  let household = found.ok ? found.data?.[0] : null;
  if (!household?.id) {
    const made = await call(
      cfg,
      '/rest/v1/households',
      { method: 'POST', token: s.access, prefer: 'return=representation', body: { person_user_id: s.userId, person_name: personName } },
      fetchImpl
    );
    household = made.ok ? made.data?.[0] : null;
  }
  return household?.id ? { id: household.id, name: household.person_name || '' } : null;
}

// Check the SMS code, then find or create this person's household. Returns what to keep in state.
// Needs an SMS provider on the server, which costs money: see signInAnonymous for the free way.
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
  const h = await ensureHousehold(cfg, s, personName, fetchImpl);
  if (!h) return { ok: false, reason: 'household' };
  return { ok: true, cloud: { phone: String(phone).replace(/\D/g, '').slice(-10), ...s, householdId: h.id }, personName: h.name };
}

// Free sign-in with no phone number and no SMS: the server makes an anonymous account for this
// phone. Circles still work, because people join by invite code, not by number. The catch: an
// anonymous account cannot be recovered. If the app's data is cleared, this account is gone and the
// circle has to invite the person again. Needs "Allow anonymous sign-ins" switched on in the project.
export async function signInAnonymous(cfg, fetchImpl, personName = '') {
  if (!isConfigured(cfg)) return { ok: false, reason: 'invalid' };
  const v = await call(cfg, '/auth/v1/signup', { method: 'POST', body: {} }, fetchImpl);
  if (!v.ok || !v.data?.access_token) return { ok: false, reason: v.status === 0 ? 'network' : 'disabled' };
  const s = sessionOf(v.data);
  const h = await ensureHousehold(cfg, s, personName, fetchImpl);
  if (!h) return { ok: false, reason: 'household' };
  return { ok: true, cloud: { phone: '', ...s, householdId: h.id }, personName: h.name };
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
        { method: 'POST', token, prefer: 'return=minimal', body: {
            household_id: cloud.householdId,
            name: inv.name,
            role: inv.role,
            code: inv.code,
            // only an account with this number can accept it
            phone: inv.phone ? String(inv.phone).replace(/\D/g, '').slice(-10) : null,
          },
        },
        fetchImpl
      ),
    fetchImpl
  );
  // 409 means the code is already there (sent before, reply lost): count that as done
  return { ok: res.ok || res.status === 409, status: res.status, session };
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
  // a wrong code comes back as null (the server keeps count of wrong tries), not as an error
  if (res.ok && res.data) return { ok: true, householdId: res.data, session };
  if (res.ok) return { ok: false, reason: 'invalid', session };
  if (res.status === 0) return { ok: false, reason: 'network', session };
  const tooMany = /too many/i.test(String(res.data?.message || ''));
  return { ok: false, reason: tooMany ? 'limit' : 'invalid', session };
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

// ---- The dial on the server: who joined, and what each may see ----

// People who joined this household from their own phones (rows with a user). The person's phone reads
// them so the Circle screen shows real members and can set what each one sees.
export async function listMembers(cfg, cloud, fetchImpl) {
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) =>
      call(
        cfg,
        `/rest/v1/members?household_id=eq.${encodeURIComponent(cloud.householdId)}&user_id=not.is.null&select=id,name,role,dial,time_off,share_contact&order=created_at.asc`,
        { token },
        fetchImpl
      ),
    fetchImpl
  );
  return { ok: res.ok && Array.isArray(res.data), members: Array.isArray(res.data) ? res.data : [], session };
}

const isDial = (d) => Number.isInteger(d) && d >= 0 && d <= 2;

// The person sets what a joined member sees: 0 safety only, 1 routine, 2 full. The database also
// enforces who may do this (only the person) and keeps a guardian at Routine or above.
export async function setMemberDial(cfg, cloud, memberId, dial, fetchImpl) {
  if (!isDial(dial)) return { ok: false, session: null };
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) =>
      call(
        cfg,
        `/rest/v1/members?id=eq.${encodeURIComponent(memberId)}`,
        { method: 'PATCH', token, prefer: 'return=minimal', body: { dial } },
        fetchImpl
      ),
    fetchImpl
  );
  return { ok: res.ok, session };
}

// A member pauses routine updates from one person (Time Off). Safety alerts are never paused: the
// database rule `can_see_event` lets safety events through whatever this is set to.
export async function setMyTimeOff(cfg, cloud, householdId, on, fetchImpl) {
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (token) =>
      call(
        cfg,
        `/rest/v1/members?household_id=eq.${encodeURIComponent(householdId)}&user_id=eq.${encodeURIComponent(cloud.userId)}`,
        { method: 'PATCH', token, prefer: 'return=minimal', body: { time_off: !!on } },
        fetchImpl
      ),
    fetchImpl
  );
  return { ok: res.ok, session };
}

// ---- Account with a phone number and a password (recoverable, works on a second phone, costs nothing) ----
// The phone number is the account name; no text message is ever sent, so there is no SMS bill. This needs the
// project's Phone provider switched on with "Enable phone confirmations" switched OFF. The trade-off, stated
// plainly: with no SMS or email, a forgotten password cannot be reset by the app.

export const PASSWORD_MIN = 8;
export const passwordOk = (p) => typeof p === 'string' && p.length >= PASSWORD_MIN;

async function finishSignIn(cfg, data, phone, personName, fetchImpl) {
  const s = sessionOf(data);
  const h = await ensureHousehold(cfg, s, personName, fetchImpl);
  if (!h) return { ok: false, reason: 'household' };
  return {
    ok: true,
    cloud: { phone: String(phone).replace(/\D/g, '').slice(-10), ...s, householdId: h.id },
    personName: h.name,
  };
}

// New account. reason: 'invalid' (bad number or short password), 'exists' (already registered),
// 'confirm' (the server still wants a confirmation text: the provider switch is not set), 'network', 'household'.
export async function signUpPassword(cfg, phone, password, fetchImpl, personName = '') {
  if (!isConfigured(cfg) || !validPhone(phone) || !passwordOk(password)) return { ok: false, reason: 'invalid' };
  const r = await call(cfg, '/auth/v1/signup', { method: 'POST', body: { phone: toE164(phone), password } }, fetchImpl);
  if (r.status === 0) return { ok: false, reason: 'network' };
  if (!r.ok) {
    const msg = String(r.data?.msg || r.data?.message || r.data?.error_description || '');
    return { ok: false, reason: /already|registered|exists/i.test(msg) ? 'exists' : 'rejected' };
  }
  if (!r.data?.access_token) return { ok: false, reason: 'confirm' };
  return finishSignIn(cfg, r.data, phone, personName, fetchImpl);
}

// Existing account, on this or another phone. reason: 'invalid', 'wrong' (number or password), 'network'.
export async function signInPassword(cfg, phone, password, fetchImpl) {
  if (!isConfigured(cfg) || !validPhone(phone) || !passwordOk(password)) return { ok: false, reason: 'invalid' };
  const r = await call(
    cfg,
    '/auth/v1/token?grant_type=password',
    { method: 'POST', body: { phone: toE164(phone), password } },
    fetchImpl
  );
  if (r.status === 0) return { ok: false, reason: 'network' };
  if (!r.ok || !r.data?.access_token) return { ok: false, reason: 'wrong' };
  return finishSignIn(cfg, r.data, phone, '', fetchImpl);
}

// ---- Push: this phone's address, so the server can send it a notification ----

export async function saveDeviceToken(cfg, cloud, token, lang, fetchImpl) {
  if (!token) return { ok: false, session: null };
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (access) =>
      call(
        cfg,
        '/rest/v1/device_tokens?on_conflict=token',
        {
          method: 'POST',
          token: access,
          prefer: 'resolution=merge-duplicates,return=minimal',
          body: { token, lang: lang === 'hi' ? 'hi' : 'en', user_id: cloud.userId, updated_at: new Date().toISOString() },
        },
        fetchImpl
      ),
    fetchImpl
  );
  return { ok: res.ok, session };
}

// On sign-out, so a phone that left the account stops getting its alerts. Best effort.
export async function deleteDeviceToken(cfg, cloud, token, fetchImpl) {
  if (!token) return { ok: true, session: null };
  const { res, session } = await withAuth(
    cfg,
    cloud,
    (access) => call(cfg, `/rest/v1/device_tokens?token=eq.${encodeURIComponent(token)}`, { method: 'DELETE', token: access, prefer: 'return=minimal' }, fetchImpl),
    fetchImpl
  );
  return { ok: res.ok, session };
}
