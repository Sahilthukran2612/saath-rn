import { sanitizePlan, planPatch, planFromDraft, draftFromPlan } from '../src/carePlan';
import { reducer } from '../src/state/reducer';
import { seededState as initialState } from '../testSupport/fixtures';
import { strings } from '../src/i18n/strings';

const plan = sanitizePlan({
  meds: [
    { name: 'Metformin', dose: '500 mg after food', when: 'afterBreakfast' },
    { name: 'Atorvastatin', dose: '', when: 'bedtime' },
  ],
  tasks: [{ title: 'Walk', hour: 18 }],
  testPerDay: 2,
  notes: 'Review in two weeks',
});

describe('care plan data', () => {
  test('keeps what the clinician typed and cleans what it cannot trust', () => {
    expect(plan.meds[0]).toEqual({ name: 'Metformin', dose: '500 mg after food', when: 'afterBreakfast' });
    const messy = sanitizePlan({
      meds: [{ name: ' x ', dose: 'a' }, { name: 'Good\u0007name', dose: 'd'.repeat(200), when: 'nonsense' }],
      tasks: [{ title: 'Walk', hour: 99 }],
      testPerDay: 40,
      notes: 'n'.repeat(900),
    });
    expect(messy.meds.length).toBe(1); // a one-letter name is dropped
    expect(messy.meds[0].name).toBe('Good name');
    expect(messy.meds[0].dose.length).toBe(60);
    expect(messy.meds[0].when).toBe('afterBreakfast');
    expect(messy.tasks[0].hour).toBeNull();
    expect(messy.testPerDay).toBeNull();
    expect(messy.notes.length).toBe(400);
  });

  test('nothing usable gives no plan, and caps are enforced', () => {
    expect(sanitizePlan(null)).toBeNull();
    expect(sanitizePlan({ meds: [], tasks: [] })).toBeNull();
    const many = sanitizePlan({ meds: Array.from({ length: 30 }, (_, i) => ({ name: `Med ${i}` })) });
    expect(many.meds.length).toBe(12);
  });

  test('the form and the plan round-trip', () => {
    expect(planFromDraft(draftFromPlan(plan))).toEqual(plan);
    expect(planFromDraft({ meds: [], tasks: [], testPerDay: '', notes: '' })).toBeNull();
  });
});

describe('applying a plan', () => {
  const mine = { id: 'own', name: 'Vitamin D', dose: 'as advised', when: 'afterLunch' };
  const start = { ...initialState, medicines: [mine], testPlan: { perDay: 1, strips: 30 } };

  test("replaces only the plan's own medicines and tasks, never what the person added", () => {
    const s1 = reducer(start, { type: 'PLAN_APPLY', plan, version: '2026-11-20T10:00:00Z', author: 'Dr Rao', at: 1 });
    expect(s1.medicines.map((m) => m.name)).toEqual(['Vitamin D', 'Metformin', 'Atorvastatin']);
    expect(s1.medicines.filter((m) => m.plan).length).toBe(2);
    expect(s1.testPlan).toEqual({ perDay: 2, strips: 30 }); // only the daily count changes: strips on hand are the person's
    expect(s1.carePlan).toMatchObject({ author: 'Dr Rao', meds: 2, tasks: 1, seen: false });
    const next = sanitizePlan({ meds: [{ name: 'Metformin', dose: '850 mg', when: 'afterDinner' }] });
    const s2 = reducer(s1, { type: 'PLAN_APPLY', plan: next, version: '2026-11-21T10:00:00Z', author: 'Dr Rao', at: 2 });
    expect(s2.medicines.map((m) => m.name)).toEqual(['Vitamin D', 'Metformin']);
    expect(s2.medicines[1].dose).toBe('850 mg');
    expect(s2.tasks.some((x) => x.plan)).toBe(false); // the new plan has no tasks, so the old plan's task goes
  });

  test('an older or repeated plan changes nothing, and the same plan never duplicates', () => {
    const s1 = reducer(start, { type: 'PLAN_APPLY', plan, version: '2026-11-20T10:00:00Z', author: 'Dr Rao', at: 1 });
    expect(reducer(s1, { type: 'PLAN_APPLY', plan, version: '2026-11-20T10:00:00Z', author: 'Dr Rao', at: 9 })).toBe(s1);
    expect(reducer(s1, { type: 'PLAN_APPLY', plan, version: '2026-11-19T10:00:00Z', author: 'Dr X', at: 9 })).toBe(s1);
  });

  test('a plan with tasks replaces the starter tasks nobody renamed; renamed and added tasks stay', () => {
    const own = { id: 'mine', title: 'Pray', done: false, hour: 6 };
    const renamed = { id: 't2', title: 'Lunch with dal', done: false, hour: 13 };
    const tasks = [...initialState.tasks.filter((x) => x.id !== 't2'), renamed, own];
    const s = reducer({ ...start, tasks }, { type: 'PLAN_APPLY', plan, version: 'a', author: 'Dr', at: 1 });
    expect(s.tasks.map((x) => x.id).filter((id) => /^t\d$/.test(id))).toEqual(['t2']);
    expect(s.tasks.some((x) => x.id === 'mine')).toBe(true);
    expect(s.tasks.filter((x) => x.plan)).toHaveLength(plan.tasks.length);
  });

  test('a task the person already ticked stays ticked when the plan is updated', () => {
    const s1 = reducer(start, { type: 'PLAN_APPLY', plan, version: 'a', author: 'Dr', at: 1 });
    const id = s1.tasks.find((x) => x.plan).id;
    const ticked = reducer(s1, { type: 'TOGGLE_TASK', id });
    const s2 = reducer(ticked, { type: 'PLAN_APPLY', plan, version: 'b', author: 'Dr', at: 2 });
    expect(s2.tasks.find((x) => x.id === id).done).toBe(true);
  });

  test('"seen" is remembered and the planPatch does not mutate the state', () => {
    const s1 = reducer(start, { type: 'PLAN_APPLY', plan, version: 'a', author: 'Dr', at: 1 });
    expect(reducer(s1, { type: 'PLAN_SEEN' }).carePlan.seen).toBe(true);
    const copy = JSON.stringify(start);
    planPatch(start, plan, { version: 'a', author: 'Dr', at: 1 });
    expect(JSON.stringify(start)).toBe(copy);
  });

  test('every plan string exists in English and Hindi', () => {
    const keys = Object.keys(strings.en).filter((k) => k.startsWith('plan.'));
    expect(keys.length).toBeGreaterThan(15);
    for (const k of keys) expect(strings.hi[k]).toBeTruthy();
  });
});
