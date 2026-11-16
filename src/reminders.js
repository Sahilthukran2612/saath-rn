import { shouldNudge } from './logic';

// Which tasks get a daily reminder. Pure, so it is tested without a phone.
// A reminder needs a whole hour (0 to 23). Hours inside the sleep window are left out, because an
// inactivity-friendly night is the point of that window: nobody should be woken for a routine task.
export const validHour = (h) => Number.isInteger(h) && h >= 0 && h <= 23;

export function reminderPlan(tasks) {
  return tasks
    .filter((t) => validHour(t.hour))
    .filter((t) => shouldNudge({ nowMs: new Date(2000, 0, 1, t.hour).getTime() }).ok)
    .map((t) => ({ id: t.id, title: t.title, hour: t.hour }));
}

export const formatHour = (h) => `${String(h).padStart(2, '0')}:00`;

// Move a task's reminder one hour earlier or later. From "none", the first press picks 8:00.
// Going past the ends turns it off, so the same two buttons also clear a reminder.
export function stepHour(hour, delta) {
  if (!validHour(hour)) return delta > 0 ? 8 : null;
  const next = hour + delta;
  return validHour(next) ? next : null;
}