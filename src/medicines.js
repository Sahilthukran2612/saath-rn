// The person's own medicine list, kept exactly as their doctor wrote it. Saath stores the name, the dose text as
// typed from the prescription, and when it is taken. It never suggests, calculates, converts or changes a dose,
// and it never says what a medicine is for. Marking "taken" records a time on this phone only.

// Times of day as people say them, with the hour a reminder or "still to mark" check uses.
export const WHEN = [
  ['beforeBreakfast', 7],
  ['afterBreakfast', 9],
  ['beforeLunch', 12],
  ['afterLunch', 14],
  ['beforeDinner', 19],
  ['afterDinner', 21],
  ['bedtime', 22],
];
export const dueHour = (when) => (WHEN.find(([id]) => id === when) || [null, 12])[1];

export const dayOf = (ms) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const takenToday = (medTaken, nowMs) => (medTaken?.day === dayOf(nowMs) ? medTaken.ids || [] : []);

// Medicines whose time has come (within the last hour, or later today) and are not marked as taken.
export function dueMedicines(medicines, medTaken, nowMs) {
  const h = new Date(nowMs).getHours();
  const taken = new Set(takenToday(medTaken, nowMs));
  return (medicines || []).filter((m) => !taken.has(m.id) && h >= dueHour(m.when));
}

// Medicines more than an hour past their time and still not marked: what the "not marked yet" slip is about.
export function overdueMedicines(medicines, medTaken, nowMs) {
  const h = new Date(nowMs).getHours();
  const taken = new Set(takenToday(medTaken, nowMs));
  return (medicines || []).filter((m) => !taken.has(m.id) && h >= dueHour(m.when) + 1);
}

export const validMedicine = (name) => typeof name === 'string' && name.trim().length >= 2;
