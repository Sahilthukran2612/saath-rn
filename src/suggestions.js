import { refillStatus, stripsPlan } from './care';
import { weekKey, weeklySummary } from './plan';

// Suggestion slips for the person: a short pad of "one small thing" cards for today.
//
// How they are made (all on the phone, no network, nothing leaves it):
//   1. Every slip is a fixed, hand-written card. There is no generated text and no model.
//   2. A rule decides whether a card is eligible, using only what this person already entered or what
//      the clock says: meals, routine, medicine and strip counts, foot checks, the weekly check-in,
//      the clinic-visit questions.
//   3. Eligible cards are ranked (care reminders from the person's own entries first, then habits that
//      fit this hour) and the top few form today's pad. Done and skipped slips drop out for the day.
//
// Safety rules, kept in code and tested:
//   - never a dose, never a medicine instruction, never a diagnosis; care cards point to the clinic,
//     chemist, ASHA or family
//   - never a nudge to do more after a hard week or in a crisis phase: only company and rest
//   - the phone cannot see sugar, so no card ever says what a sugar level is or means

export const PAD_SIZE = 4;
const HOUR = 3600000;

// Local calendar day, used to reset the pad each morning.
export const dayKey = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const hourOf = (ms) => new Date(ms).getHours();
const sameDay = (a, b) => dayKey(a) === dayKey(b);

function lastAt(list) {
  const times = (list || []).map((x) => x?.at).filter((n) => Number.isFinite(n) && n > 0);
  return times.length ? Math.max(...times) : null;
}

// Each rule returns a slip or null. `priority` ranks them; `kind` is 'care' or 'habit'.
// `doodle` names the drawn picture; `tab` is where the slip's button goes (optional).
const RULES = [
  // ---- care reminders from the person's own entries ----
  {
    id: 'refill',
    kind: 'care',
    doodle: 'strip',
    tab: 'care',
    make: (c) => {
      const r = refillStatus(c.meds || {});
      if (!c.meds?.name || r.daysLeft == null || r.level === 'ok' || r.level === 'unknown') return null;
      return { priority: r.level === 'now' ? 90 : 62, params: { days: r.daysLeft } };
    },
  },
  {
    id: 'strips',
    kind: 'care',
    doodle: 'drop',
    tab: 'care',
    make: (c) => {
      const s = stripsPlan(c.testPlan || {});
      if (s.daysLeft == null || s.level === 'ok' || s.level === 'unknown') return null;
      return { priority: s.level === 'now' ? 80 : 58, params: { days: s.daysLeft } };
    },
  },
  {
    id: 'visit',
    kind: 'care',
    doodle: 'note',
    tab: 'plan',
    make: (c) => {
      const n = (c.visitQuestions || []).length;
      return n > 0 ? { priority: 54, params: { n } } : null;
    },
  },
  {
    id: 'foot',
    kind: 'care',
    doodle: 'foot',
    tab: 'plan',
    make: (c) => {
      if (c.mode === 'teen') return null;
      const last = lastAt(c.footChecks);
      if (last != null && c.nowMs - last < 7 * 24 * HOUR) return null;
      return { priority: 50, params: {} };
    },
  },
  {
    id: 'checkin',
    kind: 'care',
    doodle: 'face',
    tab: 'plan',
    make: (c) => {
      const key = weekKey(c.nowMs);
      return (c.checkins || []).some((x) => x.week === key) ? null : { priority: 44, params: {} };
    },
  },
  {
    id: 'reading',
    kind: 'care',
    doodle: 'drop',
    tab: 'care',
    make: (c) => {
      if (c.mode !== 'adult' && c.mode !== 'teen') return null;
      const last = lastAt((c.readings || []).filter((r) => !r.demo));
      if (last == null || c.nowMs - last < 24 * HOUR) return null;
      return { priority: 46, params: {} };
    },
  },
  {
    id: 'ladder',
    kind: 'care',
    doodle: 'steps',
    tab: 'plan',
    make: (c) => {
      if (c.mode !== 'teen') return null;
      const stages = (c.ladder || []).map((s) => s.stage);
      return stages.length && Math.min(...stages) < 3 ? { priority: 36, params: {} } : null;
    },
  },
  // ---- a hard week: company first, never more to do ----
  {
    id: 'company',
    kind: 'care',
    doodle: 'phone',
    tab: 'circle',
    make: (c) => (weeklySummary(c.checkins || []).id === 'hard' ? { priority: 88, params: {} } : null),
  },
  // ---- daily habits that fit this hour ----
  {
    id: 'water',
    kind: 'habit',
    doodle: 'glass',
    make: (c) => {
      const h = hourOf(c.nowMs);
      return h >= 7 && h < 20 ? { priority: 24, params: {} } : null;
    },
  },
  {
    id: 'walk',
    kind: 'habit',
    doodle: 'walker',
    make: (c) => {
      const meal = c.lastMealAt;
      const after = meal != null && c.nowMs - meal >= 20 * 60000 && c.nowMs - meal <= 3 * HOUR;
      return after ? { priority: 40, params: {} } : null;
    },
  },
  {
    id: 'meal',
    kind: 'habit',
    doodle: 'plate',
    tab: 'plan',
    make: (c) => {
      const h = hourOf(c.nowMs);
      const ate = c.lastMealAt != null && sameDay(c.lastMealAt, c.nowMs);
      return h >= 9 && h < 12 && !ate ? { priority: 42, params: {} } : null;
    },
  },
  {
    id: 'plate',
    kind: 'habit',
    doodle: 'plate',
    tab: 'plan',
    make: (c) => {
      const h = hourOf(c.nowMs);
      return (h >= 11 && h < 14) || (h >= 18 && h < 21) ? { priority: 30, params: {} } : null;
    },
  },
  {
    id: 'stretch',
    kind: 'habit',
    doodle: 'stretch',
    make: (c) => {
      const h = hourOf(c.nowMs);
      return h >= 6 && h < 11 ? { priority: 28, params: {} } : null;
    },
  },
  {
    id: 'shoes',
    kind: 'habit',
    doodle: 'foot',
    make: (c) => {
      const h = hourOf(c.nowMs);
      return c.mode !== 'teen' && h >= 6 && h < 10 ? { priority: 22, params: {} } : null;
    },
  },
  {
    id: 'sleep',
    kind: 'habit',
    doodle: 'moon',
    make: (c) => {
      const h = hourOf(c.nowMs);
      return h >= 21 || h < 5 ? { priority: 38, params: {} } : null;
    },
  },
  // ---- gentle ones that stay on offer when nothing else fits ----
  {
    id: 'rest',
    kind: 'habit',
    doodle: 'moon',
    make: (c) => (weeklySummary(c.checkins || []).id === 'hard' || c.phase === 'crisis' ? { priority: 60, params: {} } : null),
  },
];

