// Without the native module (Expo Go, tests) every call is a safe no-op.
import {
  foregroundAvailable,
  startWatching,
  stopWatching,
  isWatching,
  askNotificationPermission,
} from '../src/services/foreground';

describe('foreground service wrapper without the native module', () => {
  test('is reported as unavailable', () => expect(foregroundAvailable).toBe(false));
  test('start returns false and stop does not throw', () => {
    expect(startWatching('Saath', 'x')).toBe(false);
    expect(() => stopWatching()).not.toThrow();
    expect(isWatching()).toBe(false);
  });
  test('permission request resolves without crashing', async () => {
    await expect(askNotificationPermission()).resolves.toBeDefined();
  });
});
