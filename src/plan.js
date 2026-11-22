// Phase 3 logic: handover, visit prep, health passport, wellbeing, risk screening, school card.
// Pure functions. Screening and summaries only: nothing here diagnoses or sets a dose.
import { canShareItem } from './logic';
import { glucoseTrend, refillStatus } from './care';

// ---- Transition Ladder ----
export const STAGES = ['parent', 'together', 'backup', 'independent'];
export const SKILLS = ['refills', 'explain', 'visitPrep', 'badDays'];
const MAX_STAGE = STAGES.length - 1;

export const initialLadder = () => SKILLS.map((id) => ({ id, stage: 0, pending: false }));

const mapSkill = (ladder, id, fn) => ladder.map((s) => (s.id === id ? fn(s) : s));

// The teen confirms they are ready for the next stage of one skill. If the family wants a
// say, the move waits for the caregiver's approval; otherwise it happens straight away.
export function requestAdvance(ladder, id, { needsApproval = false } = {}) {
  return mapSkill(ladder, id, (s) => {
    if (s.stage >= MAX_STAGE || s.pending) return s;
    return needsApproval ? { ...s, pending: true } : { ...s, stage: s.stage + 1 };
  });
}
export const approveAdvance = (ladder, id) =>
  mapSkill(ladder, id, (s) =>
    s.pending ? { ...s, pending: false, stage: Math.min(MAX_STAGE, s.stage + 1) } : s
  );
export const declineAdvance = (ladder, id) => mapSkill(ladder, id, (s) => ({ ...s, pending: false }));
// Stepping back is allowed and neutral: a hard week is not a failure.
export const stepBack = (ladder, id) =>
  mapSkill(ladder, id, (s) => ({ ...s, pending: false, stage: Math.max(0, s.stage - 1) }));
export const overallStage = (ladder) => (ladder.length ? Math.min(...ladder.map((s) => s.stage)) : 0);

// ---- Visit prep ----
// Plain facts for the next clinic visit. No advice, no judgement.
export function visitSummary({ readings, tasks, meds, testPlan, nowMs }) {
  const real = readings;
  const t = glucoseTrend(real);
  const lines = [];
  lines.push(t.count > 0 ? { id: 'sugar', n: t.count, avg: t.avg, last: t.last } : { id: 'noSugar' });
  const done = tasks.filter((x) => x.done).length;
  lines.push({ id: 'routine', done, total: tasks.length });
  const refill = refillStatus(meds);
  lines.push({ id: 'stock', pills: meds.pillsLeft, days: refill.daysLeft });
  lines.push({ id: 'strips', strips: testPlan.strips });
  return { generatedAt: nowMs, lines };
}

// ---- Health Passport (offline QR and PDF) ----
export const QR_MAX_CHARS = 700;

// Only what the person chose to include. The emergency contact's number appears only if that
// person agreed (interdependent privacy). Raw sensor data is never part of it.
export function passportPayload({ profile, meds, readings, members, share }) {
  const out = { v: 1, n: profile.name || '', c: profile.condition || '' };
  if (profile.allergies) out.a = profile.allergies;
  if (share.meds) out.m = `${meds.name}`;
  if (share.sugar) {
    const t = glucoseTrend(readings);
    if (t.count > 0) out.s = { n: t.count, avg: t.avg, last: t.last };
  }
  if (share.contact && profile.emergencyId) {
    const m = members.find((x) => x.id === profile.emergencyId);
    if (m) {
      out.e = m.name;
      if (canShareItem({ involves: [m.id] }, { [m.id]: m.shareContact })) out.p = m.phone;
    }
  }
  return out;
}
export const passportString = (payload) => JSON.stringify(payload);
export const passportFits = (payload) => passportString(payload).length <= QR_MAX_CHARS;

// ---- Weekly wellbeing check-in ----
// Gentle summary only: it never scolds and never counts misses.
export const weekKey = (ms) => {
  const d = new Date(ms);
  const day = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dow = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(day.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((day - yearStart) / 86400000 + 1) / 7);
  return `${day.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

export function addCheckin(list, mood, nowMs) {
  if (!(mood >= 1 && mood <= 5)) return list;
  const key = weekKey(nowMs);
  return [...list.filter((c) => c.week !== key), { week: key, mood, at: nowMs }];
}

export function weeklySummary(list) {
  if (list.length === 0) return { id: 'none' };
  const last = list[list.length - 1].mood;
  const recent = list.slice(-4).map((c) => c.mood);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  if (list.length === 1) return { id: 'first', mood: last };
  if (last >= 4 && avg >= 3.5) return { id: 'good', mood: last };
  if (last <= 2) return { id: 'hard', mood: last }; // offers company and Time Off, never a nudge to do more
  return { id: 'steady', mood: last };
}

// ---- Diabetes risk questionnaire (Indian Diabetes Risk Score) ----
// A screening score, not a diagnosis. Cut-offs follow the published IDRS; the team must verify
// them against the source and with a clinician before any real use.
export function idrsScore({ age, gender, waistCm, activity, family }) {
  let s = 0;
  s += age < 35 ? 0 : age < 50 ? 20 : 30;
  const w = Number(waistCm);
  if (gender === 'female') s += w < 80 ? 0 : w < 90 ? 10 : 20;
  else s += w < 90 ? 0 : w < 100 ? 10 : 20;
  s += { vigorous: 0, moderate: 10, mild: 20, sedentary: 30 }[activity] ?? 0;
  s += { none: 0, one: 10, both: 20 }[family] ?? 0;
  const level = s >= 60 ? 'high' : s >= 30 ? 'moderate' : 'low';
  return { score: s, level };
}

// ---- Foot check ----
export const FOOT_ITEMS = ['cuts', 'redness', 'swelling', 'dry', 'nails', 'shoes'];

// ---- Teen type 1 school plan ----
export const SCHOOL_STEPS = ['stop', 'sugar', 'stay', 'call'];
// The guardian's number goes on the card only if the guardian agreed to show it.
export function schoolCard({ profile, members }) {
  const g = members.find((m) => m.guardian);
  const phone = g && canShareItem({ involves: [g.id] }, { [g.id]: g.shareContact }) ? g.phone : null;
  return { name: profile.name || '', guardian: g ? g.name : '', phone, steps: SCHOOL_STEPS };
}
