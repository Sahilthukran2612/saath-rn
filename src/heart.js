// Heart-rate band (Bluetooth) logic. Pure, so it is tested without a device.
// Saath never diagnoses. It can only say "your heart rate has stayed unusual while you were still" and
// point to the clinician's plan, family, a clinic or an ASHA. The limits below are plain defaults that a
// clinician should set for each person; they have not been clinically reviewed.

export const HR = {
  restHigh: 120, // bpm, while still
  restLow: 40,
  stillMs: 2 * 60 * 1000, // must have been still this long before a reading counts as "at rest"
  windowMs: 3 * 60 * 1000, // look at the last three minutes
  spanMs: 60 * 1000, // and need readings covering at least a minute
  minReadings: 3,
  keep: 60, // readings kept in memory (never stored or sent)
};

// Standard Bluetooth GATT Heart Rate Measurement (characteristic 0x2A37).
// Byte 0 holds flags: bit 0 says whether the rate is 8 or 16 bits. Bit 1 and 2: sensor contact.
export const HEART_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
export const HEART_MEASUREMENT = '00002a37-0000-1000-8000-00805f9b34fb';

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function base64ToBytes(b64) {
  const clean = String(b64 || '').replace(/[^A-Za-z0-9+/]/g, '');
  const out = [];
  let bits = 0;
  let acc = 0;
  for (const ch of clean) {
    acc = (acc << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  return out;
}

// bytes: array of numbers (or a base64 string). Returns { bpm, contact } or null if it is not a valid reading.
export function parseHeartRate(input) {
  const b = typeof input === 'string' ? base64ToBytes(input) : Array.from(input || []);
  if (b.length < 2) return null;
  const sixteen = (b[0] & 1) === 1;
  if (sixteen && b.length < 3) return null;
  const bpm = sixteen ? b[1] | (b[2] << 8) : b[1];
  const contactSupported = (b[0] & 0b100) !== 0;
  const contactDetected = (b[0] & 0b010) !== 0;
  // a rate of 0 or an impossible one is a band that is not on the wrist yet
  if (bpm < 20 || bpm > 250) return null;
  return { bpm, contact: contactSupported ? contactDetected : true };
}

export const addReading = (readings, bpm, at) => [...readings, { bpm, at }].slice(-HR.keep);

// level: 'unknown' (not enough yet), 'ok', 'high' or 'low'.
// stillSince: when the person last moved, from the accelerometer. A fast heart while walking is normal,
// so nothing is said unless the person has been still.
export function heartStatus(readings, { stillSince, now, limits = HR } = {}) {
  const recent = readings.filter((r) => now - r.at <= limits.windowMs);
  const last = recent[recent.length - 1];
  if (!last) return { level: 'unknown', bpm: null };
  const still = stillSince != null && now - stillSince >= limits.stillMs;
  const span = last.at - recent[0].at;
  if (!still || recent.length < limits.minReadings || span < limits.spanMs) {
    return { level: 'unknown', bpm: last.bpm };
  }
  if (recent.every((r) => r.bpm >= limits.restHigh)) return { level: 'high', bpm: last.bpm };
  if (recent.every((r) => r.bpm <= limits.restLow)) return { level: 'low', bpm: last.bpm };
  return { level: 'ok', bpm: last.bpm };
}
