import React from 'react';
import { Share } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );

const SIGNED = { access: 'a', refresh: 'r', householdId: 'h', userId: 'u', phone: '9000000001' };

async function invite(preload) {
  const share = jest.spyOn(Share, 'share').mockResolvedValue({});
  await mount({ role: 'person', ...preload });
  await fireEvent.press(await screen.findByLabelText('Circle'));
  await fireEvent.press(await screen.findByLabelText('Add a person'));
  await fireEvent.changeText(await screen.findByLabelText('Name'), 'Meena');
  await fireEvent.changeText(screen.getByLabelText('Phone number'), '9876543210');
  await fireEvent.press(screen.getByLabelText('Add and send code'));
  await waitFor(() => expect(share).toHaveBeenCalled());
  return share;
}

describe('sending an invite', () => {
  afterEach(() => jest.restoreAllMocks());

  test('the message is plain text with the code and no web address', async () => {
    const share = await invite({ demo: false });
    const message = share.mock.calls[0][0].message;
    expect(message).toMatch(/Enter this code: [A-Z0-9]{8}/);
    expect(message).not.toMatch(/https?:|saath\.app/i);
  });

  test('signed out: it says the invite was not sent and there is no Send now', async () => {
    await invite({ demo: false });
    expect(await screen.findByText(/Not sent\. Sign in on the Me tab first/)).toBeTruthy();
    expect(screen.queryByLabelText('Send now')).toBeNull();
  });

  test('signed in but not yet uploaded: it says so and offers Send now', async () => {
    await invite({ demo: false, cloud: SIGNED });
    expect(await screen.findByText(/Not sent yet\. It sends by itself/)).toBeTruthy();
    expect(screen.getByLabelText('Send now')).toBeTruthy();
  });

  test('a failed upload shows why', async () => {
    await invite({ demo: false, cloud: { ...SIGNED, inviteFail: 400 } });
    expect(await screen.findByText(/Could not send it/)).toBeTruthy();
  });

  test('the code is shown on the waiting row, and tapping it does not mark anyone as joined outside demo', async () => {
    await invite({ demo: false, cloud: SIGNED });
    const row = await screen.findByText(/Guardian\. Code: [A-Z0-9]{8}/);
    await fireEvent.press(row);
    expect(screen.queryByText('Waiting')).toBeTruthy(); // still waiting: nothing was accepted locally
  });

  test('in demo mode the row still simulates a join, and says so', async () => {
    await invite({ demo: true });
    expect(await screen.findByText(/Demo: tapping a waiting person/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Mark joined (demo)'));
    await waitFor(() => expect(screen.queryByText('Waiting')).toBeNull());
  });

  test('a freshly made invite starts as Waiting until it reaches the server', async () => {
    await invite({ demo: false, cloud: SIGNED, invites: [] });
    expect(await screen.findByText('Waiting')).toBeTruthy();
  });
});
