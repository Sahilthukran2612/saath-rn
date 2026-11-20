import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { visitStatus } from '../src/visits';
import { reducer, initialState, productionState } from '../src/state/reducer';

jest.mock('../src/services/sensing', () => ({ startFallListener: jest.fn(() => () => {}) }));
beforeEach(() => {
  process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
  process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
});

const DAY = 86400000;
const NOW = new Date(2026, 10, 21, 12).getTime();

describe('household visits', () => {
  test('never visited is due; 13 days is not; 14 days is', () => {
    expect(visitStatus(undefined, NOW)).toEqual({ due: true, days: null });
    expect(visitStatus(NOW - 13 * DAY, NOW).due).toBe(false);
    expect(visitStatus(NOW - 14 * DAY, NOW).due).toBe(true);
    expect(visitStatus(NOW, NOW)).toEqual({ due: false, days: 0 });
  });
  test('the reducer keeps one time per household', () => {
    let s = reducer(initialState, { type: 'VISIT_MARK', id: 'a', at: 5 });
    s = reducer(s, { type: 'VISIT_MARK', id: 'b', at: 6 });
    s = reducer(s, { type: 'VISIT_MARK', id: 'a', at: 9 });
    expect(s.visits).toEqual({ a: 9, b: 6 });
  });
  test('an ASHA sees Visit due on a home, then marks it visited from the panel', async () => {
    const circle = { household_id: 'hx', role: 'asha', dial: 1, time_off: false, person_name: 'Kamla' };
    await render(
      <StoreProvider preload={{ ...productionState, usage: 'member', onboarded: true, cloud: { phone: '9876543210', userId: 'u', access: 'A', refresh: 'R', householdId: 'h' }, circles: [circle], feeds: { hx: [] }, visits: {} }}>
        <AppShell sensing={false} />
      </StoreProvider>,
    );
    expect(await screen.findByLabelText('Kamla')).toBeTruthy();
    expect(await screen.findByText('Visit due')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Kamla'));
    expect(await screen.findByText('No visit noted yet.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('I visited today'));
    expect(await screen.findByText('Visited today.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Back'));
    expect(screen.queryByText('Visit due')).toBeNull();
  });
});
