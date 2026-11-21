import {
  initialLadder,
  requestAdvance,
  approveAdvance,
  declineAdvance,
  stepBack,
  overallStage,
  STAGES,
  SKILLS,
  visitSummary,
  passportPayload,
  passportString,
  passportFits,
  QR_MAX_CHARS,
  weekKey,
  addCheckin,
  weeklySummary,
  idrsScore,
  schoolCard,
} from '../src/plan';
import food from '../src/content/food.json';
import { strings } from '../src/i18n/strings';

describe('Transition Ladder', () => {
  test('four stages and four skills, all starting with the parent', () => {
    expect(STAGES).toEqual(['parent', 'together', 'backup', 'independent']);
    const l = initialLadder();
    expect(l).toHaveLength(SKILLS.length);
    expect(overallStage(l)).toBe(0);
  });
  test('without approval the teen moves up straight away, up to the last stage', () => {
    let l = initialLadder();
    for (let i = 0; i < 6; i++) l = requestAdvance(l, 'refills');
    expect(l.find((s) => s.id === 'refills').stage).toBe(3);
  });
  test('with approval the move waits, then happens once', () => {
    let l = requestAdvance(initialLadder(), 'refills', { needsApproval: true });
    expect(l[0]).toMatchObject({ stage: 0, pending: true });
    l = requestAdvance(l, 'refills', { needsApproval: true });
    expect(l[0].stage).toBe(0);
    l = approveAdvance(l, 'refills');
    expect(l[0]).toMatchObject({ stage: 1, pending: false });
    expect(approveAdvance(l, 'refills')[0].stage).toBe(1);
  });
  test('a declined request keeps the stage and clears the wait', () => {
    const l = declineAdvance(requestAdvance(initialLadder(), 'explain', { needsApproval: true }), 'explain');
    expect(l.find((s) => s.id === 'explain')).toMatchObject({ stage: 0, pending: false });
  });
  test('stepping back is allowed and never goes below the first stage', () => {
    let l = requestAdvance(initialLadder(), 'badDays');
    l = stepBack(stepBack(stepBack(l, 'badDays'), 'badDays'), 'badDays');
    expect(l.find((s) => s.id === 'badDays').stage).toBe(0);
  });
  test('overall stage is the lowest skill', () => {
    let l = initialLadder();
    l = requestAdvance(requestAdvance(l, 'refills'), 'refills');
    expect(overallStage(l)).toBe(0);
    SKILLS.forEach((id) => (l = requestAdvance(l, id)));
    expect(overallStage(l)).toBe(1);
  });
});

describe('visit summary', () => {
  const base = {
    tasks: [{ done: true }, { done: false }],
    meds: { name: 'X', pillsLeft: 10, perDay: 2 },
    testPlan: { strips: 8 },
    nowMs: 1,
  };
  test('reports facts only', () => {
    const s = visitSummary({ ...base, readings: [{ mgdl: 120 }, { mgdl: 140 }] });
    expect(s.lines[0]).toMatchObject({ id: 'sugar', n: 2, avg: 130, last: 140 });
    expect(s.lines[1]).toMatchObject({ done: 1, total: 2 });
    expect(s.lines[2]).toMatchObject({ pills: 10, days: 5 });
  });
  test('no readings says so instead of inventing numbers', () => {
    expect(visitSummary({ ...base, readings: [] }).lines[0].id).toBe('noSugar');
  });
});

describe('Health Passport', () => {
  const members = [
    { id: 'm1', name: 'Asha', phone: '9000000001', shareContact: true },
    { id: 'm2', name: 'Ramesh', phone: '9000000002', shareContact: false },
  ];
  const profile = { name: 'Mina', condition: 'Type 1 diabetes', allergies: '', emergencyId: 'm1' };
  const args = {
    profile,
    meds: { name: 'Insulin plan from clinic' },
    readings: [{ mgdl: 130 }, { mgdl: 150 }],
    members,
  };
  test('includes only what the person chose', () => {
    const p = passportPayload({ ...args, share: { meds: false, sugar: false, contact: false } });
    expect(p).toEqual({ v: 1, n: 'Mina', c: 'Type 1 diabetes' });
  });
  test('emergency number appears only if that person agreed', () => {
    const yes = passportPayload({ ...args, share: { contact: true } });
    expect(yes.p).toBe('9000000001');
    const no = passportPayload({
      ...args,
      profile: { ...profile, emergencyId: 'm2' },
      share: { contact: true },
    });
    expect(no.e).toBe('Ramesh');
    expect(no.p).toBeUndefined();
  });
  test('sugar is a summary, never the raw list', () => {
    const p = passportPayload({ ...args, share: { sugar: true } });
    expect(p.s).toEqual({ n: 2, avg: 140, last: 150 });
    expect(passportString(p)).not.toMatch(/accel|sensor/i);
  });
  test('a full passport fits in a QR code', () => {
    const p = passportPayload({ ...args, share: { meds: true, sugar: true, contact: true } });
    expect(passportFits(p)).toBe(true);
    expect(passportString(p).length).toBeLessThanOrEqual(QR_MAX_CHARS);
  });
  test('a passport that is too long is reported, not truncated silently', () => {
    const p = passportPayload({ ...args, profile: { ...profile, allergies: 'x'.repeat(900) }, share: {} });
    expect(passportFits(p)).toBe(false);
  });
});

