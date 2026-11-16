import { Platform } from 'react-native';

// Push notifications from the circle (Firebase Cloud Messaging), so an alert reaches this phone even when
// Saath is closed. The notification library is loaded only when needed. Without a Firebase project in the
// build (google-services.json) there is no device address to get: that is reported as 'nofirebase', never a crash.
let N;
function mod() {
  if (N !== undefined) return N;
  try {
    N = require('expo-notifications');
  } catch {
    N = null;
  }
  return N;
}

export const pushAvailable = () => !!mod() && Platform.OS === 'android';

// Asks for permission, makes the high-priority channel, and returns this phone's FCM address.
// reason: 'unavailable' | 'denied' | 'nofirebase' | 'error'
export async function setupPush() {
  const n = mod();
  if (!n || Platform.OS !== 'android') return { ok: false, reason: 'unavailable' };
  try {
    n.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    await n.setNotificationChannelAsync('alerts', {
      name: 'Alerts from your circle',
      importance: n.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lockscreenVisibility: n.AndroidNotificationVisibility.PUBLIC,
      sound: 'default',
    });
    const cur = await n.getPermissionsAsync();
    if (!cur.granted && !(await n.requestPermissionsAsync()).granted) return { ok: false, reason: 'denied' };
    const tok = await n.getDevicePushTokenAsync();
    return tok?.data ? { ok: true, token: String(tok.data) } : { ok: false, reason: 'error' };
  } catch (e) {
    const missing = /firebase|fcm|google-services|FirebaseApp|SERVICE_NOT_AVAILABLE/i.test(String(e?.message || e));
    return { ok: false, reason: missing ? 'nofirebase' : 'error' };
  }
}