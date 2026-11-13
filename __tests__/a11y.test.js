import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const ROLES_WITH_PRESS = new Set(['button', 'switch', 'tab', 'checkbox', 'radio', 'link']);
const TABS = ['Today', 'Circle', 'Safety', 'Care', 'Plan', 'Me'];

const textOf = (node) =>
  typeof node === 'string'
    ? node
    : (node?.children || []).map(textOf).join('');

// Every control a screen reader can land on must have a name: an explicit label, or visible text.
function unlabelled(json) {
  const bad = [];
  const walk = (n, trail) => {
    if (!n || typeof n === 'string') return;
    const p = n.props || {};
    const role = p.accessibilityRole || p.role;
    const label = p.accessibilityLabel || p['aria-label'];
    if (ROLES_WITH_PRESS.has(role) && !label && !textOf(n).trim()) bad.push(`${trail} ${role}`);
    if (n.type === 'TextInput' && !label) bad.push(`${trail} TextInput`);
    (n.children || []).forEach((c) => walk(c, `${trail}>${n.type}`));
  };
  (Array.isArray(json) ? json : [json]).forEach((j) => walk(j, ''));
  return bad;
}

const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

const GRANTED = { status: 'granted', guardianName: 'Asha', guardianPhone: '9000000001', at: 1 };

describe('accessibility audit: every control has a name', () => {
  const homes = [
    ['elder, person', { mode: 'elder' }],
    ['adult, person', { mode: 'adult' }],
    ['teen, person', { mode: 'teen', consent: GRANTED }],
    ['family', { role: 'family' }],
    ['neighbour', { role: 'neighbour' }],
    ['asha', { role: 'asha' }],
    ['clinician', { role: 'clinician' }],
    ['elder in Hindi with large text', { mode: 'elder', lang: 'hi', largeText: true }],
  ];
  test.each(homes)('%s: all six tabs', async (_name, preload) => {
    await mount(preload);
    for (const tab of TABS) {
      await fireEvent.press(screen.getAllByRole('tab')[TABS.indexOf(tab)]);
      expect([tab, unlabelled(screen.toJSON())]).toEqual([tab, []]);
    }
  });

  test('the alert takeover has named controls', async () => {
    await mount({
      alert: {
        id: 'a',
        kind: 'fall',
        confidence: 0.9,
        reason: 'x',
        phase: 'countdown',
        remaining: 20,
        stepIndex: 0,
        chain: [{ id: 'm1', name: 'Asha (daughter)', role: 'family', phone: '9000000001' }],
      },
    });
    expect(unlabelled(screen.toJSON())).toEqual([]);
  });

  test('each Plan tool opens with named controls', async () => {
    await mount({ mode: 'teen', consent: GRANTED }); // the teen sees all seven tools
    await fireEvent.press(screen.getAllByRole('tab')[4]);
    const names = [
      'Handing over care',
      'Visit prep',
      'Health passport',
      'Weekly check-in',
      'Food guide',
      'Body check',
      'School plan',
    ];
    for (const n of names) {
      await fireEvent.press(screen.getByLabelText(n));
      expect([n, unlabelled(screen.toJSON())]).toEqual([n, []]);
      await fireEvent.press(screen.getByLabelText('Back'));
    }
  });
});
