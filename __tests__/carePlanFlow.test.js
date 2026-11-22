import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { publishPlan } from '../src/services/cloud';

jest.mock('../src/services/cloud', () => ({
  ...jest.requireActual('../src/services/cloud'),
  isConfigured: () => true,
  cloudConfig: () => ({ url: 'https://api.example.test', key: 'k' }),
  fetchLatestPlan: jest.fn(async () => ({ ok: true, row: null })),
  publishPlan: jest.fn(async () => ({ ok: true })),
}));
const signedIn = { phone: '9876543210', userId: 'u', access: 'A', refresh: 'R', householdId: 'h' };

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );

const circle = { household_id: 'h-amma', role: 'clinician', dial: 1, time_off: false, person_name: 'Amma' };

describe('a clinician publishes a care plan and the person sees it', () => {
  test('a guardian never sees the builder, and a doctor phone never lists a circle where it is not the doctor', async () => {
    await mount({ usage: 'member', circles: [{ ...circle, role: 'family' }] });
    await fireEvent.press(await screen.findByLabelText('Amma'));
    expect(screen.queryByText('Publish plan')).toBeNull();
    expect(screen.queryByLabelText('Edit care plan')).toBeNull();
  });

  test('a doctor phone only lists patients, and says how many invitations were set aside', async () => {
    await mount({ usage: 'doctor', circles: [circle, { ...circle, household_id: 'h2', role: 'neighbour', person_name: 'Chacha' }] });
    expect(await screen.findByLabelText('Amma')).toBeTruthy();
    expect(screen.queryByLabelText('Chacha')).toBeNull();
    expect(screen.getByText(/Doctors only see their patients/)).toBeTruthy();
  });

  test('a doctor publishes a plan from the patient panel and it is sent to the server', async () => {
    await mount({ usage: 'doctor', cloud: signedIn, circles: [circle] });
    await fireEvent.press(await screen.findByLabelText('Amma'));
    await fireEvent.press(await screen.findByLabelText('Edit care plan')); // the builder opens in a drawer
    await fireEvent.changeText(await screen.findByLabelText('Medicine name'), 'Metformin');
    await fireEvent.changeText(screen.getByLabelText('Dose as written on the prescription'), '500 mg after food');
    await fireEvent.press(screen.getByLabelText('Save medicine'));
    await fireEvent.changeText(screen.getByLabelText('Sugar checks per day (number)'), '3');
    await fireEvent.changeText(screen.getByLabelText('A note for the person'), 'Review in two weeks');
    await fireEvent.press(screen.getByLabelText('Publish plan'));
    expect(await screen.findByText(/Published\. Their phone updates next time/)).toBeTruthy();
    expect(publishPlan).toHaveBeenCalledTimes(1);
    expect(publishPlan.mock.calls[0][2]).toBe('h-amma');
    expect(publishPlan.mock.calls[0][4]).toMatchObject({ testPerDay: 3, notes: 'Review in two weeks' });
  });

  test('on the patient phone, an applied plan shows who set it, then the medicine on Care', async () => {
    const carePlan = { version: 'v1', author: 'Dr Rao', at: 1, notes: 'Review in two weeks', meds: 1, tasks: 0, testPerDay: 3, seen: false };
    const medicines = [{ id: 'plan-x', name: 'Metformin', dose: '500 mg after food', when: 'afterBreakfast', plan: true }];
    await mount({ usage: 'person', carePlan, medicines });
    expect(await screen.findByText(/Dr Rao updated your plan/)).toBeTruthy();
    expect(screen.getByText('Review in two weeks')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Got it'));
    await waitFor(() => expect(screen.queryByText(/updated your plan/)).toBeNull());
    await fireEvent.press(screen.getByLabelText('Care'));
    expect(await screen.findByText('Metformin')).toBeTruthy();
    expect(screen.getByText(/500 mg after food/)).toBeTruthy();
    expect(screen.getAllByText(/set by Dr Rao/).length).toBeGreaterThan(0);
  });
});