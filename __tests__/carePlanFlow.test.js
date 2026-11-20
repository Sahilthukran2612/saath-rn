import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>,
  );

const circle = { household_id: 'demo-amma', role: 'clinician', dial: 1, time_off: false, person_name: 'Amma (demo)' };

describe('a clinician publishes a care plan and the person sees it', () => {
  test('the builder is only for a clinician in that circle', async () => {
    await mount({ usage: 'member', demo: true, circles: [{ ...circle, role: 'family' }] });
    await fireEvent.press(await screen.findByLabelText('Amma (demo)'));
    expect(screen.queryByText('Publish plan')).toBeNull();
  });

  test('a doctor publishes a plan from the patient panel (demo mode applies it locally and says so)', async () => {
    await mount({ usage: 'member', demo: true, circles: [circle] });
    await fireEvent.press(await screen.findByLabelText('Amma (demo)'));
    await fireEvent.press(await screen.findByLabelText('Edit care plan')); // the builder opens in a drawer
    await fireEvent.changeText(await screen.findByLabelText('Medicine name'), 'Metformin');
    await fireEvent.changeText(screen.getByLabelText('Dose as written on the prescription'), '500 mg after food');
    await fireEvent.press(screen.getByLabelText('Save medicine'));
    await fireEvent.changeText(screen.getByLabelText('Sugar checks per day (number)'), '3');
    await fireEvent.changeText(screen.getByLabelText('A note for the person'), 'Review in two weeks');
    await fireEvent.press(screen.getByLabelText('Publish plan'));
    expect(await screen.findByText(/Demo: applied to this phone/)).toBeTruthy();
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