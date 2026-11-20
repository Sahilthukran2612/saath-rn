import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react-native';
import { StoreProvider, useStore } from '../src/state/store';
import AppShell from '../src/AppShell';
import { initialState, productionState, reducer } from '../src/state/reducer';
import { CFG } from '../src/logic';
import { callSeconds } from '../src/services/calls';
import * as callsService from '../src/services/calls';

let mockCallsAvailable = false;
jest.mock('../src/services/calls', () => ({
  get callsAvailable() {
    return mockCallsAvailable;
  },
  askCallPermissions: jest.fn(async () => true),
  placeCall: jest.fn(async () => true),
  callSeconds: jest.requireActual('../src/services/calls').callSeconds,
}));

const base = { ...initialState, hydrated: true };
const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

beforeEach(() => {
  jest.clearAllMocks();
  mockCallsAvailable = false;
});

describe('a real install starts empty', () => {
  test('no demo people, no fake numbers, no invented readings or costs, setup not done', () => {
    expect(productionState.demo).toBe(false);
    expect(productionState.onboarded).toBe(false);
    expect(productionState.members).toEqual([]);
    expect(productionState.readings).toEqual([]);
    expect(productionState.budget).toEqual([]);
    expect(productionState.meds.name).toBe('');
    expect(JSON.stringify(productionState)).not.toMatch(/9000000/);
    expect(JSON.stringify(productionState)).not.toMatch(/\(demo\)/);
  });
  test('the development build and the tests keep the demo data', () => {
    expect(initialState.demo).toBe(true);
    expect(initialState.members.length).toBeGreaterThan(0);
    expect(initialState.onboarded).toBe(true);
  });
  test('the automatic call, SMS and siren all start off', () => {
    expect([productionState.autoCall, productionState.autoSms, productionState.siren]).toEqual([false, false, false]);
  });
});

describe('emergency contacts', () => {
  const add = (s, over = {}) =>
    reducer(s, { type: 'CONTACT_ADD', id: 'c1', name: 'Asha', phone: '98765 43210', role: 'family', ...over });
  test('a valid contact is added with the number as 10 digits, safety only, and the person’s own consent', () => {
    const s = add({ ...productionState, hydrated: true });
    expect(s.members).toEqual([
      { id: 'c1', name: 'Asha', role: 'family', dial: 0, timeOff: false, phone: '9876543210', shareContact: true },
    ]);
    expect(s.profile.emergencyId).toBe('c1');
  });
  test('+91 and 0 prefixes reach the same 10 digits', () => {
    expect(add(base, { phone: '+91 98765 43210' }).members.at(-1).phone).toBe('9876543210');
  });
  test('a short name, a bad number, or the same number twice is ignored', () => {
    const p = { ...productionState, hydrated: true };
    expect(add(p, { name: 'A' })).toBe(p);
    expect(add(p, { phone: '12345' })).toBe(p);
    expect(add(p, { phone: '0000000000' }).members).toHaveLength(p.members.length); // not a valid mobile
    const one = add(p);
    expect(add(one, { id: 'c2', name: 'Other', phone: '+919876543210' })).toBe(one);
  });
  test('an unknown role becomes family, and the person role can never be a contact', () => {
    expect(add({ ...productionState, hydrated: true }, { role: 'person' }).members[0].role).toBe('family');
    expect(add({ ...productionState, hydrated: true }, { role: 'neighbour' }).members[0].role).toBe('neighbour');
  });
  test('at most twelve real contacts', () => {
    let s = { ...productionState, hydrated: true };
    for (let i = 0; i < 14; i++) s = add(s, { id: `c${i}`, name: `Person ${i}`, phone: `98765${String(10000 + i)}`.slice(0, 10) });
    expect(s.members.length).toBeLessThanOrEqual(12);
  });
  test('removing one keeps the others, and moves the emergency contact on', () => {
    let s = add({ ...productionState, hydrated: true });
    s = add(s, { id: 'c2', name: 'Raju', phone: '9123456780', role: 'neighbour' });
    s = reducer(s, { type: 'CONTACT_REMOVE', id: 'c1' });
    expect(s.members.map((m) => m.id)).toEqual(['c2']);
    expect(s.profile.emergencyId).toBe('c2');
    expect(reducer(s, { type: 'CONTACT_REMOVE', id: 'c2' }).profile.emergencyId).toBeNull();
  });
  test('adding a real contact leaves demo people out of the real list', () => {
    const s = add(reducer({ ...productionState, hydrated: true }, { type: 'DEMO_ON' }));
    expect(s.members.filter((m) => m.demo)).toEqual([]);
    expect(s.members.map((m) => m.name)).toEqual(['Asha']);
  });
});

