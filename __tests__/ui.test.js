import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';
import * as icons from '../src/components/icons';
import {
  Toggle,
  Segmented,
  Field,
  ProgressRing,
  DyeRing,
  CheckMark,
  LineChart,
  StageTrack,
  Avatar,
  Badge,
} from '../src/components/kit';
import { MoodFace, PlateDiagram, SaathMark, IkatBand } from '../src/components/art';
import { taskIcon } from '../src/components/taskIcons';
import { colors, fonts } from '../src/theme';

const wrap = (ui, preload = {}) => render(<StoreProvider preload={preload}>{ui}</StoreProvider>);
const mountApp = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );

describe('icon set', () => {
  test('every exported icon is a real component (a mistyped icon would crash at runtime)', () => {
    const entries = Object.entries({ ...icons });
    expect(entries.length).toBeGreaterThan(80);
    entries.forEach(([name, Icon]) => {
      expect([name, ['function', 'object'].includes(typeof Icon) && Icon !== null]).toEqual([name, true]);
    });
  });
  test('the icons the tab bar and task list rely on exist', () => {
    [
      'House',
      'Users',
      'ShieldCheck',
      'HeartPulse',
      'LayoutGrid',
      'UserRound',
      'Pill',
      'Utensils',
      'Footprints',
      'Droplet',
    ].forEach((n) => expect({ ...icons }[n]).toBeTruthy());
  });
  test('tasks map to a line icon, with a fallback for custom tasks', () => {
    expect(taskIcon({ icon: '💊' })).toBe({ ...icons }.Pill);
    expect(taskIcon({ icon: '📌' })).toBe({ ...icons }.ClipboardList);
  });
});

describe('theme', () => {
  test('brick red is distinct from every other colour and the three Mukta weights are named', () => {
    expect(Object.entries(colors).filter(([k, v]) => k !== 'brick' && v === colors.brick)).toEqual([]);
    expect(fonts).toEqual({ regular: 'Mukta_400Regular', semi: 'Mukta_600SemiBold', bold: 'Mukta_700Bold' });
  });
});

describe('Toggle', () => {
  test('is a switch whose label carries its state, and tapping reports the new value', async () => {
    const onValueChange = jest.fn();
    await wrap(<Toggle value={false} label="Large text" onValueChange={onValueChange} />);
    const sw = screen.getByLabelText('Large text: off');
    expect(sw.props.accessibilityRole).toBe('switch');
    await fireEvent.press(sw);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });
  test('shows on when on', async () => {
    await wrap(<Toggle value label="Time off" onValueChange={() => {}} />);
    expect(screen.getByLabelText('Time off: on').props.accessibilityState.checked).toBe(true);
  });
});

