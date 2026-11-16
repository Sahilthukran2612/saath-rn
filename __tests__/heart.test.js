import { parseHeartRate, base64ToBytes, addReading, heartStatus, HR } from '../src/heart';
import { strings } from '../src/i18n/strings';

describe('reading the band', () => {
  test('an 8-bit rate: flags 0, then the rate', () => {
    expect(parseHeartRate([0b00000110, 72])).toEqual({ bpm: 72, contact: true });
  });
  test('a 16-bit rate is little-endian', () => {
    expect(parseHeartRate([0b00000001, 0x2c, 0x01])).toBeNull(); // 300 bpm is not a heart rate
    expect(parseHeartRate([0b00000001, 0x82, 0x00])).toEqual({ bpm: 130, contact: true });
  });
  test('sensor contact is reported when the band supports it', () => {
    expect(parseHeartRate([0b00000100, 70]).contact).toBe(false); // supported, not detected
    expect(parseHeartRate([0b00000110, 70]).contact).toBe(true); // supported and detected
    expect(parseHeartRate([0b00000000, 70]).contact).toBe(true); // not supported: assume worn
  });
  test('base64 from the Bluetooth library decodes to the same bytes', () => {
    expect(base64ToBytes('BEg=')).toEqual([4, 72]);
    expect(parseHeartRate('BEg=')).toEqual({ bpm: 72, contact: false });
    expect(base64ToBytes('')).toEqual([]);
  });
  test('rubbish gives null, never a made-up rate', () => {
    [[], [0], [1, 80], [0, 0], [0, 10], [0, 255], null, undefined, 'x'].forEach((v) =>
      expect([JSON.stringify(v), parseHeartRate(v)]).toEqual([JSON.stringify(v), null])
    );
  });
});

describe('when Saath says something', () => {
  const T0 = 1_000_000;
  const read = (bpms, gapSec = 30, start = T0) =>
    bpms.reduce((acc, bpm, i) => addReading(acc, bpm, start + i * gapSec * 1000), []);
  const calm = T0 - 10 * 60 * 1000; // still for ten minutes
  const at = (n, gapSec = 30) => T0 + (n - 1) * gapSec * 1000;

  test('no reading yet', () => {
    expect(heartStatus([], { stillSince: calm, now: T0 })).toEqual({ level: 'unknown', bpm: null });
  });
  test('a normal resting rate is ok', () => {
    const r = read([70, 72, 71, 73]);
    expect(heartStatus(r, { stillSince: calm, now: at(4) }).level).toBe('ok');
  });
  test('a high rate while still, for over a minute, is flagged', () => {
    const r = read([130, 135, 128, 140]);
    expect(heartStatus(r, { stillSince: calm, now: at(4) })).toEqual({ level: 'high', bpm: 140 });
  });
  test('a low rate while still is flagged', () => {
    const r = read([38, 36, 39, 37]);
    expect(heartStatus(r, { stillSince: calm, now: at(4) })).toEqual({ level: 'low', bpm: 37 });
  });
  test('a fast heart while moving is normal: nothing is said', () => {
    const r = read([130, 135, 128, 140]);
    const moving = at(4) - 20 * 1000; // moved 20 seconds ago
    expect(heartStatus(r, { stillSince: moving, now: at(4) }).level).toBe('unknown');
    expect(heartStatus(r, { stillSince: null, now: at(4) }).level).toBe('unknown');
  });
  test('one spike is not enough: all readings in the window must be out of range', () => {
    const r = read([70, 150, 72, 71]);
    expect(heartStatus(r, { stillSince: calm, now: at(4) }).level).toBe('ok');
  });
  test('too few readings, or too short a span, stays unknown', () => {
    expect(heartStatus(read([130, 135]), { stillSince: calm, now: at(2) }).level).toBe('unknown');
    expect(heartStatus(read([130, 135, 140], 5), { stillSince: calm, now: at(3, 5) }).level).toBe('unknown');
  });
  test('old readings fall out of the window', () => {
    const old = read([130, 135, 128, 140], 30, T0 - HR.windowMs - 600_000);
    expect(heartStatus(old, { stillSince: calm, now: T0 }).level).toBe('unknown');
  });
  test('only the most recent readings are kept in memory', () => {
    let r = [];
    for (let i = 0; i < 200; i++) r = addReading(r, 70, i);
    expect(r).toHaveLength(HR.keep);
  });
});

describe('the words', () => {
  const keys = ['hr.high', 'hr.low'];
  test.each(['en', 'hi'])('%s: both prompts exist, point to the clinician plan and carry no diagnosis or dose', (lang) => {
    keys.forEach((k) => {
      const text = `${strings[lang][k]} ${strings[lang].clinicianPlan}`;
      expect(strings[lang][k]).toBeTruthy();
      expect(text).toContain(strings[lang].clinicianPlan);
      expect(text).not.toMatch(/heart attack|arrhythmia|tachycardia|bradycardia|दिल का दौरा|\b\d+\s*(mg|units?|ml)\b/i);
    });
  });
});
