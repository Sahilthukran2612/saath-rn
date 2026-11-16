import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

// The native foreground service exists only in a development or release build. In Expo Go
// (and in tests) this module is missing, so every call here is a safe no-op.
const Native = requireOptionalNativeModule('SaathForeground');

export const foregroundAvailable = !!Native && Platform.OS === 'android';

export async function askNotificationPermission() {
  if (Platform.OS !== 'android' || Platform.Version < 33) return true;
  try {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return r === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export function startWatching(title, text) {
  if (!foregroundAvailable) return false;
  try {
    Native.start(title, text);
    return true;
  } catch {
    return false;
  }
}

export function stopWatching() {
  if (!foregroundAvailable) return;
  try {
    Native.stop();
  } catch {
    // stopping a service that is not running is fine
  }
}

export const isWatching = () => (foregroundAvailable ? !!Native.isRunning() : false);

// Opens the alert over the lock screen and wakes the screen (a full-screen notification). A no-op without the
// native module. The person may have to allow "full screen notifications" for Saath in the phone's settings.
export function raiseAlert(title, text) {
  if (!foregroundAvailable) return false;
  try {
    return Native.raiseAlert(title, text) === true;
  } catch {
    return false;
  }
}

export function clearAlert() {
  if (!foregroundAvailable) return;
  try {
    Native.clearAlert();
  } catch {
    // nothing to clear
  }
}
