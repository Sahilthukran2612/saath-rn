import AsyncStorage from '@react-native-async-storage/async-storage';
import { initialRegistry, stateKey } from '../profiles';

const KEY = 'saath/state/v1';
const REG_KEY = 'saath/profiles/v1';
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
  'invites',
  'delegations',
  'consent',
  'queue',
  'online',
  'synced',
  'baseline',
  'careEvents',
  'meds',
  'testPlan',
  'budget',
  'background',
  'profile',
  'ladder',
  'ladderApproval',
  'visitQuestions',
  'checkins',
  'meals',
  'footChecks',
  'footPhotos',
  'waist',
  'risk',
];

export async function load(id) {
  try {
    const raw = await AsyncStorage.getItem(stateKey(KEY, id));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function save(state, id) {
  try {
    const out = {};
    PERSIST.forEach((k) => (out[k] = state[k]));
    await AsyncStorage.setItem(stateKey(KEY, id), JSON.stringify(out));
  } catch {
    // offline-first: failing to save must not crash the app
  }
}

// Who shares this phone, their salted PIN hashes and who is active. Never holds a plain PIN.
export async function loadRegistry() {
  try {
    const raw = await AsyncStorage.getItem(REG_KEY);
    return raw ? { ...initialRegistry(), ...JSON.parse(raw) } : initialRegistry();
  } catch {
    return initialRegistry();
  }
}

export async function saveRegistry(reg) {
  try {
    await AsyncStorage.setItem(REG_KEY, JSON.stringify(reg));
  } catch {
    // see above
  }
}