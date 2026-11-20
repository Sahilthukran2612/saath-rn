import React from 'react';
import { Linking, Share } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { productionState } from '../src/state/reducer';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );

afterEach(() => jest.restoreAllMocks());

describe('joining a circle by QR', () => {
  test('after adding a person, their QR and code are shown to scan', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({});
    await mount({ role: 'person', demo: false });
    await fireEvent.press(await screen.findByLabelText('Circle'));
    await fireEvent.press(await screen.findByLabelText('Add a person'));
    await fireEvent.changeText(await screen.findByLabelText('Name'), 'Meena');
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '9876543210');
    await fireEvent.press(screen.getByLabelText('Add and send code'));
    expect(await screen.findByText('Scan to join')).toBeTruthy();
    expect(screen.getByText(/scan this with your phone camera/)).toBeTruthy();
  });

  test('a scanned link on a new phone makes it a care-giver phone and fills the code in', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('saath://join/AB12CD34');
    await mount({ ...productionState });
    // the setup for someone who looks after a person, not the choice screen
    expect(await screen.findByText('About you')).toBeTruthy();
  });

  test('a scanned link on a phone already set up opens the join box with the code in it', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('saath://join/AB12CD34');
    await mount({ ...productionState, usage: 'member', onboarded: true });
    await waitFor(() => expect(screen.getByLabelText('Invite code').props.value).toBe('AB12CD34'));
  });

  test('a link that is not a Saath join link is ignored', async () => {
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue('https://example.com/join/AB12CD34');
    await mount({ ...productionState });
    expect(await screen.findByText('How will you use Saath?')).toBeTruthy();
  });
});
