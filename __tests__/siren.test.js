import fs from 'fs';
import path from 'path';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as siren from '../src/services/siren';

jest.mock('../src/services/siren', () => ({
  startSiren: jest.fn(() => true),
  stopSiren: jest.fn(),
  sirenPlaying: jest.fn(() => false),
}));

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

const asha = { id: 'm1', name: 'Asha (daughter)', role: 'family', dial: 2, phone: '9000000001' };
const alert = (over = {}) => ({
  id: 'a',
  kind: 'fall',
  confidence: 0.9,
  reason: 'x',
  phase: 'escalating',
  remaining: 15,
  stepIndex: 0,
  chain: [asha],
  ...over,
});

beforeEach(() => jest.clearAllMocks());

describe('loud alarm when nobody answers', () => {
  test('off by default: never plays, even when nobody has answered', async () => {
    await mount({ alert: alert() });
    expect(siren.startSiren).not.toHaveBeenCalled();
  });

  test('on: stays quiet during the countdown, while the person can still answer', async () => {
    await mount({ siren: true, alert: alert({ phase: 'countdown', remaining: 25 }) });
    expect(screen.getByText('Are you OK?')).toBeTruthy();
    expect(siren.startSiren).not.toHaveBeenCalled();
  });

  test('on: plays once nobody has answered (escalating), and when nobody could be reached (done)', async () => {
    await mount({ siren: true, alert: alert() });
    await waitFor(() => expect(siren.startSiren).toHaveBeenCalled());
    jest.clearAllMocks();
    await mount({ siren: true, alert: alert({ phase: 'done', remaining: 0 }) });
    await waitFor(() => expect(siren.startSiren).toHaveBeenCalled());
  });

  test('answering stops it at once', async () => {
    await mount({ siren: true, alert: alert() });
    await waitFor(() => expect(siren.startSiren).toHaveBeenCalled());
    siren.stopSiren.mockClear();
    await fireEvent.press(screen.getByLabelText('False alarm'));
    await waitFor(() => expect(siren.stopSiren).toHaveBeenCalled());
  });

  test('the switch on the Me tab turns it on and off', async () => {
    await mount({});
    await fireEvent.press(screen.getByLabelText('Me'));
    expect(screen.getByText(/Plays a loud siren on this phone so people nearby can hear it/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Loud alarm when no one answers: off'));
    await waitFor(() => expect(screen.getByLabelText('Loud alarm when no one answers: on')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('Loud alarm when no one answers: on'));
    await waitFor(() => expect(screen.getByLabelText('Loud alarm when no one answers: off')).toBeTruthy());
  });
});

describe('the siren sound file', () => {
  const wav = fs.readFileSync(path.join(process.cwd(), 'assets', 'siren.wav'));
  test('is a valid mono 16-bit PCM wav of about 1.6 seconds', () => {
    expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
    expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
    expect(wav.readUInt16LE(20)).toBe(1); // PCM
    expect(wav.readUInt16LE(22)).toBe(1); // mono
    expect(wav.readUInt16LE(34)).toBe(16); // bits
    const rate = wav.readUInt32LE(24);
    const seconds = (wav.length - 44) / 2 / rate;
    expect(seconds).toBeGreaterThan(1.5);
    expect(seconds).toBeLessThan(1.7);
  });
  test('is loud but not clipped', () => {
    let peak = 0;
    for (let i = 44; i < wav.length; i += 2) peak = Math.max(peak, Math.abs(wav.readInt16LE(i)));
    expect(peak).toBeGreaterThan(32767 * 0.7);
    expect(peak).toBeLessThan(32767);
  });
  test('stays small enough for a low-end phone', () => {
    expect(wav.length).toBeLessThan(100 * 1024);
  });
});