describe('demo mode on a real install', () => {
  const real = { ...productionState, hydrated: true };
  test('turning it on loads flagged demo data; turning it off removes exactly that', () => {
    const on = reducer(real, { type: 'DEMO_ON' });
    expect(on.demo).toBe(true);
    expect(on.members.length).toBeGreaterThan(0);
    expect(on.members.every((m) => m.demo)).toBe(true);
    const off = reducer(on, { type: 'DEMO_OFF' });
    expect(off.demo).toBe(false);
    expect(off.members).toEqual([]);
    expect(off.readings).toEqual([]);
    expect(off.budget).toEqual([]);
    expect(off.meds.name).toBe('');
  });
  test('real contacts, readings and costs survive demo on and off', () => {
    let s = reducer(real, { type: 'CONTACT_ADD', id: 'c1', name: 'Asha', phone: '9876543210', role: 'family' });
    s = reducer(s, { type: 'ADD_READING', mgdl: 140, at: 5, id: 'r1' });
    s = reducer(s, { type: 'DEMO_ON' });
    expect(s.members.map((m) => m.name)).toEqual(['Asha']); // demo people are not added next to real ones
    s = reducer(s, { type: 'DEMO_OFF' });
    expect(s.members.map((m) => m.name)).toEqual(['Asha']);
    expect(s.readings.some((r) => r.id === 'r1')).toBe(true);
  });
  test('turning demo off also removes the demo person I look after', () => {
    let s = reducer(real, { type: 'DEMO_ON' });
    s = reducer(s, { type: 'DEMO_CIRCLE_ADD', at: 1_000_000 });
    expect(s.circles.length).toBe(1);
    expect(reducer(s, { type: 'DEMO_OFF' }).circles).toEqual([]);
  });
});

describe('the first-run setup', () => {
  test('a fresh install shows the setup, not the app', async () => {
    await mount({ ...productionState, usage: 'person' });
    expect(screen.getByText('Welcome to Saath')).toBeTruthy();
    expect(screen.queryByLabelText('Circle')).toBeNull();
  });
  test('it runs through: language and role, name, a contact, choices, finish', async () => {
    await mount({ ...productionState, usage: 'person' });
    await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('About you')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Your name'), 'Amma');
    await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('Who should we reach?')).toBeTruthy();
    expect(screen.getByText('Without a contact, an alert has no one to reach.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Name'), 'Asha');
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '9876543210');
    await fireEvent.press(screen.getByLabelText('Add contact'));
    await waitFor(() => expect(screen.getByText('Family, 9876543210')).toBeTruthy());
    expect(screen.queryByText('Without a contact, an alert has no one to reach.')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('How should alerts work?')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Start using Saath'));
    await waitFor(() => expect(screen.getByLabelText('Circle')).toBeTruthy());
  });
  test('a bad contact is refused with a clear message', async () => {
    await mount({ ...productionState, usage: 'person' });
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.changeText(screen.getByLabelText('Name'), 'A');
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '123');
    await fireEvent.press(screen.getByLabelText('Add contact'));
    expect(screen.getByText('Enter a name and a 10-digit mobile number.')).toBeTruthy();
  });
  test('the setup is in Hindi when Hindi is chosen', async () => {
    await mount({ ...productionState, usage: 'person' });
    await fireEvent.press(screen.getByLabelText('हिन्दी'));
    expect(screen.getByText('साथ में आपका स्वागत है')).toBeTruthy();
  });
  test('an install that finished setup goes straight to the app', async () => {
    await mount({ ...productionState, onboarded: true });
    expect(screen.getByLabelText('Today')).toBeTruthy();
    expect(screen.queryByLabelText('Demo mode')).toBeNull(); // no demo strip in a real install
  });
});

describe('contacts on the Circle tab', () => {
  test('in a real install the list starts empty with a message, and a contact can be added and removed', async () => {
    await mount({ ...productionState, onboarded: true });
    await fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.getByLabelText('Add a person')).toBeTruthy();
    expect(screen.getByText(/No contacts yet/)).toBeTruthy();
    // one form, in a bottom sheet: adding a person makes them a contact and an invite at once
    await fireEvent.press(screen.getByLabelText('Add a person'));
    await fireEvent.changeText(await screen.findByLabelText('Name'), 'Sunita');
    await fireEvent.changeText(screen.getByLabelText('Phone number'), '9123456780');
    await fireEvent.press(screen.getAllByLabelText('ASHA')[0]);
    await fireEvent.press(screen.getByLabelText('Add and send code'));
    await waitFor(() => expect(screen.getAllByText('Sunita').length).toBeGreaterThan(0));
    await fireEvent.press(screen.getByLabelText('Remove Sunita'));
    await waitFor(() => expect(screen.queryByText('Sunita')).toBeNull());
  });
});

