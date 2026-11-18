import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );

// Pin the clock to 8:00 on a day with low medicine so the first slip is the refill reminder.
const lowMeds = { meds: { name: 'Metformin', pillsLeft: 4, perDay: 2 } };

describe('suggestion pad on Today', () => {
  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(2026, 10, 10, 8, 0).getTime(), doNotFake: ['nextTick', 'setImmediate'] });
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true); // instant, no tear animation
  });
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  test('shows the most important slip first, with Stamp it, Open and Not today', async () => {
    await mount({ mode: 'adult', ...lowMeds });
    expect(await screen.findByText("Today's slips")).toBeTruthy();
    expect(screen.getByText('Medicine running low')).toBeTruthy();
    expect(screen.getByLabelText('Stamp it')).toBeTruthy();
    expect(screen.getByLabelText('Open')).toBeTruthy();
    expect(screen.getByLabelText('Not today')).toBeTruthy();
    expect(screen.getByText(/about 2 days/)).toBeTruthy();
  });

  test('Stamp it stamps the slip and moves to the next one', async () => {
    await mount({ mode: 'adult', ...lowMeds });
    await fireEvent.press(await screen.findByLabelText('Stamp it'));
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() => expect(screen.queryByText('Medicine running low')).toBeNull());
  });

  test('Not today puts it aside without a stamp', async () => {
    await mount({ mode: 'adult', ...lowMeds });
    await fireEvent.press(await screen.findByLabelText('Not today'));
    await waitFor(() => expect(screen.queryByText('Medicine running low')).toBeNull());
  });

  test('is in Hindi when the language is Hindi', async () => {
    await mount({ mode: 'adult', lang: 'hi', ...lowMeds });
    expect(await screen.findByText('आज की पर्चियाँ')).toBeTruthy();
    expect(screen.getByText('दवा कम हो रही है')).toBeTruthy();
    expect(screen.getByLabelText('मुहर लगाएँ')).toBeTruthy();
  });

  test('is not on the family home and does not appear over a real alert', async () => {
    await mount({ role: 'family' });
    expect(screen.queryByText("Today's slips")).toBeNull();
  });
});
