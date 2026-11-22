import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Placing a call without a tap needs a native module and Android's CALL_PHONE permission, so it exists only in
// an installed build; in Expo Go and in tests every call here is a safe no-op. READ_PHONE_STATE is used only to
// learn when the call has ended. Saath does not read call history, numbers or contacts.
const Native = requireOptionalNativeModule('SaathCall');

export const callsAvailable = !!Native && Platform.OS === 'android';

export async function askCallPermissions() {
  if (Platform.OS !== 'android') return false;
  try {
    const P = PermissionsAndroid.PERMISSIONS;
    const wanted = [P.CALL_PHONE, P.READ_PHONE_STATE];
    const res = await PermissionsAndroid.requestMultiple(wanted);
    return wanted.every((p) => res[p] === PermissionsAndroid.RESULTS.GRANTED);
  } catch {
    return false;
  }
}

// Seconds the phone was off the hook, from "offhook" to "idle". Dialling counts, so a call nobody answers
// still lasts as long as it rang. Pure, so it is tested.
export function callSeconds(offhookAt, idleAt) {
  if (offhookAt == null || idleAt == null || idleAt < offhookAt) return 0;
  return Math.round((idleAt - offhookAt) / 1000);
}

const START_TIMEOUT_MS = 15000; // the call never started: do not wait for it
const SETTLE_MS = 2000; // let Saath come back to the front after the call screen closes

// Dials `phone`. onEnd(seconds) fires exactly once: when the call ends, or with 0 if it never started.
// Resolves true if the dial was handed to Android.
export async function placeCall(phone, onEnd) {
  if (!callsAvailable) return false;
  let offhookAt = null;
  let done = false;
  let sub = null;
  let timer = null;
  const finish = (seconds, wait = 0) => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    try {
      sub?.remove();
      Native.stopWatching();
    } catch {
      // already stopped
    }
    setTimeout(() => onEnd(seconds), wait);
  };
  try {
    Native.startWatching();
    sub = Native.addListener('onCallState', ({ state, at }) => {
      if (state === 'offhook' && offhookAt == null) offhookAt = at;
      if (state === 'idle' && offhookAt != null) finish(callSeconds(offhookAt, at), SETTLE_MS);
    });
    timer = setTimeout(() => {
      if (offhookAt == null) finish(0);
    }, START_TIMEOUT_MS);
    if (Native.call(String(phone).replace(/[^\d+]/g, '')) !== true) {
      finish(0);
      return false;
    }
    return true;
  } catch {
    finish(0);
    return false;
  }
}
