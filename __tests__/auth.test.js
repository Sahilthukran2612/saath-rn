import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { roleFromAccount } from '../src/accountRole';
import * as pushService from '../src/services/push';

const reply = (status, data) => ({ ok: status >= 200 && status < 300, status, json: async () => data });

describe('the role worked out from an account', () => {
  test('a clinician in any circle is a doctor', () => {
    expect(roleFromAccount({ circles: [{ role: 'family' }, { role: 'clinician' }] })).toBe('doctor');
  });
  test('in other circles with nothing of their own is a care-giver; with something of their own, both', () => {
    expect(roleFromAccount({ circles: [{ role: 'neighbour' }] })).toBe('member');
    expect(roleFromAccount({ circles: [{ role: 'family' }], hasReadings: true })).toBe('both');
    expect(roleFromAccount({ circles: [{ role: 'family' }], ownMembers: [{ id: 'm' }] })).toBe('both');
  });
  test('everyone else is a patient, including a brand new account', () => {
    expect(roleFromAccount({ hasPlan: true })).toBe('person');
    expect(roleFromAccount()).toBe('person');
  });
});

describe('the welcome screen', () => {
  const KEYS = ['EXPO_PUBLIC_SAATH_API_URL', 'EXPO_PUBLIC_SAATH_ANON_KEY'];
  const saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
  let realFetch;
  let spy;
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SAATH_API_URL = 'https://x.test';
    process.env.EXPO_PUBLIC_SAATH_ANON_KEY = 'k';
    realFetch = global.fetch;
    spy = jest.spyOn(pushService, 'setupPush').mockResolvedValue({ ok: false, reason: 'unavailable' });
  });
  afterEach(() => {
    global.fetch = realFetch;
    spy.mockRestore();
    KEYS.forEach((k) => (saved[k] === undefined ? delete process.env[k] : (process.env[k] = saved[k])));
  });
  const fresh = { demo: false, onboarded: false, usage: null, members: [] };
  const mount = () =>
    render(
      <StoreProvider preload={fresh}>
        <AppShell sensing={false} />
      </StoreProvider>
    );
  // A fake server: the account signs in, and the rest of the answers come from `data`.
  const server = (data) =>
    jest.fn(async (url) => {
      if (url.includes('grant_type=password')) return reply(200, { access_token: 'A', refresh_token: 'R', user: { id: 'u1' } });
      if (url.includes('/auth/v1/signup')) return reply(200, { access_token: 'A', refresh_token: 'R', user: { id: 'u1' } });
      if (url.includes('select=id,person_name')) return reply(200, [{ id: 'h1', person_name: data.name || '' }]);
      if (url.includes('/rest/v1/my_circles')) return reply(200, data.circles || []);
      if (url.includes('/rest/v1/members')) return reply(200, data.members || []);
      if (url.includes('/rest/v1/care_plans')) return reply(200, data.plans || []);
      if (url.includes('/rest/v1/readings')) return reply(200, data.readings || []);
      return reply(200, []);
    });
  const fill = async (button) => {
    await fireEvent.changeText(screen.getByLabelText('Your mobile number'), '9876543210');
    await fireEvent.changeText(screen.getByLabelText('Password (8 or more characters)'), 'abcdefgh1');
    await fireEvent.press(screen.getByLabelText(button));
  };

  test('a first-time phone opens on two doors, before anything else', async () => {
    await mount();
    expect(screen.getByLabelText('Create account')).toBeTruthy();
    expect(screen.getByLabelText('I already have an account')).toBeTruthy();
    expect(screen.queryByText('How will you use Saath?')).toBeNull();
  });

  test('creating an account leads to "How will you use Saath?"', async () => {
    global.fetch = server({});
    await mount();
    await fireEvent.press(screen.getByLabelText('Create account'));
    await fill('Create account');
    await waitFor(() => expect(screen.getByText('How will you use Saath?')).toBeTruthy());
  });

  test('a returning patient signs in, keeps the name on the account, and is asked only the phone-only steps', async () => {
    global.fetch = server({ name: 'Meera', plans: [{ created_at: '2026-11-18T00:00:00Z', author_name: 'Dr Rao', plan: { v: 1, meds: [], tasks: [{ title: 'Walk', hour: 18 }] } }] });
    await mount();
    await fireEvent.press(screen.getByLabelText('I already have an account'));
    await fill('Sign in');
    await waitFor(() => expect(screen.getByText('Who should we reach?')).toBeTruthy());
    expect(screen.getByText('Step 1 of 2')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Next'));
    await fireEvent.press(screen.getByLabelText('Start using Saath'));
    await waitFor(() => expect(screen.getByLabelText("I'm OK")).toBeTruthy());
  });

  test('a returning doctor goes straight to their patients', async () => {
    global.fetch = server({ name: 'Rao', circles: [{ household_id: 'h2', role: 'clinician', dial: 2, time_off: false, person_name: 'Meera' }] });
    await mount();
    await fireEvent.press(screen.getByLabelText('I already have an account'));
    await fill('Sign in');
    await waitFor(() => expect(screen.getByLabelText('Meera')).toBeTruthy());
    expect(screen.queryByText('Who should we reach?')).toBeNull();
  });

  test('a wrong password says so and creates nothing', async () => {
    const urls = [];
    global.fetch = jest.fn(async (url) => {
      urls.push(url);
      return url.includes('grant_type=password') ? reply(400, { error_code: 'invalid_credentials' }) : reply(200, []);
    });
    await mount();
    await fireEvent.press(screen.getByLabelText('I already have an account'));
    await fill('Sign in');
    await waitFor(() => expect(screen.getByText('The number or the password is wrong.')).toBeTruthy());
    expect(urls.some((u) => u.includes('/auth/v1/signup'))).toBe(false);
  });
});
