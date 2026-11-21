import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { violates, isEmergency, sanitizeReply, sanitizeCard, SAFE_LINE } from '../src/ai/guard';
import { buildAiContext } from '../src/ai/context';
import { fetchAiCards, fetchAiReply } from '../src/ai/client';
import * as client from '../src/ai/client';
import { buildPad } from '../src/suggestions';
import { productionState } from '../src/state/reducer';
import { seededState } from '../testSupport/fixtures';

const cfg = { url: 'https://api.example.test', key: 'anon' };
const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

describe('the safety guard: no doses, no diagnoses, no meaning of a reading', () => {
  test.each([
    'Take 500 mg after food.',
    'You could take two tablets now.',
    'Increase your insulin a little.',
    'Skip your metformin tonight.',
    'You have diabetes, so be careful.',
    'Your sugar is too high today.',
    'That reading looks normal.',
    'इंसुलिन बढ़ाएँ।',
  ])('blocks: %s', (text) => {
    expect(violates(text)).toBe(true);
  });

  test.each([
    'Drink a glass of water.',
    'A short walk for ten minutes after lunch is a good idea.',
    'Look at both feet for sores or cracks.',
    'Ask your doctor or the pharmacist about a missed medicine.',
    'एक गिलास पानी पिएँ।',
  ])('allows: %s', (text) => {
    expect(violates(text)).toBe(false);
  });

  test('an unsafe reply is replaced by a safe line, in the right language', () => {
    expect(sanitizeReply('Take 2 tablets of metformin.', 'en')).toEqual({ text: SAFE_LINE.en, blocked: true });
    expect(sanitizeReply('दो गोली लें', 'hi').text).toBe(SAFE_LINE.hi);
    expect(sanitizeReply('**Drink water** and rest.', 'en')).toEqual({ text: 'Drink water and rest.', blocked: false });
  });

  test('a card with an amount or a diagnosis is dropped, a plain one is kept', () => {
    expect(sanitizeCard({ title: 'Take your tablet', body: 'Take 1 tablet at 8 pm with water.' })).toBeNull();
    expect(sanitizeCard({ title: 'Walk after lunch', body: 'Ten easy minutes in the sun, then sit down and rest.' })).toEqual({
      title: 'Walk after lunch',
      body: 'Ten easy minutes in the sun, then sit down and rest.',
    });
    expect(sanitizeCard({ title: 'x', body: 'y' })).toBeNull();
  });

  test('what sounds like an emergency is recognised on the phone, before anything is sent', () => {
    ['I fell down', 'I have chest pain', 'my sugar is very low', 'सीने में दर्द है', 'मैं गिर गया'].forEach((q) => expect(isEmergency(q)).toBe(true));
    ['What can I eat today?', 'Ideas for a short walk', 'I feel fit and well'].forEach((q) => expect(isEmergency(q)).toBe(false));
  });
});

describe('what leaves the phone', () => {
  test('a short anonymous summary: no name, number, medicine or reading', () => {
    const state = {
      ...seededState,
      profile: { name: 'Meena Devi', condition: 'Type 2 diabetes', allergies: 'penicillin', emergencyId: 'm1' },
      medicines: [{ id: 'a', name: 'Metformin', dose: '500 mg', when: 'afterBreakfast' }],
    };
    const text = JSON.stringify(buildAiContext(state, Date.now()));
    expect(text).not.toMatch(/Meena|Devi|9000000|Metformin|500|penicillin|Asha|Ramesh|Rao/);
    expect(text).not.toMatch(/mgdl/);
    const ctx = JSON.parse(text);
    expect(ctx).toMatchObject({ lang: 'en', hasCondition: true, onMedicines: true });
    expect(Object.keys(ctx).sort()).toEqual(
      ['avoids', 'diet', 'hasCondition', 'lang', 'likes', 'mode', 'onMedicines', 'partOfDay', 'phase', 'region', 'sugarLoggedToday', 'tasksDone', 'tasksTotal', 'weekend'].sort(),
    );
  });
});

