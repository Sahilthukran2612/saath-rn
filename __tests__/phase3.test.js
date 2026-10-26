import React from 'react';
import { Share } from 'react-native';
import * as Print from 'expo-print';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { reducer, initialState } from '../src/state/reducer';
import { StoreProvider } from '../src/state/store';
import AppShell from '../src/AppShell';

const run = (s, ...a) => a.reduce(reducer, s);
const consent = { status: 'granted', guardianName: 'A', guardianPhone: '9876543210', at: 1 };
const mount = (preload) =>
  render(
    <StoreProvider preload={preload}>
      <AppShell sensing={false} />
    </StoreProvider>
  );
const openPlan = async (label) => {
  await fireEvent.press(screen.getByLabelText('Plan'));
  if (label) await fireEvent.press(screen.getByLabelText(label));
};

describe('Phase 3 reducer', () => {
  test('ladder: request without approval moves up, with approval waits, then approve', () => {
    let s = run(initialState, { type: 'LADDER_REQUEST', id: 'refills' });
    expect(s.ladder[0].stage).toBe(1);
    s = run({ ...initialState, ladderApproval: true }, { type: 'LADDER_REQUEST', id: 'refills' });
    expect(s.ladder[0]).toMatchObject({ stage: 0, pending: true });
    s = run(s, { type: 'LADDER_APPROVE', id: 'refills' });
    expect(s.ladder[0]).toMatchObject({ stage: 1, pending: false });
    s = run(s, { type: 'LADDER_BACK', id: 'refills' });
    expect(s.ladder[0].stage).toBe(0);
  });
  test('visit questions: blank ignored, added, removed', () => {
    let s = run(initialState, { type: 'VISIT_Q_ADD', text: '   ' });
    expect(s.visitQuestions).toEqual([]);
    s = run(s, { type: 'VISIT_Q_ADD', text: 'Is this normal?' }, { type: 'VISIT_Q_ADD', text: 'Second' });
    s = run(s, { type: 'VISIT_Q_REMOVE', index: 0 });
    expect(s.visitQuestions).toEqual(['Second']);
  });
  test('one check-in per week', () => {
    const s = run(
      initialState,
      { type: 'CHECKIN', mood: 2, at: Date.now() },
      { type: 'CHECKIN', mood: 4, at: Date.now() }
    );
    expect(s.checkins).toHaveLength(1);
    expect(s.checkins[0].mood).toBe(4);
  });
  test('waist outside a sane range is ignored', () => {
    expect(run(initialState, { type: 'WAIST_ADD', cm: 5, at: 1 }).waist).toEqual([]);
    expect(run(initialState, { type: 'WAIST_ADD', cm: 90, at: 1 }).waist).toHaveLength(1);
  });
  test('foot photos stay as local paths and the list is capped', () => {
    let s = initialState;
    for (let i = 0; i < 40; i++) s = run(s, { type: 'FOOT_PHOTO', uri: `file:///p${i}.jpg`, at: i });
    expect(s.footPhotos).toHaveLength(30);
    expect(s.footPhotos.every((p) => p.uri.startsWith('file://'))).toBe(true);
  });
  test('ladder changes go through the offline queue', () => {
    expect(run(initialState, { type: 'LADDER_REQUEST', id: 'refills', at: 1 }).queue.length).toBe(1);
  });
});

