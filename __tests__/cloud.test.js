import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { initialState, reducer } from '../src/state/reducer';
import {
  cloudConfig,
  isConfigured,
  toE164,
  requestOtp,
  signIn,
  signInAnonymous,
  flush,
  refreshSession,
} from '../src/services/cloud';

// Everything here uses a fake fetch. Nothing has been run against a real Supabase project.
const cfg = { url: 'https://api.example.test', key: 'anon-key' };
const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const fakeFetch = (routes) =>
  jest.fn(async (url, init) => {
    const hit = routes.find(([m, p]) => m === init.method && url.includes(p));
    if (!hit) throw new Error(`unexpected ${init.method} ${url}`);
    return typeof hit[2] === 'function' ? hit[2](url, init) : hit[2];
  });

describe('configuration', () => {
  const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY', 'EXPO_PUBLIC_SAATH_PHONE_AUTH'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  afterEach(() => {
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  test('not configured without both a URL and a key', () => {
    delete process.env.EXPO_PUBLIC_SAATH_API_URL;
    delete process.env.EXPO_PUBLIC_SAATH_ANON_KEY;
    expect(isConfigured()).toBe(false);
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test/';
    expect(isConfigured()).toBe(false);
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    expect(isConfigured()).toBe(true);
    expect(cloudConfig().url).toBe('https://x.test'); // trailing slash removed
  });
  test('a number becomes +91 and ten digits', () => {
    expect(toE164('98765 43210')).toBe('+919876543210');
  });
});

describe('sign in', () => {
  test('asks for a code only for a valid number and a configured server', async () => {
    const f = fakeFetch([]);
    expect(await requestOtp(cfg, '123', f)).toMatchObject({ ok: false, reason: 'invalid' });
    expect(await requestOtp({ url: '', key: '' }, '9876543210', f)).toMatchObject({ ok: false });
    expect(f).not.toHaveBeenCalled();
  });
  test('sends the number in international form', async () => {
    const f = fakeFetch([['POST', '/auth/v1/otp', reply(200, {})]]);
    expect(await requestOtp(cfg, '9876543210', f)).toEqual({ ok: true });
    expect(JSON.parse(f.mock.calls[0][1].body).phone).toBe('+919876543210');
    expect(f.mock.calls[0][1].headers.apikey).toBe('anon-key');
  });
  test('a network failure is reported, never thrown', async () => {
    const f = jest.fn(async () => {
      throw new Error('blocked');
    });
    expect(await requestOtp(cfg, '9876543210', f)).toEqual({ ok: false, reason: 'network' });
    expect(await signIn(cfg, '9876543210', '123456', f)).toMatchObject({ ok: false, reason: 'network' });
  });
  test('a wrong code is reported as a code problem', async () => {
    const f = fakeFetch([['POST', '/auth/v1/verify', reply(403, { error: 'bad' })]]);
    expect(await signIn(cfg, '9876543210', '000000', f)).toMatchObject({ ok: false, reason: 'code' });
  });
  test('finds an existing household', async () => {
    const f = fakeFetch([
      ['POST', '/auth/v1/verify', reply(200, { access_token: 'A', refresh_token: 'R', user: { id: 'u1' } })],
      ['GET', '/rest/v1/households', reply(200, [{ id: 'h1' }])],
    ]);
    const r = await signIn(cfg, '9876543210', '123456', f);
    expect(r).toEqual({
      ok: true,
      cloud: { phone: '9876543210', access: 'A', refresh: 'R', userId: 'u1', householdId: 'h1' },
    });
    expect(f.mock.calls[1][0]).toContain('person_user_id=eq.u1');
  });
  test('creates a household the first time', async () => {
    const f = fakeFetch([
      ['POST', '/auth/v1/verify', reply(200, { access_token: 'A', refresh_token: 'R', user: { id: 'u1' } })],
      ['GET', '/rest/v1/households', reply(200, [])],
      ['POST', '/rest/v1/households', reply(201, [{ id: 'h9' }])],
    ]);
    const r = await signIn(cfg, '9876543210', '123456', f);
    expect(r.cloud.householdId).toBe('h9');
  });
  test('fails clearly if no household can be made', async () => {
    const f = fakeFetch([
      ['POST', '/auth/v1/verify', reply(200, { access_token: 'A', refresh_token: 'R', user: { id: 'u1' } })],
      ['GET', '/rest/v1/households', reply(200, [])],
      ['POST', '/rest/v1/households', reply(403, {})],
    ]);
    expect(await signIn(cfg, '9876543210', '123456', f)).toMatchObject({ ok: false, reason: 'household' });
  });
});

