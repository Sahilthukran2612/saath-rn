// Pure care logic. No React, no device APIs, so it can be unit-tested.
// Thresholds live in CFG and are meant to be tuned from trial data.

export const CFG = {
  fallImpactG: 2.5, // spike magnitude (in g) that counts as an impact
  stillWindowMs: 3000, // how long after the spike the phone must stay still
  stillBandG: 0.25, // |magnitude - 1g| below this counts as "still"
  minSamplesAfterSpike: 5, // fewer samples than this means a sensor gap: do not guess
  countdownSec: 30, // "Are you OK?" countdown before escalating
  stepSec: 20, // time given to each escalation step
  inactiveHours: 6, // default quiet period that is worth a check-in
  quietWindow: { startHour: 22, endHour: 7 }, // sleep window: inactivity is expected
};

export const EVENT_TYPE = { safety: 0, routine: 1, summary: 2 };
export const DIAL = { safetyOnly: 0, routine: 1, full: 2 };
export const ROLES = ['person', 'family', 'neighbour', 'asha', 'clinician'];

// Privacy Dial: a member receives an event if the event's type number is at or
// below their dial level. Safety events (0) always pass, so they cannot be switched off.
export function canReceive(dialLevel, eventType) {
  if (eventType === EVENT_TYPE.safety) return true;
  return eventType <= dialLevel;
}

// Escalation: person -> family -> neighbour -> ASHA -> clinician.
// Members are skipped when they are on Time Off for non-safety, but never for safety.
const ORDER = ['family', 'neighbour', 'asha', 'clinician'];
export function escalationChain(members, { isSafety = true } = {}) {
  return ORDER.flatMap((role) =>
    members.filter(
      (m) =>
        m.role === role &&
        canReceive(m.dial ?? DIAL.safetyOnly, EVENT_TYPE.safety) &&
        (isSafety || !m.timeOff)
    )
  );
}

const mag = (s) => Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);

// samples: [{t (ms), x, y, z}] in g. Returns { state, confidence, reason }.
// state: 'fall' | 'unsure' | 'none'. "unsure" means ask the person, do not alarm.
export function detectFall(samples, cfg = CFG) {
  if (!samples || samples.length === 0) return { state: 'none', confidence: 0, reason: 'no data' };
  const spike = samples.findIndex((s) => mag(s) >= cfg.fallImpactG);
  if (spike === -1) return { state: 'none', confidence: 0.9, reason: 'no impact' };
  const after = samples.filter((s) => s.t > samples[spike].t && s.t <= samples[spike].t + cfg.stillWindowMs);
  if (after.length < cfg.minSamplesAfterSpike)
    return { state: 'unsure', confidence: 0.3, reason: 'sensor gap after impact' };
  const still = after.filter((s) => Math.abs(mag(s) - 1) < cfg.stillBandG).length / after.length;
  if (still >= 0.8)
    return { state: 'fall', confidence: Math.min(0.9, 0.5 + still * 0.4), reason: 'impact then still' };
  if (still >= 0.5) return { state: 'unsure', confidence: 0.4, reason: 'impact then some movement' };
  return { state: 'none', confidence: 0.7, reason: 'impact then walking' };
}

const inWindow = (hour, { startHour, endHour }) =>
  startHour > endHour ? hour >= startHour || hour < endHour : hour >= startHour && hour < endHour;

// lastActiveMs / nowMs are epoch ms. Quiet during the sleep window is not flagged.
export function isInactive(lastActiveMs, nowMs, cfg = CFG, thresholdHours = cfg.inactiveHours) {
  if (lastActiveMs == null) return { inactive: false, confidence: 0, reason: 'no data' };
  if (inWindow(new Date(nowMs).getHours(), cfg.quietWindow))
    return { inactive: false, confidence: 0.8, reason: 'sleep window' };
  const hours = (nowMs - lastActiveMs) / 3600000;
  return hours >= thresholdHours
    ? {
        inactive: true,
        confidence: Math.min(0.9, 0.5 + (hours - thresholdHours) * 0.1),
        reason: `quiet for ${hours.toFixed(1)}h`,
      }
    : { inactive: false, confidence: 0.8, reason: 'recent activity' };
}

// Prompts only. Never returns a dose and never claims the phone sensed sugar.
export function glucoseAdvice(mgdl) {
  const note = "Follow your clinician's plan, or call family, a clinic or an ASHA.";
  if (mgdl == null || Number.isNaN(mgdl)) return { level: 'unknown', text: `Enter a reading. ${note}` };
  if (mgdl < 70)
    return {
      level: 'low',
      text: `This looks low. Have sugar, jaggery or a glucose biscuit, then recheck. ${note}`,
    };
  if (mgdl > 250) return { level: 'high', text: `This looks high. Drink water and check your plan. ${note}` };
  return { level: 'ok', text: `In the usual range. Nice work logging it. ${note}` };
}

// Rule table for the Care screen: which role may do what. Replaces the clinician special case.
export const CARE_RULES = {
  person: { viewSummary: true, logReading: true, editPlan: true },
  family: { viewSummary: true, logReading: true, editPlan: false },
  neighbour: { viewSummary: false, logReading: false, editPlan: false },
  asha: { viewSummary: true, logReading: true, editPlan: false },
  clinician: { viewSummary: true, logReading: false, editPlan: true },
};
export const can = (role, action) => !!CARE_RULES[role]?.[action];