describe('automatic calls: the alert clock', () => {
  const asha = { id: 'm1', name: 'Asha', role: 'family', phone: '9876543210' };
  const raju = { id: 'm2', name: 'Raju', role: 'neighbour', phone: '9123456780' };
  const esc = (over = {}) => ({
    ...base,
    alert: { id: 'a', kind: 'fall', confidence: 0.9, reason: 'x', phase: 'escalating', stepIndex: 0, remaining: 20, chain: [asha, raju], ...over },
  });
  test('while a call is up the clock waits, so the next contact is not skipped', () => {
    let s = reducer(esc(), { type: 'CALL_START' });
    expect(s.alert.hold).toBe(true);
    expect(s.alert.calling).toBe('m1');
    for (let i = 0; i < 60; i++) s = reducer(s, { type: 'TICK' });
    expect(s.alert.stepIndex).toBe(0);
    expect(s.alert.remaining).toBe(20);
  });
  test('a short or unanswered call moves on to the next contact', () => {
    let s = reducer(esc(), { type: 'CALL_START' });
    s = reducer(s, { type: 'CALL_END', seconds: 12 });
    expect(s.alert).toMatchObject({ stepIndex: 1, hold: false, calling: null, phase: 'escalating', remaining: CFG.stepSec });
  });
  test('a call long enough to be a conversation stops the chain and says who answered', () => {
    let s = reducer(esc(), { type: 'CALL_START' });
    s = reducer(s, { type: 'CALL_END', seconds: CFG.callReachedSec });
    expect(s.alert).toMatchObject({ phase: 'done', reached: 'm1' });
  });
  test('the last contact not answering ends the chain without anyone reached', () => {
    let s = reducer(esc({ stepIndex: 1 }), { type: 'CALL_START' });
    s = reducer(s, { type: 'CALL_END', seconds: 5 });
    expect(s.alert.phase).toBe('done');
    expect(s.alert.reached).toBeUndefined();
  });
  test('a call that never reports its end is let go after the hold limit', () => {
    let s = reducer(esc(), { type: 'CALL_START' });
    for (let i = 0; i < CFG.callMaxHoldSec; i++) s = reducer(s, { type: 'TICK' });
    expect(s.alert.stepIndex).toBe(1);
    expect(s.alert.hold).toBe(false);
  });
  test('call events do nothing outside an escalation', () => {
    expect(reducer(base, { type: 'CALL_START' })).toBe(base);
    expect(reducer(base, { type: 'CALL_END', seconds: 3 })).toBe(base);
    const counting = { ...base, alert: { id: 'a', phase: 'countdown', stepIndex: 0, remaining: 20, chain: [asha] } };
    expect(reducer(counting, { type: 'CALL_START' })).toBe(counting);
  });
  test('how long a call lasted, and never a negative or missing time', () => {
    expect(callSeconds(1000, 61000)).toBe(60);
    expect(callSeconds(null, 5)).toBe(0);
    expect(callSeconds(5000, 1000)).toBe(0);
  });
});

