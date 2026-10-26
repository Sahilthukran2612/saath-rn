import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'saath/state/v1';
// Alert state is never persisted: a stale countdown after a restart would be wrong.
const PERSIST = [
  'demo',
  'mode',
  'phase',
  'largeText',
  'lang',
  'members',
  'tasks',
  'readings',
  'audit',
  'tally',
];

export async function load() {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function save(state) {
  try {
    const out = {};
    PERSIST.forEach((k) => (out[k] = state[k]));
    await AsyncStorage.setItem(KEY, JSON.stringify(out));
  } catch {
    // offline-first: failing to save must not crash the app
  }
}
