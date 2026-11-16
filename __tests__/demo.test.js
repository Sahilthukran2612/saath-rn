import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { initialState, reducer } from '../src/state/reducer';
import { heartStatus } from '../src/heart';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );
const openCircle = async () => fireEvent.press(screen.getByLabelText('Circle'));

describe('demo: a person I look after (no server)', () => {
  test('the section and the demo buttons show in demo mode even without a server', async () => {
    await mount({ demo: true });
    await openCircle();
    expect(screen.getByText('People I look after')).toBeTruthy();
    expect(screen.getByLabelText('Demo: add a person I look after')).toBeTruthy();
    expect(screen.queryByLabelText('Demo: they may have fallen')).toBeNull(); // nobody added yet
  });

  test('add the person, then their fall shows the same banner the real server data would', async () => {
    await mount({ demo: true });
    await openCircle();
    await fireEvent.press(screen.getByLabelText('Demo: add a person I look after'));
    expect(screen.getAllByText(/Amma \(demo\)/).length).toBeGreaterThan(0);
    expect(screen.queryByLabelText('Got it')).toBeNull(); // routine news only, no alert yet
    await fireEvent.press(screen.getByLabelText('Demo: they may have fallen'));
    await waitFor(() => expect(screen.getByLabelText('Got it')).toBeTruthy());
    expect(screen.getAllByText('Amma (demo) may have fallen. Please call them.').length).toBeGreaterThan(0);
  });

  test('"Got it" clears the banner, and their "I am OK" clears an alert I have not seen', async () => {
    await mount({ demo: true });
    await openCircle();
    await fireEvent.press(screen.getByLabelText('Demo: add a person I look after'));
    await fireEvent.press(screen.getByLabelText('Demo: they may have fallen'));
    await fireEvent.press(await screen.findByLabelText('Got it'));
    await waitFor(() => expect(screen.queryByLabelText('Got it')).toBeNull());
    await fireEvent.press(screen.getByLabelText('Demo: they may have fallen'));
    await waitFor(() => expect(screen.getByLabelText('Got it')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Demo: they say they are OK'));
    await waitFor(() => expect(screen.queryByLabelText('Got it')).toBeNull());
  });

  test('opening them shows the feed with what they sent, worded in plain language', async () => {
    await mount({ demo: true });
    await openCircle();
    await fireEvent.press(screen.getByLabelText('Demo: add a person I look after'));
    await fireEvent.press(screen.getByLabelText('Amma (demo)'));
    expect(screen.getByText('You see: Routine')).toBeTruthy();
    expect(screen.getByText('Amma (demo) finished: Lunch')).toBeTruthy();
    expect(screen.getByText('Amma (demo) said they are OK.')).toBeTruthy();
  });

  test('outside demo mode, with no server, none of it shows', async () => {
    await mount({ demo: false });
    await openCircle();
    expect(screen.queryByText('People I look after')).toBeNull();
    expect(screen.queryByLabelText('Demo: add a person I look after')).toBeNull();
  });
});

describe('demo actions in the reducer', () => {
  const base = { ...initialState, hydrated: true };
  test('adding the demo person twice does not duplicate them', () => {
    let s = reducer(base, { type: 'DEMO_CIRCLE_ADD', at: 1_000_000 });
    s = reducer(s, { type: 'DEMO_CIRCLE_ADD', at: 2_000_000 });
    expect(s.circles.filter((c) => c.household_id === 'demo-amma')).toHaveLength(1);
  });
  test('an event for a person who was never added is ignored', () => {
    expect(reducer(base, { type: 'DEMO_CIRCLE_EVENT', kind: 'fall', at: 1 })).toBe(base);
  });
  test('the demo fall is a safety event and goes first', () => {
    let s = reducer(base, { type: 'DEMO_CIRCLE_ADD', at: 5_000_000 });
    s = reducer(s, { type: 'DEMO_CIRCLE_EVENT', kind: 'fall', at: 5_000_100 });
    expect(s.feeds['demo-amma'][0]).toMatchObject({ kind: 'fall', event_type: 0 });
  });
  test('signing out of sync wipes the demo person too', () => {
    let s = reducer(base, { type: 'DEMO_CIRCLE_ADD', at: 1 });
    s = reducer(s, { type: 'CLOUD_SIGN_OUT' });
    expect(s.circles).toEqual([]);
  });
  test('the simulated heart readings are what heartStatus calls high, low and ok, and only while still', () => {
    const at = 10_000_000;
    const status = (bpm) => {
      const s = reducer(base, { type: 'HEART_SIM', bpm, at });
      return heartStatus(s.heart.readings, { stillSince: s.lastActiveMs, now: at }).level;
    };
    expect(status(135)).toBe('high');
    expect(status(36)).toBe('low');
    expect(status(72)).toBe('ok');
  });
});