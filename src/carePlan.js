import { WHEN } from './medicines';

// A care plan: what a clinician sets for a person, as plain data. The clinician writes it in their own Saath app and
// the person's phone applies the newest one by itself. Saath never makes up any part of it: every medicine, dose
// and time is exactly what the clinician typed, and the screens say who set it.
//
// Safety: plain text only (no links, no code), hard size limits, medicines and tasks capped. The server only
// accepts a plan from a member whose role is clinician, so a plan always comes from someone the person added.

export const PLAN_VERSION = 1;
const MAX_MEDS = 12;
const MAX_TASKS = 8;
const WHEN_IDS = WHEN.map(([id]) => id);

const text = (s, n) =>
  String(s ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, n);

// Clean whatever arrived (from the server, or from the form) into a plan the app can trust. Returns null when
// there is nothing usable in it.
export function sanitizePlan(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const meds = (Array.isArray(raw.meds) ? raw.meds : [])
    .map((m) => ({
      name: text(m?.name, 50),
      dose: text(m?.dose, 60),
      when: WHEN_IDS.includes(m?.when) ? m.when : 'afterBreakfast',
    }))
    .filter((m) => m.name.length >= 2)
    .slice(0, MAX_MEDS);
  const tasks = (Array.isArray(raw.tasks) ? raw.tasks : [])
    .map((x) => ({
      title: text(x?.title, 40),
      hour: Number.isInteger(x?.hour) && x.hour >= 0 && x.hour <= 23 ? x.hour : null,
    }))
    .filter((x) => x.title.length >= 2)
    .slice(0, MAX_TASKS);
  const testPerDay = Number.isInteger(raw.testPerDay) && raw.testPerDay >= 0 && raw.testPerDay <= 8 ? raw.testPerDay : null;
  const notes = text(raw.notes, 400);
  if (!meds.length && !tasks.length && testPerDay == null && !notes) return null;
  return { v: PLAN_VERSION, meds, tasks, testPerDay, notes };
}

// A short stable tag so the same plan always gives the same ids (a re-sync never duplicates anything).
function tag(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

// What the plan changes on this phone. Medicines and tasks that came from a plan are marked, so a newer plan
// replaces exactly those and never touches what the person added themselves.
export function planPatch(state, plan, meta) {
  const medicines = [
    ...state.medicines.filter((m) => !m.plan),
    ...plan.meds.map((m) => ({ id: `plan-${tag(`${m.name}|${m.dose}|${m.when}`)}`, ...m, plan: true })),
  ];
  const keptDone = new Set(state.tasks.filter((x) => x.done).map((x) => x.id));
  const tasks = [
    ...state.tasks.filter((x) => !x.plan),
    ...plan.tasks.map((x) => {
      const id = `plan-${tag(x.title)}`;
      return { id, icon: '📋', title: x.title, hour: x.hour, done: keptDone.has(id), plan: true };
    }),
  ];
  const patch = { medicines, tasks };
  if (plan.testPerDay != null) patch.testPlan = { ...state.testPlan, perDay: plan.testPerDay };
  patch.carePlan = {
    version: meta.version,
    author: meta.author,
    at: meta.at,
    notes: plan.notes,
    meds: plan.meds.length,
    tasks: plan.tasks.length,
    testPerDay: plan.testPerDay,
    seen: false,
  };
  return patch;
}

// The form state a clinician edits, from a plan (or empty).
export const emptyDraft = () => ({ meds: [], tasks: [], testPerDay: '', notes: '' });
export const draftFromPlan = (p) =>
  p
    ? { meds: p.meds.map((m) => ({ ...m })), tasks: p.tasks.map((x) => ({ ...x })), testPerDay: p.testPerDay == null ? '' : String(p.testPerDay), notes: p.notes || '' }
    : emptyDraft();
export const planFromDraft = (d) =>
  sanitizePlan({
    meds: d.meds,
    tasks: d.tasks,
    testPerDay: d.testPerDay === '' ? null : Number(d.testPerDay),
    notes: d.notes,
  });