// After a hard week or in a crisis phase, only these may appear: no new things to do.
const CALM_ONLY = new Set(['company', 'rest', 'checkin', 'refill', 'strips', 'visit', 'sleep', 'water']);

export function allSlips(ctx) {
  const c = { ...ctx, lastMealAt: lastAt([{ at: ctx.careEvents?.lastMealAt }, ...(ctx.meals || [])]) };
  const calm = weeklySummary(c.checkins || []).id === 'hard' || c.phase === 'crisis';
  const out = [];
  for (const rule of RULES) {
    if (calm && !CALM_ONLY.has(rule.id)) continue;
    const made = rule.make(c);
    if (made) out.push({ id: rule.id, kind: rule.kind, doodle: rule.doodle, tab: rule.tab || null, ...made });
  }
  return out.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

// Today's pad: ranked, minus anything done or skipped today, and never more than PAD_SIZE.
export function buildPad(ctx, slips = { day: null, done: [], skipped: [] }) {
  const today = dayKey(ctx.nowMs);
  const gone = slips.day === today ? new Set([...(slips.done || []), ...(slips.skipped || [])]) : new Set();
  return allSlips(ctx)
    .filter((s) => !gone.has(s.id))
    .slice(0, PAD_SIZE);
}

// Slips stamped today, for the "all stamped" state.
export const stampedToday = (ctx, slips) => (slips?.day === dayKey(ctx.nowMs) ? slips.done || [] : []);

// The reducer calls this to record a slip as done or skipped, resetting at midnight.
export function markSlip(slips, id, how, nowMs) {
  const today = dayKey(nowMs);
  const base = slips?.day === today ? slips : { day: today, done: [], skipped: [] };
  const key = how === 'done' ? 'done' : 'skipped';
  if (base[key].includes(id)) return base;
  return { ...base, [key]: [...base[key], id] };
}