describe('Plan screen', () => {
  test('a person in elder mode sees the shared sections but not the teen ones', async () => {
    await mount({ mode: 'elder' });
    await fireEvent.press(screen.getByLabelText('Plan'));
    expect(screen.getByLabelText('Visit prep')).toBeTruthy();
    expect(screen.getByLabelText('Health passport')).toBeTruthy();
    expect(screen.queryByLabelText('Handing over care')).toBeNull();
    expect(screen.queryByLabelText('School plan')).toBeNull();
  });
  test('a teen also sees the ladder and the school plan', async () => {
    await mount({ mode: 'teen', consent });
    await fireEvent.press(screen.getByLabelText('Plan'));
    expect(screen.getByLabelText('Handing over care')).toBeTruthy();
    expect(screen.getByLabelText('School plan')).toBeTruthy();
  });
  test('a neighbour has no access to Plan', async () => {
    await mount({ role: 'neighbour' });
    await fireEvent.press(screen.getByLabelText('Plan'));
    expect(screen.getByText(/do not have access/)).toBeTruthy();
  });
  test('a family member sees only the ladder and can agree to a step', async () => {
    const ladder = [
      { id: 'refills', stage: 0, pending: true },
      { id: 'explain', stage: 0, pending: false },
      { id: 'visitPrep', stage: 0, pending: false },
      { id: 'badDays', stage: 0, pending: false },
    ];
    await mount({ mode: 'teen', consent, role: 'family', ladder });
    await fireEvent.press(screen.getByLabelText('Plan'));
    expect(screen.queryByLabelText('Visit prep')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Handing over care'));
    await fireEvent.press(screen.getByLabelText('Agree'));
    expect(screen.queryByText('Waiting for a parent to agree')).toBeNull();
  });
  test('a family view of the ladder is written to the audit log', async () => {
    await mount({ mode: 'teen', consent, role: 'family' });
    await fireEvent.press(screen.getByLabelText('Plan'));
    await fireEvent.press(screen.getByLabelText('Handing over care'));
    // switch to the person (demo role bar) and read the log they can see
    await fireEvent.press(screen.getByLabelText('Person'));
    await fireEvent.press(screen.getByLabelText('Circle'));
    expect(screen.getByText(/family · Handing over care/)).toBeTruthy();
  });
  test('the teen can mark a step ready, and the stage name updates', async () => {
    await mount({ mode: 'teen', consent });
    await openPlan('Handing over care');
    await fireEvent.press(screen.getAllByLabelText('I am ready for the next step')[0]);
    expect(screen.getAllByText(/\[ Together \]/).length).toBe(1);
  });
  test('visit prep: a suggested question is added and shown', async () => {
    await mount({});
    await openPlan('Visit prep');
    await fireEvent.press(screen.getByLabelText('Is my testing plan right for me?'));
    expect(screen.getByText(/1\. Is my testing plan right for me\?/)).toBeTruthy();
  });
  test('visit prep never invents sugar readings from demo data', async () => {
    await mount({});
    await openPlan('Visit prep');
    expect(screen.getByText(/No sugar readings logged yet/)).toBeTruthy();
  });
  test('passport: QR shows only after tapping, and PDF is built offline', async () => {
    await mount({ profile: { name: 'Mina', condition: 'Type 1', allergies: '', emergencyId: 'm1' } });
    await openPlan('Health passport');
    expect(screen.queryByText(/\/ 700/)).toBeNull();
    await fireEvent.press(screen.getByLabelText('Show QR code'));
    expect(screen.getByText(/\/ 700/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Save as PDF'));
    expect(Print.printToFileAsync).toHaveBeenCalled();
    const html = Print.printToFileAsync.mock.calls[0][0].html;
    expect(html).toContain('Mina');
    expect(html).toContain('<b>Name</b>');
    expect(html).toContain('<b>Condition</b>');
    expect(html).not.toMatch(/<b>[a-z]<\/b>/); // no cryptic one-letter QR keys on the page
    expect(html).not.toMatch(/accel|sensor/i);
  });
  test('passport: a too-long note is reported instead of a broken QR', async () => {
    await mount({ profile: { name: 'M', condition: 'C', allergies: 'x'.repeat(900), emergencyId: 'm1' } });
    await openPlan('Health passport');
    expect(screen.getByText(/Too long for a QR code/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Show QR code'));
    expect(screen.queryByText(/\/ 700/)).toBeNull();
  });
  test('check-in: tapping a face shows a gentle reply', async () => {
    await mount({});
    await openPlan('Weekly check-in');
    expect(screen.getByText(/no wrong answer/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('😣 Very hard'));
    expect(screen.getByText(/Thank you for sharing/)).toBeTruthy();
  });
  test('food guide is marked verify locally and switches to Hindi', async () => {
    await mount({ lang: 'hi' });
    await fireEvent.press(screen.getByLabelText('योजना'));
    await fireEvent.press(screen.getByLabelText('खाने की जानकारी'));
    expect(screen.getByText(/स्थानीय रूप से जाँचें/)).toBeTruthy();
    expect(screen.getByText(/आधी थाली/)).toBeTruthy();
  });
  test('food log adds a meal icon', async () => {
    await mount({});
    await openPlan('Food guide');
    await fireEvent.press(screen.getByLabelText('🍚'));
    expect(screen.getByText(/Meals today: 🍚/)).toBeTruthy();
  });
  test('foot check can be saved and counted', async () => {
    await mount({});
    await openPlan('Body check');
    await fireEvent.press(screen.getByLabelText('Look for cuts or sores'));
    await fireEvent.press(screen.getByLabelText('Save foot check'));
    expect(screen.getByText('Foot checks done: 1')).toBeTruthy();
  });
  test('risk check needs a waist reading, then says screening not diagnosis', async () => {
    await mount({});
    await openPlan('Body check');
    await fireEvent.changeText(screen.getByLabelText('Age in years'), '45');
    await fireEvent.press(screen.getByLabelText('See my score'));
    expect(screen.queryByText(/^Score:/)).toBeNull();
    await fireEvent.changeText(screen.getByLabelText('Waist in cm'), '95');
    await fireEvent.press(screen.getByLabelText('Save waist'));
    await fireEvent.press(screen.getByLabelText('See my score'));
    expect(screen.getByText(/^Score: \d+/)).toBeTruthy();
    expect(screen.getByText(/screening score, not a diagnosis/)).toBeTruthy();
  });
  test("school card share is the teen's own tap and is logged", async () => {
    const spy = jest.spyOn(Share, 'share').mockResolvedValue({});
    await mount({
      mode: 'teen',
      consent,
      profile: { name: 'Mina', condition: '', allergies: '', emergencyId: 'm1' },
    });
    await openPlan('School plan');
    expect(screen.getByText(/sugar, jaggery or a glucose biscuit/)).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Share this card'));
    expect(spy).toHaveBeenCalled();
    expect(spy.mock.calls[0][0].message).not.toMatch(/\b\d+\s*units?\b/i);
    spy.mockRestore();
  });
  test('the school card shows the guardian number only because the guardian agreed', async () => {
    await mount({ mode: 'teen', consent });
    await openPlan('School plan');
    expect(screen.getByText(/9000000001/)).toBeTruthy();
  });
});

describe('PDF export falls back instead of failing', () => {
  const Sharing = require('expo-sharing');
  const profile = { name: 'Mina', condition: 'Type 1', allergies: '', emergencyId: 'm1' };
  beforeEach(() => {
    Print.printAsync.mockClear();
    Print.printToFileAsync.mockClear();
  });
  test('shares the file with a PDF type when the phone allows it', async () => {
    Sharing.shareAsync.mockClear();
    await mount({ profile });
    await openPlan('Health passport');
    await fireEvent.press(screen.getByLabelText('Save as PDF'));
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      'file:///x.pdf',
      expect.objectContaining({ mimeType: 'application/pdf' })
    );
    expect(Print.printAsync).not.toHaveBeenCalled();
  });
  test('when the file cannot be shared, the print dialog (Save as PDF) opens instead', async () => {
    Sharing.shareAsync.mockRejectedValueOnce(new Error('Not allowed to read file under given URL'));
    await mount({ profile });
    await openPlan('Health passport');
    await fireEvent.press(screen.getByLabelText('Save as PDF'));
    expect(Print.printAsync).toHaveBeenCalled();
    expect(screen.queryByText(/Could not make the PDF/)).toBeNull();
  });
  test('if everything fails, a plain message is shown, never a raw error', async () => {
    Print.printToFileAsync.mockRejectedValueOnce(new Error('ExpoPrint boom'));
    await mount({ profile });
    await openPlan('Health passport');
    await fireEvent.press(screen.getByLabelText('Save as PDF'));
    expect(screen.getByText(/Could not make the PDF/)).toBeTruthy();
    expect(screen.queryByText(/boom/)).toBeNull();
  });
});

describe('printed passport rows', () => {
  const { passportRows } = require('../src/components/plan/Handover');
  const { t } = require('../src/i18n/strings');
  const en = (k) => t('en', k);
  test('uses readable labels and skips empty fields', () => {
    const rows = passportRows({ v: 1, n: 'Mina', c: '', m: 'Metformin' }, en);
    expect(rows).toEqual([
      ['Name', 'Mina'],
      ['Medicine', 'Metformin'],
    ]);
  });
  test('writes the sugar summary as a sentence, and the number only with a label', () => {
    const rows = passportRows({ n: 'M', s: { n: 2, avg: 140, last: 150 }, e: 'Asha', p: '9000000001' }, en);
    expect(rows.find(([l]) => l === 'Sugar summary')[1]).toBe('2 sugar readings, average 140, last 150');
    expect(rows.find(([l]) => l === 'Phone number')[1]).toBe('9000000001');
  });
  test('labels are in Hindi when the language is Hindi', () => {
    const rows = passportRows({ n: 'Mina' }, (k) => t('hi', k));
    expect(rows[0][0]).toBe('नाम');
  });
});
