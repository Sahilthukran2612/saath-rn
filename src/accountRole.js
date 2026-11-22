import { fetchLatestPlan, fetchReadings, listCircles, listMembers } from './services/cloud';

// When someone signs in to an existing account on a new phone, Saath works out how they use it from the account
// itself, so nobody has to remember which door they took the first time:
//   doctor  a clinician in someone's circle
//   member  in other people's circles, with nothing of their own
//   both    in other people's circles, and with a circle, a plan or readings of their own
//   person  everyone else
// They can still change it in Me.
export function roleFromAccount({
  circles = [],
  ownMembers = [],
  hasPlan = false,
  hasReadings = false,
} = {}) {
  if (circles.some((c) => c.role === 'clinician')) return 'doctor';
  const looksAfter = circles.length > 0;
  const hasOwn = ownMembers.length > 0 || hasPlan || hasReadings;
  if (looksAfter && hasOwn) return 'both';
  return looksAfter ? 'member' : 'person';
}

// Reads what the role needs from the server. Tokens may be refreshed along the way; the newest session is returned
// so the caller can keep it. A failed read counts as "nothing there".
export async function lookupAccount(cfg, cloud) {
  let session = null;
  let c = { ...cloud };
  const keep = (s) => {
    if (s) {
      session = { ...(session || {}), ...s };
      c = { ...c, ...s };
    }
  };
  const circles = await listCircles(cfg, c);
  keep(circles.session);
  const members = await listMembers(cfg, c);
  keep(members.session);
  const plan = await fetchLatestPlan(cfg, c, c.householdId);
  keep(plan.session);
  const readings = await fetchReadings(cfg, c, c.householdId);
  keep(readings.session);
  const facts = {
    circles: circles.ok ? circles.circles : [],
    ownMembers: members.ok ? members.members : [],
    hasPlan: Boolean(plan.ok && plan.row),
    hasReadings: Boolean(readings.ok && readings.readings.length),
  };
  return { usage: roleFromAccount(facts), circles: facts.circles, session };
}
