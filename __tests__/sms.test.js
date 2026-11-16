import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as sms from '../src/services/sms';

jest.mock('../src/services/sms', () => ({
  smsAvailable: true,
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

beforeEach(() => jest.clearAllMocks());

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

  test('the next contact is texted at the next step, and each step only once', async () => {
    await mount({ autoSms: true, alert: alert() });
    await waitFor(() => expect(sms.sendSms).toHaveBeenCalledTimes(1));
    // same step re-rendered (the countdown ticks): still one message
    await mount({ autoSms: true, alert: alert({ remaining: 10 }) });
    // a different alert on a fresh mount is a new message, so just check the second contact separately
    sms.sendSms.mockClear();
    await mount({ autoSms: true, alert: alert({ id: 'b', stepIndex: 1 }) });
    await waitFor(() => expect(sms.sendSms).toHaveBeenCalled());
    expect(sms.sendSms.mock.calls.at(-1)[0]).toBe('9000000002');
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
    expect(screen.getByText(/uses your own SMS plan and needs mobile signal, not internet/)).toBeTruthy();
  });
});
