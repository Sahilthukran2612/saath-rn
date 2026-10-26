import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import {
  validPhone,
  inviteLink,
  clampDial,
  minDialFor,
  isDelegationActive,
  canShareItem,
  phaseDefaults,
  shouldNudge,
  canReceive,
  EVENT_TYPE,
} from '../src/logic';
import { reducer, initialState } from '../src/state/reducer';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const run = (s, ...a) => a.reduce(reducer, s);
const at = (h) => new Date(2026, 0, 10, h).getTime();

describe('invite helpers', () => {
  test.each([
    ['9876543210', true],
    ['+91 98765 43210', true],
    ['98765-43210', true],
    ['1234567890', false],
    ['98765', false],
    ['', false],
    [null, false],
  ])('validPhone(%s) = %s', (s, ok) => expect(validPhone(s)).toBe(ok));
  test('link contains the code', () => expect(inviteLink('AB12CD')).toContain('AB12CD'));
});

describe('guardian limit for teens', () => {
  const guardian = { id: 'g', guardian: true };
  const other = { id: 'o' };
  test('teen cannot drop a guardian below Routine', () => {
    expect(clampDial(guardian, 0, 'teen')).toBe(1);
    expect(minDialFor(guardian, 'teen')).toBe(1);
  });
  test('teen can set a non-guardian to Safety only', () => expect(clampDial(other, 0, 'teen')).toBe(0));
  test('outside teen mode there is no floor', () => expect(clampDial(guardian, 0, 'elder')).toBe(0));
  test('safety events still reach the lowest dial', () =>
    expect(canReceive(0, EVENT_TYPE.safety)).toBe(true));
  test('reducer applies the clamp', () => {
    const s = run({ ...initialState, mode: 'teen' }, { type: 'SET_DIAL', id: 'm1', dial: 0 });
    expect(s.members.find((m) => m.id === 'm1').dial).toBe(1);
  });
});

describe('delegation expiry', () => {
  const d = { status: 'open', expiresAt: 1000 };
  test('active before expiry', () => expect(isDelegationActive(d, 999)).toBe(true));
  test('inactive at and after expiry', () => {
    expect(isDelegationActive(d, 1000)).toBe(false);
    expect(isDelegationActive(d, 5000)).toBe(false);
  });
  test('done is never active', () => expect(isDelegationActive({ ...d, status: 'done' }, 0)).toBe(false));
  test('reducer: create, expire, and done are kept apart', () => {
    let s = run(initialState, { type: 'DELEGATE', id: 'd1', to: 'm1', taskId: 't1', expiresAt: 1000, at: 1 });
    s = run(
      s,
      { type: 'HELP_REQUEST', id: 'd2', to: 'm1', expiresAt: 9000, at: 1 },
      { type: 'DELEGATION_DONE', id: 'd2' }
    );
    s = run(s, { type: 'EXPIRE_DELEGATIONS', now: 2000 });
    expect(s.delegations.map((x) => x.status)).toEqual(['expired', 'done']);
  });
});

describe('second-person consent (interdependent privacy)', () => {
  test('no consent from an involved person blocks sharing', () => {
    expect(canShareItem({ involves: ['a'] }, {})).toBe(false);
    expect(canShareItem({ involves: ['a', 'b'] }, { a: true })).toBe(false);
  });
  test('everyone involved must agree', () =>
    expect(canShareItem({ involves: ['a', 'b'] }, { a: true, b: true })).toBe(true));
  test('an item involving nobody else is free to share', () =>
    expect(canShareItem({ involves: [] }, {})).toBe(true));
});

describe('nudges respect Time Off, sleep window and phase', () => {
  test('safety is never muted', () => {
    expect(shouldNudge({ nowMs: at(2), timeOff: true, isSafety: true }).ok).toBe(true);
  });
  test('time off mutes reminders', () =>
    expect(shouldNudge({ nowMs: at(12), timeOff: true }).ok).toBe(false));
  test('sleep window mutes reminders', () => expect(shouldNudge({ nowMs: at(23) }).ok).toBe(false));
  test('daytime reminder is fine', () => expect(shouldNudge({ nowMs: at(12) }).ok).toBe(true));
  test('stable phase allows fewer prompts than new diagnosis', () => {
    expect(phaseDefaults('stable').maxPromptsPerDay).toBeLessThan(phaseDefaults('new').maxPromptsPerDay);
    expect(shouldNudge({ nowMs: at(12), phase: 'stable', sentToday: 3 }).ok).toBe(false);
    expect(shouldNudge({ nowMs: at(12), phase: 'new', sentToday: 3 }).ok).toBe(true);
  });
});

