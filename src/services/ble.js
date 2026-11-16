import { PermissionsAndroid, Platform } from 'react-native';
import { HEART_MEASUREMENT, HEART_SERVICE, parseHeartRate } from '../heart';

// Bluetooth heart-rate band (a standard BLE "Heart Rate" device: most cheap bands and chest straps, or a
// second phone running a BLE tester app). The native library exists only in an installed build. In Expo Go
// and in tests it is missing, so every call here is a safe no-op and bleAvailable() is false.
// The reading is used on this phone only: nothing is stored or sent anywhere.
let manager;
function getManager() {
  if (manager !== undefined) return manager;
  try {
    // required lazily so a missing native module never breaks the app at start
    const { BleManager } = require('react-native-ble-plx');
    manager = new BleManager();
  } catch {
    manager = null;
  }
  return manager;
}

export const bleAvailable = () => Platform.OS === 'android' && !!getManager();

// Android 12 and later: Bluetooth scan and connect. Android 11 and earlier: the system insists on the
// location permission for any Bluetooth scan. Saath never reads the location.
export async function askBluetoothPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    const P = PermissionsAndroid.PERMISSIONS;
    const wanted = Platform.Version >= 31 ? [P.BLUETOOTH_SCAN, P.BLUETOOTH_CONNECT] : [P.ACCESS_FINE_LOCATION];
    const res = await PermissionsAndroid.requestMultiple(wanted);
    return wanted.every((p) => res[p] === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

// Looks for heart-rate devices for a few seconds. onFound({ id, name }) fires once per device.
// Returns a function that stops the scan early.
export function scanForBands(onFound, onDone, ms = 10000) {
  const m = getManager();
  if (!m) {
    onDone?.();
    return () => {};
  }
  const seen = new Set();
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    try {
      m.stopDeviceScan();
    } catch {
      // already stopped
    }
    onDone?.();
  };
  const timer = setTimeout(stop, ms);
  try {
    m.startDeviceScan([HEART_SERVICE], null, (error, device) => {
      if (error) return stop();
      if (device && !seen.has(device.id)) {
        seen.add(device.id);
        onFound({ id: device.id, name: device.localName || device.name || 'Heart-rate band' });
      }
      return undefined;
    });
  } catch {
    stop();
  }
  return stop;
}

let connected = null; // { id, subscription }

// Connects and streams readings. onReading({ bpm, contact }) for every valid reading; onLost() once if the
// band drops. Resolves true when the stream is running.
export async function connectBand(id, onReading, onLost) {
  const m = getManager();
  if (!m) return false;
  try {
    await disconnectBand();
    const device = await m.connectToDevice(id, { timeout: 10000 });
    await device.discoverAllServicesAndCharacteristics();
    const subscription = device.monitorCharacteristicForService(HEART_SERVICE, HEART_MEASUREMENT, (error, ch) => {
      if (error) return;
      const r = ch?.value ? parseHeartRate(ch.value) : null;
      if (r) onReading(r);
    });
    const lost = device.onDisconnected(() => {
      connected = null;
      lost.remove();
      onLost?.();
    });
    connected = { id, subscription };
    return true;
  } catch {
    connected = null;
    return false;
  }
}

export async function disconnectBand() {
  const m = getManager();
  if (!m || !connected) return;
  const { id, subscription } = connected;
  connected = null;
  try {
    subscription?.remove();
    await m.cancelDeviceConnection(id);
  } catch {
    // already gone
  }
}
