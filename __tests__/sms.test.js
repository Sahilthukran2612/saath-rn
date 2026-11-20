import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { StoreProvider, useStore } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as sms from '../src/services/sms';

let mockAvailable = true;
jest.mock('../src/services/sms', () => ({
  get smsAvailable() {
    return mockAvailable;
  },
  askSmsPermission: jest.fn(async () => true),
  hasSmsPermission: jest.fn(async () => true),
  sendSms: jest.fn(async () => true),
}));

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

const asha = { id: 'm1', name: 'Asha (daughter)', role: 'family', dial: 2, phone: '9000000001' };
const raju = { id: 'm2', name: 'Raju (neighbour)', role: 'neighbour', dial: 0, phone: '9000000002' };
const alert = (over = {}) => ({
  id: 'a',
  kind: 'fall',
  confidence: 0.9,
  reason: 'x',
  phase: 'escalating',
  remaining: 15,
  stepIndex: 0,
  chain: [asha, raju],
  ...over,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockAvailable = true;
});

// Lets a test push actions (like the countdown ticking) into the same store the app uses.
const holder = {};
function Capture({ onReady }) {
  const { dispatch } = useStore();
  React.useEffect(() => onReady(dispatch), [dispatch, onReady]);
  return null;
}
const mountWithDispatch = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
      <Capture onReady={(d) => (holder.dispatch = d)} />
    </StoreProvider>
  );

describe('automatic SMS when nobody answers', () => {
  test('off by default: nothing is sent, even when an alert reaches the escalation step', async () => {
    await mount({ alert: alert() });
    expect(screen.getByLabelText('Call Asha (daughter)')).toBeTruthy();
    expect(sms.sendSms).not.toHaveBeenCalled();
  });

  test('on: texts the contact being reached, with the alert wording and the person’s name', async () => {
    await mount({ autoSms: true, profile: { name: 'Amma' }, alert: alert() });
    await waitFor(() => expect(sms.sendSms).toHaveBeenCalledTimes(1));
    expect(sms.sendSms.mock.calls[0][0]).toBe('9000000001');
    expect(sms.sendSms.mock.calls[0][1]).toMatch(/Amma may have had a fall/);
    expect(sms.sendSms.mock.calls[0][1]).not.toMatch(/emergency|is hurt/i);
    await waitFor(() => expect(screen.getByText('Message sent to Asha (daughter)')).toBeTruthy());
  });

  test('a long-quiet alert uses the quiet wording', async () => {
    await mount({ autoSms: true, alert: alert({ kind: 'quiet' }) });
    await waitFor(() => expect(sms.sendSms).toHaveBeenCalled());
    expect(sms.sendSms.mock.calls[0][1]).toMatch(/quiet for a long time/);
  });

  test('nothing is sent during the countdown, while the person can still answer', async () => {
    await mount({ autoSms: true, alert: alert({ phase: 'countdown', remaining: 25 }) });
    expect(screen.getByText('Are you OK?')).toBeTruthy();
    expect(sms.sendSms).not.toHaveBeenCalled();
  });

  test('a contact with no phone number is skipped without an error', async () => {
    await mount({ autoSms: true, alert: alert({ chain: [{ ...asha, phone: '' }, raju] }) });
    expect(sms.sendSms).not.toHaveBeenCalled();
  });

  test('if Android refuses the message the screen says so and points to the buttons', async () => {
    sms.sendSms.mockResolvedValueOnce(false);
    await mount({ autoSms: true, alert: alert() });
    await waitFor(() => expect(screen.getByText(/Could not send a message by itself/)).toBeTruthy());
  });

  test('the next contact is texted when the escalation moves on, and each step only once', async () => {
    await mountWithDispatch({ autoSms: true, alert: alert({ remaining: 2 }) });
    await waitFor(() => expect(sms.sendSms).toHaveBeenCalledTimes(1));
    expect(sms.sendSms.mock.calls[0][0]).toBe('9000000001');
    // the same step ticking down must not send again
    await act(async () => holder.dispatch({ type: 'TICK' }));
    expect(sms.sendSms).toHaveBeenCalledTimes(1);
    // the step ends: the next contact is texted, once
    await act(async () => holder.dispatch({ type: 'TICK' }));
    await waitFor(() => expect(sms.sendSms).toHaveBeenCalledTimes(2));
    expect(sms.sendSms.mock.calls[1][0]).toBe('9000000002');
    await act(async () => holder.dispatch({ type: 'TICK' }));
    expect(sms.sendSms).toHaveBeenCalledTimes(2);
  });
});

describe('demo: the automatic SMS is shown, not sent, when the SMS module is absent (Expo Go)', () => {
  test('the message that would be sent is shown on the alert screen and nothing is sent', async () => {
    mockAvailable = false;
    await mount({ autoSms: true, demo: true, profile: { name: 'Amma' }, alert: alert() });
    await waitFor(() => expect(screen.getByText(/Demo: would send to Asha \(daughter\): Saath: Amma may have had a fall/)).toBeTruthy());
    expect(sms.sendSms).not.toHaveBeenCalled();
  });
  test('the switch can be turned on in demo mode without the permission, and says it is a demo', async () => {
    mockAvailable = false;
    await mount({ demo: true });
    await fireEvent.press(screen.getByLabelText('Me'));
    expect(screen.getByText('Demo: the message is shown on screen, not sent.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Send the alert SMS by itself: off'));
    await waitFor(() => expect(screen.getByLabelText('Send the alert SMS by itself: on')).toBeTruthy());
    expect(sms.askSmsPermission).not.toHaveBeenCalled();
  });
  test('outside demo mode, without the module, nothing is simulated', async () => {
    mockAvailable = false;
    await mount({ demo: false, autoSms: true, alert: alert() });
    expect(screen.queryByText(/Demo: would send/)).toBeNull();
    expect(sms.sendSms).not.toHaveBeenCalled();
  });
});
describe('the setting on the Me tab', () => {
  const openMe = async () => fireEvent.press(screen.getByLabelText('Me'));

  test('turning it on asks for the SMS permission first', async () => {
    await mount({});
    await openMe();
    await fireEvent.press(screen.getByLabelText('Send the alert SMS by itself: off'));
    await waitFor(() => expect(screen.getByLabelText('Send the alert SMS by itself: on')).toBeTruthy());
    expect(sms.askSmsPermission).toHaveBeenCalled();
  });

  test('if the permission is refused it stays off and says why', async () => {
    sms.askSmsPermission.mockResolvedValueOnce(false);
    await mount({});
    await openMe();
    await fireEvent.press(screen.getByLabelText('Send the alert SMS by itself: off'));
    await waitFor(() => expect(screen.getByText(/Allow SMS so Saath can send alerts/)).toBeTruthy());
    expect(screen.getByLabelText('Send the alert SMS by itself: off')).toBeTruthy();
  });

  test('turning it off needs no permission', async () => {
    await mount({ autoSms: true });
    await openMe();
    await fireEvent.press(screen.getByLabelText('Send the alert SMS by itself: on'));
    await waitFor(() => expect(screen.getByLabelText('Send the alert SMS by itself: off')).toBeTruthy());
    expect(sms.askSmsPermission).not.toHaveBeenCalled();
  });

  test('it explains the cost and that it needs signal, not internet', async () => {
    await mount({});
    await openMe();
    expect(screen.getByText(/Uses your SMS plan and mobile signal, not internet/)).toBeTruthy();
  });
});
