import { reducer } from '../src/state/reducer';
import { seededState as initialState } from '../testSupport/fixtures';
import { CFG } from '../src/logic';
import { tallyToCsv } from '../src/services/export';

const run = (s, ...actions) => actions.reduce(reducer, s);
const fall = { type: 'TRIGGER_ALERT', kind: 'fall', confidence: 0.8, reason: 'x', id: 'a1' };
const ticks = (n) => Array.from({ length: n }, () => ({ type: 'TICK' }));

describe('alert flow and tally', () => {
  test('a second trigger while one is open is ignored (no double count)', () => {
    const s = run(initialState, fall, { ...fall, id: 'a2' });
    expect(s.tally.alerts).toBe(1);
    expect(s.alert.id).toBe('a1');
  });
  test("I'm OK before the countdown ends counts once and never escalates", () => {
    const s = run(initialState, fall, ...ticks(5), { type: 'IM_OK', at: 1 });
    expect(s.alert).toBeNull();
    expect(s.tally).toMatchObject({ alerts: 1, imOk: 1, escalated: 0 });
  });
  test('countdown expiry escalates exactly once and walks the chain in order', () => {
    let s = run(initialState, fall, ...ticks(CFG.countdownSec));
    expect(s.alert.phase).toBe('escalating');
    expect(s.tally.escalated).toBe(1);
    expect(s.alert.chain.map((m) => m.role)).toEqual(['family', 'neighbour', 'asha', 'clinician']);
    s = run(s, ...ticks(CFG.stepSec));
    expect(s.alert.stepIndex).toBe(1);
    s = run(s, ...ticks(CFG.stepSec * 3));
    expect(s.alert.phase).toBe('done');
    expect(s.tally.escalated).toBe(1);
  });
  test('false alarm and missed are counted separately', () => {
    const s = run(initialState, fall, { type: 'FALSE_ALARM' }, { type: 'MISSED' });
    expect(s.tally).toMatchObject({ alerts: 1, falseAlarm: 1, missed: 1 });
  });
});

describe('simulate long quiet uses isInactive', () => {
  const at = (h) => new Date(2026, 0, 10, h).getTime();
  test('seven quiet hours in daytime opens a quiet alert', () => {
    const s = run(initialState, {
      type: 'QUIET_CHECK',
      lastActiveMs: at(7),
      nowMs: at(14),
      simulated: true,
      id: 'q',
    });
    expect(s.alert.kind).toBe('quiet');
  });
  test('the same gap inside the sleep window does not', () => {
    const s = run(initialState, {
      type: 'QUIET_CHECK',
      lastActiveMs: at(18),
      nowMs: at(23),
      simulated: true,
      id: 'q',
    });
    expect(s.alert).toBeNull();
  });
});

describe('audit log', () => {
  test('Person views are never logged', () => {
    expect(
      run(initialState, { type: 'VIEW', viewer: 'person', item: 'Care summary', at: 1 }).audit
    ).toHaveLength(0);
  });
  test('repeat view by the same viewer is one entry', () => {
    const v = { type: 'VIEW', viewer: 'family', item: 'Care summary' };
    const s = run(initialState, { ...v, at: 1 }, { ...v, at: 2 }, { ...v, at: 3 });
    expect(s.audit).toHaveLength(1);
  });
  test('a different viewer is a new entry', () => {
    const s = run(
      initialState,
      { type: 'VIEW', viewer: 'family', item: 'c', at: 1 },
      { type: 'VIEW', viewer: 'asha', item: 'c', at: 2 }
    );
    expect(s.audit).toHaveLength(2);
  });
});

test('Time Off member is still in the safety chain', () => {
  const s = run(initialState, { type: 'SET_TIME_OFF', id: 'm1', on: true }, fall);
  expect(s.alert.chain.some((m) => m.id === 'm1')).toBe(true);
});

test('tally exports as CSV', () => {
  expect(tallyToCsv({ alerts: 2, imOk: 1, escalated: 1, falseAlarm: 0, missed: 0 }, new Date(0))).toBe(
    'exported_at,alerts,im_ok,escalated,false_alarm,missed\n1970-01-01T00:00:00.000Z,2,1,1,0,0\n'
  );
});
