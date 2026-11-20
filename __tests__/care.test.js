import {
  adjustBaseline,
  defaultBaseline,
  cfgFrom,
  explainBaseline,
  glucoseTrend,
  lowSugarPrompt,
  stripsPlan,
  refillStatus,
  levelFor,
  budgetSummary,
  callLink,
  smsLink,
  whatsappLink,
  escalationMessage,
  BASELINE_LIMITS,
} from '../src/care';
import { detectFall, isInactive, glucoseAdvice, CFG } from '../src/logic';

const at = (h, d = 10) => new Date(2026, 0, d, h).getTime();

describe('personal baseline', () => {
  test('a false alarm makes the fall check less sensitive', () => {
    const b = adjustBaseline(defaultBaseline(), 'fall', 'false_alarm');
    expect(b.impactG).toBeGreaterThan(CFG.fallImpactG);
  });
  test('a missed fall makes it more sensitive', () => {
    expect(adjustBaseline(defaultBaseline(), 'fall', 'missed').impactG).toBeLessThan(CFG.fallImpactG);
  });
  test('quiet feedback changes only the quiet hours', () => {
    const b = adjustBaseline(defaultBaseline(), 'quiet', 'false_alarm');
    expect(b.inactiveHours).toBeGreaterThan(CFG.inactiveHours);
    expect(b.impactG).toBe(CFG.fallImpactG);
  });
  test('it never leaves its limits', () => {
    let b = defaultBaseline();
    for (let i = 0; i < 100; i++) b = adjustBaseline(b, 'fall', 'false_alarm');
    expect(b.impactG).toBe(BASELINE_LIMITS.impactG[1]);
    for (let i = 0; i < 100; i++) b = adjustBaseline(b, 'fall', 'missed');
    expect(b.impactG).toBe(BASELINE_LIMITS.impactG[0]);
  });
  test('unknown feedback changes nothing', () => {
    const b = defaultBaseline();
    expect(adjustBaseline(b, 'fall', 'whatever')).toBe(b);
  });
  test('the detector actually uses the adjusted threshold', () => {
    const impact = { t: 0, x: 0, y: 0, z: 2.7 };
    const still = Array.from({ length: 30 }, (_, i) => ({ t: 100 + i * 100, x: 0, y: 0, z: 1 }));
    expect(detectFall([impact, ...still], cfgFrom(defaultBaseline())).state).toBe('fall');
    let b = defaultBaseline();
    for (let i = 0; i < 3; i++) b = adjustBaseline(b, 'fall', 'false_alarm');
    expect(detectFall([impact, ...still], cfgFrom(b)).state).toBe('none');
  });
  test('quiet hours feed isInactive', () => {
    let b = defaultBaseline();
    for (let i = 0; i < 4; i++) b = adjustBaseline(b, 'quiet', 'false_alarm');
    const cfg = cfgFrom(b);
    expect(isInactive(at(7), at(14), cfg, cfg.inactiveHours).inactive).toBe(false);
    expect(isInactive(at(7), at(14), CFG, CFG.inactiveHours).inactive).toBe(true);
  });
  test('explanations say when feedback changed things', () => {
    expect(explainBaseline(defaultBaseline()).join(' ')).not.toMatch(/feedback/);
    expect(explainBaseline(adjustBaseline(defaultBaseline(), 'fall', 'false_alarm')).join(' ')).toMatch(
      /feedback/
    );
  });
});

describe('glucose trend', () => {
  test('empty', () => expect(glucoseTrend([]).direction).toBe('none'));
  test('rising, falling, steady', () => {
    expect(glucoseTrend([{ mgdl: 100 }, { mgdl: 140 }]).direction).toBe('up');
    expect(glucoseTrend([{ mgdl: 140 }, { mgdl: 100 }]).direction).toBe('down');
    expect(glucoseTrend([{ mgdl: 100 }, { mgdl: 110 }]).direction).toBe('steady');
  });
  test('average and last', () => {
    const t = glucoseTrend([{ mgdl: 100 }, { mgdl: 200 }]);
    expect(t).toMatchObject({ avg: 150, last: 200, count: 2 });
  });
});

