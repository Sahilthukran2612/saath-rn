import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { initialState, reducer } from '../src/state/reducer';
import { listMembers, setMemberDial, setMyTimeOff } from '../src/services/cloud';

const cfg = { url: 'https://api.example.test', key: 'anon-key' };
const cloud = { access: 'A', refresh: 'R', householdId: 'h1', userId: 'u1' };
const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const route = (table) =>
  jest.fn(async (url, init) => {
    const hit = table.find(([m, p]) => m === init.method && url.includes(p));
    if (!hit) throw new Error(`unexpected ${init.method} ${url}`);
    return typeof hit[2] === 'function' ? hit[2](url, init) : hit[2];
  });

describe('the dial on the server (fake server)', () => {
  test('lists only people who joined from their own phones, oldest first', async () => {
    const f = route([['GET', '/rest/v1/members', reply(200, [{ id: 'm9', name: 'Asha', role: 'family', dial: 0, time_off: false, share_contact: false }])]]);
    const r = await listMembers(cfg, cloud, f);
    expect(r.members).toHaveLength(1);
    const url = f.mock.calls[0][0];
    expect(url).toContain('household_id=eq.h1');
    expect(url).toContain('user_id=not.is.null');
    expect(url).toContain('order=created_at.asc');
  });

  test('a server error gives an empty list, not a crash', async () => {
    const f = route([['GET', '/rest/v1/members', reply(500, {})]]);
    expect(await listMembers(cfg, cloud, f)).toMatchObject({ ok: false, members: [] });
  });

  test('setting a dial sends exactly the new level for that member', async () => {
    const f = route([['PATCH', '/rest/v1/members', reply(204, null)]]);
    expect((await setMemberDial(cfg, cloud, 'm9', 2, f)).ok).toBe(true);
    expect(f.mock.calls[0][0]).toContain('id=eq.m9');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ dial: 2 });
  });

  test('a dial that is not 0, 1 or 2 is never sent', async () => {
    const f = route([]);
    for (const d of [-1, 3, 1.5, '1', null, undefined]) expect((await setMemberDial(cfg, cloud, 'm9', d, f)).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });

  test('the server refusing (for example a guardian below Routine) reports not ok', async () => {
    const f = route([['PATCH', '/rest/v1/members', reply(400, { message: 'refused' })]]);
    expect((await setMemberDial(cfg, cloud, 'm9', 0, f)).ok).toBe(false);
  });

  test('Time Off targets only my own row in that household', async () => {
    const f = route([['PATCH', '/rest/v1/members', reply(204, null)]]);
    expect((await setMyTimeOff(cfg, cloud, 'hx', true, f)).ok).toBe(true);
    const url = f.mock.calls[0][0];
    expect(url).toContain('household_id=eq.hx');
    expect(url).toContain('user_id=eq.u1');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ time_off: true });
  });

  test('an expired token is refreshed once for these calls too', async () => {
    let n = 0;
    const f = route([
      ['PATCH', '/rest/v1/members', () => (n++ === 0 ? reply(401, {}) : reply(204, null))],
      ['POST', '/auth/v1/token', reply(200, { access_token: 'A2', refresh_token: 'R2', user: { id: 'u1' } })],
    ]);
    const r = await setMemberDial(cfg, cloud, 'm9', 1, f);
    expect(r.ok).toBe(true);
    expect(r.session).toMatchObject({ access: 'A2' });
  });

  test('without a sign-in nothing is sent', async () => {
    const f = route([]);
    expect((await setMemberDial(cfg, { ...cloud, access: null }, 'm9', 1, f)).ok).toBe(false);
    expect(f).not.toHaveBeenCalled();
  });
});

describe('state', () => {
  const base = { ...initialState, hydrated: true };
  test('the dial change shows at once, ignores a bad level, and sign-out clears the list', () => {
    let s = reducer(base, { type: 'JOINED_SET', members: [{ id: 'm9', name: 'Asha', role: 'family', dial: 0, time_off: false }] });
    s = reducer(s, { type: 'JOINED_DIAL', id: 'm9', dial: 2 });
    expect(s.joined[0].dial).toBe(2);
    expect(reducer(s, { type: 'JOINED_DIAL', id: 'm9', dial: 7 }).joined[0].dial).toBe(2);
    expect(reducer(s, { type: 'JOINED_DIAL', id: 'nobody', dial: 1 }).joined[0].dial).toBe(2);
    expect(reducer(s, { type: 'CLOUD_SIGN_OUT' }).joined).toEqual([]);
  });
  test('Time Off on one circle does not touch another', () => {
    let s = reducer(base, {
      type: 'CIRCLES_SET',
      circles: [
        { household_id: 'a', time_off: false },
        { household_id: 'b', time_off: false },
      ],
    });
    s = reducer(s, { type: 'CIRCLE_TIMEOFF', id: 'a', on: true });
    expect(s.circles.map((c) => c.time_off)).toEqual([true, false]);
  });
});

