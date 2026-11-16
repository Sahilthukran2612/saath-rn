import { PermissionsAndroid, Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Sending an SMS without a tap needs a native module and Android's SEND_SMS permission, so it exists
// only in an installed build, never in Expo Go or in tests (every call is then a safe no-op).
// SMS uses mobile signal, not internet, and the person's own SMS plan. Google Play restricts this
// permission, so it suits a directly installed APK such as this project's; it would not pass a Play review.
const Native = requireOptionalNativeModule('SaathSms');

export const smsAvailable = !!Native && Platform.OS === 'android';

export async function askSmsPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    const r = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS);
    return r === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function hasSmsPermission() {
  if (Platform.OS !== 'android') return false;
  try {
    return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
  } catch {
    return false;
  }
}

// Resolves true when Android accepted the message for sending. It cannot know the message arrived.
export async function sendSms(phone, text) {
  if (!smsAvailable) return false;
  try {
    return (await Native.send(String(phone).replace(/[^\d+]/g, ''), String(text))) === true;
  } catch {
    return false;
  }
}
