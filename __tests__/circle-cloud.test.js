import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { initialState, reducer } from '../src/state/reducer';
import { load, save } from '../src/services/storage';
import { strings, t as translate } from '../src/i18n/strings';
import {
  isAlert,
  describeEvent,
  ago,
  pendingAlert,
  allPending,
  newest,
  ALERT_WINDOW_MS,
} from '../src/circleFeed';
import { acceptInvite, createInvite, listCircles, fetchFeed, setPersonName } from '../src/services/cloud';

const cfg = { url: 'https://api.example.test', key: 'anon-key' };
const cloud = { access: 'A', refresh: 'R', householdId: 'h1' };
const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const route = (table) =>
  jest.fn(async (url, init) => {
    const hit = table.find(([m, p]) => m === init.method && url.includes(p));
    if (!hit) throw new Error(`unexpected ${init.method} ${url}`);
    return typeof hit[2] === 'function' ? hit[2](url, init) : hit[2];
  });
const en = (k) => translate('en', k);

const NOW = Date.parse('2026-11-13T10:00:00Z');
const at = (minAgo) => new Date(NOW - minAgo * 60000).toISOString();
const ev = (id, kind, minAgo, extra = {}) => ({ id, event_type: 0, kind, created_at: at(minAgo), ...extra });

describe('wording the events', () => {
  test('each kind has words in English and Hindi, and unknown kinds still read', () => {
    ['fall', 'quiet', 'im_ok', 'false_alarm', 'task_done', 'other'].forEach((kind) => {
      const e = { kind, detail: 'Lunch' };
      ['en', 'hi'].forEach((lang) => {
        const text = describeEvent(e, 'Amma', (k) => translate(lang, k));
        expect(text).toContain('Amma');
        expect(text).not.toMatch(/\{(name|detail)\}/);
      });
    });
    expect(describeEvent({ kind: 'task_done', detail: 'Lunch' }, 'Amma', en)).toBe('Amma finished: Lunch');
    expect(strings.hi['ev.fall']).not.toBe(strings.en['ev.fall']);
  });
  test('times read as minutes, hours, days', () => {
    expect(ago(at(0), NOW, en)).toBe('just now');
    expect(ago(at(5), NOW, en)).toBe('5 min ago');
    expect(ago(at(180), NOW, en)).toBe('3 h ago');
    expect(ago(at(60 * 49), NOW, en)).toBe('2 days ago');
    expect(ago('not a date', NOW, en)).toBe('just now');
  });
  test('only a fall or quiet safety event is an alert', () => {
    expect(isAlert(ev(1, 'fall', 1))).toBe(true);
    expect(isAlert(ev(1, 'quiet', 1))).toBe(true);
    expect(isAlert(ev(1, 'im_ok', 1))).toBe(false);
    expect(isAlert({ ...ev(1, 'fall', 1), event_type: 1 })).toBe(false);
  });
});

describe('which alert needs me', () => {
  const feed = (...e) => e; // newest first
  test('a recent, unseen, unanswered fall is pending', () => {
    expect(pendingAlert(feed(ev(2, 'fall', 3), ev(1, 'im_ok', 60)), null, NOW).id).toBe(2);
  });
  test('an old alert is not pending', () => {
    expect(pendingAlert(feed(ev(1, 'fall', ALERT_WINDOW_MS / 60000 + 5)), null, NOW)).toBeNull();
  });
  test('once I have looked at it, it is not pending', () => {
    expect(pendingAlert(feed(ev(1, 'fall', 3)), at(3), NOW)).toBeNull();
    expect(pendingAlert(feed(ev(1, 'fall', 3)), at(10), NOW)).not.toBeNull();
  });
  test('if they answered afterwards (I am OK or false alarm) it is not pending', () => {
    expect(pendingAlert(feed(ev(2, 'im_ok', 1), ev(1, 'fall', 3)), null, NOW)).toBeNull();
    expect(pendingAlert(feed(ev(2, 'false_alarm', 1), ev(1, 'quiet', 3)), null, NOW)).toBeNull();
  });
  test('an empty or missing feed is fine, and circles are sorted newest alert first', () => {
    expect(pendingAlert(undefined, null, NOW)).toBeNull();
    expect(newest([])).toBeNull();
    const circles = [{ household_id: 'a' }, { household_id: 'b' }, { household_id: 'c' }];
    const feeds = { a: [ev(1, 'fall', 20)], b: [ev(2, 'quiet', 5)], c: [] };
    expect(allPending(circles, feeds, {}, NOW).map((x) => x.circle.household_id)).toEqual(['b', 'a']);
  });
});

