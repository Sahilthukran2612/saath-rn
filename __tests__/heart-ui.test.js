import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as ble from '../src/services/ble';
import { strings } from '../src/i18n/strings';

jest.mock('../src/services/ble', () => ({
  bleAvailable: jest.fn(() => true),
  askBluetoothPermission: jest.fn(async () => true),
  scanForBands: jest.fn(() => () => {}),
  connectBand: jest.fn(async () => true),
  disconnectBand: jest.fn(async () => {}),
}));

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );
const openSafety = async () => fireEvent.press(screen.getByLabelText('Safety'));

beforeEach(() => jest.clearAllMocks());

describe('the heart-rate band card', () => {
  test('without the installed app it says Bluetooth is not available', async () => {
    ble.bleAvailable.mockReturnValue(false);
    await mount({});
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Find my band'));
    expect(screen.getByText(/Bluetooth needs the installed Saath app/)).toBeTruthy();
    expect(ble.scanForBands).not.toHaveBeenCalled();
    ble.bleAvailable.mockReturnValue(true);
  });

  test('if Bluetooth permission is refused it says so and does not scan', async () => {
    ble.askBluetoothPermission.mockResolvedValueOnce(false);
    await mount({});
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Find my band'));
    await waitFor(() => expect(screen.getByText(/Allow Bluetooth so Saath can find your band/)).toBeTruthy());
    expect(ble.scanForBands).not.toHaveBeenCalled();
  });

  test('if no band is found it says what to try', async () => {
    ble.scanForBands.mockImplementationOnce((onFound, onDone) => {
      setTimeout(onDone, 0);
      return () => {};
    });
    await mount({});
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Find my band'));
    await waitFor(() => expect(screen.getByText(/No band found/)).toBeTruthy());
  });

  test('find, pick, connect, then live readings appear, and disconnect goes back', async () => {
    let push;
    ble.scanForBands.mockImplementationOnce((onFound) => {
      setTimeout(() => onFound({ id: 'AA:BB', name: 'Mi Band 7' }), 0);
      return () => {};
    });
    ble.connectBand.mockImplementationOnce(async (id, onReading) => {
      push = onReading;
      return true;
    });
    await mount({});
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Find my band'));
    await fireEvent.press(await screen.findByLabelText('Mi Band 7'));
    await waitFor(() => expect(screen.getByText('Connected to Mi Band 7')).toBeTruthy());
    expect(ble.connectBand.mock.calls[0][0]).toBe('AA:BB');
    await act(async () => push({ bpm: 74, contact: true }));
    expect(screen.getByText('74')).toBeTruthy();
    await act(async () => push({ bpm: 76, contact: false }));
    expect(screen.getByText('The band is not touching your skin.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Disconnect'));
    await waitFor(() => expect(screen.getByLabelText('Find my band')).toBeTruthy());
    expect(ble.disconnectBand).toHaveBeenCalled();
  });

  test('a band that drops is forgotten, not shown as still connected', async () => {
    let lost;
    ble.scanForBands.mockImplementationOnce((onFound) => {
      setTimeout(() => onFound({ id: 'AA:BB', name: 'Band' }), 0);
      return () => {};
    });
    ble.connectBand.mockImplementationOnce(async (id, onReading, onLostCb) => {
      lost = onLostCb;
      return true;
    });
    await mount({});
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Find my band'));
    await fireEvent.press(await screen.findByLabelText('Band'));
    await waitFor(() => expect(screen.getByText('Connected to Band')).toBeTruthy());
    await act(async () => lost());
    expect(screen.queryByText('Connected to Band')).toBeNull();
  });

  test('a failed connection is reported and nothing is left connected', async () => {
    ble.scanForBands.mockImplementationOnce((onFound) => {
      setTimeout(() => onFound({ id: 'AA:BB', name: 'Band' }), 0);
      return () => {};
    });
    ble.connectBand.mockResolvedValueOnce(false);
    await mount({});
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Find my band'));
    await fireEvent.press(await screen.findByLabelText('Band'));
    await waitFor(() => expect(screen.getByText(/No band found/)).toBeTruthy());
    expect(screen.queryByText(/Connected to/)).toBeNull();
  });
});

