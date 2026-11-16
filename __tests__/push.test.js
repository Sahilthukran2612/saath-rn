import fs from 'fs';
import path from 'path';
import React from 'react';
import { Platform } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { setupPush } from '../src/services/push';
import * as pushService from '../src/services/push';
import { saveDeviceToken, deleteDeviceToken } from '../src/services/cloud';
import { messageFor, shouldPush, recipients, isDeadToken, URGENT } from '../supabase/functions/push/logic';
import { canReceive } from '../src/logic';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true })),
  getDevicePushTokenAsync: jest.fn(async () => ({ data: 'FCM-TOKEN-1' })),
  AndroidImportance: { MAX: 5, DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 },
}));
// eslint-disable-next-line import/first
import * as N from 'expo-notifications';

const cfg = { url: 'https://api.example.test', key: 'anon-key' };
const cloud = { access: 'A', refresh: 'R', householdId: 'h1', userId: 'u1' };
const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const route = (table) =>
  jest.fn(async (url, init) => {
    const hit = table.find(([m, p]) => m === init.method && url.includes(p));
    if (!hit) throw new Error(`unexpected ${init.method} ${url}`);
    return hit[2];
  });

const realOS = Platform.OS;
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = 'android'; // push is Android-only, and the tests run as iOS by default
});
afterEach(() => {
  Platform.OS = realOS;
});

describe('getting this phone’s push address', () => {
  test('makes the high-priority channel, asks for permission if needed, and returns the address', async () => {
    const r = await setupPush();
    expect(r).toEqual({ ok: true, token: 'FCM-TOKEN-1' });
    expect(N.setNotificationChannelAsync).toHaveBeenCalledWith('alerts', expect.objectContaining({ importance: 5 }));
  });
  test('asks the person when permission is not yet given, and stops if refused', async () => {
    N.getPermissionsAsync.mockResolvedValueOnce({ granted: false });
    N.requestPermissionsAsync.mockResolvedValueOnce({ granted: false });
    expect(await setupPush()).toEqual({ ok: false, reason: 'denied' });
    expect(N.getDevicePushTokenAsync).not.toHaveBeenCalled();
  });
  test('without a Firebase project in the build it says so instead of crashing', async () => {
    N.getDevicePushTokenAsync.mockRejectedValueOnce(new Error('Default FirebaseApp is not initialized in this process'));
    expect(await setupPush()).toEqual({ ok: false, reason: 'nofirebase' });
  });
  test('any other failure is reported as an error, never thrown', async () => {
    N.getDevicePushTokenAsync.mockRejectedValueOnce(new Error('boom'));
    expect(await setupPush()).toEqual({ ok: false, reason: 'error' });
    N.getDevicePushTokenAsync.mockResolvedValueOnce({});
    expect(await setupPush()).toEqual({ ok: false, reason: 'error' });
  });
});

