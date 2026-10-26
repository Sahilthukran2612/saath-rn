jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-sensors', () => ({
  Accelerometer: { setUpdateInterval: jest.fn(), addListener: jest.fn(() => ({ remove: jest.fn() })) },
}));
