import React from 'react';
import { Linking } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { reducer } from '../src/state/reducer';
import { seededState as initialState, SEED } from '../testSupport/fixtures';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { defaultBaseline } from '../src/care';
import { CFG } from '../src/logic';

const run = (s, ...a) => a.reduce(reducer, s);
const fall = { type: 'TRIGGER_ALERT', kind: 'fall', confidence: 0.8, reason: 'x', id: 'a1' };
const quiet = { ...fall, kind: 'quiet', id: 'q1' };
const at = (h) => new Date(2026, 0, 10, h).getTime();

describe('baseline feedback in the reducer', () => {
  test('false alarm on a fall raises the impact threshold', () => {
    const s = run(initialState, fall, { type: 'FALSE_ALARM' });
    expect(s.baseline.impactG).toBeGreaterThan(CFG.fallImpactG);
    expect(s.baseline.inactiveHours).toBe(CFG.inactiveHours);
  });
  test('false alarm on a quiet alert raises the quiet hours only', () => {
    const s = run(initialState, quiet, { type: 'FALSE_ALARM' });
    expect(s.baseline.inactiveHours).toBeGreaterThan(CFG.inactiveHours);
    expect(s.baseline.impactG).toBe(CFG.fallImpactG);
  });
  test('missed fall lowers it, missed quiet lowers quiet hours', () => {
    expect(run(initialState, { type: 'MISSED', kind: 'fall' }).baseline.impactG).toBeLessThan(
      CFG.fallImpactG
    );
    expect(run(initialState, { type: 'MISSED', kind: 'quiet' }).baseline.inactiveHours).toBeLessThan(
      CFG.inactiveHours
    );
  });
  test('"I\'m OK" does not change the baseline', () => {
    expect(run(initialState, fall, { type: 'IM_OK', at: 1 }).baseline).toEqual(defaultBaseline());
  });
  test('reset puts it back', () => {
    const s = run(initialState, fall, { type: 'FALSE_ALARM' }, { type: 'RESET_BASELINE' });
    expect(s.baseline).toEqual(defaultBaseline());
  });
  test('the quiet check uses the personal threshold', () => {
    const strict = { ...initialState, baseline: { ...defaultBaseline(), inactiveHours: 9 } };
    const a = { type: 'QUIET_CHECK', lastActiveMs: at(7), nowMs: at(14), simulated: true, id: 'q' };
    expect(run(initialState, a).alert).not.toBeNull();
    expect(run(strict, a).alert).toBeNull();
  });
});

describe('care data', () => {
  test('a reading uses up one strip and never below zero', () => {
    let s = run(initialState, { type: 'ADD_READING', id: 'r', mgdl: 100, at: 1 });
    expect(s.testPlan.strips).toBe(initialState.testPlan.strips - 1);
    s = run(
      { ...s, testPlan: { ...s.testPlan, strips: 0 } },
      { type: 'ADD_READING', id: 'r2', mgdl: 100, at: 2 }
    );
    expect(s.testPlan.strips).toBe(0);
  });
  test('insulin is logged as a time only: no dose field exists in state', () => {
    const s = run(initialState, { type: 'LOG_INSULIN', at: 5, units: 12, dose: 12 });
    expect(s.careEvents).toEqual({ lastInsulinAt: 5, lastMealAt: null });
    // Insulin and care events never carry an amount. (The medicine list holds a dose only as the text the person
    // typed from their prescription, which Saath never reads, works out or changes: see src/medicines.js.)
    expect(JSON.stringify(s.careEvents)).not.toMatch(/units|dose/i);
    expect(JSON.stringify({ ...s, medicines: [], carePlan: null })).not.toMatch(/units|dose/i);
  });
  test('stock never goes below zero', () => {
    expect(run(initialState, { type: 'MEDS_SET', pillsLeft: -5 }).meds.pillsLeft).toBe(0);
  });
  test('budget entries add up', () => {
    const s = run(initialState, { type: 'BUDGET_ADD', id: 'x', amount: 100, cat: 'travel', at: Date.now() });
    expect(s.budget).toHaveLength(initialState.budget.length + 1);
  });
});

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

