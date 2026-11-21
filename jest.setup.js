jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-sensors', () => ({
  Accelerometer: { setUpdateInterval: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default
);
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(async () => ({ uri: 'file:///x.pdf' })),
  printAsync: jest.fn(async () => {}),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(async () => {}),
}));
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///photo.jpg' }] })),
}));
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning' },
}));

jest.mock('expo-secure-store', () => {
  const mem = new Map();
  return {
    getItemAsync: jest.fn(async (k) => (mem.has(k) ? mem.get(k) : null)),
    setItemAsync: jest.fn(async (k, v) => void mem.set(k, v)),
    deleteItemAsync: jest.fn(async (k) => void mem.delete(k)),
  };
});

// Screen tests mount the app with no preload and expect a household that is already set up. The installed app
// starts empty (a real first launch asks who you are), so the tests, and only the tests, start from this seed.
jest.mock('./src/state/reducer', () => {
  const actual = jest.requireActual('./src/state/reducer');
  const { makeSeeded } = jest.requireActual('./testSupport/seed');
  const seeded = makeSeeded(actual.initialState);
  // productionState stays the real, empty install; initialState and startState are the set-up household.
  return { ...actual, initialState: seeded, startState: seeded };
});
