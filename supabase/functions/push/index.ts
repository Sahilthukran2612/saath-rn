// Supabase Edge Function: sends a push notification for a new safety event.
// Deploy:  npx supabase functions deploy push --no-verify-jwt     (the database calls it with a shared secret)
// Secrets: PUSH_SECRET (any long random string) and FCM_SERVICE_ACCOUNT (the Firebase service-account JSON).
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase itself.
// Written but NOT yet run: it needs a Firebase project (docs/PUSH.md).
import { isDeadToken, messageFor, recipients, shouldPush } from './logic.js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PUSH_SECRET = Deno.env.get('PUSH_SECRET') ?? '';
const SERVICE_ACCOUNT = JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT') ?? '{}');

const rest = (path: string, init: RequestInit = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  });

const b64url = (data: ArrayBuffer | string) => {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// A short-lived Google access token from the service account (RS256 JWT).
async function accessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(
    JSON.stringify({
      iss: SERVICE_ACCOUNT.client_email,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3300,
    })
  );
  const pem = String(SERVICE_ACCOUNT.private_key).replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${claims}`));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${header}.${claims}.${b64url(sig)}` }),
  });
  return (await res.json()).access_token;
}

Deno.serve(async (req) => {
  if (!PUSH_SECRET || req.headers.get('x-push-secret') !== PUSH_SECRET) return new Response('forbidden', { status: 403 });
  const { record } = await req.json();
  if (!shouldPush(record)) return new Response('skipped');

  const [house] = await (await rest(`households?id=eq.${record.household_id}&select=person_name`)).json();
  const members = await (
    await rest(`members?household_id=eq.${record.household_id}&user_id=not.is.null&select=user_id,dial,time_off`)
  ).json();
  const userIds = recipients(record, members).map((m: { user_id: string }) => m.user_id);
  if (userIds.length === 0) return new Response('no recipients');

  const tokens: { token: string; lang: string }[] = await (
    await rest(`device_tokens?user_id=in.(${userIds.join(',')})&select=token,lang`)
  ).json();
  if (tokens.length === 0) return new Response('no devices');

  const bearer = await accessToken();
  let sent = 0;
  for (const t of tokens) {
    const { title, body } = messageFor(record.kind, house?.person_name, t.lang);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${SERVICE_ACCOUNT.project_id}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${bearer}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token: t.token,
          notification: { title, body },
          data: { household_id: String(record.household_id), kind: String(record.kind) },
          android: { priority: 'HIGH', notification: { channel_id: 'alerts', sound: 'default' } },
        },
      }),
    });
    if (res.ok) sent += 1;
    else if (isDeadToken(res.status, await res.json().catch(() => null))) {
      await rest(`device_tokens?token=eq.${encodeURIComponent(t.token)}`, { method: 'DELETE' });
    }
  }
  return new Response(JSON.stringify({ sent, devices: tokens.length }), { headers: { 'Content-Type': 'application/json' } });
});