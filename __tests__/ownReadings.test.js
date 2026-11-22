import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { reducer, productionState } from '../src/state/reducer';
import * as pushService from '../src/services/push';

const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

describe('restoring my own readings', () => {
  const base = { ...productionState, readings: [{ id: 'local', mgdl: 150, at: 2000 }] };
  test('readings from the server are added once by id, in time order, and local ones are kept', () => {
    const server = [
      { id: 'seed-1', mgdl: 140, at: 1000 },
      { id: 'local', mgdl: 999, at: 2000 },
      { id: 'seed-2', mgdl: 160, at: 3000 },
    ];
    let s = reducer(base, { type: 'READINGS_RESTORE', readings: server });
    expect(s.readings.map((r) => r.id)).toEqual(['seed-1', 'local', 'seed-2']);
    expect(s.readings.find((r) => r.id === 'local').mgdl).toBe(150);
    const again = reducer(s, { type: 'READINGS_RESTORE', readings: server });
    expect(again).toBe(s);
  });
  test('broken rows are ignored', () => {
    const s = reducer(base, { type: 'READINGS_RESTORE', readings: [{ id: '', mgdl: 1, at: 1 }, { id: 'x', mgdl: NaN, at: 1 }, null] });
    expect(s).toBe(base);
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
      if (init.method === 'GET' && url.includes('/rest/v1/readings?household_id=eq.h1'))
        return reply(200, [{ client_id: 'seed-1', mgdl: 140, at: '2026-11-20T07:30:00Z' }]);
      if (init.method === 'GET') return reply(200, []);
      return reply(201, null);
    });
    spy = jest.spyOn(pushService, 'setupPush').mockResolvedValue({ ok: false, reason: 'unavailable' });
  });
  afterEach(() => {
    global.fetch = realFetch;
    spy.mockRestore();
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  const cloud = { phone: '9876543210', userId: 'u1', access: 'A', refresh: 'R', householdId: 'h1' };
  const readingsCalls = () => global.fetch.mock.calls.filter(([u, i]) => i.method === 'GET' && u.includes('/rest/v1/readings?household_id=eq.h1'));

  test('a signed-in person fetches their own readings from the server', async () => {
    await render(
      <StoreProvider preload={{ demo: false, usage: 'person', cloud }}>
        <AppShell sensing={false} />
      </StoreProvider>
    );
    await waitFor(() => expect(readingsCalls().length).toBe(1));
  });

  test('someone who only looks after others does not', async () => {
    await render(
      <StoreProvider preload={{ demo: false, usage: 'member', onboarded: true, cloud }}>
        <AppShell sensing={false} />
      </StoreProvider>
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 50));
    expect(readingsCalls()).toHaveLength(0);
  });
});