describe('generated cards', () => {
  const six = [
    { title: 'Drink a glass of water', body: 'A glass now helps. Keep a bottle where you sit.', icon: 'glass', tab: null },
    { title: 'Walk after lunch', body: 'Ten easy minutes in the sun, then sit and rest.', icon: 'walker', tab: null },
    { title: 'Look at your feet', body: 'Check both feet for sores, cracks or blisters tonight.', icon: 'foot', tab: 'care' },
    { title: 'Call someone dear', body: 'A short call to a friend or a cousin lifts the day.', icon: 'phone', tab: 'circle' },
    { title: 'Stretch your back', body: 'Stand up, reach high and slowly bend. Two easy rounds.', icon: 'stretch', tab: null },
    { title: 'Early night', body: 'Put the phone down and wind down before ten.', icon: 'moon', tab: 'nonsense' },
  ];
  const ctx = { lang: 'en' };

  test('five to seven safe cards come back with a whitelisted icon and tab', async () => {
    const f = jest.fn(async () => reply(200, { cards: [...six, { title: 'Take your tablet', body: 'Take 2 tablets of metformin now please.', icon: 'note' }] }));
    const r = await fetchAiCards(ctx, cfg, f);
    expect(r.ok).toBe(true);
    expect(r.cards).toHaveLength(6);
    expect(r.cards.every((c) => c.ai && c.id.startsWith('ai-'))).toBe(true);
    expect(r.cards.find((c) => c.title === 'Early night')).toMatchObject({ tab: null, doodle: 'moon' });
    expect(r.cards.find((c) => c.title === 'Look at your feet')).toMatchObject({ tab: 'care', doodle: 'foot' });
    expect(f.mock.calls[0][0]).toBe('https://api.example.test/functions/v1/ai');
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({ kind: 'cards', ctx });
  });

  test('too few usable cards, a server error, no network and no server are all quiet failures', async () => {
    expect((await fetchAiCards(ctx, cfg, jest.fn(async () => reply(200, { cards: six.slice(0, 2) })))).ok).toBe(false);
    expect((await fetchAiCards(ctx, cfg, jest.fn(async () => reply(500, {})))).reason).toBe('unavailable');
    expect((await fetchAiCards(ctx, cfg, jest.fn(async () => reply(429, {})))).reason).toBe('busy');
    expect((await fetchAiCards(ctx, cfg, jest.fn(async () => { throw new Error('offline'); }))).reason).toBe('offline');
    expect((await fetchAiCards(ctx, { url: '', key: '' }, jest.fn())).reason).toBe('not_configured');
  });

  test('a chat reply is checked on arrival, whatever the server sent', async () => {
    const good = await fetchAiReply({ lang: 'en' }, [{ role: 'user', text: 'ideas?' }], cfg, jest.fn(async () => reply(200, { reply: 'Try a short walk.' })));
    expect(good).toEqual({ ok: true, text: 'Try a short walk.', blocked: false });
    const bad = await fetchAiReply({ lang: 'en' }, [{ role: 'user', text: 'I missed it' }], cfg, jest.fn(async () => reply(200, { reply: 'Take 2 tablets now.' })));
    expect(bad).toMatchObject({ ok: true, text: SAFE_LINE.en, blocked: true });
  });
});

