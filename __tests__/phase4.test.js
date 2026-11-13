import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { initialRegistry, enableShared, addProfile, lock } from '../src/profiles';

const mount = (preload = {}, preloadRegistry) =>
  render(
    <StoreProvider preload={preload} preloadRegistry={preloadRegistry}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

const sharedRegistry = () => {
  const one = enableShared(initialRegistry(), '1234', 's1', 'Amma');
  return lock(addProfile({ ...one, activeId: 'p1' }, { id: 'p2', name: 'Raju', pin: '1111', salt: 's2' }));
};

const asha = { id: 'm1', name: 'Asha (daughter)', role: 'family', phone: '9000000001' };
const openAlert = {
  id: 'a',
  kind: 'fall',
  confidence: 0.9,
  reason: 'impact then still',
  phase: 'countdown',
  remaining: 25,
  stepIndex: 0,
  chain: [asha],
};

describe('shared phone: lock screen', () => {
  test('a locked shared phone shows who is using it, not the app', async () => {
    await mount({}, sharedRegistry());
    expect(screen.getByText('Who is using Saath?')).toBeTruthy();
    expect(screen.getByLabelText('Amma')).toBeTruthy();
    expect(screen.getByLabelText('Raju')).toBeTruthy();
    expect(screen.queryByLabelText('Circle')).toBeNull();
  });

  test('a wrong PIN says how many tries are left, the right PIN opens the app', async () => {
    await mount({}, sharedRegistry());
    await fireEvent.press(screen.getByLabelText('Amma'));
    await fireEvent.changeText(screen.getByLabelText('Enter your PIN'), '0000');
    await fireEvent.press(screen.getByLabelText('Open'));
    await waitFor(() => expect(screen.getByText('Wrong PIN. 4 tries left.')).toBeTruthy());
    await fireEvent.changeText(screen.getByLabelText('Enter your PIN'), '1234');
    await fireEvent.press(screen.getByLabelText('Open'));
    await waitFor(() => expect(screen.getByLabelText('Circle')).toBeTruthy());
  });

  test('a PIN that is not four digits is refused without a try being used', async () => {
    await mount({}, sharedRegistry());
    await fireEvent.press(screen.getByLabelText('Amma'));
    await fireEvent.changeText(screen.getByLabelText('Enter your PIN'), '12');
    await fireEvent.press(screen.getByLabelText('Open'));
    expect(screen.getByText('Use exactly 4 digits.')).toBeTruthy();
  });

  test('a safety alert is drawn over the lock screen, so it never waits for a PIN', async () => {
    await mount({ alert: openAlert }, sharedRegistry());
    expect(screen.getByText('Are you OK?')).toBeTruthy();
    expect(screen.getByLabelText('False alarm')).toBeTruthy();
  });

  test('while an alert is open, another person cannot take over the phone', async () => {
    await mount({ alert: openAlert }, sharedRegistry());
    // Raju was the last person on the phone, so the alert is his; Amma cannot take it over
    await fireEvent.press(screen.getByLabelText('Amma'));
    await fireEvent.changeText(screen.getByLabelText('Enter your PIN'), '1234');
    await fireEvent.press(screen.getByLabelText('Open'));
    await waitFor(() => expect(screen.getByText('Answer the safety alert first.')).toBeTruthy());
    expect(screen.queryByLabelText('Circle')).toBeNull();
  });

  test('a new person can be added with their own PIN', async () => {
    await mount({}, sharedRegistry());
    await fireEvent.press(screen.getByLabelText('Add a person'));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Sunita');
    await fireEvent.changeText(screen.getByLabelText('Choose a 4-digit PIN'), '2222');
    await fireEvent.press(screen.getByLabelText('Add person'));
    await waitFor(() => expect(screen.getByLabelText('Circle')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Me'));
    expect(screen.getAllByText('Sunita').length).toBeGreaterThan(0);
  });

  test('a new person is refused without a name or a valid PIN', async () => {
    await mount({}, sharedRegistry());
    await fireEvent.press(screen.getByLabelText('Add a person'));
    await fireEvent.press(screen.getByLabelText('Add person'));
    expect(screen.getByText('Enter a name and a 4-digit PIN.')).toBeTruthy();
  });
});

describe('shared phone: turning it on and off in Me', () => {
  test('turn on with a PIN, lock now, and the lock screen appears', async () => {
    await mount({});
    await fireEvent.press(screen.getByLabelText('Me'));
    await fireEvent.press(screen.getByLabelText('Shared phone: off'));
    await fireEvent.changeText(screen.getByLabelText('Choose a 4-digit PIN'), '4321');
    await fireEvent.press(screen.getByLabelText('Confirm'));
    await fireEvent.press(screen.getByLabelText('Lock now'));
    expect(screen.getByText('Who is using Saath?')).toBeTruthy();
  });

  test('a bad PIN does not turn it on', async () => {
    await mount({});
    await fireEvent.press(screen.getByLabelText('Me'));
    await fireEvent.press(screen.getByLabelText('Shared phone: off'));
    await fireEvent.changeText(screen.getByLabelText('Choose a 4-digit PIN'), '12');
    await fireEvent.press(screen.getByLabelText('Confirm'));
    expect(screen.getByText('Use exactly 4 digits.')).toBeTruthy();
    expect(screen.getByLabelText('Shared phone: off')).toBeTruthy();
  });

  test('turning it off needs the PIN', async () => {
    const open = { ...enableShared(initialRegistry(), '1234', 's1', 'Amma') };
    await mount({}, open);
    await fireEvent.press(screen.getByLabelText('Me'));
    await fireEvent.press(screen.getByLabelText('Shared phone: on'));
    await fireEvent.changeText(screen.getByLabelText('Enter your PIN to turn this off'), '0000');
    await fireEvent.press(screen.getByLabelText('Confirm'));
    expect(screen.getByLabelText('Shared phone: on')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Enter your PIN to turn this off'), '1234');
    await fireEvent.press(screen.getByLabelText('Confirm'));
    expect(screen.getByLabelText('Shared phone: off')).toBeTruthy();
  });
});