describe('Care and alert screens', () => {
  test('Care shows the sugar log and stock, and the budget is hidden', async () => {
    await mount({ mode: 'adult' });
    await fireEvent.press(screen.getByLabelText('Care'));
    expect(screen.getByText('Sugar log')).toBeTruthy();
    expect(screen.getByText('Medicine stock')).toBeTruthy();
    expect(screen.queryByText('Care budget')).toBeNull();
    expect(screen.queryByLabelText('Add cost')).toBeNull();
  });
  test('with no medicine named yet the stock line has no stray colon', async () => {
    await mount({ meds: { name: '', pillsLeft: 0, perDay: 0 } });
    await fireEvent.press(screen.getByLabelText('Care'));
    expect(screen.queryByText(/^: /)).toBeNull();
    expect(screen.getByText(/0 tablets left/)).toBeTruthy();
  });
  test('insulin logged 3 hours ago with no meal shows a prompt with the safe steps', async () => {
    await mount({ careEvents: { lastInsulinAt: Date.now() - 3 * 3600000, lastMealAt: null } });
    await fireEvent.press(screen.getByLabelText('Care'));
    expect(screen.getByText('Insulin logged, no meal yet')).toBeTruthy();
    expect(screen.getByText(/sugar, jaggery or a glucose biscuit/)).toBeTruthy();
    // the prompt and the sugar advice both end with the clinician note
    expect(screen.getAllByText(/Follow your clinician's plan/).length).toBeGreaterThanOrEqual(2);
  });
  test('there is no insulin amount field on the Care screen', async () => {
    await mount({});
    await fireEvent.press(screen.getByLabelText('Care'));
    expect(screen.queryByPlaceholderText(/units|dose/i)).toBeNull();
    expect(screen.getByText('Saath records only the time, never the amount.')).toBeTruthy();
  });
  test('someone who only looks after people has no Care tab, so cannot see the Care cards', async () => {
    await mount({ usage: 'member' });
    expect(screen.queryByLabelText('Care')).toBeNull();
    expect(screen.queryByText('Sugar log')).toBeNull();
  });
  test('the adult Today screen has no spend figure and no budget link while the budget is hidden', async () => {
    await mount({ mode: 'adult' });
    expect(screen.queryByText('Budget')).toBeNull();
    expect(screen.queryByText(/₹/)).toBeNull();
  });
  test('escalation step shows tap-to-call and a prefilled message', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const asha = { id: 'm1', name: 'Asha (daughter)', role: 'family', dial: 2, phone: '9000000001' };
    await mount({
      alert: {
        id: 'a',
        kind: 'fall',
        confidence: 0.9,
        reason: 'x',
        phase: 'escalating',
        remaining: 15,
        stepIndex: 0,
        chain: [asha],
      },
    });
    await fireEvent.press(screen.getByLabelText('Call Asha (daughter)'));
    expect(spy).toHaveBeenCalledWith('tel:9000000001');
    await fireEvent.press(screen.getByLabelText('WhatsApp Asha (daughter)'));
    expect(spy.mock.calls[1][0]).toMatch(/^https:\/\/wa\.me\/919000000001\?text=/);
    await fireEvent.press(screen.getByLabelText('Send message Asha (daughter)'));
    expect(spy.mock.calls[2][0]).toMatch(/^sms:9000000001\?body=/);
    spy.mockRestore();
  });
  test('Safety explains the baseline in plain words', async () => {
    await mount({});
    await fireEvent.press(screen.getByLabelText('Safety'));
    expect(screen.getByText('How Saath learned from you')).toBeTruthy();
    expect(screen.getByText(/Fall check: normal/)).toBeTruthy();
  });
});
