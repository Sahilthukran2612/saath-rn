import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { productionState, initialState, reducer } from '../src/state/reducer';
import * as sensing from '../src/services/sensing';
import { createInvite } from '../src/services/cloud';

jest.mock('../src/services/sensing', () => ({
  startFallListener: jest.fn(() => () => {}),
}));

const mount = (preload, props = {}) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} {...props} />
    </StoreProvider>
  );

const signedIn = { phone: '9876543210', userId: 'u1', access: 'A', refresh: 'R', householdId: 'h1' };
const neighbourOf = { household_id: 'hx', role: 'neighbour', dial: 0, time_off: false, person_name: 'Amma' };

// An installed build always has the server address baked in, so these tests have one too.
const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY'];
const savedEnv = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
  process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
});
afterEach(() => {
  KEYS.forEach((k) => (savedEnv[k] === undefined ? delete process.env[k] : (process.env[k] = savedEnv[k])));
});

describe('the first question', () => {
  test('a fresh install asks how Saath will be used, before anything else', async () => {
    await mount({ ...productionState });
    expect(screen.getByText('How will you use Saath?')).toBeTruthy();
    expect(screen.getByLabelText('I need care')).toBeTruthy();
    expect(screen.getByLabelText('I look after someone')).toBeTruthy();
    expect(screen.queryByLabelText('Circle')).toBeNull();
  });
  test('the question can be read in Hindi', async () => {
    await mount({ ...productionState });
    await fireEvent.press(screen.getByLabelText('हिन्दी'));
    expect(screen.getByText('आप साथ का कैसे इस्तेमाल करेंगे?')).toBeTruthy();
  });
  test('"I need care" leads to the person\u2019s setup, with contacts and alert choices', async () => {
    await mount({ ...productionState });
    await fireEvent.press(screen.getByLabelText('I need care'));
    expect(screen.getByText('Welcome to Saath')).toBeTruthy();
  });
  test('"I look after someone" leads to a different setup, with no contacts or sensors in it', async () => {
    await mount({ ...productionState });
    await fireEvent.press(screen.getByLabelText('I look after someone'));
    expect(screen.getByText('About you')).toBeTruthy();
    expect(screen.queryByText('Welcome to Saath')).toBeNull();
    expect(screen.queryByText('Who should we reach?')).toBeNull();
  });
  test('the development build and the tests still start as a person', () => {
    expect(initialState.usage).toBe('person');
    expect(productionState.usage).toBeNull();
  });
});

describe('the care-giver setup (family, neighbour, ASHA, clinician)', () => {
  test('name, then an account, then the invite code: and the account is required before the code', async () => {
    await mount({ ...productionState, usage: 'member' });
    await fireEvent.changeText(screen.getByLabelText('Your name'), 'Asha');
    await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('Your own account')).toBeTruthy();
    expect(screen.getByText('Create your account first.')).toBeTruthy();
    // not signed in: Next does not move on
    await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('Your own account')).toBeTruthy();
    expect(screen.queryByText('Join the person you look after')).toBeNull();
  });
  test('once signed in, the join step explains where the code comes from and that the number must match', async () => {
    await mount({ ...productionState, usage: 'member', cloud: signedIn });
    await fireEvent.press(screen.getByLabelText('Next')); // name
    await fireEvent.press(screen.getByLabelText('Next')); // account (already signed in)
    expect(screen.getByText('Join the person you look after')).toBeTruthy();
    expect(screen.getByText(/Your role, for example neighbour or clinician, comes from their invite/)).toBeTruthy();
    expect(screen.getByText(/only works for the phone number the person entered for you/)).toBeTruthy();
    expect(screen.getByText(/No code yet\? Ask the person to open Circle/)).toBeTruthy();
    expect(screen.getByLabelText('I will join later')).toBeTruthy();
  });
  test('a care-giver who has joined sees how many circles and can start', async () => {
    await mount({ ...productionState, usage: 'member', cloud: signedIn, circles: [neighbourOf] });
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.press(screen.getByLabelText('Next'));
    expect(screen.getByText('Circles you have joined: 1')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Start'));
    await waitFor(() => expect(screen.getByText('People I look after')).toBeTruthy());
  });
  test('skipping the code still opens the app, with a clear message that nobody is joined yet', async () => {
    await mount({ ...productionState, usage: 'member', cloud: signedIn });
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.press(screen.getByLabelText('I will join later'));
    await waitFor(() => expect(screen.getByText('You have not joined anyone\'s circle yet.')).toBeTruthy());
  });
});

