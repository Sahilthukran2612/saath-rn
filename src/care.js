// Phase 2 care logic: personal baseline, glucose prompts, refill, budget, escalation links.
// Pure functions. Nothing here calculates a dose or diagnoses: prompts only.
import { CFG } from './logic';

export const CLINICIAN_NOTE = "Follow your clinician's plan, or call family, a clinic or an ASHA.";

// ---- Personal baseline: simple, explainable rules (no black box) ----
export const BASELINE_LIMITS = { impactG: [1.8, 4.0], inactiveHours: [3, 12] };
export const defaultBaseline = () => ({ impactG: CFG.fallImpactG, inactiveHours: CFG.inactiveHours });

const clamp = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v));
const round1 = (v) => Math.round(v * 10) / 10;

// A false alarm means we were too sensitive: raise the bar a little.
// A missed event means we were not sensitive enough: lower it a little.
export function adjustBaseline(b, kind, feedback) {
  const dir = feedback === 'false_alarm' ? 1 : feedback === 'missed' ? -1 : 0;
  if (!dir) return b;
  if (kind === 'quiet') {
    return { ...b, inactiveHours: round1(clamp(b.inactiveHours + dir * 0.5, BASELINE_LIMITS.inactiveHours)) };
  }
  return { ...b, impactG: round1(clamp(b.impactG + dir * 0.1, BASELINE_LIMITS.impactG)) };
}

export const cfgFrom = (b) => ({ ...CFG, fallImpactG: b.impactG, inactiveHours: b.inactiveHours });

// Plain sentences that say what the baseline is and why it moved.
export function explainBaseline(b) {
  const d = defaultBaseline();
  const parts = [];
  parts.push(
    b.impactG === d.impactG
      ? `Fall check: normal (impact ${b.impactG} g).`
      : `Fall check: ${b.impactG > d.impactG ? 'less' : 'more'} sensitive than usual (impact ${b.impactG} g) because of your feedback.`
  );
  parts.push(
    b.inactiveHours === d.inactiveHours
      ? `Quiet check: after ${b.inactiveHours} hours.`
      : `Quiet check: after ${b.inactiveHours} hours (was ${d.inactiveHours}) because of your feedback.`
  );
  return parts;
}

// ---- Glucose ----
export function glucoseTrend(readings) {
  const vals = readings.map((r) => r.mgdl);
  if (vals.length === 0) return { count: 0, last: null, avg: null, direction: 'none' };
  const last = vals[vals.length - 1];
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  let direction = 'steady';
  if (vals.length >= 2) {
    const diff = last - vals[vals.length - 2];
    if (diff >= 20) direction = 'up';
    else if (diff <= -20) direction = 'down';
  }
  return { count: vals.length, last, avg, direction };
}

const HOUR = 3600000;

// Rule-based prompts. The phone cannot sense sugar: these only look at what the person logged.
// Returns null, or { id, title, reason, steps[], note }.
export function lowSugarPrompt({ lastInsulinAt, lastMealAt, lastReadingAt, nowMs, mealGapHours = 2 }) {
  const steps = [
    'Have sugar, jaggery or a glucose biscuit.',
    'Check your sugar again in 15 minutes.',
    'If you still feel unwell, call family, a clinic or an ASHA.',
  ];
  if (
    lastInsulinAt != null &&
    nowMs - lastInsulinAt >= mealGapHours * HOUR &&
    (lastMealAt == null || lastMealAt < lastInsulinAt)
  ) {
    return {
      id: 'insulin-no-meal',
      title: 'Insulin logged, no meal yet',
      reason: `You logged insulin over ${mealGapHours} hours ago and no meal since.`,
      steps,
      note: CLINICIAN_NOTE,
    };
  }
  const hour = new Date(nowMs).getHours();
  const night = hour >= 22 || hour < 2;
  if (night && (lastReadingAt == null || nowMs - lastReadingAt > 4 * HOUR)) {
    return {
      id: 'night-checkin',
      title: 'Night check-in',
      reason: 'No sugar reading in the last 4 hours.',
      steps: ['Check your sugar before sleeping if your clinician has told you to.', ...steps.slice(2)],
      note: CLINICIAN_NOTE,
    };
  }
  return null;
}

