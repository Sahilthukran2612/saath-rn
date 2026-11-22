import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { readingsToPush, doctorHasFullAccess } from '../src/readingsSync';
import { pushReadings, fetchReadings } from '../src/services/cloud';
import { reducer, productionState } from '../src/state/reducer';
import * as cloud from '../src/services/cloud';

const cfg = { url: 'https://api.example.test', key: 'anon' };
const session = { access: 'A', refresh: 'R', householdId: 'h1', userId: 'u1', phone: '9876543210' };
const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });
const day = 86400000;
const NOW = Date.now();

const patient = (over = {}) => ({
  ...productionState,
  cloud: session,
  joined: [{ id: 'd1', name: 'Dr Rao', role: 'clinician', dial: 2 }],
  readings: [
    { id: 'r1', mgdl: 140, at: NOW - 3 * day },
    { id: 'r2', mgdl: 180, at: NOW - 2 * day },
    { id: 'r3', mgdl: 120, at: NOW - day },
  ],
  readingsSyncedAt: 0,
  ...over,
});

describe('what the phone uploads for a doctor', () => {
  test('nothing leaves the phone unless a joined doctor is at Full', () => {
    expect(readingsToPush(patient())).toHaveLength(3);
    expect(readingsToPush(patient({ joined: [{ role: 'clinician', dial: 1 }] }))).toEqual([]);
    expect(readingsToPush(patient({ joined: [{ role: 'family', dial: 2 }] }))).toEqual([]);
    expect(readingsToPush(patient({ joined: [] }))).toEqual([]);
    expect(readingsToPush(patient({ cloud: { ...session, access: null } }))).toEqual([]);
    expect(doctorHasFullAccess([{ role: 'clinician', dial: 2 }])).toBe(true);
  });

  test('only readings not yet sent, oldest first, in the shape the table wants', () => {
    const rows = readingsToPush(patient({ readingsSyncedAt: NOW - 2 * day - 1000 }));
    expect(rows.map((r) => r.client_id)).toEqual(['r2', 'r3']);
    expect(rows[0]).toEqual({ household_id: 'h1', client_id: 'r2', mgdl: 180, at: new Date(NOW - 2 * day).toISOString() });
  });

  test('an impossible number is never sent, and the batch is capped', () => {
    const many = Array.from({ length: 300 }, (_, i) => ({ id: `x${i}`, mgdl: 100, at: NOW - i * 1000 }));
    expect(readingsToPush(patient({ readings: [{ id: 'bad', mgdl: 5, at: NOW }, { id: 'bad2', mgdl: 900, at: NOW }] }))).toEqual([]);
    expect(readingsToPush(patient({ readings: many }), 200)).toHaveLength(200);
  });

  test('marking readings as sent only ever moves forward', () => {
    let s = reducer(patient(), { type: 'READINGS_SYNCED', at: 500 });
    expect(s.readingsSyncedAt).toBe(500);
    s = reducer(s, { type: 'READINGS_SYNCED', at: 100 });
    expect(s.readingsSyncedAt).toBe(500);
  });
});

describe('the readings calls (fake server)', () => {
  test('push is an upsert keyed by household and reading, and an empty batch sends nothing', async () => {
    const f = jest.fn(async () => reply(201, null));
    const rows = readingsToPush(patient());
    expect((await pushReadings(cfg, session, rows, f)).ok).toBe(true);
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/rest/v1/readings?on_conflict=household_id,client_id');
    expect(init.method).toBe('POST');
    expect(init.headers.Prefer).toContain('resolution=merge-duplicates');
    expect(JSON.parse(init.body)).toHaveLength(3);
    const none = jest.fn();
    expect((await pushReadings(cfg, session, [], none)).ok).toBe(true);
    expect(none).not.toHaveBeenCalled();
  });

  test('fetch returns readings oldest first with numeric times, and a refusal is an empty list', async () => {
    const f = jest.fn(async () =>
      reply(200, [
        { client_id: 'b', mgdl: 150, at: '2026-11-20T08:00:00.000Z' },
        { client_id: 'a', mgdl: 110, at: '2026-11-19T08:00:00.000Z' },
        { client_id: 'junk', mgdl: 'x', at: 'not a date' },
      ]),
    );
    const r = await fetchReadings(cfg, session, 'h1', f);
    expect(r.ok).toBe(true);
    expect(r.readings.map((x) => x.id)).toEqual(['a', 'b']);
    expect(f.mock.calls[0][0]).toContain('household_id=eq.h1');
    const denied = await fetchReadings(cfg, session, 'h1', jest.fn(async () => reply(200, [])));
    expect(denied).toMatchObject({ ok: true, readings: [] });
  });
});

describe('the doctor’s patient screen', () => {
  afterEach(() => jest.restoreAllMocks());
  const doctor = {
    ...productionState,
    usage: 'doctor',
    onboarded: true,
    cloud: session,
    circles: [{ household_id: 'h-amma', role: 'clinician', dial: 2, time_off: false, person_name: 'Amma' }],
  };
  const mount = (preload) =>
    render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
      </StoreProvider>,
    );

  test('shows the patient’s sugar statistics, read-only, without saying what they mean', async () => {
    jest.spyOn(cloud, 'isConfigured').mockReturnValue(true);
    jest.spyOn(cloud, 'fetchReadings').mockResolvedValue({
      ok: true,
      session: null,
      readings: [
        { id: 'a', mgdl: 100, at: NOW - 2 * day },
        { id: 'b', mgdl: 140, at: NOW - day },
        { id: 'c', mgdl: 180, at: NOW - 3600000 },
      ],
    });
    await mount(doctor);
    await fireEvent.press(await screen.findByLabelText('Amma'));
    expect(await screen.findByText('Sugar readings')).toBeTruthy();
    expect(await screen.findByText('140')).toBeTruthy(); // the average of 100, 140 and 180
    expect(screen.getByText(/never what they mean/)).toBeTruthy();
    expect(screen.queryByLabelText('Add a reading')).toBeNull();
  });

  test('with nothing shared it says so, and tells the doctor why', async () => {
    jest.spyOn(cloud, 'isConfigured').mockReturnValue(true);
    jest.spyOn(cloud, 'fetchReadings').mockResolvedValue({ ok: true, session: null, readings: [] });
    await mount(doctor);
    await fireEvent.press(await screen.findByLabelText('Amma'));
    expect(await screen.findByText(/No readings shared yet/)).toBeTruthy();
  });

  test('a guardian’s view of the same person has no readings card', async () => {
    jest.spyOn(cloud, 'isConfigured').mockReturnValue(true);
    const spy = jest.spyOn(cloud, 'fetchReadings').mockResolvedValue({ ok: true, session: null, readings: [] });
    await mount({ ...doctor, usage: 'member', circles: [{ household_id: 'h-amma', role: 'family', dial: 2, time_off: false, person_name: 'Amma' }] });
    await fireEvent.press(await screen.findByLabelText('Amma'));
    expect(screen.queryByText('Sugar readings')).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});
