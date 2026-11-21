import { refillStatus, stripsPlan } from './care';
import { weekKey, weeklySummary } from './plan';
import { suggestMeal } from './mealGenerator';
import { overdueMedicines } from './medicines';

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

// Diabetes-specific cards (foot care, shoes) show unless the person has written a different condition.
const diabetic = (c) => {
  const cond = (c.condition || '').trim();
  return !cond || /diab|sugar|madhumeh|मधुमेह|शुगर/i.test(cond);
};

function lastAt(list) {
  const times = (list || []).map((x) => x?.at).filter((n) => Number.isFinite(n) && n > 0);
  return times.length ? Math.max(...times) : null;
}

// Each rule returns a slip or null. `priority` ranks them; `kind` is 'care' or 'habit'.
// `doodle` names the drawn picture; `tab` is where the slip's button goes (optional).
const RULES = [
  // ---- care reminders from the person's own entries ----
  {
    // A medicine whose time passed more than an hour ago and is not marked as taken. Names only: the slip never
    // repeats a dose, and it never tells the person what to take.
    id: 'med',
    kind: 'care',
    doodle: 'strip',
    tab: 'care',
    make: (c) => {
      const late = overdueMedicines(c.medicines, c.medTaken, c.nowMs);
      if (!late.length) return null;
      return { priority: 92, params: { names: late.map((m) => m.name).slice(0, 3).join(', ') } };
    },
  },
  {
    // Something from the person's own daily list whose hour has passed and is not ticked. It only points at the
    // list: it never says what to take or how much.
    id: 'task',
    kind: 'care',
    doodle: 'note',
    make: (c) => {
      // Never nag a brand-new user about starter tasks they did not make: wait until they have used the app.
      if (!c.engaged) return null;
      const h = hourOf(c.nowMs);
      const late = (c.tasks || [])
        .filter((x) => x && !x.done && Number.isFinite(x.hour) && x.hour <= h - 1 && x.title)
        .sort((a, b) => a.hour - b.hour);
      if (!late.length) return null;
      return { priority: 70, params: { title: late[0].title, time: `${late[0].hour}:00` } };
    },
  },
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
      if (c.mode === 'teen' || !diabetic(c)) return null;
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
      const last = lastAt((c.readings || []));
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
    // A meal idea made for this person: region, diet, the hour, what they were given lately, what they turned down.
    // Shown near each mealtime when no meal has been logged in the last few hours.
    id: 'meal',
    kind: 'habit',
    doodle: 'plate',
    tab: 'plan',
    make: (c) => {
      const h = hourOf(c.nowMs);
      const slot = h >= 7 && h < 10 ? 'breakfast' : h >= 12 && h < 15 ? 'lunch' : h >= 17 && h < 19 ? 'snack' : h >= 19 && h < 22 ? 'dinner' : null;
      if (!slot || !c.foodPrefs) return null;
      if (c.lastMealAt != null && c.nowMs - c.lastMealAt < 3 * HOUR) return null;
      const f = c.foodPrefs;
      const idea = suggestMeal({ region: f.region, diet: f.diet, slot, day: dayKey(c.nowMs), recent: f.recent, disliked: f.disliked });
      if (!idea) return null;
      const lang = c.lang === 'hi' ? 'hi' : 'en';
      return { priority: 42, params: { slot: (c.labels && c.labels[slot]) || slot, idea: idea.text[lang] } };
    },
  },
  {
    id: 'shoes',
    kind: 'habit',
    doodle: 'foot',
    make: (c) => {
      const h = hourOf(c.nowMs);
      return c.mode !== 'teen' && diabetic(c) && h >= 6 && h < 10 ? { priority: 22, params: {} } : null;
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
const CALM_ONLY = new Set(['med', 'company', 'rest', 'checkin', 'refill', 'strips', 'visit', 'sleep', 'water']);

// How many phrasings a habit slip has (sg.<id>.b, sg.<id>.b2, ...). One is chosen per day, so the wording is not
// the same every morning.
const VARIANTS = { water: 3, walk: 3, shoes: 3, sleep: 3, rest: 3 };

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// What this person's own choices say about a habit slip. Skipped more than stamped: it drops, by up to 30.
// Stamped more than skipped: it rises a little. Care reminders are never adjusted: a refill must not be learned away.
function learned(stats) {
  const d = stats?.done || 0;
  const s = stats?.skipped || 0;
  if (s > d) return -Math.min(30, 8 * (s - d));
  if (d > s) return Math.min(6, 2 * (d - s));
  return 0;
}

export function allSlips(ctx) {
  const c = { ...ctx, lastMealAt: lastAt([{ at: ctx.careEvents?.lastMealAt }, ...(ctx.meals || [])]) };
  const calm = weeklySummary(c.checkins || []).id === 'hard' || c.phase === 'crisis';
  const out = [];
  for (const rule of RULES) {
    if (calm && !CALM_ONLY.has(rule.id)) continue;
    const made = rule.make(c);
    if (!made) continue;
    const day = dayKey(c.nowMs);
    const habit = rule.kind === 'habit';
    out.push({
      id: rule.id,
      kind: rule.kind,
      doodle: rule.doodle,
      tab: rule.tab || null,
      ...made,
      // Habits move with the person and the day: what they do, what they skip, and a small daily shuffle so the
      // set rotates. Care reminders keep their priority exactly.
      priority: habit ? made.priority + learned(c.slipStats?.[rule.id]) + (hash(`${day}|${rule.id}`) % 9) : made.priority,
      variant: VARIANTS[rule.id] ? hash(`${day}|v|${rule.id}`) % VARIANTS[rule.id] : 0,
    });
  }
  out.sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
  // Care reminders come first. Habits only fill what is left: at most two, and one when there are
  // already two or more care reminders, so the pad never turns into a list of generic advice.
  const care = out.filter((s) => s.kind === 'care');
  const habitCap = care.length >= 2 ? 1 : 2;
  let habits = 0;
  return out.filter((s) => s.kind === 'care' || ++habits <= habitCap);
}

// How many cards the pad shows when generated ones are available, and the fewest worth showing.
export const AI_PAD_SIZE = 7;
export const AI_MIN = 3;

// Today's pad: ranked, minus anything done or skipped today. Rule-based care reminders always come first, because a
// refill or a medicine must not depend on a server. Generated cards (`extra`, already checked by src/ai/guard.js)
// fill the rest, up to seven. With none, or in a hard week, it is the offline rule-based pad of at most PAD_SIZE.
export function buildPad(ctx, slips = { day: null, done: [], skipped: [] }, extra = []) {
  const today = dayKey(ctx.nowMs);
  const gone = slips.day === today ? new Set([...(slips.done || []), ...(slips.skipped || [])]) : new Set();
  const rules = allSlips(ctx).filter((s) => !gone.has(s.id));
  const calm = weeklySummary(ctx.checkins || []).id === 'hard' || ctx.phase === 'crisis';
  // A generated card about the same thing as a rule-based one (same drawing: feet, water, a walk...) is left out,
  // even if the rule-based one was already stamped or put aside today, so the same advice never shows twice.
  const covered = new Set(allSlips(ctx).map((s) => s.doodle));
  const generated = calm ? [] : (extra || []).filter((s) => !gone.has(s.id) && (s.doodle === 'note' || !covered.has(s.doodle)));
  if (generated.length < AI_MIN) return rules.slice(0, PAD_SIZE);
  const care = rules.filter((s) => s.kind === 'care');
  return [...care, ...generated].slice(0, AI_PAD_SIZE);
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