describe('Rhythm Board and offline queue', () => {
  test('add, edit and delete change tasks and queue each change', () => {
    let s = run(initialState, { type: 'TASK_ADD', id: 'x', title: 'Walk', at: 1 });
    s = run(s, { type: 'TASK_EDIT', id: 'x', title: 'Long walk', at: 2 });
    expect(s.tasks.find((t) => t.id === 'x').title).toBe('Long walk');
    s = run(s, { type: 'TASK_DELETE', id: 'x', at: 3 });
    expect(s.tasks.find((t) => t.id === 'x')).toBeUndefined();
    expect(s.queue.map((q) => q.op)).toEqual(['TASK_ADD', 'TASK_EDIT', 'TASK_DELETE']);
  });
  test('queue waits offline and flushes when online', () => {
    let s = run(
      initialState,
      { type: 'TOGGLE_TASK', id: 't1', at: 1 },
      { type: 'TOGGLE_TASK', id: 't2', at: 2 }
    );
    expect(s.queue).toHaveLength(2);
    s = run(s, { type: 'SET_ONLINE', online: true });
    expect(s.queue).toHaveLength(0);
    expect(s.synced).toBe(2);
  });
});

describe('invite flow and consent', () => {
  test('a joined invitee starts at Safety only', () => {
    let s = run(initialState, {
      type: 'INVITE_ADD',
      id: 'i1',
      name: 'Mina',
      phone: '9876543210',
      role: 'family',
      code: 'ABC',
      at: 1,
    });
    s = run(s, { type: 'INVITE_ACCEPT', id: 'i1' }, { type: 'INVITE_ACCEPT', id: 'i1' });
    const added = s.members.filter((m) => m.name === 'Mina');
    expect(added).toHaveLength(1);
    expect(added[0].dial).toBe(0);
    expect(added[0].shareContact).toBe(false);
  });
  test('guardian consent is recorded and can be revoked', () => {
    let s = run(initialState, {
      type: 'GRANT_CONSENT',
      guardianName: 'Asha',
      guardianPhone: '9876543210',
      at: 5,
    });
    expect(s.consent.status).toBe('granted');
    s = run(s, { type: 'REVOKE_CONSENT' });
    expect(s.consent.status).toBe('none');
  });
});

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

describe('component flows', () => {
  test('teen mode is gated until a guardian agrees', async () => {
    await mount({ mode: 'teen' });
    expect(screen.getByText('Ask a parent or guardian')).toBeTruthy();
    expect(screen.queryByText('Transition ladder')).toBeNull();
  });
  test('consent needs a name and a valid phone', async () => {
    await mount({ mode: 'teen' });
    await fireEvent.press(screen.getByLabelText('My guardian agrees'));
    expect(screen.getByText(/Enter the guardian name/)).toBeTruthy();
  });
  test('valid consent opens the teen home', async () => {
    await mount({ mode: 'teen' });
    await fireEvent.changeText(screen.getByLabelText('Guardian name'), 'Asha');
    await fireEvent.changeText(screen.getByLabelText('Guardian phone'), '9876543210');
    await fireEvent.press(screen.getByLabelText('My guardian agrees'));
    expect(screen.getByText('Transition ladder')).toBeTruthy();
  });
  test('Ask for help adds a delegation', async () => {
    await mount({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText('Circle'));
    await fireEvent.press(screen.getByLabelText('Ask for help'));
    // the button and the new list row both say 'Ask for help'
    expect(screen.getAllByText('Ask for help').length).toBeGreaterThanOrEqual(2);
  });
  test('a member number is hidden until they agree', async () => {
    await mount({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.getAllByText('Number hidden until they agree').length).toBe(2);
  });
  test('new-diagnosis phase shows guidance on Today', async () => {
    await mount({ mode: 'elder', phase: 'new' });
    expect(screen.getByText(/New diagnosis: take it one step/)).toBeTruthy();
  });
});
