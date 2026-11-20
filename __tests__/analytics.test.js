import { dailyReadings, sugarSummary, adherence, heartSummary } from '../src/analytics';
import { dayOf } from '../src/medicines';

const at = (d, h = 9) => new Date(2026, 10, d, h).getTime();
const NOW = at(20, 12);

describe('sugar analytics', () => {
  const readings = [
    { id: 'a', mgdl: 100, at: at(20, 8) },
    { id: 'b', mgdl: 140, at: at(20, 18) },
    { id: 'c', mgdl: 90, at: at(18) },
    { id: 'old', mgdl: 300, at: at(1) },
    { id: 'junk', mgdl: NaN, at: at(19) },
  ];

  test('days run oldest to newest, today last, with each day average, lowest and highest', () => {
    const d = dailyReadings(readings, 7, NOW);
    expect(d).toHaveLength(7);
    expect(d[6].day).toBe(dayOf(NOW));
    expect(d[6]).toMatchObject({ n: 2, avg: 120, min: 100, max: 140 });
    expect(d[4]).toMatchObject({ n: 1, avg: 90 });
    expect(d[5].n).toBe(0);
    expect(d[5].avg).toBeNull();
  });

  test('the summary covers only the window and ignores bad data', () => {
    expect(sugarSummary(readings, 7, NOW)).toEqual({ n: 3, avg: 110, min: 90, max: 140, daysLogged: 2 });
    expect(sugarSummary(readings, 30, NOW).max).toBe(300); // the old one is inside 30 days
    expect(sugarSummary([], 7, NOW)).toEqual({ n: 0, avg: null, min: null, max: null, daysLogged: 0 });
  });

  test('the summary never labels a number as good or bad', () => {
    const keys = Object.keys(sugarSummary(readings, 7, NOW));
    expect(keys.sort()).toEqual(['avg', 'daysLogged', 'max', 'min', 'n']);
  });
});

describe('medicine adherence', () => {
  const meds = [{ id: 'm1' }, { id: 'm2' }];
  const log = { [dayOf(NOW)]: ['m1', 'm2'], [dayOf(at(19))]: ['m1', 'removed'] };

  test('counts what was marked against the medicines that exist, ignoring removed ones', () => {
    const a = adherence(log, meds, 3, NOW);
    expect(a.map((x) => [x.taken, x.total])).toEqual([[0, 2], [1, 2], [2, 2]]);
  });
  test('no medicines gives zero totals, not a divide by zero', () => {
    expect(adherence({}, [], 2, NOW).every((x) => x.total === 0 && x.taken === 0)).toBe(true);
  });
});

describe('heart summary', () => {
  test('average, lowest and highest from the session readings', () => {
    expect(heartSummary([{ bpm: 70 }, { bpm: 90 }, { bpm: 80 }])).toEqual({ n: 3, avg: 80, min: 70, max: 90 });
    expect(heartSummary([])).toEqual({ n: 0, avg: null, min: null, max: null });
  });
});
