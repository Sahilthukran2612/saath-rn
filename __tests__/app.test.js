import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

test("elder home shows one big I'm OK button", async () => {
  await mount({ mode: 'elder' });
  expect(screen.getAllByLabelText("I'm OK")).toHaveLength(1);
});

test('teen home shows the transition ladder', async () => {
  await mount({
    mode: 'teen',
    consent: { status: 'granted', guardianName: 'A', guardianPhone: '9876543210', at: 1 },
  });
  expect(screen.getByText('Transition ladder')).toBeTruthy();
});

test("simulate fall opens the alert, I'm OK closes it", async () => {
  await mount({ mode: 'elder' });
  await fireEvent.press(screen.getByLabelText('Safety'));
  await fireEvent.press(screen.getByLabelText('Simulate a fall'));
  expect(screen.getByText('Are you OK?')).toBeTruthy();
  await fireEvent.press(screen.getAllByLabelText("I'm OK")[0]);
  expect(screen.queryByText('Are you OK?')).toBeNull();
});

test('someone who only looks after people has one screen: no Care, Plan, Safety or Circle tabs', async () => {
  await mount({ usage: 'member' });
  ['Care', 'Plan', 'Safety', 'Circle'].forEach((l) => expect(screen.queryByLabelText(l)).toBeNull());
  expect(screen.getByLabelText('Me')).toBeTruthy();
});

test('Hindi strings switch', async () => {
  await mount({ lang: 'hi' });
  expect(screen.getByLabelText('सुरक्षा')).toBeTruthy();
});