// Strip-saving test plan: the clinician sets how many tests a day. This only counts them.
export function stripsPlan({ perDay, strips }) {
  const daysLeft = perDay > 0 ? Math.floor(strips / perDay) : null;
  return { daysLeft, level: levelFor(daysLeft) };
}

// ---- Refill ----
export const levelFor = (days) => (days == null ? 'unknown' : days <= 3 ? 'now' : days <= 7 ? 'soon' : 'ok');
export function refillStatus({ pillsLeft, perDay }) {
  const daysLeft = perDay > 0 ? Math.floor(pillsLeft / perDay) : null;
  return { daysLeft, level: levelFor(daysLeft) };
}

// ---- Care Budget ----
const monthKey = (ms) => {
  const d = new Date(ms);
  return d.getFullYear() * 12 + d.getMonth();
};

export const TIP_TEXT = {
  strips:
    'Strips are a large part of your spend. Ask your clinician if a lower testing plan is safe for you.',
  up: 'Spend went up this month. Ask the clinic or an ASHA about free or cheaper medicines (verify locally).',
  travel: 'Travel costs are high. Ask if refills can be collected closer to home or in one visit.',
};

export function budgetSummary(entries, nowMs) {
  const cur = monthKey(nowMs);
  const sum = (key) => entries.filter((e) => monthKey(e.at) === key).reduce((a, e) => a + e.amount, 0);
  const thisMonth = sum(cur);
  const lastMonth = sum(cur - 1);
  const byCat = {};
  entries
    .filter((e) => monthKey(e.at) === cur)
    .forEach((e) => (byCat[e.cat] = (byCat[e.cat] || 0) + e.amount));
  let trend = 'steady';
  if (lastMonth > 0) {
    const change = (thisMonth - lastMonth) / lastMonth;
    trend = change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'steady';
  } else if (thisMonth > 0) trend = 'up';
  // Tips are ids so the UI can show them in the person's language. TIP_TEXT is the English text.
  const tipIds = [];
  if (thisMonth > 0 && (byCat.strips || 0) / thisMonth > 0.4) tipIds.push('strips');
  if (trend === 'up') tipIds.push('up');
  if ((byCat.travel || 0) / (thisMonth || 1) > 0.3) tipIds.push('travel');
  return { thisMonth, lastMonth, trend, byCat, tipIds, tips: tipIds.map((id) => TIP_TEXT[id]) };
}

// ---- Escalation: tap-to-call and prefilled message ----
export const callLink = (phone) => `tel:${String(phone).replace(/[^\d+]/g, '')}`;
export const escalationMessage = (personName, kind) =>
  kind === 'quiet'
    ? `Saath: ${personName} has been quiet for a long time and has not answered. Please call or check on them.`
    : `Saath: ${personName} may have had a fall and has not answered. Please call or check on them.`;
export const smsLink = (phone, text) =>
  `sms:${String(phone).replace(/[^\d+]/g, '')}?body=${encodeURIComponent(text)}`;

// WhatsApp is free when the person's own phone sends it: this opens WhatsApp with the message ready and
// the person (or the circle member's phone) only has to tap Send. India numbers get 91 in front. A
// server cannot send it for free: the business API charges and unofficial automation breaks WhatsApp's rules.
export function whatsappLink(phone, text) {
  let d = String(phone).replace(/\D/g, '');
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  if (d.length === 10) d = `91${d}`;
  if (d.length < 11 || d.length > 15) return null;
  return `https://wa.me/${d}?text=${encodeURIComponent(text)}`;
}