describe('the suggestion pad with generated cards', () => {
  const ctx = {
    nowMs: new Date(2026, 10, 21, 11).getTime(),
    mode: 'adult',
    phase: 'stable',
    tasks: [{ id: 't1', done: false, hour: 8, title: 'Morning medicine' }],
    medicines: [],
    medTaken: { day: null, ids: [] },
    meds: { name: 'X', pillsLeft: 3, perDay: 2 },
    testPlan: { perDay: 0, strips: 0 },
    careEvents: {},
    meals: [],
    footChecks: [],
    checkins: [],
    readings: [],
    visitQuestions: [],
    lang: 'en',
    labels: {},
    engaged: true,
  };
  const ai = Array.from({ length: 7 }, (_, i) => ({ id: `ai-${i}`, kind: 'ai', ai: true, title: `Idea ${i}`, body: 'A small safe thing to do today.', doodle: 'note', tab: null, priority: 40 - i }));

  test('care reminders from rules come first, then generated cards, seven at most', () => {
    const pad = buildPad(ctx, undefined, ai);
    expect(pad.length).toBeLessThanOrEqual(7);
    expect(pad.length).toBeGreaterThanOrEqual(5);
    const firstAi = pad.findIndex((s) => s.ai);
    expect(pad.slice(0, firstAi).every((s) => s.kind === 'care')).toBe(true);
  });

  test('without generated cards, or in a hard phase, it is the offline rule-based pad', () => {
    expect(buildPad(ctx, undefined, []).every((s) => !s.ai)).toBe(true);
    expect(buildPad(ctx, undefined, ai.slice(0, 2)).every((s) => !s.ai)).toBe(true);
    expect(buildPad({ ...ctx, phase: 'crisis' }, undefined, ai).every((s) => !s.ai)).toBe(true);
  });

  test('a generated card about the same thing as a rule-based one is left out', () => {
    const rule = require('../src/suggestions').allSlips(ctx).find((s) => s.doodle !== 'note');
    expect(rule).toBeTruthy();
    const dup = { id: 'ai-dup', kind: 'ai', ai: true, title: 'Same again', body: 'Says what the rule card already says.', doodle: rule.doodle, tab: null, priority: 90 };
    const pad = buildPad(ctx, undefined, [dup, ...ai]);
    expect(pad.some((s) => s.id === 'ai-dup')).toBe(false);
    expect(pad.some((s) => s.ai)).toBe(true);
  });

  test('a card already stamped today is not shown again', () => {
    const slips = { day: '2026-10-21', done: [], skipped: [] };
    const pad = buildPad(ctx, { ...slips, day: require('../src/suggestions').dayKey(ctx.nowMs), done: ['ai-0', 'ai-1'] }, ai);
    expect(pad.some((s) => s.id === 'ai-0' || s.id === 'ai-1')).toBe(false);
  });
});

