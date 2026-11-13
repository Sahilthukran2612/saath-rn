// Shared-phone mode: several people use one phone, each with their own data and a 4-digit PIN.
// The PIN keeps casual eyes out. It is a deterrent on a shared phone, not encryption: the data
// on the device is not encrypted, and a 4-digit PIN has only 10,000 possibilities.

export const PIN_LEN = 4;
export const MAX_TRIES = 5;
export const LOCK_MS = 60000;
export const FIRST_ID = 'p1';

export const pinValid = (p) => /^\d{4}$/.test(String(p ?? ''));

// Salted and stretched, so the PIN is never stored as typed. Pure and deterministic for tests.
export function hashPin(pin, salt) {
  const s = `${salt}:${pin}`;
  let h = 2166136261;
  for (let round = 0; round < 1500; round++) {
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i) + round;
      h = Math.imul(h, 16777619) >>> 0;
    }
  }
  return h.toString(16);
}

export const initialRegistry = () => ({
  shared: false,
  locked: false,
  activeId: FIRST_ID,
  tries: 0,
  lockedUntil: 0,
  profiles: [{ id: FIRST_ID, name: '', salt: '', pinHash: null }],
});

const withPin = (profile, pin, salt) => ({ ...profile, salt, pinHash: hashPin(pin, salt) });

// Turn the mode on for the person using the phone now. Needs a valid PIN.
export function enableShared(reg, pin, salt, name = '') {
  if (!pinValid(pin)) return reg;
  return {
    ...reg,
    shared: true,
    locked: false,
    tries: 0,
    profiles: reg.profiles.map((p) =>
      p.id === reg.activeId ? { ...withPin(p, pin, salt), name: name || p.name } : p
    ),
  };
}

// Add a person and move to them. The new person starts with their own empty data.
export function addProfile(reg, { id, name, pin, salt }) {
  if (!reg.shared || !pinValid(pin) || reg.profiles.some((p) => p.id === id)) return reg;
  const profile = withPin({ id, name: String(name || '').trim(), salt: '', pinHash: null }, pin, salt);
  return { ...reg, profiles: [...reg.profiles, profile], activeId: id, locked: false, tries: 0 };
}

export const lock = (reg) => (reg.shared ? { ...reg, locked: true } : reg);

export const waitSeconds = (reg, now) => Math.max(0, Math.ceil((reg.lockedUntil - now) / 1000));

// Try a PIN for a profile. Five wrong tries lock the keypad for a minute (shared by all profiles,
// so someone cannot go from one profile to the next to get more guesses).
export function unlock(reg, id, pin, now) {
  const profile = reg.profiles.find((p) => p.id === id);
  if (!profile) return { ok: false, reason: 'unknown', reg };
  if (now < reg.lockedUntil) return { ok: false, reason: 'wait', reg };
  if (profile.pinHash && hashPin(pin, profile.salt) === profile.pinHash) {
    return { ok: true, reg: { ...reg, activeId: id, locked: false, tries: 0, lockedUntil: 0 } };
  }
  const tries = reg.tries + 1;
  if (tries >= MAX_TRIES) {
    return { ok: false, reason: 'wait', reg: { ...reg, tries: 0, lockedUntil: now + LOCK_MS } };
  }
  return { ok: false, reason: 'wrong', triesLeft: MAX_TRIES - tries, reg: { ...reg, tries } };
}

// Turning the mode off needs the current person's PIN.
export function disableShared(reg, pin) {
  const me = reg.profiles.find((p) => p.id === reg.activeId);
  if (!me?.pinHash || hashPin(pin, me.salt) !== me.pinHash) return { ok: false, reg };
  return { ok: true, reg: { ...reg, shared: false, locked: false, tries: 0 } };
}

// Where each profile keeps its data. The first profile keeps the original key, so data saved
// before shared-phone mode existed is still found.
export const stateKey = (base, id) => (id === FIRST_ID ? base : `${base}/${id}`);
