import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import { SHOW_HEART } from '../src/features';

describe('the heart-rate band is hidden', () => {
  test('the switch is off', () => {
    expect(SHOW_HEART).toBe(false);
  });

  test('Safety has no band card', async () => {
    await render(
      <StoreProvider preload={{}}>
        <AppShell sensing={false} />
      </StoreProvider>
    );
    await fireEvent.press(screen.getByLabelText('Safety'));
    expect(screen.queryByLabelText('Find my band')).toBeNull();
  });
});
