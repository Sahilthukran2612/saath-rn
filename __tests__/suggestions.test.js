import { allSlips, buildPad, markSlip, dayKey, PAD_SIZE } from '../src/suggestions';
import { strings } from '../src/i18n/strings';
import { reducer, initialState } from '../src/state/reducer';

const at = (h, m = 0, d = 10) => new Date(2026, 10, d, h, m).getTime();
const base = (over = {}) => ({
  nowMs: at(10),
  mode: 'adult',
  phase: 'stable',
  meds: { name: 'Metformin', pillsLeft: 40, perDay: 2 },
  testPlan: { perDay: 2, strips: 60 },
  careEvents: { lastInsulinAt: null, lastMealAt: null },
  meals: [],
  footChecks: [{ at: at(9, 0, 8) }],
  checkins: [],
  readings: [],
  visitQuestions: [],
  ladder: [],
  ...over,
});
const ids = (ctx) => allSlips(ctx).map((s) => s.id);

describe('suggestion rules', () => {
  test('refill and strips appear only when stock is low, and are ranked first', () => {
    const calm = ids(base());
    expect(calm).not.toContain('refill');
    expect(calm).not.toContain('strips');
    const low = allSlips(base({ meds: { name: 'M', pillsLeft: 4, perDay: 2 }, testPlan: { perDay: 2, strips: 30 } }));
    expect(low[0].id).toBe('refill');
    expect(low[0].params.days).toBe(2);
  });

  test('no medicine on file means no refill slip', () => {
    expect(ids(base({ meds: { name: '', pillsLeft: 0, perDay: 0 } }))).not.toContain('refill');
  });

  test('a walk is offered only after a logged meal, not before', () => {
    expect(ids(base())).not.toContain('walk');
    const meal = at(9, 30);
    expect(ids(base({ nowMs: at(10, 10), meals: [{ id: 'm', at: meal }] }))).toContain('walk');
    expect(ids(base({ nowMs: at(9, 40), meals: [{ id: 'm', at: meal }] }))).not.toContain('walk');
    expect(ids(base({ nowMs: at(14), meals: [{ id: 'm', at: meal }] }))).not.toContain('walk');
  });

  test('habits follow the clock', () => {
    expect(ids(base({ nowMs: at(8) }))).toEqual(expect.arrayContaining(['stretch', 'shoes']));
    expect(ids(base({ nowMs: at(22) }))).toContain('sleep');
    expect(ids(base({ nowMs: at(22) }))).not.toContain('water');
    expect(ids(base({ nowMs: at(12, 30) }))).toContain('plate');
  });

  test('the foot slip returns after a week and the weekly check-in once a week', () => {
    expect(ids(base())).not.toContain('foot');
    expect(ids(base({ footChecks: [{ at: at(9, 0, 1) }] }))).toContain('foot');
    expect(ids(base({ mode: 'teen', footChecks: [] }))).not.toContain('foot');
    expect(ids(base())).toContain('checkin');
  });

  test('visit questions and teen ladder', () => {
    expect(allSlips(base({ visitQuestions: ['a', 'b'] })).find((s) => s.id === 'visit').params.n).toBe(2);
    expect(ids(base({ mode: 'teen', ladder: [{ id: 'refills', stage: 1 }] }))).toContain('ladder');
    expect(ids(base({ mode: 'teen', ladder: [{ id: 'refills', stage: 3 }] }))).not.toContain('ladder');
  });
});

describe('a hard week or a crisis never adds things to do', () => {
  const hard = { checkins: [{ week: '2026-W44', mood: 3, at: at(9, 0, 3) }, { week: '2026-W45', mood: 1, at: at(9) }] };
  test('after a hard week only company, rest and care reminders remain', () => {
    const list = allSlips(base({ ...hard, nowMs: at(11, 0), meals: [{ id: 'm', at: at(10, 30) }] }));
    const got = list.map((s) => s.id);
    expect(got).toContain('company');
    expect(got).toContain('rest');
    for (const banned of ['walk', 'stretch', 'meal', 'plate', 'shoes', 'ladder', 'foot', 'reading']) {
      expect(got).not.toContain(banned);
    }
    expect(list[0].id).toBe('company');
  });
  test('the crisis phase is treated the same way', () => {
    const got = ids(base({ phase: 'crisis', nowMs: at(8) }));
    expect(got).toContain('rest');
    expect(got).not.toContain('stretch');
  });
});