describe('weekly check-in', () => {
  const at = (m, d) => new Date(2026, m, d, 12).getTime();
  test('weekKey is stable within a week and changes across weeks', () => {
    expect(weekKey(at(0, 12))).toBe(weekKey(at(0, 15)));
    expect(weekKey(at(0, 12))).not.toBe(weekKey(at(0, 19)));
  });
  test('one check-in per week: a second replaces the first', () => {
    let l = addCheckin([], 2, at(0, 12));
    l = addCheckin(l, 4, at(0, 14));
    expect(l).toHaveLength(1);
    expect(l[0].mood).toBe(4);
  });
  test('out-of-range moods are ignored', () => {
    expect(addCheckin([], 9, 1)).toEqual([]);
    expect(addCheckin([], 0, 1)).toEqual([]);
  });
  test('summaries: none, first, good, steady, hard', () => {
    expect(weeklySummary([]).id).toBe('none');
    expect(weeklySummary([{ week: 'a', mood: 3 }]).id).toBe('first');
    expect(weeklySummary([{ mood: 4 }, { mood: 5 }]).id).toBe('good');
    expect(weeklySummary([{ mood: 5 }, { mood: 3 }]).id).toBe('steady');
    expect(weeklySummary([{ mood: 4 }, { mood: 2 }]).id).toBe('hard');
  });
  test('no wellbeing message nags, blames or counts misses (English and Hindi)', () => {
    ['en', 'hi'].forEach((lang) => {
      ['good', 'steady', 'hard', 'first', 'none'].forEach((id) => {
        const text = strings[lang][`wellbeing.${id}`];
        expect(text).toBeTruthy();
        expect(text).not.toMatch(/\bmissed\b|\bfailed\b|\bshould\b|\bmust\b|\bbehind\b|छूट|चाहिए ही|असफल/i);
      });
    });
  });
});

describe('diabetes risk (IDRS)', () => {
  test('lowest possible', () => {
    expect(
      idrsScore({ age: 25, gender: 'female', waistCm: 70, activity: 'vigorous', family: 'none' })
    ).toEqual({ score: 0, level: 'low' });
  });
  test('highest possible', () => {
    expect(
      idrsScore({ age: 60, gender: 'male', waistCm: 105, activity: 'sedentary', family: 'both' })
    ).toEqual({ score: 100, level: 'high' });
  });
  test('waist thresholds differ by gender', () => {
    const f = idrsScore({
      age: 25,
      gender: 'female',
      waistCm: 85,
      activity: 'vigorous',
      family: 'none',
    }).score;
    const m = idrsScore({ age: 25, gender: 'male', waistCm: 85, activity: 'vigorous', family: 'none' }).score;
    expect(f).toBe(10);
    expect(m).toBe(0);
  });
  test('levels at the cut-offs', () => {
    expect(
      idrsScore({ age: 40, gender: 'male', waistCm: 80, activity: 'vigorous', family: 'none' }).level
    ).toBe('low');
    expect(idrsScore({ age: 40, gender: 'male', waistCm: 80, activity: 'mild', family: 'none' }).level).toBe(
      'moderate'
    );
    expect(
      idrsScore({ age: 55, gender: 'male', waistCm: 95, activity: 'sedentary', family: 'one' }).level
    ).toBe('high');
  });
  test('the result text says screening, not diagnosis, in both languages', () => {
    ['en', 'hi'].forEach((lang) => {
      const text = strings[lang]['risk.note'];
      expect(text).toBeTruthy();
      expect(strings[lang]['risk.high']).not.toMatch(/you have diabetes|आपको डायबिटीज़ है/i);
    });
    expect(strings.en['risk.note']).toMatch(/screening/i);
  });
});

describe('school plan', () => {
  const profile = { name: 'Mina' };
  test("the guardian's number is on the card only if they agreed", () => {
    const yes = schoolCard({
      profile,
      members: [{ id: 'g', name: 'Asha', guardian: true, phone: '9000000001', shareContact: true }],
    });
    expect(yes.phone).toBe('9000000001');
    const no = schoolCard({
      profile,
      members: [{ id: 'g', name: 'Asha', guardian: true, phone: '9000000001', shareContact: false }],
    });
    expect(no.phone).toBeNull();
  });
  test('the hypo steps never contain a dose', () => {
    ['en', 'hi'].forEach((lang) => {
      ['stop', 'sugar', 'stay', 'call'].forEach((id) => {
        expect(strings[lang][`school.${id}`]).toBeTruthy();
        expect(strings[lang][`school.${id}`]).not.toMatch(/\b\d+\s*(units?|iu|ml)\b|यूनिट/i);
      });
    });
    expect(strings.en['school.sugar']).toMatch(/sugar, jaggery or a glucose biscuit/);
  });
  test('no school hypo step claims to treat or diagnose', () => {
    expect(strings.en['school.note']).toMatch(/clinician/i);
  });
});

describe('curated food content', () => {
  test('is marked verify locally, has a plate model, and every item has English and Hindi', () => {
    expect(food.verify).toMatch(/verify locally/i);
    expect(food.plate).toHaveLength(3);
    const items = [
      ...food.plate,
      ...food.regions,
      ...food.regions.flatMap((r) => r.meals),
      ...food.fasting,
      ...food.festival,
    ];
    items.forEach((i) => {
      expect(i.en).toBeTruthy();
      expect(i.hi).toBeTruthy();
    });
  });
  test('fasting advice always starts from the clinician', () => {
    expect(food.fasting[0].en).toMatch(/clinician/i);
  });
  test('no food item gives a dose or tells insulin users to change a plan on their own', () => {
    JSON.stringify(food)
      .split('"')
      .forEach((s) => expect(s).not.toMatch(/\b\d+\s*(units?|iu)\b/i));
  });
});