describe('automatic calls: on the alert screen', () => {
  const asha = { id: 'm1', name: 'Asha', role: 'family', phone: '9876543210' };
  const raju = { id: 'm2', name: 'Raju', role: 'neighbour', phone: '9123456780' };
  const alert = (over = {}) => ({
    id: 'a',
    kind: 'fall',
    confidence: 0.9,
    reason: 'x',
    phase: 'escalating',
    stepIndex: 0,
    remaining: 20,
    chain: [asha, raju],
    ...over,
  });
  let holder;
  function Capture() {
    const { dispatch } = useStore();
    React.useEffect(() => {
      holder = dispatch;
    }, [dispatch]);
    return null;
  }
  const mountWith = (preload) =>
    render(
      <StoreProvider preload={preload}>
        <AppShell sensing={false} />
        <Capture />
      </StoreProvider>
    );

  test('off by default: nothing is dialled', async () => {
    mockCallsAvailable = true;
    await mount({ demo: false, alert: alert() });
    expect(callsService.placeCall).not.toHaveBeenCalled();
  });

  test('on in an installed build: dials the contact being reached, once, and shows it', async () => {
    mockCallsAvailable = true;
    await mount({ demo: false, autoCall: true, alert: alert() });
    await waitFor(() => expect(callsService.placeCall).toHaveBeenCalledTimes(1));
    expect(callsService.placeCall.mock.calls[0][0]).toBe('9876543210');
    await waitFor(() => expect(screen.getByText('Calling Asha now...')).toBeTruthy());
  });

  test('when that call ends short, the next contact is dialled, then no more', async () => {
    mockCallsAvailable = true;
    let end;
    callsService.placeCall.mockImplementation(async (_phone, onEnd) => {
      end = onEnd;
      return true;
    });
    await mount({ demo: false, autoCall: true, alert: alert() });
    await waitFor(() => expect(callsService.placeCall).toHaveBeenCalledTimes(1));
    await act(async () => end(8));
    await waitFor(() => expect(callsService.placeCall).toHaveBeenCalledTimes(2));
    expect(callsService.placeCall.mock.calls[1][0]).toBe('9123456780');
    await act(async () => end(8));
    await waitFor(() => expect(screen.getByText(/No one answered yet/)).toBeTruthy());
    expect(callsService.placeCall).toHaveBeenCalledTimes(2);
  });

  test('a conversation stops the chain and the screen says who answered', async () => {
    mockCallsAvailable = true;
    let end;
    callsService.placeCall.mockImplementation(async (_phone, onEnd) => {
      end = onEnd;
      return true;
    });
    await mount({ demo: false, autoCall: true, alert: alert() });
    await waitFor(() => expect(callsService.placeCall).toHaveBeenCalledTimes(1));
    await act(async () => end(120));
    await waitFor(() => expect(screen.getByText('Someone answered the call to Asha.')).toBeTruthy());
    expect(callsService.placeCall).toHaveBeenCalledTimes(1);
  });

  test('nothing is dialled during the countdown, while the person can still answer', async () => {
    mockCallsAvailable = true;
    await mount({ demo: false, autoCall: true, alert: alert({ phase: 'countdown', remaining: 25 }) });
    expect(screen.getByText('Are you OK?')).toBeTruthy();
    expect(callsService.placeCall).not.toHaveBeenCalled();
  });

  test('demo mode never places a real call, even if the module is there; it shows what it would do', async () => {
    mockCallsAvailable = true;
    await mount({ demo: true, autoCall: true, alert: alert() });
    expect(callsService.placeCall).not.toHaveBeenCalled();
    expect(screen.getByText('Demo: would call Asha now')).toBeTruthy();
  });

  test('a contact with no number is skipped, and "I’m OK" ends everything', async () => {
    mockCallsAvailable = true;
    await mountWith({ demo: false, autoCall: true, alert: alert({ chain: [{ ...asha, phone: '' }] }) });
    expect(callsService.placeCall).not.toHaveBeenCalled();
    await act(async () => holder({ type: 'IM_OK', at: 1 }));
    await waitFor(() => expect(screen.queryByText('Are you OK?')).toBeNull());
  });
});

describe('the automatic-call switch', () => {
  const openMe = async () => fireEvent.press(screen.getByLabelText('Me'));
  test('asks the phone for permission, and goes on only if it is given', async () => {
    mockCallsAvailable = true;
    await mount({ demo: false });
    await openMe();
    await fireEvent.press(screen.getByLabelText('Call my contacts automatically: off'));
    await waitFor(() => expect(screen.getByLabelText('Call my contacts automatically: on')).toBeTruthy());
    expect(callsService.askCallPermissions).toHaveBeenCalled();
  });
  test('refused: it stays off and says why', async () => {
    mockCallsAvailable = true;
    callsService.askCallPermissions.mockResolvedValueOnce(false);
    await mount({ demo: false });
    await openMe();
    await fireEvent.press(screen.getByLabelText('Call my contacts automatically: off'));
    await waitFor(() => expect(screen.getByText(/Allow phone calls so Saath can call your contacts/)).toBeTruthy());
    expect(screen.getByLabelText('Call my contacts automatically: off')).toBeTruthy();
  });
  test('without the installed app it says so, and does not turn on', async () => {
    mockCallsAvailable = false;
    await mount({ demo: false });
    await openMe();
    expect(screen.getAllByText('This needs the installed Saath app, not Expo Go.').length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByLabelText('Call my contacts automatically: off'));
    await waitFor(() => expect(screen.getByLabelText('Call my contacts automatically: off')).toBeTruthy());
  });
  test('in demo mode it turns on without the module and says it is a demo', async () => {
    mockCallsAvailable = false;
    await mount({ demo: true });
    await openMe();
    expect(screen.getByText('Demo: calls are shown on screen, not placed.')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Call my contacts automatically: off'));
    await waitFor(() => expect(screen.getByLabelText('Call my contacts automatically: on')).toBeTruthy());
    expect(callsService.askCallPermissions).not.toHaveBeenCalled();
  });
  test('the Safety trial card warns that a real run reaches real contacts', async () => {
    await mount({ demo: false, autoCall: true });
    await fireEvent.press(screen.getByLabelText('Safety'));
    expect(screen.getByText(/A trial that runs to the end will really reach your contacts/)).toBeTruthy();
  });
});