describe('the care-giver\u2019s app', () => {
  const memberApp = { ...productionState, usage: 'member', onboarded: true, cloud: signedIn, circles: [neighbourOf], feeds: { hx: [] } };

  test('has one screen with all their people, no tab bar, and Me from the avatar', async () => {
    await mount(memberApp);
    expect(screen.getByText('People I look after')).toBeTruthy();
    ['Today', 'Circle', 'Safety', 'Care', 'Plan'].forEach((l) => expect(screen.queryByLabelText(l)).toBeNull());
    expect(screen.getByLabelText('Me')).toBeTruthy();
  });
  test('the dashboard names each person they look after and their role with that person', async () => {
    await mount(memberApp);
    expect(screen.getByLabelText('Amma')).toBeTruthy();
    expect(screen.getByText(/Neighbour ·/)).toBeTruthy();
  });
  test('opening a person says what role they have and what they may see', async () => {
    await mount(memberApp);
    await fireEvent.press(screen.getByLabelText('Amma'));
    expect(screen.getByText('You are their Neighbour.')).toBeTruthy();
    expect(screen.getByText('You see: Safety only')).toBeTruthy();
  });
  test('a fall by the person they look after shows an alert on every tab', async () => {
    const fall = { id: 1, event_type: 0, kind: 'fall', detail: null, created_at: new Date().toISOString() };
    await mount({ ...memberApp, feeds: { hx: [fall] } });
    // on Today the same words also head the person's row in the list, so there are two on that tab
    expect(screen.getAllByText('Amma may have fallen. Please call them.').length).toBeGreaterThanOrEqual(1);
    await fireEvent.press(screen.getByLabelText('Me'));
    expect(screen.getByText('Amma may have fallen. Please call them.')).toBeTruthy();
  });
  test('Me shows their account and how they use Saath, but none of the person\u2019s alert settings', async () => {
    await mount(memberApp);
    await fireEvent.press(screen.getByLabelText('Me'));
    expect(screen.getByText('How I use Saath')).toBeTruthy();
    expect(screen.getByText('Signed in as +91 9876543210')).toBeTruthy();
    expect(screen.queryByLabelText('Call my contacts automatically: off')).toBeNull();
    expect(screen.queryByLabelText('Loud alarm when no one answers: off')).toBeNull();
    expect(screen.queryByText('Shared phone')).toBeNull();
  });
  test('a person who also looks after someone can switch to using both, and the other tabs come back', async () => {
    await mount(memberApp);
    await fireEvent.press(screen.getByLabelText('Me'));
    await fireEvent.press(screen.getByLabelText('Both'));
    await waitFor(() => expect(screen.getByLabelText('Safety')).toBeTruthy());
    expect(screen.getByLabelText('Care')).toBeTruthy();
  });
  test('their phone never watches for falls or runs the background service', async () => {
    await mount(memberApp, { sensing: true });
    expect(sensing.startFallListener).not.toHaveBeenCalled();
  });
  test('a person\u2019s phone does watch for falls', async () => {
    await mount({ ...productionState, usage: 'person', onboarded: true }, { sensing: true });
    await waitFor(() => expect(sensing.startFallListener).toHaveBeenCalled());
  });
});

describe('inviting someone', () => {
  test('the invite form says the invited person must use the number entered here', async () => {
    await mount({ ...productionState, usage: 'person', onboarded: true });
    await fireEvent.press(screen.getByLabelText('Circle'));
    await fireEvent.press(screen.getByLabelText('Add a person'));
    expect(await screen.findByText('They must create their Saath account with this same phone number, or the code will not work.')).toBeTruthy();
  });
  test('the invite published to the server carries that number, as 10 digits', async () => {
    const cfg = { url: 'https://api.example.test', key: 'k' };
    const f = jest.fn(async () => ({ ok: true, status: 201, json: async () => null }));
    await createInvite(cfg, signedIn, { name: 'Asha', role: 'family', code: 'ABC123', phone: '+91 98765 43210' }, f);
    expect(JSON.parse(f.mock.calls[0][1].body)).toEqual({
      household_id: 'h1',
      name: 'Asha',
      role: 'family',
      code: 'ABC123',
      phone: '9876543210',
    });
    await createInvite(cfg, signedIn, { name: 'Asha', role: 'family', code: 'ABC123' }, f);
    expect(JSON.parse(f.mock.calls[1][1].body).phone).toBeNull();
  });
  test('the joining card tells the care-giver which number to sign in with', async () => {
    await mount({ ...productionState, usage: 'member', onboarded: true });
    await fireEvent.press(screen.getByLabelText('I have an invite code'));
    expect(screen.getByText(/only works for the phone number the person entered for you/)).toBeTruthy();
  });
});

describe('usage in state', () => {
  test('it can be switched, and is kept', () => {
    const s = reducer({ ...initialState, hydrated: true }, { type: 'SET', key: 'usage', value: 'member' });
    expect(s.usage).toBe('member');
  });
});