describe('the note when the rate stays unusual while still', () => {
  const NOW = Date.now();
  const band = { id: 'x', name: 'Band' };
  const readings = (bpm) => [0, 1, 2, 3].map((i) => ({ bpm, at: NOW - (3 - i) * 30000 }));
  const still = NOW - 10 * 60000;

  test('high while still: a calm note that points to the clinician plan, not an alarm', async () => {
    await mount({ heart: { device: band, readings: readings(135), contact: true }, lastActiveMs: still });
    expect(screen.getByText('Your heart rate has stayed high while you were still.')).toBeTruthy();
    expect(screen.getByText(strings.en.clinicianPlan)).toBeTruthy();
    expect(screen.queryByText('Are you OK?')).toBeNull(); // not a safety alert
  });

  test('low while still', async () => {
    await mount({ heart: { device: band, readings: readings(36), contact: true }, lastActiveMs: still });
    expect(screen.getByText('Your heart rate has stayed low while you were still.')).toBeTruthy();
  });

  test('a fast rate while the person is moving says nothing', async () => {
    await mount({ heart: { device: band, readings: readings(135), contact: true }, lastActiveMs: NOW - 5000 });
    expect(screen.queryByText(/stayed high/)).toBeNull();
  });

  test('a normal rate says nothing, and no band means no note', async () => {
    await mount({ heart: { device: band, readings: readings(72), contact: true }, lastActiveMs: still });
    expect(screen.queryByText(/stayed (high|low)/)).toBeNull();
    await mount({ heart: { device: null, readings: readings(135), contact: true }, lastActiveMs: still });
    expect(screen.queryByText(/stayed high/)).toBeNull();
  });
});

describe('demo: the simulated band (no Bluetooth needed)', () => {
  const openSim = async () => {
    await mount({ demo: true });
    await openSafety();
    await fireEvent.press(screen.getByLabelText('Try a simulated band'));
    await waitFor(() => expect(screen.getByText('Connected to Simulated band')).toBeTruthy());
  };

  test('connects at once, says the readings are made up, and never touches Bluetooth', async () => {
    await openSim();
    expect(screen.getByText('Demo: these readings are made up to show the screen.')).toBeTruthy();
    expect(ble.scanForBands).not.toHaveBeenCalled();
    expect(ble.connectBand).not.toHaveBeenCalled();
  });

  test('a high rate while resting shows the calm note at once, then a normal rate clears it', async () => {
    await openSim();
    await fireEvent.press(screen.getByLabelText('High while resting'));
    await waitFor(() => expect(screen.getAllByText('Your heart rate has stayed high while you were still.').length).toBeGreaterThan(0));
    expect(screen.getAllByText(strings.en.clinicianPlan).length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText('Resting'));
    await waitFor(() => expect(screen.queryByText(/stayed (high|low)/)).toBeNull());
    expect(screen.getByText('Steady while you rest.')).toBeTruthy();
  });

  test('a low rate while resting', async () => {
    await openSim();
    await fireEvent.press(screen.getByLabelText('Low while resting'));
    await waitFor(() => expect(screen.getAllByText('Your heart rate has stayed low while you were still.').length).toBeGreaterThan(0));
  });

  test('the live rate shown follows the button pressed', async () => {
    await openSim();
    await fireEvent.press(screen.getByLabelText('High while resting'));
    await waitFor(() => expect(screen.getByText('136')).toBeTruthy()); // the last of 135 with a little jitter
  });

  test('disconnect returns to the find screen, and the demo button is only there in demo mode', async () => {
    await openSim();
    await fireEvent.press(screen.getByLabelText('Disconnect'));
    await waitFor(() => expect(screen.getByLabelText('Find my band')).toBeTruthy());
    await mount({ demo: false });
    expect(screen.queryByLabelText('Try a simulated band')).toBeNull();
  });
});
