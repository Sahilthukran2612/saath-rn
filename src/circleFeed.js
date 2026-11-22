// What a circle member sees about the person they look after. Pure, so it can be tested.
// Events arrive already filtered by the server's row-level security (the Privacy Dial): this file
// only decides how to word them and which ones need attention.
import { fmt } from './i18n/strings';

export const ALERT_KINDS = ['fall', 'quiet'];
const RESOLVES = ['im_ok', 'false_alarm'];
export const ALERT_WINDOW_MS = 30 * 60 * 1000;

const KEY = {
  fall: 'ev.fall',
  quiet: 'ev.quiet',
  im_ok: 'ev.imOk',
  false_alarm: 'ev.false',
  task_done: 'ev.task',
};

export { fmt };

export const isAlert = (e) => e.event_type === 0 && ALERT_KINDS.includes(e.kind);

export function describeEvent(e, name, t) {
  return fmt(t(KEY[e.kind] || 'ev.other'), { name, detail: e.detail || '' });
}

export function ago(iso, now, t) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60000));
  if (Number.isNaN(min) || min < 1) return t('ago.now');
  if (min < 60) return fmt(t('ago.min'), { n: min });
  if (min < 60 * 24) return fmt(t('ago.hour'), { n: Math.round(min / 60) });
  const days = Math.round(min / (60 * 24));
  return days === 1 ? t('ago.yesterday') : fmt(t('ago.day'), { n: days });
}

const time = (e) => new Date(e.created_at).getTime();

// The newest alert I have not looked at, still recent, and not already answered by the person.
// feed is newest first.
export function pendingAlert(feed = [], seenAt, now) {
  const alert = feed.find(isAlert);
  if (!alert) return null;
  if (now - time(alert) > ALERT_WINDOW_MS) return null;
  if (seenAt && time(alert) <= new Date(seenAt).getTime()) return null;
  const answered = feed.some((e) => RESOLVES.includes(e.kind) && time(e) >= time(alert));
  return answered ? null : alert;
}

// Alerts across every circle I am in: [{ circle, event }], newest first.
export function allPending(circles, feeds, seen, now) {
  return circles
    .map((c) => ({ circle: c, event: pendingAlert(feeds[c.household_id], seen[c.household_id], now) }))
    .filter((x) => x.event)
    .sort((a, b) => time(b.event) - time(a.event));
}

export const newest = (feed = []) => (feed.length ? feed[0].created_at : null);
