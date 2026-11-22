import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { reducer } from '../src/state/reducer';
import { seededState } from '../testSupport/fixtures';

// The phone keeps what a screen saved and loads it over a test's starting state, so each test starts with nothing saved.
beforeEach(async () => {
  await AsyncStorage.clear();
});

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );

describe('the I\'m OK card on Today', () => {
  test('it has one round I\'m OK button, a status, the day\'s count and a last-confirmed line', async () => {
    await mount({ mode: 'elder' });
    expect(screen.getAllByLabelText("I'm OK")).toHaveLength(1);
    expect(screen.getByText('Daily activity and status')).toBeTruthy();
    expect(screen.getByText('Tap to confirm')).toBeTruthy();
    expect(screen.getByText('0 / 4 done today')).toBeTruthy();
    expect(screen.getByText('Not confirmed yet')).toBeTruthy();
  });

  test('the day\'s count is the only progress on the screen: the greeting no longer has a second one', async () => {
    await mount({ mode: 'elder' });
    expect(screen.getAllByText(/done today/)).toHaveLength(1);
  });

  test('tapping the button confirms, says so, and fills in the last-confirmed line', async () => {
    await mount({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText("I'm OK"));
    expect(screen.getByText('Your circle knows you are fine.')).toBeTruthy();
    expect(screen.getByText('Sent')).toBeTruthy();
    expect(screen.getByText('Confirmed today')).toBeTruthy();
    expect(screen.getByText(/^Last confirmed: Today at /)).toBeTruthy();
  });

  test('a confirmation from an earlier day shows its date and asks again today', async () => {
    const yesterday = Date.now() - 26 * 3600000;
    await mount({ mode: 'elder', lastOkAt: yesterday });
    expect(screen.getByText('Tap to confirm')).toBeTruthy();
    expect(screen.getByText(/^Last confirmed: .+, /)).toBeTruthy();
    expect(screen.queryByText(/Today at/)).toBeNull();
  });

  test.each(['teen', 'adult'])('the %s home has it too, not only the elder one', async (mode) => {
    await mount({ mode, consent: { status: 'granted', guardianName: 'A', guardianPhone: '9876543210', at: 1 } });
    expect(screen.getAllByLabelText("I'm OK")).toHaveLength(1);
    expect(screen.getByText('0 / 4 done today')).toBeTruthy();
  });

  test('with no tasks there is no count line, only the ring track', async () => {
    await mount({ mode: 'elder', tasks: [] });
    expect(screen.queryByText(/done today/)).toBeNull();
    expect(screen.getAllByLabelText("I'm OK")).toHaveLength(1);
  });
});

describe('the last confirmed time', () => {
  test('the check-in action records it, and keeps the activity time', () => {
    const s = reducer({ ...seededState, hydrated: true }, { type: 'CHECK_IN', at: 12345 });
    expect(s.lastOkAt).toBe(12345);
    expect(s.lastActiveMs).toBe(12345);
  });
});

// Hindi words are padded with invisible spaces, so these match on a part of the text.
describe('Hindi', () => {
  test('the words, the status and the last-confirmed line are Hindi', async () => {
    await mount({ mode: 'elder', lang: 'hi' });
    expect(screen.getByText(/दैनिक/)).toBeTruthy();
    expect(screen.getByText(/अभी पुष्टि नहीं/)).toBeTruthy();
    expect(screen.getByLabelText('मैं ठीक हूँ')).toBeTruthy();
  });
});
