import {
  pinValid,
  hashPin,
  initialRegistry,
  enableShared,
  addProfile,
  lock,
  unlock,
  disableShared,
  waitSeconds,
  stateKey,
  MAX_TRIES,
  LOCK_MS,
} from '../src/profiles';

const on = () => enableShared(initialRegistry(), '1234', 's1', 'Amma');

describe('PIN', () => {
  test('exactly four digits', () => {
    ['1234', '0000'].forEach((p) => expect(pinValid(p)).toBe(true));
    ['', '123', '12345', 'abcd', '12 4', null, undefined].forEach((p) => expect(pinValid(p)).toBe(false));
  });
  test('hash is stable, salted, and does not contain the PIN', () => {
    expect(hashPin('1234', 'a')).toBe(hashPin('1234', 'a'));
    expect(hashPin('1234', 'a')).not.toBe(hashPin('1234', 'b'));
    expect(hashPin('1234', 'a')).not.toBe(hashPin('1235', 'a'));
    expect(hashPin('1234', 'a')).not.toContain('1234');
  });
});

describe('shared phone registry', () => {
  test('starts off, with one profile and no PIN', () => {
    const r = initialRegistry();
    expect(r.shared).toBe(false);
    expect(r.profiles).toHaveLength(1);
    expect(r.profiles[0].pinHash).toBeNull();
  });
  test('turning it on needs a valid PIN', () => {
    expect(enableShared(initialRegistry(), '12', 's').shared).toBe(false);
    const r = on();
    expect(r.shared).toBe(true);
    expect(r.profiles[0].name).toBe('Amma');
    expect(JSON.stringify(r)).not.toContain('"1234"');
  });
  test('adding a person moves to them, and needs the mode on and a valid PIN', () => {
    expect(addProfile(initialRegistry(), { id: 'p2', name: 'Raju', pin: '1111', salt: 'x' }).profiles).toHaveLength(1);
    const r = on();
    expect(addProfile(r, { id: 'p2', name: 'Raju', pin: '11', salt: 'x' }).profiles).toHaveLength(1);
    const two = addProfile(r, { id: 'p2', name: ' Raju ', pin: '1111', salt: 'x' });
    expect(two.profiles).toHaveLength(2);
    expect(two.activeId).toBe('p2');
    expect(two.profiles[1].name).toBe('Raju');
    expect(addProfile(two, { id: 'p2', name: 'Again', pin: '2222', salt: 'y' }).profiles).toHaveLength(2);
  });
  test('locking only does something in shared mode', () => {
    expect(lock(initialRegistry()).locked).toBe(false);
    expect(lock(on()).locked).toBe(true);
  });
});

describe('unlock', () => {
  const locked = () => lock(on());
  test('the right PIN opens that profile', () => {
    const res = unlock(locked(), 'p1', '1234', 1000);
    expect(res.ok).toBe(true);
    expect(res.reg.locked).toBe(false);
    expect(res.reg.activeId).toBe('p1');
  });
  test('a wrong PIN says how many tries are left', () => {
    const res = unlock(locked(), 'p1', '0000', 1000);
    expect(res).toMatchObject({ ok: false, reason: 'wrong', triesLeft: MAX_TRIES - 1 });
    expect(res.reg.locked).toBe(true);
  });
  test('five wrong tries lock the keypad for a minute, for every profile', () => {
    let reg = addProfile(on(), { id: 'p2', name: 'Raju', pin: '1111', salt: 'x' });
    reg = lock(reg);
    for (let i = 0; i < MAX_TRIES; i++) reg = unlock(reg, 'p1', '0000', 1000).reg;
    expect(reg.lockedUntil).toBe(1000 + LOCK_MS);
    const blocked = unlock(reg, 'p2', '1111', 2000);
    expect(blocked).toMatchObject({ ok: false, reason: 'wait' });
    expect(waitSeconds(reg, 2000)).toBe(59);
    expect(unlock(reg, 'p2', '1111', 1000 + LOCK_MS).ok).toBe(true);
  });
  test('a profile with no PIN, or an unknown profile, never opens', () => {
    expect(unlock(locked(), 'nope', '1234', 0).ok).toBe(false);
    const reg = { ...locked(), profiles: [{ id: 'p1', name: '', salt: '', pinHash: null }] };
    expect(unlock(reg, 'p1', '1234', 0).ok).toBe(false);
  });
  test('switching profiles needs that profile’s own PIN', () => {
    const reg = lock(addProfile(on(), { id: 'p2', name: 'Raju', pin: '1111', salt: 'x' }));
    expect(unlock(reg, 'p2', '1234', 0).ok).toBe(false);
    expect(unlock(reg, 'p2', '1111', 0).ok).toBe(true);
  });
});

describe('turning the mode off', () => {
  test('needs the current person’s PIN', () => {
    expect(disableShared(on(), '0000').ok).toBe(false);
    const res = disableShared(on(), '1234');
    expect(res.ok).toBe(true);
    expect(res.reg.shared).toBe(false);
  });
});

describe('storage keys', () => {
  test('the first profile keeps the original key so older data is still found', () => {
    expect(stateKey('saath/state/v1', 'p1')).toBe('saath/state/v1');
    expect(stateKey('saath/state/v1', 'p2')).toBe('saath/state/v1/p2');
  });
});
