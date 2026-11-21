import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { initialRegistry, stateKey } from '../profiles';

// v2: a fresh start for installed builds, so state saved while the app still held demo people and fake
// numbers is not carried into production.
const KEY = 'saath/state/v2';
const REG_KEY = 'saath/profiles/v1';
// Alert state is never persisted: a stale countdown after a restart would be wrong.
const PERSIST = [
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
  'cloud',
  'outbox',
  'outboxSeq',
  'joined',
  'circles',
  'feeds',
  'seen',
  'baseline',
  'careEvents',
  'slips',
  'carePlan',
  'visits',
  'joinCode',
  'addPrefill',
  'medicines',
  'medTaken',
  'medLog',
  'slipStats',
 'aiOn',
 'readingsSyncedAt',
 'aiCards',
 'aiChat',
  'foodPrefs',
  'meds',
  'testPlan',
  'budget',
  'background',
  'autoSms',
  'autoCall',
  'onboarded',
  'usage',
  'reminders',
  'siren',
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

// Sign-in tokens live in the phone's secure store (Android Keystore), not in the plain state file.
const tokenKey = (id) => `saath.tok.${id}`;

async function readTokens(id) {
  try {
    const raw = await SecureStore.getItemAsync(tokenKey(id));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function writeTokens(id, cloud) {
  try {
    if (cloud?.access) {
      await SecureStore.setItemAsync(tokenKey(id), JSON.stringify({ access: cloud.access, refresh: cloud.refresh }));
    } else {
      await SecureStore.deleteItemAsync(tokenKey(id));
    }
  } catch {
    // no secure store: the person signs in again next time. Never fall back to plain storage.
  }
}

export async function load(id) {
  try {
    const raw = await AsyncStorage.getItem(stateKey(KEY, id));
    const saved = raw ? JSON.parse(raw) : {};
    if (saved.cloud?.userId) {
      const tok = await readTokens(id);
      // older builds kept the tokens in the state file; they are moved on the next save
      saved.cloud = { ...saved.cloud, ...(tok || {}) };
    }
    return saved;
  } catch {
    return {};
  }
}

export async function save(state, id) {
  try {
    const out = {};
    PERSIST.forEach((k) => (out[k] = state[k]));
    if (out.cloud) out.cloud = { ...out.cloud, access: null, refresh: null };
    await AsyncStorage.setItem(stateKey(KEY, id), JSON.stringify(out));
    await writeTokens(id, state.cloud);
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