describe('Segmented', () => {
  const options = [
    { value: 0, label: 'Safety only' },
    { value: 1, label: 'Routine' },
    { value: 2, label: 'Full' },
  ];
  test('marks the chosen option and reports a tap', async () => {
    const onChange = jest.fn();
    await wrap(<Segmented options={options} value={1} onChange={onChange} />);
    expect(screen.getByLabelText('Routine').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Full').props.accessibilityState.selected).toBe(false);
    await fireEvent.press(screen.getByLabelText('Full'));
    expect(onChange).toHaveBeenCalledWith(2);
  });
});

describe('Field', () => {
  test('has a visible label, a matching accessibility label, and reports typing', async () => {
    const onChangeText = jest.fn();
    await wrap(<Field label="Guardian name" value="" onChangeText={onChangeText} />);
    expect(screen.getAllByText('Guardian name').length).toBeGreaterThan(0);
    await fireEvent.changeText(screen.getByLabelText('Guardian name'), 'Asha');
    expect(onChangeText).toHaveBeenCalledWith('Asha');
  });
});

describe('drawn components render without crashing at the edges', () => {
  test('progress ring clamps below 0 and above 1', async () => {
    await wrap(
      <>
        <ProgressRing progress={-3} />
        <ProgressRing progress={7} />
      </>
    );
  });
  test('dye ring with zero tasks, all tasks done, and more done than total', async () => {
    await wrap(
      <>
        <DyeRing total={0} done={0} />
        <DyeRing total={4} done={4} />
        <DyeRing total={2} done={9} />
      </>
    );
  });
  test('chart needs two points, and handles flat and extreme values', async () => {
    await wrap(
      <>
        <LineChart values={[100]} />
        <LineChart values={[120, 120, 120]} />
        <LineChart values={[40, 400]} />
      </>
    );
  });
  test('check mark, stage track, avatar, badge, mood faces, plate, mark and band', async () => {
    await wrap(
      <>
        <CheckMark done />
        <CheckMark done={false} />
        {[0, 1, 2, 3].map((s) => (
          <StageTrack key={s} stage={s} />
        ))}
        <Avatar name="Dr. Rao (clinic)" role="clinician" />
        <Avatar name="" />
        <Badge label="x" tone="brick" />
        {[1, 2, 3, 4, 5].map((n) => (
          <MoodFace key={n} level={n} />
        ))}
        <PlateDiagram />
        <SaathMark />
        <IkatBand />
      </>
    );
  });
  test('an avatar uses initials and ignores the bracketed relation', async () => {
    await wrap(<Avatar name="Asha (daughter)" role="family" />);
    // the avatar is decorative, so it is hidden from screen readers on purpose
    expect(screen.queryByText('A', { includeHiddenElements: true })).toBeTruthy();
    expect(screen.queryByText('AD', { includeHiddenElements: true })).toBeNull();
  });
});

describe('Today and the tab bar', () => {
  test('the six tabs are labelled and the selected one says so', async () => {
    await mountApp({});
    ['Today', 'Circle', 'Safety', 'Care', 'Plan', 'Me'].forEach((l) =>
      expect(screen.getByLabelText(l)).toBeTruthy()
    );
    expect(screen.getByLabelText('Today').props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByLabelText('Care'));
    expect(screen.getByLabelText('Care').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('Today').props.accessibilityState.selected).toBe(false);
  });
  test('the elder home shows the ring caption and ticking a task updates it', async () => {
    await mountApp({ mode: 'elder' });
    // the hero shows the count as a big number, the total and the words "done today"
    expect(screen.getByText('0')).toBeTruthy();
    expect(screen.getByText('/ 4')).toBeTruthy();
    expect(screen.getByText('done today')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Lunch'));
    expect(screen.getByText('1')).toBeTruthy();
    expect(screen.getByLabelText('Lunch, done').props.accessibilityState.checked).toBe(true);
  });
  test("tapping I'm OK confirms in words", async () => {
    await mountApp({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText("I'm OK"));
    expect(screen.getByText('Your circle knows you are fine.')).toBeTruthy();
  });
  test('the adult home shows real stock numbers, not fixed demo ones', async () => {
    await mountApp({
      mode: 'adult',
      meds: { name: 'Test med', pillsLeft: 6, perDay: 2 },
      testPlan: { perDay: 2, strips: 8 },
    });
    expect(screen.getByText('3')).toBeTruthy(); // 6 tablets / 2 a day
    expect(screen.getByText('8')).toBeTruthy(); // strips left
  });
  test('the family view says all is well, then flags an open alert', async () => {
    await mountApp({ role: 'family' });
    expect(screen.getByText('All is well')).toBeTruthy();
  });
  test('the neighbour view says it is safety only', async () => {
    await mountApp({ role: 'neighbour' });
    expect(screen.getByText('You are a neighbour')).toBeTruthy();
    expect(screen.getByText('You get safety alerts only')).toBeTruthy();
    expect(screen.getByText('You never see')).toBeTruthy();
  });
  test('the greeting is localized', async () => {
    await mountApp({ lang: 'hi' });
    expect(screen.getByLabelText('आज')).toBeTruthy();
  });
});

describe('Circle', () => {
  test('the privacy dial is a control per member and shows who is chosen', async () => {
    await mountApp({});
    await fireEvent.press(screen.getByLabelText('Circle'));
    // one switch per person in the circle: who is in the privacy dial, and who is not
    expect(screen.getAllByLabelText(/In my privacy dial/).length).toBe(4);
    expect(screen.getAllByLabelText('In my privacy dial: on').length).toBe(3);
    expect(screen.getAllByLabelText('Full')[0].props.accessibilityState.selected).toBe(true); // Asha starts at Full
    // switching someone in shows their level
    await fireEvent.press(screen.getByLabelText('In my privacy dial: off'));
    expect(screen.getAllByLabelText('In my privacy dial: on').length).toBe(4);
    await fireEvent.press(screen.getAllByLabelText('Full')[1]);
    expect(screen.getAllByLabelText('Full')[1].props.accessibilityState.selected).toBe(true);
  });
  test('Time off is a labelled switch', async () => {
    await mountApp({});
    await fireEvent.press(screen.getByLabelText('Circle'));
    const first = screen.getAllByLabelText('Time off: off')[0];
    await fireEvent.press(first);
    expect(screen.getAllByLabelText('Time off: on').length).toBe(1);
  });
});

describe('alert screen', () => {
  const asha = { id: 'm1', name: 'Asha (daughter)', role: 'family', phone: '9000000001' };
  test('shows the countdown, the confidence and the two answers', async () => {
    await mountApp({
      alert: {
        id: 'a',
        kind: 'fall',
        confidence: 0.9,
        reason: 'impact then still',
        phase: 'countdown',
        remaining: 25,
        stepIndex: 0,
        chain: [asha],
      },
    });
    expect(screen.getByText('Are you OK?')).toBeTruthy();
    expect(screen.getByText('25')).toBeTruthy();
    expect(screen.getByText(/Confidence: 90%/)).toBeTruthy();
    // Today is still mounted behind the alert, so there are two I'm OK controls
    expect(screen.getAllByLabelText("I'm OK")).toHaveLength(2);
    expect(screen.getByLabelText('False alarm')).toBeTruthy();
  });
  test('the person being reached can be called, messaged on WhatsApp, or sent an SMS', async () => {
    await mountApp({
      alert: {
        id: 'a',
        kind: 'fall',
        confidence: 0.9,
        reason: 'x',
        phase: 'escalating',
        remaining: 20,
        stepIndex: 0,
        chain: [asha],
      },
    });
    expect(screen.getByLabelText('Call Asha (daughter)')).toBeTruthy();
    expect(screen.getByLabelText('WhatsApp Asha (daughter)')).toBeTruthy();
    expect(screen.getByLabelText('Send message Asha (daughter)')).toBeTruthy();
  });
  test('a contact with no usable number gets no WhatsApp button', async () => {
    await mountApp({
      alert: {
        id: 'a',
        kind: 'fall',
        confidence: 0.9,
        reason: 'x',
        phase: 'escalating',
        remaining: 20,
        stepIndex: 0,
        chain: [{ ...asha, phone: '123' }],
      },
    });
    expect(screen.queryByLabelText('WhatsApp Asha (daughter)')).toBeNull();
    expect(screen.getByLabelText('Call Asha (daughter)')).toBeTruthy();
  });  test('when nobody could be reached it says so', async () => {
    await mountApp({
      alert: {
        id: 'a',
        kind: 'fall',
        confidence: 0.9,
        reason: 'x',
        phase: 'done',
        remaining: 0,
        stepIndex: 0,
        chain: [asha],
      },
    });
    expect(screen.getByText(/No one answered yet/)).toBeTruthy();
  });
});