describe('the floating helper', () => {
  let cards;
  beforeEach(() => {
    cards = jest.spyOn(client, 'fetchAiCards').mockResolvedValue({ ok: false, reason: 'offline', cards: [] });
  });
  afterEach(() => jest.restoreAllMocks());

  const mount = (preload) =>
    render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
      </StoreProvider>,
    );

  test('a round button opens a floating window, which closes again', async () => {
    await mount({});
    await fireEvent.press(await screen.findByLabelText('Ask Saath for help'));
    expect(await screen.findByText('Saath helper')).toBeTruthy();
    expect(screen.getByText(/never gives doses or diagnoses/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Close'));
    expect(screen.queryByText('Saath helper')).toBeNull();
    expect(cards).toBeDefined();
  });

  test('a message gets a reply from the helper and both stay in the window', async () => {
    jest.spyOn(client, 'fetchAiReply').mockResolvedValue({ ok: true, text: 'Dal, roti and a bowl of salad is a good plate.', blocked: false });
    await mount({});
    await fireEvent.press(await screen.findByLabelText('Ask Saath for help'));
    await fireEvent.changeText(await screen.findByLabelText('Ask for help'), 'What can I eat today?');
    await fireEvent.press(screen.getByLabelText('Send'));
    expect(await screen.findByText('Dal, roti and a bowl of salad is a good plate.')).toBeTruthy();
    expect(screen.getAllByText('What can I eat today?').length).toBeGreaterThan(0);
  });

  test('an emergency is never sent anywhere: it points to the alert', async () => {
    const send = jest.spyOn(client, 'fetchAiReply').mockResolvedValue({ ok: true, text: 'should not be used', blocked: false });
    await mount({});
    await fireEvent.press(await screen.findByLabelText('Ask Saath for help'));
    await fireEvent.changeText(await screen.findByLabelText('Ask for help'), 'I have chest pain');
    await fireEvent.press(screen.getByLabelText('Send'));
    expect(await screen.findByText(/This sounds urgent/)).toBeTruthy();
    expect(screen.getByLabelText('Open Safety')).toBeTruthy();
    expect(send).not.toHaveBeenCalled();
  });

  test('no internet: the window says so and nothing is invented', async () => {
    jest.spyOn(client, 'fetchAiReply').mockResolvedValue({ ok: false, reason: 'offline' });
    await mount({});
    await fireEvent.press(await screen.findByLabelText('Ask Saath for help'));
    await fireEvent.changeText(await screen.findByLabelText('Ask for help'), 'Ideas for a short walk');
    await fireEvent.press(screen.getByLabelText('Send'));
    expect(await screen.findByText(/needs internet/)).toBeTruthy();
  });

  test('switched off in Me, or on a doctor phone, there is no helper button', async () => {
    await mount({ aiOn: false });
    await waitFor(() => expect(screen.getByLabelText('Today')).toBeTruthy());
    expect(screen.queryByLabelText('Ask Saath for help')).toBeNull();
  });

  test('a doctor phone has no helper button', async () => {
    await mount({ ...productionState, usage: 'doctor', onboarded: true });
    await waitFor(() => expect(screen.getByText('My patients')).toBeTruthy());
    expect(screen.queryByLabelText('Ask Saath for help')).toBeNull();
  });

  test('a guardian, neighbour or ASHA phone has no helper button and no AI setting', async () => {
    await mount({ ...productionState, usage: 'member', onboarded: true, circles: [{ household_id: 'h1', role: 'family', dial: 1, time_off: false, person_name: 'Amma' }] });
    await waitFor(() => expect(screen.getByLabelText('Amma')).toBeTruthy());
    expect(screen.queryByLabelText('Ask Saath for help')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Me'));
    expect(await screen.findByText('I look after someone')).toBeTruthy();
    expect(screen.queryByText('Smart cards and helper')).toBeNull();
  });

  test('someone who needs care and also looks after someone is a patient, so they have the helper', async () => {
    await mount({ usage: 'both' });
    expect(await screen.findByLabelText('Ask Saath for help')).toBeTruthy();
  });

  test('the patient sees the AI setting in Me', async () => {
    await mount({});
    await fireEvent.press(await screen.findByLabelText('Me'));
    expect(await screen.findByText('Smart cards and helper')).toBeTruthy();
  });

  test('no generated cards are asked for on a phone that is not a patient\'s', async () => {
    await mount({ ...productionState, usage: 'member', onboarded: true, circles: [] });
    await waitFor(() => expect(screen.getByText(/You have not joined/)).toBeTruthy());
    expect(cards).not.toHaveBeenCalled();
  });

  test('generated cards appear on Today next to the care reminders, marked as ideas', async () => {
    const list = [
      { id: 'ai-a', kind: 'ai', ai: true, title: 'Walk after lunch', body: 'Ten easy minutes in the sun, then sit and rest.', doodle: 'walker', tab: null, priority: 40 },
      { id: 'ai-b', kind: 'ai', ai: true, title: 'Stretch your back', body: 'Stand up, reach high and bend slowly twice.', doodle: 'stretch', tab: null, priority: 39 },
      { id: 'ai-c', kind: 'ai', ai: true, title: 'Call someone dear', body: 'A short call lifts the day for both of you.', doodle: 'phone', tab: null, priority: 38 },
      { id: 'ai-d', kind: 'ai', ai: true, title: 'Early night', body: 'Put the phone down and wind down before ten.', doodle: 'moon', tab: null, priority: 37 },
    ];
    await mount({ aiCards: { at: Date.now(), lang: 'en', cards: list }, tasks: [], meds: { name: '', pillsLeft: 0, perDay: 0 }, readings: [], medicines: [], testPlan: { perDay: 0, strips: 0 } });
    // the pad is a stack: the top card is first, the rest wait behind it
    // care reminders from the rules plus the four generated ones: between five and seven cards in the stack
    expect(await screen.findByText(/^[4-7] left$/)).toBeTruthy();
  });
});