describe('saving and removing the address on the server (fake server)', () => {
  test('the address is saved with the language, merged if it already exists', async () => {
    const f = route([['POST', '/rest/v1/device_tokens', reply(201, null)]]);
    expect((await saveDeviceToken(cfg, cloud, 'FCM-TOKEN-1', 'hi', f)).ok).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('on_conflict=token');
    expect(init.headers.Prefer).toContain('resolution=merge-duplicates');
    expect(JSON.parse(init.body)).toMatchObject({ token: 'FCM-TOKEN-1', lang: 'hi', user_id: 'u1' });
  });
  test('an unknown language is saved as English, and an empty address is never sent', async () => {
    const f = route([['POST', '/rest/v1/device_tokens', reply(201, null)]]);
    await saveDeviceToken(cfg, cloud, 'T', 'fr', f);
    expect(JSON.parse(f.mock.calls[0][1].body).lang).toBe('en');
    expect((await saveDeviceToken(cfg, cloud, '', 'en', f)).ok).toBe(false);
    expect(f).toHaveBeenCalledTimes(1);
  });
  test('signing out removes exactly this address', async () => {
    const f = route([['DELETE', '/rest/v1/device_tokens', reply(204, null)]]);
    expect((await deleteDeviceToken(cfg, cloud, 'a/b+c', f)).ok).toBe(true);
    expect(f.mock.calls[0][0]).toContain('token=eq.a%2Fb%2Bc');
  });
  test('signed out, nothing is sent', async () => {
    const f = route([]);
    expect((await saveDeviceToken(cfg, { ...cloud, access: null }, 'T', 'en', f)).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('what the server function sends and to whom', () => {
  test('only safety events are pushed', () => {
    expect(shouldPush({ event_type: 0 })).toBe(true);
    expect(shouldPush({ event_type: 1 })).toBe(false);
    expect(shouldPush({ event_type: 2 })).toBe(false);
    expect(shouldPush(null)).toBe(false);
  });
  test('a safety event reaches every joined member, whatever their dial or Time Off', () => {
    const members = [
      { user_id: 'a', dial: 0, time_off: false },
      { user_id: 'b', dial: 2, time_off: true },
      { user_id: null, dial: 2, time_off: false },
    ];
    expect(recipients({ event_type: 0 }, members).map((m) => m.user_id)).toEqual(['a', 'b']);
  });
  test('the recipient rule agrees with the app’s canReceive for every dial and event type', () => {
    for (const dial of [0, 1, 2]) {
      for (const type of [0, 1, 2]) {
        const got = recipients({ event_type: type }, [{ user_id: 'x', dial, time_off: false }]).length === 1;
        expect([dial, type, got]).toEqual([dial, type, canReceive(dial, type)]);
      }
    }
    expect(recipients({ event_type: 1 }, [{ user_id: 'x', dial: 2, time_off: true }])).toEqual([]);
  });
  test('wording in English and Hindi, calm, no diagnosis, with the person’s name', () => {
    for (const lang of ['en', 'hi']) {
      for (const kind of ['fall', 'quiet', 'im_ok', 'false_alarm', 'weird']) {
        const { title, body } = messageFor(kind, 'Amma', lang);
        expect(title).toBe('Saath');
        expect(body).toContain('Amma');
        expect(body).not.toMatch(/\{name\}|heart attack|dying|emergency/i);
      }
    }
    expect(messageFor('fall', 'Amma', 'en').body).toBe('Amma may have fallen. Please call them.');
    expect(messageFor('fall', '', 'en').body).toMatch(/^Someone /);
    expect(messageFor('fall', 'Amma', 'fr').body).toBe(messageFor('fall', 'Amma', 'en').body);
    expect(URGENT).toEqual(['fall', 'quiet']);
  });
  test('a dead address is recognised so it can be deleted, a working one is not', () => {
    expect(isDeadToken(404, null)).toBe(true);
    expect(isDeadToken(400, { error: { status: 'UNREGISTERED' } })).toBe(true);
    expect(isDeadToken(500, { error: { status: 'INTERNAL' } })).toBe(false);
    expect(isDeadToken(200, null)).toBe(false);
  });
  test('the function files exist and never contain a secret', () => {
    const dir = path.join(process.cwd(), 'supabase', 'functions', 'push');
    const code = fs.readFileSync(path.join(dir, 'index.ts'), 'utf8');
    expect(code).toContain("req.headers.get('x-push-secret')");
    expect(code).toContain('Deno.env.get');
    expect(code).not.toMatch(/-----BEGIN [A-Z ]*PRIVATE KEY-----/);
    expect(code).not.toMatch(/AIza[0-9A-Za-z_-]{20,}/);
    expect(code).toContain('hash: \'SHA-256\'');
  });
});

describe('database side', () => {
  const sql = fs.readFileSync(path.join(process.cwd(), 'docs', 'supabase', 'migrations', '002_push_tokens.sql'), 'utf8');
  const trigger = fs.readFileSync(path.join(process.cwd(), 'docs', 'supabase', 'migrations', '003_push_trigger.sql.template'), 'utf8');
  test('device tokens: row-level security, own rows only, signed-in only, capped, no anon access', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toMatch(/create policy device_tokens_own on device_tokens for all to authenticated/);
    expect(sql).toMatch(/using \(user_id = auth\.uid\(\)\) with check \(user_id = auth\.uid\(\)\)/);
    expect(sql).toMatch(/>= 8/);
    expect(sql).toContain('revoke all on device_tokens from anon');
  });
  test('the same table is part of the full schema', () => {
    expect(fs.readFileSync(path.join(process.cwd(), 'docs', 'supabase', 'schema.sql'), 'utf8')).toContain('create table if not exists device_tokens');
  });
  test('the trigger sends only safety events and is not callable by app users', () => {
    expect(trigger).toContain('new.event_type = 0');
    expect(trigger).toMatch(/revoke all on function notify_push\(\) from public, anon, authenticated/);
    expect(trigger).toContain('<PUSH_SECRET>');
    expect(trigger).toContain('<PROJECT_REF>');
  });
});

describe('in the app', () => {
  const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  let realFetch;
  let spy;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    realFetch = global.fetch;
    global.fetch = jest.fn(async (url, init) => {
      if (init.method === 'GET') return reply(200, []);
      return reply(201, null);
    });
    spy = jest.spyOn(pushService, 'setupPush');
  });
  afterEach(() => {
    global.fetch = realFetch;
    spy.mockRestore();
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  const signedIn = { demo: false, cloud: { phone: '9876543210', userId: 'u1', access: 'A', refresh: 'R', householdId: 'h1' } };
  const mount = (preload) =>
    render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
      </StoreProvider>
    );

  test('after sign-in the phone registers its address with its language', async () => {
    spy.mockResolvedValue({ ok: true, token: 'FCM-TOKEN-1' });
    await mount({ ...signedIn, lang: 'hi' });
    await waitFor(() => {
      const post = global.fetch.mock.calls.find(([u, i]) => u.includes('/rest/v1/device_tokens') && i.method === 'POST');
      expect(post).toBeTruthy();
      expect(JSON.parse(post[1].body)).toMatchObject({ token: 'FCM-TOKEN-1', lang: 'hi' });
    });
    await fireEvent.press(screen.getByLabelText('मैं')); // the Hindi name of the Me tab
    await waitFor(() => expect(screen.getByText(/आपके घेरे के अलर्ट इस फ़ोन तक पहुँचेंगे/)).toBeTruthy());
  });

  test('if notifications are refused nothing is registered, and the screen says why', async () => {
    spy.mockResolvedValue({ ok: false, reason: 'denied' });
    await mount(signedIn);
    await fireEvent.press(screen.getByLabelText('Me'));
    await waitFor(() => expect(screen.getByText(/Notifications are off for Saath/)).toBeTruthy());
    expect(global.fetch.mock.calls.some(([u]) => u.includes('/rest/v1/device_tokens'))).toBe(false);
  });

  test('without Firebase in the build it says push is not set up yet', async () => {
    spy.mockResolvedValue({ ok: false, reason: 'nofirebase' });
    await mount(signedIn);
    await fireEvent.press(screen.getByLabelText('Me'));
    await waitFor(() => expect(screen.getByText('Push alerts are not set up in this build of Saath yet.')).toBeTruthy());
  });

  test('signing out removes this phone’s address from the server', async () => {
    spy.mockResolvedValue({ ok: true, token: 'FCM-TOKEN-1' });
    await mount({ ...signedIn, cloud: { ...signedIn.cloud, pushToken: 'FCM-TOKEN-1', pushState: 'on' } });
    await fireEvent.press(screen.getByLabelText('Me'));
    await fireEvent.press(screen.getByLabelText('Sign out'));
    await waitFor(() => {
      const del = global.fetch.mock.calls.find(([u, i]) => u.includes('device_tokens') && i.method === 'DELETE');
      expect(del).toBeTruthy();
      expect(del[0]).toContain('token=eq.FCM-TOKEN-1');
    });
  });
});