describe('low-sugar prompts (rule based, never a dose)', () => {
  test('insulin logged, no meal after 2 hours prompts', () => {
    const p = lowSugarPrompt({ lastInsulinAt: at(8), lastMealAt: null, lastReadingAt: at(8), nowMs: at(11) });
    expect(p.id).toBe('insulin-no-meal');
  });
  test('a meal after the insulin silences it', () => {
    expect(
      lowSugarPrompt({ lastInsulinAt: at(8), lastMealAt: at(9), lastReadingAt: at(9), nowMs: at(11) })
    ).toBeNull();
  });
  test('a meal before the insulin does not', () => {
    expect(
      lowSugarPrompt({ lastInsulinAt: at(8), lastMealAt: at(7), lastReadingAt: at(9), nowMs: at(11) })
    ).not.toBeNull();
  });
  test('too soon after insulin does not prompt', () => {
    expect(
      lowSugarPrompt({ lastInsulinAt: at(10), lastMealAt: null, lastReadingAt: at(10), nowMs: at(11) })
    ).toBeNull();
  });
  test('night check-in when no reading for 4 hours', () => {
    expect(
      lowSugarPrompt({ lastInsulinAt: null, lastMealAt: null, lastReadingAt: at(17), nowMs: at(23) }).id
    ).toBe('night-checkin');
  });
  test('no night prompt in the daytime or after a recent reading', () => {
    expect(
      lowSugarPrompt({ lastInsulinAt: null, lastMealAt: null, lastReadingAt: null, nowMs: at(12) })
    ).toBeNull();
    expect(
      lowSugarPrompt({ lastInsulinAt: null, lastMealAt: null, lastReadingAt: at(22), nowMs: at(23) })
    ).toBeNull();
  });
  test('every prompt names sugar/jaggery/biscuit, ends with the clinician note, and has no dose', () => {
    const prompts = [
      lowSugarPrompt({ lastInsulinAt: at(8), lastMealAt: null, lastReadingAt: null, nowMs: at(11) }),
      lowSugarPrompt({ lastInsulinAt: null, lastMealAt: null, lastReadingAt: null, nowMs: at(23) }),
    ];
    prompts.forEach((p) => {
      const text = [p.title, p.reason, ...p.steps, p.note].join(' ');
      expect(text).not.toMatch(/\b\d+\s*(units?|iu|ml|mg)\b/i);
      expect(text).not.toMatch(/\binject|\btake \d|\bincrease|\bdecrease|\bdose/i);
      expect(p.note).toMatch(/clinician/);
    });
    expect(prompts[0].steps.join(' ')).toMatch(/sugar, jaggery or a glucose biscuit/);
    expect(prompts[0].steps.join(' ')).toMatch(/call family, a clinic or an ASHA/);
  });
  test('glucose advice for a low reading never contains a dose either', () => {
    expect(glucoseAdvice(55).text).not.toMatch(/\bunits?\b|\bdose\b/i);
  });
});

describe('strips, refill and levels', () => {
  test('strip days left', () => expect(stripsPlan({ perDay: 2, strips: 20 }).daysLeft).toBe(10));
  test('perDay 0 is unknown, not a crash', () =>
    expect(stripsPlan({ perDay: 0, strips: 20 }).daysLeft).toBeNull());
  test.each([
    [0, 'now'],
    [3, 'now'],
    [4, 'soon'],
    [7, 'soon'],
    [8, 'ok'],
    [null, 'unknown'],
  ])('levelFor(%s) = %s', (d, level) => expect(levelFor(d)).toBe(level));
  test('refill days', () =>
    expect(refillStatus({ pillsLeft: 9, perDay: 2 })).toEqual({ daysLeft: 4, level: 'soon' }));
});

