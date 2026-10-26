import React from 'react';
import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import { Body } from '../src/components/ui';
import { colors, sizes } from '../src/theme';

const mount = (ui, preload = {}) => render(<StoreProvider preload={preload}>{ui}</StoreProvider>);

describe('design system', () => {
  test('line height follows an overridden font size, so big emoji are not clipped', async () => {
    await mount(<Body style={{ fontSize: 34 }}>{'💊'}</Body>);
    const style = StyleSheet.flatten(screen.getByText('💊').props.style);
    expect(style.fontSize).toBe(34);
    expect(style.lineHeight).toBeGreaterThanOrEqual(34);
  });
  test('default body text is at least 18 and scales in large-text mode', async () => {
    await mount(<Body>plain</Body>);
    expect(StyleSheet.flatten(screen.getByText('plain').props.style).fontSize).toBeGreaterThanOrEqual(18);
  });
  test('large-text mode makes body text bigger', async () => {
    await mount(<Body>big</Body>, { largeText: true });
    expect(StyleSheet.flatten(screen.getByText('big').props.style).fontSize).toBeGreaterThan(18);
  });
  test('touch target stays at least 56', () => expect(sizes.target).toBeGreaterThanOrEqual(56));
  test('brick red is still distinct from every other palette colour', () => {
    const others = Object.entries(colors).filter(([k]) => k !== 'brick');
    others.forEach(([, v]) => expect(v).not.toBe(colors.brick));
  });
});
