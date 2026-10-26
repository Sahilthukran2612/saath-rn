import * as Haptics from 'expo-haptics';

// A light tap on press-in, a firmer one when something is confirmed. Never blocks the action.
export const tap = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // haptics are a nicety
  }
};
export const confirm = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // haptics are a nicety
  }
};
export const warn = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // haptics are a nicety
  }
};
