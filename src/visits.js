// An ASHA's household round: when they last visited each home, and which homes are due. A visit is a note the ASHA
// makes for themselves on their own phone. It is not sent, and it is not a health record.
export const VISIT_EVERY_DAYS = 14;
const DAY = 24 * 3600000;

export function visitStatus(lastAt, nowMs) {
  if (!Number.isFinite(lastAt)) return { due: true, days: null };
  const days = Math.floor((nowMs - lastAt) / DAY);
  return { due: days >= VISIT_EVERY_DAYS, days: Math.max(0, days) };
}
