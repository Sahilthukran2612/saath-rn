import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as foreground from '../src/services/foreground';

jest.mock('../src/services/foreground', () => ({
  foregroundAvailable: true,
  askNotificationPermission: jest.fn(async () => true),
  startWatching: jest.fn(() => true),
  stopWatching: jest.fn(),
  isWatching: jest.fn(() => false),
  raiseAlert: jest.fn(() => true),
  clearAlert: jest.fn(),
}));

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );
const openMe = async () => fireEvent.press(screen.getByLabelText('Me'));

beforeEach(() => jest.clearAllMocks());

describe('background watching (foreground service)', () => {
  test('is off by default and the service is stopped', async () => {
    await mount({});
    await waitFor(() => expect(foreground.stopWatching).toHaveBeenCalled());
    expect(foreground.startWatching).not.toHaveBeenCalled();
  });
  test('turning it on asks for the notification permission, then starts the visible service', async () => {
    await mount({});
    await openMe();
    await fireEvent.press(screen.getByLabelText('Keep watching in the background: off'));
    await waitFor(() => expect(foreground.startWatching).toHaveBeenCalled());
    expect(foreground.askNotificationPermission).toHaveBeenCalled();
    expect(foreground.startWatching.mock.calls[0][1]).toMatch(/helping notice/);
  });
  test('the notice text follows the language', async () => {
    await mount({ lang: 'hi', background: true });
    await waitFor(() => expect(foreground.startWatching).toHaveBeenCalled());
    expect(foreground.startWatching.mock.calls[0][1]).toMatch(/साथ/);
  });
  test('if notifications are refused, the service does not start and the setting turns itself off', async () => {
    foreground.askNotificationPermission.mockResolvedValueOnce(false);
    await mount({});
    await openMe();
    await fireEvent.press(screen.getByLabelText('Keep watching in the background: off'));
    await waitFor(() => expect(screen.getByText(/Allow notifications/)).toBeTruthy());
    expect(foreground.startWatching).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Keep watching in the background: off')).toBeTruthy();
  });
  test('turning it off stops the service', async () => {
    await mount({ background: true });
    await waitFor(() => expect(foreground.startWatching).toHaveBeenCalled());
    foreground.stopWatching.mockClear();
    await openMe();
    await fireEvent.press(screen.getByLabelText('Keep watching in the background: on'));
    await waitFor(() => expect(foreground.stopWatching).toHaveBeenCalled());
  });
  test('the screen says a notice stays visible', async () => {
    await mount({});
    await openMe();
    expect(screen.getByText(/A notice stays on screen/)).toBeTruthy();
  });
});