describe('free sign-in without a phone number', () => {
  test('makes an anonymous account and a household', async () => {
    const f = fakeFetch([
      ['POST', '/auth/v1/signup', reply(200, { access_token: 'A', refresh_token: 'R', user: { id: 'anon1' } })],
      ['GET', '/rest/v1/households', reply(200, [])],
      ['POST', '/rest/v1/households', reply(201, [{ id: 'h5' }])],
    ]);
    const r = await signInAnonymous(cfg, f, 'Amma');
    expect(r).toEqual({ ok: true, cloud: { phone: '', access: 'A', refresh: 'R', userId: 'anon1', householdId: 'h5' } });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({}); // no phone, no email, nothing personal
    expect(JSON.parse(f.mock.calls[2][1].body)).toEqual({ person_user_id: 'anon1', person_name: 'Amma' });
  });
  test('says so when the server has not allowed anonymous sign-in, or is unreachable', async () => {
    const off = fakeFetch([['POST', '/auth/v1/signup', reply(422, { msg: 'Anonymous sign-ins are disabled' })]]);
    expect(await signInAnonymous(cfg, off)).toMatchObject({ ok: false, reason: 'disabled' });
    const down = jest.fn(async () => {
      throw new Error('blocked');
    });
    expect(await signInAnonymous(cfg, down)).toMatchObject({ ok: false, reason: 'network' });
    expect(await signInAnonymous({ url: '', key: '' }, off)).toMatchObject({ ok: false });
  });
});
describe('sending events', () => {
  const cloud = { access: 'A', refresh: 'R', householdId: 'h1' };
  const outbox = [
    { id: 1, eventType: 0, kind: 'fall' },
    { id: 2, eventType: 1, kind: 'task_done', detail: 'Lunch' },
  ];
  test('sends the waiting events in one request and reports which ids were accepted', async () => {
    const f = fakeFetch([['POST', '/rest/v1/events', reply(201, null)]]);
    const r = await flush(cfg, cloud, outbox, f);
    expect(r.sentIds).toEqual([1, 2]);
    expect(f).toHaveBeenCalledTimes(1);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual([
      { household_id: 'h1', event_type: 0, kind: 'fall', detail: null },
      { household_id: 'h1', event_type: 1, kind: 'task_done', detail: 'Lunch' },
    ]);
  });
  test('a failure keeps every event for later', async () => {
    const f = fakeFetch([['POST', '/rest/v1/events', reply(500, {})]]);
    expect((await flush(cfg, cloud, outbox, f)).sentIds).toEqual([]);
    const off = jest.fn(async () => {
      throw new Error('offline');
    });
    expect((await flush(cfg, cloud, outbox, off)).sentIds).toEqual([]);
  });
  test('an expired token is refreshed once and the send retried', async () => {
    let n = 0;
    const f = fakeFetch([
      ['POST', '/rest/v1/events', () => (n++ === 0 ? reply(401, {}) : reply(201, null))],
      ['POST', '/auth/v1/token', reply(200, { access_token: 'A2', refresh_token: 'R2', user: { id: 'u1' } })],
    ]);
    const r = await flush(cfg, cloud, outbox, f);
    expect(r.sentIds).toEqual([1, 2]);
    expect(r.session).toMatchObject({ access: 'A2', refresh: 'R2' });
    expect(f.mock.calls[2][1].headers.Authorization).toBe('Bearer A2');
  });
  test('a refresh that fails sends nothing', async () => {
    const f = fakeFetch([
      ['POST', '/rest/v1/events', reply(401, {})],
      ['POST', '/auth/v1/token', reply(400, {})],
    ]);
    expect((await flush(cfg, cloud, outbox, f)).sentIds).toEqual([]);
    expect((await refreshSession(cfg, 'R', f)).ok).toBe(false);
  });
  test('does nothing when signed out, unconfigured or empty', async () => {
    const f = fakeFetch([]);
    expect((await flush(cfg, { ...cloud, access: null }, outbox, f)).sentIds).toEqual([]);
    expect((await flush({ url: '', key: '' }, cloud, outbox, f)).sentIds).toEqual([]);
    expect((await flush(cfg, cloud, [], f)).sentIds).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('outbox in the reducer', () => {
  const signedIn = { ...initialState, hydrated: true, cloud: { ...initialState.cloud, access: 'A', householdId: 'h1' } };
  test('nothing is queued when signed out', () => {
    const s = reducer({ ...initialState, hydrated: true }, { type: 'CHECK_IN', at: 5 });
    expect(s.outbox).toEqual([]);
  });
  test('a fall alert is a safety event, an I’m OK on Today is routine', () => {
    let s = reducer(signedIn, { type: 'TRIGGER_ALERT', kind: 'fall', confidence: 0.9, reason: 'x', id: 'a' });
    expect(s.outbox).toEqual([{ id: 1, eventType: 0, kind: 'fall' }]);
    s = reducer(s, { type: 'IM_OK', at: 9 });
    expect(s.outbox[1]).toEqual({ id: 2, eventType: 0, kind: 'im_ok' });
    s = reducer(s, { type: 'CHECK_IN', at: 10 });
    expect(s.outbox[2]).toEqual({ id: 3, eventType: 1, kind: 'im_ok' });
  });
  test('a second alert while one is open is not queued twice', () => {
    let s = reducer(signedIn, { type: 'TRIGGER_ALERT', kind: 'fall', confidence: 0.9, reason: 'x', id: 'a' });
    s = reducer(s, { type: 'TRIGGER_ALERT', kind: 'fall', confidence: 0.9, reason: 'x', id: 'b' });
    expect(s.outbox).toHaveLength(1);
  });
  test('only finishing a task queues an event, not undoing it', () => {
    const task = signedIn.tasks[0];
    let s = reducer(signedIn, { type: 'TOGGLE_TASK', id: task.id });
    expect(s.outbox).toEqual([{ id: 1, eventType: 1, kind: 'task_done', detail: task.title }]);
    s = reducer(s, { type: 'TOGGLE_TASK', id: task.id });
    expect(s.outbox).toHaveLength(1);
  });
  test('sent events leave the outbox, sign out empties it, and it is capped', () => {
    let s = reducer(signedIn, { type: 'CHECK_IN', at: 1 });
    s = reducer(s, { type: 'CHECK_IN', at: 2 });
    s = reducer(s, { type: 'OUTBOX_SENT', ids: [1] });
    expect(s.outbox.map((e) => e.id)).toEqual([2]);
    expect(reducer(s, { type: 'CLOUD_SIGN_OUT' }).outbox).toEqual([]);
    expect(reducer(s, { type: 'CLOUD_SIGN_OUT' }).cloud.access).toBeNull();
    let big = signedIn;
    for (let i = 0; i < 230; i++) big = reducer(big, { type: 'CHECK_IN', at: i });
    expect(big.outbox).toHaveLength(200);
  });
  test('no event ever carries a reading, a dose or an amount', () => {
    let s = reducer(signedIn, { type: 'ADD_READING', value: 65, at: 1 });
    s = reducer(s, { type: 'LOG_INSULIN', at: 2 });
    s = reducer(s, { type: 'BUDGET_ADD', id: 'b', amount: 500, cat: 'medicine', at: 3 });
    expect(s.outbox).toEqual([]);
  });
});

describe('account card', () => {
  const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY', 'EXPO_PUBLIC_SAATH_PHONE_AUTH'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  afterEach(() => {
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  const open = async (preload) => {
    await render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
      </StoreProvider>
    );
    await fireEvent.press(screen.getByLabelText('Me'));
  };
  test('says sync is not set up when the build has no server', async () => {
    delete process.env.EXPO_PUBLIC_SAATH_API_URL;
    delete process.env.EXPO_PUBLIC_SAATH_ANON_KEY;
    await open({});
    expect(screen.getByText('Account and sync')).toBeTruthy();
    expect(screen.getByText(/Sync is not set up in this build/)).toBeTruthy();
  });
  test('with phone sign-in switched on, asks for the number and refuses a bad one', async () => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    process.env.EXPO_PUBLIC_SAATH_PHONE_AUTH = '1';
    await open({});
    await fireEvent.changeText(screen.getByLabelText('Your mobile number'), '123');
    await fireEvent.press(screen.getByLabelText('Send code'));
    expect(screen.getByText('Enter a 10-digit mobile number.')).toBeTruthy();
  });
  test('shows who is signed in, how many updates wait, and signs out', async () => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    await open({
      cloud: { phone: '9876543210', userId: 'u', access: 'A', refresh: 'R', householdId: 'h' },
      outbox: [{ id: 1, eventType: 1, kind: 'im_ok' }],
    });
    expect(screen.getByText('Signed in as +91 9876543210')).toBeTruthy();
    expect(screen.getByText('1 updates waiting to send')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Sign out'));
    await waitFor(() => expect(screen.getByLabelText('Turn on sync')).toBeTruthy());
  });
  test('by default sync turns on with one button and no phone number', async () => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    delete process.env.EXPO_PUBLIC_SAATH_PHONE_AUTH;
    await open({});
    expect(screen.getByLabelText('Turn on sync')).toBeTruthy();
    expect(screen.queryByLabelText('Your mobile number')).toBeNull();
    expect(screen.getByText(/No phone number needed/)).toBeTruthy();
  });
  test('an account without a phone number says what is lost if the data is cleared', async () => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    await open({ cloud: { phone: '', userId: 'u', access: 'A', refresh: 'R', householdId: 'h' } });
    expect(screen.getByText('Sync is on for this phone')).toBeTruthy();
    expect(screen.getByText(/this account is lost and your circle must invite you again/)).toBeTruthy();
  });});