describe('circle calls (fake server)', () => {
  test('joining sends the code and returns the household', async () => {
    const f = route([['POST', '/rpc/accept_invite', reply(200, 'h7')]]);
    expect(await acceptInvite(cfg, cloud, ' ab12cd ', f)).toMatchObject({ ok: true, householdId: 'h7' });
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ invite_code: 'ab12cd' });
  });
  test('a bad code, a short code and no network are told apart', async () => {
    expect(await acceptInvite(cfg, cloud, 'zz', route([]))).toMatchObject({ ok: false, reason: 'invalid' });
    const bad = route([['POST', '/rpc/accept_invite', reply(400, { message: 'invalid or expired code' })]]);
    expect(await acceptInvite(cfg, cloud, 'ABCDEF', bad)).toMatchObject({ ok: false, reason: 'invalid' });
    const off = jest.fn(async () => {
      throw new Error('blocked');
    });
    expect(await acceptInvite(cfg, cloud, 'ABCDEF', off)).toMatchObject({ ok: false, reason: 'network' });
  });
  test('a wrong code comes back as null from the server and reads as invalid', async () => {
    const f = route([['POST', '/rpc/accept_invite', reply(200, null)]]);
    expect(await acceptInvite(cfg, cloud, 'ABCDEF', f)).toMatchObject({ ok: false, reason: 'invalid' });
  });
  test('being locked out of guessing is reported as a limit, not as a wrong code', async () => {
    const f = route([['POST', '/rpc/accept_invite', reply(400, { message: 'too many attempts, wait a few minutes' })]]);
    expect(await acceptInvite(cfg, cloud, 'ABCDEF', f)).toMatchObject({ ok: false, reason: 'limit' });
  });  test('signed out means nothing is sent', async () => {
    const f = route([]);
    expect(await acceptInvite(cfg, { ...cloud, access: null }, 'ABCDEF', f)).toMatchObject({ ok: false });
    expect((await listCircles(cfg, { ...cloud, access: null }, f)).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
  test('lists my circles and reads a feed, newest first, limited', async () => {
    const f = route([
      ['GET', '/rest/v1/my_circles', reply(200, [{ household_id: 'h7', role: 'family', dial: 1, person_name: 'Amma' }])],
      ['GET', '/rest/v1/events', reply(200, [ev(1, 'fall', 1)])],
    ]);
    expect((await listCircles(cfg, cloud, f)).circles).toHaveLength(1);
    const feed = await fetchFeed(cfg, cloud, 'h7', f);
    expect(feed.events).toHaveLength(1);
    expect(f.mock.calls[1][0]).toContain('household_id=eq.h7');
    expect(f.mock.calls[1][0]).toContain('order=created_at.desc');
    expect(f.mock.calls[1][0]).toContain('limit=30');
  });
  test('a server error gives an empty list, not a crash', async () => {
    const f = route([['GET', '/rest/v1/my_circles', reply(500, { message: 'x' })]]);
    expect(await listCircles(cfg, cloud, f)).toMatchObject({ ok: false, circles: [] });
  });
  test('publishing an invite treats "already there" as done', async () => {
    const inv = { name: 'Asha', role: 'family', code: 'ABC123' };
    expect((await createInvite(cfg, cloud, inv, route([['POST', '/rest/v1/invites', reply(201, null)]]))).ok).toBe(true);
    expect((await createInvite(cfg, cloud, inv, route([['POST', '/rest/v1/invites', reply(409, {})]]))).ok).toBe(true);
    expect((await createInvite(cfg, cloud, inv, route([['POST', '/rest/v1/invites', reply(403, {})]]))).ok).toBe(false);
  });
  test('an expired token is refreshed once for circle calls too', async () => {
    let n = 0;
    const f = route([
      ['GET', '/rest/v1/my_circles', () => (n++ === 0 ? reply(401, {}) : reply(200, []))],
      ['POST', '/auth/v1/token', reply(200, { access_token: 'A2', refresh_token: 'R2', user: { id: 'u' } })],
    ]);
    const r = await listCircles(cfg, cloud, f);
    expect(r.ok).toBe(true);
    expect(r.session).toMatchObject({ access: 'A2' });
  });
  test('sets the person name for the circle', async () => {
    const f = route([['PATCH', '/rest/v1/households', reply(204, null)]]);
    expect((await setPersonName(cfg, cloud, 'Amma', f)).ok).toBe(true);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ person_name: 'Amma' });
  });
});

describe('state for the circle side', () => {
  test('circles, feeds and what I have seen are kept, and sign-out wipes them', () => {
    let s = { ...initialState, hydrated: true };
    s = reducer(s, { type: 'CIRCLES_SET', circles: [{ household_id: 'h', person_name: 'Amma' }] });
    s = reducer(s, { type: 'FEED_SET', id: 'h', events: Array.from({ length: 40 }, (_, i) => ev(i, 'im_ok', i)) });
    s = reducer(s, { type: 'SEEN_SET', id: 'h', at: at(1) });
    expect(s.feeds.h).toHaveLength(30);
    expect(s.seen.h).toBe(at(1));
    s = reducer(s, { type: 'CLOUD_SIGN_OUT' });
    expect([s.circles, s.feeds, s.seen]).toEqual([[], {}, {}]);
  });
  test('an invite published to the server is marked so it is not sent twice', () => {
    let s = reducer({ ...initialState, hydrated: true }, {
      type: 'INVITE_ADD',
      id: 'i1',
      name: 'Asha',
      phone: '9876543210',
      role: 'family',
      code: 'ABC123',
      at: 1,
    });
    s = reducer(s, { type: 'INVITE_SYNCED', id: 'i1' });
    expect(s.invites[0].cloud).toBe(true);
  });
});