describe('the pad', () => {
  test('is at most PAD_SIZE slips', () => {
    expect(buildPad(base({ nowMs: at(8) })).length).toBeLessThanOrEqual(PAD_SIZE);
  });
  test('done and skipped slips drop out for the day and return the next day', () => {
    const ctx = base({ nowMs: at(8) });
    const first = buildPad(ctx)[0].id;
    let slips = markSlip({ day: null, done: [], skipped: [] }, first, 'done', ctx.nowMs);
    expect(buildPad(ctx, slips).map((s) => s.id)).not.toContain(first);
    const tomorrow = base({ nowMs: at(8, 0, 11) });
    expect(buildPad(tomorrow, slips).map((s) => s.id)).toContain(first);
    slips = markSlip(slips, 'water', 'skip', ctx.nowMs);
    expect(slips.skipped).toEqual(['water']);
    expect(markSlip(slips, 'water', 'skip', ctx.nowMs)).toBe(slips); // idempotent
  });
  test('the reducer keeps the pad state and resets it at midnight', () => {
    let s = reducer(initialState, { type: 'SLIP', id: 'water', how: 'done', now: at(10) });
    expect(s.slips).toEqual({ day: dayKey(at(10)), done: ['water'], skipped: [] });
    s = reducer(s, { type: 'SLIP', id: 'walk', how: 'skip', now: at(10, 5, 11) });
    expect(s.slips.day).toBe(dayKey(at(10, 5, 11)));
    expect(s.slips.done).toEqual([]);
  });
});

describe('slip wording', () => {
  const ALL = allSlips; // every rule id, found by walking the clock and the stock
  const seen = new Set();
  for (const m of ['teen', 'adult']) for (let h = 0; h < 24; h++) {
    ALL(
      base({
        nowMs: at(h),
        mode: m,
        meds: { name: 'M', pillsLeft: 2, perDay: 2 },
        testPlan: { perDay: 2, strips: 4 },
        visitQuestions: ['q'],
        footChecks: [],
        ladder: [{ id: 'a', stage: 0 }],
        meals: [{ id: 'm', at: at(h) - 40 * 60000 }],
        readings: [{ id: 'r', mgdl: 100, at: at(h) - 30 * 3600000 }],
      }),
    ).forEach((s) => seen.add(s.id));
  }
  ALL(base()).forEach((s) => seen.add(s.id));
  ALL(base({ checkins: [{ week: 'a', mood: 3, at: 1 }, { week: 'b', mood: 1, at: 2 }] })).forEach((s) => seen.add(s.id));
  const forbidden = /\b(dose|doses|dosage|units?|insulin|mg|ml|tablet|take your|diagnos|you have diabetes|low sugar|high sugar)\b/i;

  test('every rule has an English and a Hindi title and body', () => {
    expect(seen.size).toBeGreaterThanOrEqual(16);
    for (const id of seen) {
      for (const lang of ['en', 'hi']) {
        expect(strings[lang][`sg.${id}.t`]).toBeTruthy();
        expect(strings[lang][`sg.${id}.b`]).toBeTruthy();
      }
    }
  });
  test('no slip talks about a dose, a medicine instruction, a diagnosis or a sugar level', () => {
    for (const id of seen) {
      for (const lang of ['en', 'hi']) {
        expect(`${strings[lang][`sg.${id}.t`]} ${strings[lang][`sg.${id}.b`]}`).not.toMatch(forbidden);
      }
    }
  });
  test('placeholders match between languages', () => {
    for (const id of seen) {
      const ph = (s) => (s.match(/\{\w+\}/g) || []).sort().join();
      expect(ph(strings.hi[`sg.${id}.b`])).toBe(ph(strings.en[`sg.${id}.b`]));
    }
  });
});
