import { WHEN, dueMedicines, overdueMedicines, takenToday, dayOf } from '../src/medicines';
import { allSlips } from '../src/suggestions';
import { reducer, initialState } from '../src/state/reducer';
import { strings } from '../src/i18n/strings';

const at = (h, m = 0, d = 10) => new Date(2026, 10, d, h, m).getTime();
const meds = [
  { id: 'a', name: 'Metformin', dose: '500 mg after food', when: 'afterBreakfast' },
  { id: 'b', name: 'Atorvastatin', dose: '', when: 'bedtime' },
];

describe('medicines', () => {
  test('a medicine is due from its hour and overdue an hour later, until it is marked taken', () => {
    expect(dueMedicines(meds, null, at(8)).length).toBe(0);
    expect(dueMedicines(meds, null, at(9, 30)).map((m) => m.id)).toEqual(['a']);
    expect(overdueMedicines(meds, null, at(9, 30)).length).toBe(0);
    expect(overdueMedicines(meds, null, at(10, 30)).map((m) => m.id)).toEqual(['a']);
    const marked = { day: dayOf(at(10)), ids: ['a'] };
    expect(overdueMedicines(meds, marked, at(10, 30)).length).toBe(0);
  });

  test("yesterday's marks do not count today", () => {
    const old = { day: dayOf(at(10, 0, 9)), ids: ['a'] };
    expect(takenToday(old, at(10))).toEqual([]);
  });

  test('the reducer adds, marks (and unmarks) and removes a medicine', () => {
    let s = reducer(initialState, { type: 'MED_ADD', id: 'x', name: 'Metformin', dose: '500 mg', when: 'afterBreakfast' });
    expect(s.medicines).toEqual([{ id: 'x', name: 'Metformin', dose: '500 mg', when: 'afterBreakfast' }]);
    s = reducer(s, { type: 'MED_TAKEN', id: 'x', now: at(10) });
    expect(s.medTaken.ids).toEqual(['x']);
    s = reducer(s, { type: 'MED_TAKEN', id: 'x', now: at(10, 5) });
    expect(s.medTaken.ids).toEqual([]);
    s = reducer(s, { type: 'MED_REMOVE', id: 'x' });
    expect(s.medicines).toEqual([]);
  });

  test('every time of day has an English and a Hindi label', () => {
    for (const [id] of WHEN) {
      expect(strings.en[`when.${id}`]).toBeTruthy();
      expect(strings.hi[`when.${id}`]).toBeTruthy();
    }
  });

  test('the slip names the medicine but never repeats the dose, and it is a care reminder', () => {
    const ctx = {
      nowMs: at(10, 30),
      mode: 'adult',
      phase: 'stable',
      meds: { name: '', pillsLeft: 0, perDay: 0 },
      testPlan: { perDay: 0, strips: 0 },
      careEvents: {},
      meals: [],
      footChecks: [],
      checkins: [],
      readings: [],
      visitQuestions: [],
      ladder: [],
      medicines: meds,
      medTaken: null,
    };
    const slip = allSlips(ctx).find((s) => s.id === 'med');
    expect(slip.kind).toBe('care');
    expect(slip.params.names).toBe('Metformin');
    expect(JSON.stringify(slip)).not.toMatch(/500|mg/);
    // care reminders come before any habit
    expect(allSlips(ctx)[0].id).toBe('med');
    expect(strings.en['sg.med.b']).not.toMatch(/\b(dose|take your|\d+\s?(mg|ml))\b/i);
  });
});