describe('tokens stay out of the plain state file', () => {
  test('saved state has no tokens, the secure store has them, and load puts them back', async () => {
    const state = {
      ...initialState,
      hydrated: true,
      cloud: { phone: '9876543210', userId: 'u', access: 'SECRET-A', refresh: 'SECRET-R', householdId: 'h' },
    };
    await save(state, 'p1');
    const plain = await AsyncStorage.getItem('saath/state/v1');
    expect(plain).not.toContain('SECRET-A');
    expect(plain).not.toContain('SECRET-R');
    expect(await SecureStore.getItemAsync('saath.tok.p1')).toContain('SECRET-A');
    const back = await load('p1');
    expect(back.cloud).toMatchObject({ access: 'SECRET-A', refresh: 'SECRET-R', householdId: 'h' });
  });
  test('signing out removes the tokens, and each profile has its own', async () => {
    await save({ ...initialState, cloud: { userId: 'u', access: 'T2', refresh: 'R2', householdId: 'h' } }, 'p2');
    expect(await SecureStore.getItemAsync('saath.tok.p2')).toContain('T2');
    await save({ ...initialState, cloud: { userId: null, access: null, refresh: null, householdId: null } }, 'p2');
    expect(await SecureStore.getItemAsync('saath.tok.p2')).toBeNull();
    expect(await SecureStore.getItemAsync('saath.tok.p1')).toContain('SECRET-A');
  });
  test('an old state file that still holds tokens is read, then cleaned on the next save', async () => {
    await AsyncStorage.setItem(
      'saath/state/v1/p9',
      JSON.stringify({ cloud: { userId: 'u', access: 'OLD-A', refresh: 'OLD-R', householdId: 'h' } })
    );
    const loaded = await load('p9');
    expect(loaded.cloud.access).toBe('OLD-A');
    await save({ ...initialState, ...loaded }, 'p9');
    expect(await AsyncStorage.getItem('saath/state/v1/p9')).not.toContain('OLD-A');
  });
});

describe('screens', () => {
  const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
  });
  afterEach(() => {
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  const recent = (kind, minAgo, id) => ({
    id,
    event_type: 0,
    kind,
    detail: null,
    created_at: new Date(Date.now() - minAgo * 60000).toISOString(),
  });
  const signedIn = {
    cloud: { phone: '9876543210', userId: 'u', access: 'A', refresh: 'R', householdId: 'h' },
    circles: [{ household_id: 'hx', role: 'family', dial: 1, time_off: false, person_name: 'Amma' }],
  };
  const mount = (preload) =>
    render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
      </StoreProvider>
    );

  test('a recent fall by someone I look after shows a banner on any tab, until I say I saw it', async () => {
    await mount({ ...signedIn, feeds: { hx: [recent('fall', 2, 1)] } });
    expect(screen.getByText('Amma may have fallen. Please call them.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Got it'));
    // the banner is gone; the same words stay in the list on the Circle tab it opens
    await waitFor(() => expect(screen.queryByLabelText('Got it')).toBeNull());
    expect(screen.getByText('People I look after')).toBeTruthy();
  });

  test('no banner when they already said they are OK', async () => {
    await mount({ ...signedIn, feeds: { hx: [recent('im_ok', 1, 2), recent('fall', 3, 1)] } });
    expect(screen.queryByText(/may have fallen/)).toBeNull();
  });

  test('the Circle tab lists the people I look after, and opening one shows their feed', async () => {
    await mount({ ...signedIn, feeds: { hx: [recent('im_ok', 1, 2), recent('task_done', 5, 1)] } });
    await fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.getByText('People I look after')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Amma'));
    expect(screen.getByText('You see: Routine')).toBeTruthy();
    expect(screen.getByText('Amma said they are OK.')).toBeTruthy();
    expect(screen.getByText(/only see what they chose to share/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.getByText('People I look after')).toBeTruthy();
  });

  test('joining without being signed in says to sign in first', async () => {
    await mount({});
    await fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.getByText('You are not in anyone\'s circle yet.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Invite code'), 'abc123');
    await fireEvent.press(screen.getByLabelText('Join'));
    expect(screen.getByText('Sign in on the Me tab first.')).toBeTruthy();
  });

  test('without a server in the build the circle side stays hidden', async () => {
    delete process.env.EXPO_PUBLIC_SAATH_API_URL;
    await mount({ demo: false }); // in demo mode the section shows, with stand-in buttons
    await fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.queryByText('People I look after')).toBeNull();
  });
});
