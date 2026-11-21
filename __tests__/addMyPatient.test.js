import React from 'react';
import { Linking, Share } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { productionState } from '../src/state/reducer';
import { addUrl } from '../src/joinLink';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );
afterEach(() => jest.restoreAllMocks());

const signedIn = { phone: '9876543210', userId: 'u', access: 'A', refresh: 'R', householdId: 'h' };

describe('sign-up asks who you are', () => {
  test('the care-giver setup offers guardian, neighbour and ASHA, and never doctor', async () => {
    await mount({ ...productionState, usage: 'member' });
    ['Guardian', 'Neighbour', 'ASHA'].forEach((l) => expect(screen.getByLabelText(l)).toBeTruthy());
    expect(screen.queryByLabelText('Doctor')).toBeNull();
    await fireEvent.press(screen.getByLabelText('ASHA'));
    expect(screen.getByLabelText('ASHA').props.accessibilityState.selected).toBe(true);
  });

  test('the first screen has a separate door for doctors, and a doctor setup has no role choice', async () => {
    await mount(productionState);
    await fireEvent.press(await screen.findByLabelText('I am a doctor'));
    expect(await screen.findByText('About you, doctor')).toBeTruthy();
    ['Guardian', 'Neighbour', 'ASHA'].forEach((l) => expect(screen.queryByLabelText(l)).toBeNull());
  });
});

describe('a doctor adds a patient by showing a card', () => {
  const doctor = { ...productionState, usage: 'doctor', onboarded: true, cloud: signedIn, profile: { ...productionState.profile, name: 'Dr Rao' } };

  test('a doctor sees My patients and an Add my patient button that shows a card to scan', async () => {
    await mount(doctor);
    expect(screen.getByText('My patients')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Add my patient'));
    expect(await screen.findByText(/scan this with Saath/)).toBeTruthy();
  });

  test('without a name and number the card asks for sign-in first', async () => {
    await mount({ ...doctor, cloud: { ...signedIn, phone: '' } });
    await fireEvent.press(screen.getByLabelText('Add my patient'));
    expect(await screen.findByText(/Sign in with your name and number first/)).toBeTruthy();
  });

  test('a guardian sees the plain wording, not the doctor wording', async () => {
    await mount({ ...doctor, usage: 'member', profile: { ...doctor.profile, myRole: 'family' } });
    expect(screen.getByText('People I look after')).toBeTruthy();
    expect(screen.getByLabelText('Show my card to add someone')).toBeTruthy();
  });
});

describe('the patient scans the card', () => {
  test('the Add a person form opens already filled in as a doctor, and only needs confirming', async () => {
    jest.spyOn(Share, 'share').mockResolvedValue({});
    jest.spyOn(Linking, 'getInitialURL').mockResolvedValue(addUrl({ name: 'Dr Rao', phone: '9876543210', role: 'clinician' }));
    await mount({ ...productionState, usage: 'person', onboarded: true });
    await fireEvent.press(await screen.findByLabelText('Circle'));
    await waitFor(() => expect(screen.getByLabelText('Name').props.value).toBe('Dr Rao'));
    expect(screen.getByLabelText('Phone number').props.value).toBe('9876543210');
    await fireEvent.press(screen.getByLabelText('Add and send code'));
    // the invite code is shown straight away, for the doctor to scan back
    expect(await screen.findByText('Scan to join')).toBeTruthy();
    expect(screen.getAllByText(/Doctor/).length).toBeGreaterThan(0);
  });
});
