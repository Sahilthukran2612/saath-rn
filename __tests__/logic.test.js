import {
  canReceive,
  escalationChain,
  detectFall,
  isInactive,
  glucoseAdvice,
  can,
  EVENT_TYPE,
  DIAL,
  CFG,
} from '../src/logic';

const trace = (fn, n, start = 0, dt = 100) =>
  Array.from({ length: n }, (_, i) => ({ t: start + i * dt, ...fn(i) }));
const still = () => ({ x: 0, y: 0, z: 1 });
const walking = (i) => ({ x: 0, y: 0, z: 1 + (i % 2 ? 0.6 : -0.5) });

describe('canReceive (Privacy Dial)', () => {
  test.each([DIAL.safetyOnly, DIAL.routine, DIAL.full])('safety always reaches dial %i', (d) => {
    expect(canReceive(d, EVENT_TYPE.safety)).toBe(true);
  });
  test('routine hidden from safety-only, shown at routine and full', () => {
    expect(canReceive(DIAL.safetyOnly, EVENT_TYPE.routine)).toBe(false);
    expect(canReceive(DIAL.routine, EVENT_TYPE.routine)).toBe(true);
    expect(canReceive(DIAL.full, EVENT_TYPE.routine)).toBe(true);
  });
  test('summary only at full', () => {
    expect(canReceive(DIAL.routine, EVENT_TYPE.summary)).toBe(false);
    expect(canReceive(DIAL.full, EVENT_TYPE.summary)).toBe(true);
  });
});

describe('escalationChain', () => {
  const members = [
    { id: 1, role: 'clinician', dial: 0 },
    { id: 2, role: 'family', dial: 2 },
    { id: 3, role: 'neighbour', dial: 0, timeOff: true },
  ];
  test('orders family, neighbour, clinician', () => {
    expect(escalationChain(members).map((m) => m.id)).toEqual([2, 3, 1]);
  });
  test('Time Off never skips a safety escalation', () => {
    expect(escalationChain(members, { isSafety: true })).toHaveLength(3);
  });
  test('Time Off skips non-safety escalation', () => {
    expect(escalationChain(members, { isSafety: false }).map((m) => m.id)).toEqual([2, 1]);
  });
});

describe('detectFall (synthetic traces)', () => {
  const spike = { t: 1000, x: 0, y: 0, z: 3.5 };
  test('spike then still is a fall', () => {
    const s = [spike, ...trace(still, 30, 1100)];
    expect(detectFall(s).state).toBe('fall');
  });
  test('spike then walking is not a fall', () => {
    const s = [spike, ...trace(walking, 30, 1100)];
    expect(detectFall(s).state).toBe('none');
  });
  test('a long impact (several high samples) then still is still a fall', () => {
    const impact = trace(() => ({ x: 0, y: 0, z: 3.4 }), 5, 1000);
    expect(detectFall([...impact, ...trace(still, 30, 1500)]).state).toBe('fall');
  });
  test('a long impact then walking is not a fall', () => {
    const impact = trace(() => ({ x: 0, y: 0, z: 3.4 }), 5, 1000);
    expect(detectFall([...impact, ...trace(walking, 30, 1500)]).state).toBe('none');
  });
  test('impact still in progress (no samples after yet) is unsure, not a fall', () => {
    expect(detectFall(trace(() => ({ x: 0, y: 0, z: 3.4 }), 8, 1000)).state).toBe('unsure');
  });
  test('no spike is none', () => {
    expect(detectFall(trace(still, 50)).state).toBe('none');
  });
  test('sensor gap after spike is unsure, not a fall', () => {
    const r = detectFall([spike, ...trace(still, 2, 1100)]);
    expect(r.state).toBe('unsure');
    expect(r.confidence).toBeLessThan(0.5);
  });
  test('phone on table (constant 1g) is none', () => {
    expect(detectFall(trace(still, 100)).state).toBe('none');
  });
  test('empty trace', () => {
    expect(detectFall([]).state).toBe('none');
  });
});

describe('isInactive', () => {
  const at = (h) => new Date(2026, 0, 10, h, 0, 0).getTime();
  test('quiet for 7h in the afternoon is inactive', () => {
    expect(isInactive(at(8), at(15)).inactive).toBe(true);
  });
  test('quiet during the sleep window is not flagged', () => {
    expect(isInactive(at(18), at(23)).inactive).toBe(false);
  });
  test('recent activity is not inactive', () => {
    expect(isInactive(at(13), at(15)).inactive).toBe(false);
  });
  test('no data gives zero confidence', () => {
    expect(isInactive(null, at(15))).toMatchObject({ inactive: false, confidence: 0 });
  });
  test('fast-forwarded clock triggers it', () => {
    const last = at(8);
    expect(isInactive(last, last + (CFG.inactiveHours + 1) * 3600000 - 0).inactive).toBe(true);
  });
});

describe('glucoseAdvice', () => {
  test.each([40, 69, 70, 120, 250, 251, 400, null, NaN])('never outputs a dose for %s', (v) => {
    const { text } = glucoseAdvice(v);
    expect(text).not.toMatch(/\b\d+\s*(units?|iu|mg of|ml)\b/i);
    expect(text).not.toMatch(/\binject|\btake \d/i);
    expect(text).toMatch(/clinician|Enter a reading/);
  });
  test('levels', () => {
    expect(glucoseAdvice(60).level).toBe('low');
    expect(glucoseAdvice(120).level).toBe('ok');
    expect(glucoseAdvice(300).level).toBe('high');
  });
});

describe('care rules', () => {
  test('neighbour sees no health summary', () => expect(can('neighbour', 'viewSummary')).toBe(false));
  test('clinician may edit plan but not log readings', () => {
    expect(can('clinician', 'editPlan')).toBe(true);
    expect(can('clinician', 'logReading')).toBe(false);
  });
});
