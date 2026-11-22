import { dayOf } from './medicines';

// Plain statistics over what the person logged, for the Care charts. Nothing here labels a number as good or bad:
// it reports counts, averages and the lowest and highest, and the clinician's plan says what they mean.

const DAY = 24 * 3600000;

// The last `days` calendar days ending today, oldest first, each with the readings that fall on it.
export function dailyReadings(readings, days, nowMs) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const ms = nowMs - i * DAY;
    out.push({ day: dayOf(ms), ms, values: [] });
  }
  const index = new Map(out.map((d, i) => [d.day, i]));
  for (const r of readings || []) {
    if (!Number.isFinite(r?.mgdl) || !Number.isFinite(r?.at)) continue;
    const i = index.get(dayOf(r.at));
    if (i != null) out[i].values.push(r.mgdl);
  }
  return out.map((d) => ({
    day: d.day,
    ms: d.ms,
    n: d.values.length,
    avg: d.values.length ? Math.round(d.values.reduce((a, b) => a + b, 0) / d.values.length) : null,
    min: d.values.length ? Math.min(...d.values) : null,
    max: d.values.length ? Math.max(...d.values) : null,
  }));
}

// One summary over the same window: how many, the average, the lowest and the highest.
export function sugarSummary(readings, days, nowMs) {
  const all = dailyReadings(readings, days, nowMs).flatMap((d) => (d.n ? [d] : []));
  const n = all.reduce((a, d) => a + d.n, 0);
  if (!n) return { n: 0, avg: null, min: null, max: null, daysLogged: 0 };
  const sum = all.reduce((a, d) => a + d.avg * d.n, 0);
  return {
    n,
    avg: Math.round(sum / n),
    min: Math.min(...all.map((d) => d.min)),
    max: Math.max(...all.map((d) => d.max)),
    daysLogged: all.length,
  };
}

// Medicines marked taken, per day, against how many medicines there are. `log` is { day: [ids] }.
export function adherence(log, medicines, days, nowMs) {
  const ids = new Set((medicines || []).map((m) => m.id));
  const total = ids.size;
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const ms = nowMs - i * DAY;
    const taken = ((log || {})[dayOf(ms)] || []).filter((id) => ids.has(id)).length;
    out.push({ day: dayOf(ms), ms, taken, total });
  }
  return out;
}

export function heartSummary(readings) {
  const v = (readings || []).map((r) => r.bpm).filter(Number.isFinite);
  if (!v.length) return { n: 0, avg: null, min: null, max: null };
  return {
    n: v.length,
    avg: Math.round(v.reduce((a, b) => a + b, 0) / v.length),
    min: Math.min(...v),
    max: Math.max(...v),
  };
}

// Short weekday letters for a chart axis, in English or Hindi.
export function weekdayLabel(ms, lang) {
  return new Date(ms).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'narrow' });
}
