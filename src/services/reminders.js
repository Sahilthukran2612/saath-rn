import { Platform } from 'react-native';
import { reminderPlan } from '../reminders';

// Local daily reminders, scheduled on the phone: no server, no internet, no Firebase.
// expo-notifications is loaded only when needed so a missing native module never breaks the app start.
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

export const remindersAvailable = () => !!mod();

export async function askReminderPermission() {
  const n = mod();
  if (!n) return false;
  try {
    const cur = await n.getPermissionsAsync();
    if (cur.granted) return true;
    const res = await n.requestPermissionsAsync();
    return !!res.granted;
  } catch {
    return false;
  }
}

// Replaces every scheduled reminder with the current plan. Safe to call as often as tasks change.
export async function scheduleReminders(tasks, bodyFor) {
  const n = mod();
  if (!n) return 0;
  try {
    await n.cancelAllScheduledNotificationsAsync();
    if (Platform.OS === 'android') {
      await n.setNotificationChannelAsync('reminders', { name: 'Reminders', importance: n.AndroidImportance.DEFAULT });
    }
    const plan = reminderPlan(tasks);
    for (const p of plan) {
      await n.scheduleNotificationAsync({
        content: { title: 'Saath', body: bodyFor(p.title), sound: true },
        trigger: { type: n.SchedulableTriggerInputTypes.DAILY, hour: p.hour, minute: 0, channelId: 'reminders' },
      });
    }
    return plan.length;
  } catch {
    return 0;
  }
}

export async function cancelReminders() {
  const n = mod();
  if (!n) return;
  try {
    await n.cancelAllScheduledNotificationsAsync();
  } catch {
    // nothing was scheduled
  }
}