describe('care budget', () => {
  const now = at(12, 15);
  const lastMonth = new Date(2025, 11, 20).getTime();
  test('sums this month and last month', () => {
    const s = budgetSummary(
      [
        { amount: 300, cat: 'medicine', at: at(9, 3) },
        { amount: 200, cat: 'strips', at: at(9, 5) },
        { amount: 400, cat: 'medicine', at: lastMonth },
      ],
      now
    );
    expect(s).toMatchObject({ thisMonth: 500, lastMonth: 400, trend: 'up' });
    expect(s.byCat).toEqual({ medicine: 300, strips: 200 });
  });
  test('strips-heavy spend produces a clinician-first tip', () => {
    const s = budgetSummary([{ amount: 500, cat: 'strips', at: at(9, 3) }], now);
    expect(s.tips.join(' ')).toMatch(/clinician/);
    expect(s.tips.join(' ')).not.toMatch(/stop|skip|reduce your/i);
  });
  test('spend going down has no alarming tip', () => {
    const s = budgetSummary(
      [
        { amount: 100, cat: 'medicine', at: at(9, 3) },
        { amount: 900, cat: 'medicine', at: lastMonth },
      ],
      now
    );
    expect(s.trend).toBe('down');
    expect(s.tips).toEqual([]);
  });
  test('empty is calm', () =>
    expect(budgetSummary([], now)).toMatchObject({ thisMonth: 0, trend: 'steady', tips: [] }));
});

describe('escalation links', () => {
  test('call link strips spaces', () => expect(callLink('+91 98765 43210')).toBe('tel:+919876543210'));
  test('sms link encodes the body', () => {
    const link = smsLink('9876543210', escalationMessage('Asha', 'fall'));
    expect(link.startsWith('sms:9876543210?body=')).toBe(true);
    expect(decodeURIComponent(link.split('body=')[1])).toMatch(/may have had a fall/);
  });
  test('the message helps notice, never states a diagnosis', () => {
    expect(escalationMessage('Asha', 'quiet')).not.toMatch(/is hurt|has fallen|emergency/i);
  });
});

describe('WhatsApp link (free: the phone sends it, one tap)', () => {
  const text = escalationMessage('Asha', 'fall');
  test('a 10-digit Indian number gets 91 in front, and the text is encoded', () => {
    const link = whatsappLink('98765 43210', text);
    expect(link.startsWith('https://wa.me/919876543210?text=')).toBe(true);
    expect(decodeURIComponent(link.split('?text=')[1])).toBe(text);
  });
  test('numbers with +91, 91 or a leading 0 all reach the same chat', () => {
    const want = 'https://wa.me/919876543210';
    ['+91 98765 43210', '919876543210', '09876543210', '+91-9876543210'].forEach((n) =>
      expect(whatsappLink(n, 'x').startsWith(want)).toBe(true)
    );
  });
  test('a number that cannot be a phone number gives no link, so no broken button', () => {
    ['', '123', 'abc', '98765', '1'.repeat(16)].forEach((n) => expect(whatsappLink(n, 'x')).toBeNull());
  });
  test('the message still never claims a diagnosis', () => {
    expect(text).not.toMatch(/is hurt|has fallen|emergency/i);
  });
});

describe('baseline explanation in Hindi', () => {
  const { explainBaseline: explain, adjustBaseline: adjust, defaultBaseline: base } = require('../src/care');
  test('normal and adjusted lines are in Hindi with the same numbers', () => {
    const normal = explain(base(), 'hi');
    expect(normal[0]).toMatch(/गिरने की जाँच: सामान्य/);
    expect(normal[0]).toContain(String(base().impactG));
    expect(normal[1]).toContain(String(base().inactiveHours));
    expect(/[A-Za-z]{4,}/.test(normal.join(' '))).toBe(false);
    const moved = explain(adjust(base(), 'fall', 'false_alarm'), 'hi').join(' ');
    expect(moved).toMatch(/प्रतिक्रिया/);
    expect(explain(base()).join(' ')).toMatch(/Fall check: normal/); // English is still the default
  });
});