describe('on the Circle screen', () => {
  const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  let realFetch;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    realFetch = global.fetch;
  });
  afterEach(() => {
    global.fetch = realFetch;
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  const mount = (preload) =>
    render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
      </StoreProvider>
    );
  const openCircle = async () => fireEvent.press(screen.getByLabelText('Circle'));
  const live = {
    cloud: { phone: '', userId: 'u1', access: 'A', refresh: 'R', householdId: 'h1' },
    joined: [{ id: 'm9', name: 'Asha (joined)', role: 'family', dial: 0, time_off: false, share_contact: false }],
  };

  test('demo: nobody has joined yet, then a demo member joins and the dial moves what they see', async () => {
    delete process.env.EXPO_PUBLIC_SAATH_API_URL;
    await mount({ demo: true });
    await openCircle();
    expect(screen.getByText('Joined on their own phones')).toBeTruthy();
    expect(screen.getByText(/No one has joined yet/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Demo: someone joins with my invite'));
    expect(screen.getByText('Asha (demo) sees: Safety only')).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Routine').at(-1));
    expect(screen.getByText('Asha (demo) sees: Routine')).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Full').at(-1));
    expect(screen.getByText('Asha (demo) sees: Full')).toBeTruthy();
  });

  test('signed in: the dial change is sent to the server for that member', async () => {
    global.fetch = jest.fn(async () => reply(204, null));
    await mount({ demo: false, ...live });
    await openCircle();
    await fireEvent.press(screen.getAllByLabelText('Full').at(-1));
    const patch = () => global.fetch.mock.calls.find(([, i]) => i.method === 'PATCH');
    await waitFor(() => expect(patch()).toBeTruthy());
    const [url, init] = patch();
    expect(url).toContain('/rest/v1/members?id=eq.m9');
    expect(JSON.parse(init.body)).toEqual({ dial: 2 });
    expect(screen.getByText('Asha (joined) sees: Full')).toBeTruthy();
  });

  test('if the server does not take the change, the screen goes back and says so', async () => {
    global.fetch = jest.fn(async () => reply(400, { message: 'refused' }));
    await mount({ demo: false, ...live });
    await openCircle();
    await fireEvent.press(screen.getAllByLabelText('Routine').at(-1));
    await waitFor(() => expect(screen.getByText(/Could not save the change/)).toBeTruthy());
    expect(screen.getByText('Asha (joined) sees: Safety only')).toBeTruthy();
  });

  test('a member who is on Time Off is marked', async () => {
    await mount({ demo: false, ...live, joined: [{ ...live.joined[0], time_off: true }] });
    await openCircle();
    expect(screen.getByText('On Time Off')).toBeTruthy();
  });

  test('as a member, pausing routine updates from someone is sent to the server and safety is not mentioned as paused', async () => {
    global.fetch = jest.fn(async () => reply(204, null));
    await mount({
      demo: false,
      cloud: live.cloud,
      circles: [{ household_id: 'hx', role: 'family', dial: 1, time_off: false, person_name: 'Amma' }],
      feeds: { hx: [] },
    });
    await openCircle();
    await fireEvent.press(screen.getByLabelText('Amma'));
    expect(screen.getByText('Safety alerts still reach you.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Pause routine updates from them: off'));
    const patch = () => global.fetch.mock.calls.find(([, i]) => i.method === 'PATCH');
    await waitFor(() => expect(patch()).toBeTruthy());
    const [url, init] = patch();
    expect(url).toContain('household_id=eq.hx');
    expect(url).toContain('user_id=eq.u1');
    expect(JSON.parse(init.body)).toEqual({ time_off: true });
    expect(screen.getByLabelText('Pause routine updates from them: on')).toBeTruthy();
  });

  test('a failed Time Off change is undone', async () => {
    global.fetch = jest.fn(async () => reply(500, {}));
    await mount({
      demo: false,
      cloud: live.cloud,
      circles: [{ household_id: 'hx', role: 'family', dial: 1, time_off: false, person_name: 'Amma' }],
      feeds: { hx: [] },
    });
    await openCircle();
    await fireEvent.press(screen.getByLabelText('Amma'));
    await fireEvent.press(screen.getByLabelText('Pause routine updates from them: off'));
    await waitFor(() => expect(screen.getByLabelText('Pause routine updates from them: off')).toBeTruthy());
  });

  test('the demo person can be paused locally without any server', async () => {
    delete process.env.EXPO_PUBLIC_SAATH_API_URL;
    global.fetch = jest.fn();
    await mount({ demo: true, usage: 'member' });
    await fireEvent.press(screen.getByLabelText('Demo: add a person I look after'));
    await fireEvent.press(screen.getByLabelText('Amma (demo)'));
    await fireEvent.press(screen.getByLabelText('Pause routine updates from them: off'));
    expect(screen.getByLabelText('Pause routine updates from them: on')).toBeTruthy();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
