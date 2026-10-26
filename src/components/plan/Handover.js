import React, { useState } from 'react';
import { Share, TextInput, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { BigButton, Body, Card, Chip, Title } from '../ui';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import {
  STAGES,
  overallStage,
  passportFits,
  passportPayload,
  passportString,
  visitSummary,
} from '../../plan';
import { colors } from '../../theme';

const fmt = (s, vars) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v ?? '—')), s);
const field = {
  minHeight: 56,
  fontSize: 18,
  borderWidth: 2,
  borderColor: colors.indigo,
  borderRadius: 12,
  paddingHorizontal: 12,
  backgroundColor: colors.white,
};
const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 6 };

// The person decides when they are ready. A parent may agree or say "not yet".
// Going back a step is allowed and neutral.
export function LadderSection() {
  const { state, dispatch, t } = useStore();
  const isPerson = state.role === 'person';
  const isFamily = state.role === 'family';
  return (
    <View style={{ gap: 12 }}>
      <Body>{t('ladder.teenOnly')}</Body>
      <Body bold>
        {t('sec.ladder')}: {t(`stage.${STAGES[overallStage(state.ladder)]}`)}
      </Body>
      {isPerson && (
        <Chip
          label={`${t('ladder.needApproval')}: ${state.ladderApproval ? 'on' : 'off'}`}
          active={state.ladderApproval}
          onPress={() => dispatch({ type: 'SET', key: 'ladderApproval', value: !state.ladderApproval })}
        />
      )}
      {state.ladder.map((s) => (
        <Card key={s.id}>
          <Title>{t(`skill.${s.id}`)}</Title>
          <Body>
            {STAGES.map((st, i) => (i === s.stage ? `[ ${t(`stage.${st}`)} ]` : t(`stage.${st}`))).join(
              '  ›  '
            )}
          </Body>
          {s.pending && <Body bold>{t('ladder.waiting')}</Body>}
          {isPerson && !s.pending && s.stage < STAGES.length - 1 && (
            <BigButton
              label={t('ladder.ready')}
              onPress={() => dispatch({ type: 'LADDER_REQUEST', id: s.id })}
            />
          )}
          {isPerson && s.stage > 0 && (
            <BigButton
              kind="quiet"
              label={t('ladder.back')}
              onPress={() => dispatch({ type: 'LADDER_BACK', id: s.id })}
            />
          )}
          {isFamily && s.pending && (
            <View style={{ gap: 8 }}>
              <BigButton
                kind="ok"
                label={t('ladder.approve')}
                onPress={() => dispatch({ type: 'LADDER_APPROVE', id: s.id })}
              />
              <BigButton
                kind="quiet"
                label={t('ladder.decline')}
                onPress={() => dispatch({ type: 'LADDER_DECLINE', id: s.id })}
              />
            </View>
          )}
        </Card>
      ))}
      <Body>{t('ladder.backNote')}</Body>
    </View>
  );
}

function summaryText(state, t, now) {
  const s = visitSummary({ ...state, nowMs: now });
  const lines = s.lines.map((l) => {
    if (l.id === 'sugar') return fmt(t('visit.sugar'), l);
    if (l.id === 'routine') return fmt(t('visit.routine'), l);
    if (l.id === 'stock') return fmt(t('visit.stock'), l);
    if (l.id === 'strips') return fmt(t('visit.strips'), l);
    return t('visit.noSugar');
  });
  return lines;
}

export function VisitSection() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const [q, setQ] = useState('');
  const lines = summaryText(state, t, now);
  const add = (text) => {
    dispatch({ type: 'VISIT_Q_ADD', text });
    setQ('');
  };
  const share = () =>
    Share.share({
      message: [
        t('visit.facts'),
        ...lines,
        '',
        t('visit.questions'),
        ...state.visitQuestions.map((x, i) => `${i + 1}. ${x}`),
      ].join('\n'),
    });
  return (
    <View style={{ gap: 12 }}>
      <Card>
        <Title>{t('visit.facts')}</Title>
        {lines.map((l) => (
          <Body key={l}>• {l}</Body>
        ))}
        <Body>{t('food.verify')}</Body>
      </Card>
      <Card>
        <Title>{t('visit.questions')}</Title>
        {state.visitQuestions.map((x, i) => (
          <View key={`${i}-${x}`} style={{ gap: 6 }}>
            <Body>
              {i + 1}. {x}
            </Body>
            <Chip
              label={`${t('remove')}: ${i + 1}`}
              onPress={() => dispatch({ type: 'VISIT_Q_REMOVE', index: i })}
            />
          </View>
        ))}
        <View style={row}>
          {['visit.s1', 'visit.s2', 'visit.s3'].map((k) => (
            <Chip key={k} label={t(k)} onPress={() => add(t(k))} />
          ))}
        </View>
        <TextInput
          accessibilityLabel={t('visit.qPlaceholder')}
          placeholder={t('visit.qPlaceholder')}
          value={q}
          onChangeText={setQ}
          style={field}
        />
        <BigButton label={t('visit.addQ')} onPress={() => add(q)} />
      </Card>
      <BigButton icon="📤" label={t('visit.share')} onPress={share} />
    </View>
  );
}

// The QR code uses short keys to stay small. A printed page uses readable labels and skips empty fields.
export function passportRows(p, t) {
  const rows = [
    [t('pass.name'), p.n],
    [t('pass.condition'), p.c],
    [t('pass.allergies'), p.a],
    [t('pass.meds'), p.m],
    [t('pass.sugar'), p.s && fmt(t('visit.sugar'), p.s)],
    [t('pass.emergency'), p.e],
    [t('invitePhone'), p.p],
  ];
  return rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');
}

const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);

// Offline QR and PDF. Only what the person ticks goes in. The emergency number appears only
// if that member agreed to show it (see passportPayload). Raw sensor data is never included.
export function PassportSection() {
  const { state, dispatch, t } = useStore();
  const [share, setShare] = useState({ meds: true, sugar: true, contact: true });
  const [showQr, setShowQr] = useState(false);
  const [error, setError] = useState('');
  const payload = passportPayload({ ...state, share });
  const text = passportString(payload);
  const fits = passportFits(payload);
  const set = (patch) => dispatch({ type: 'PROFILE_SET', patch });

  const savePdf = async () => {
    try {
      const html = `<html><body style="font-family:sans-serif;font-size:20px"><h1>${esc(t('sec.passport'))}</h1>${passportRows(
        payload,
        t
      )
        .map(([label, v]) => `<p><b>${esc(label)}</b>: ${esc(v)}</p>`)
        .join('')}<p style="font-size:14px">${esc(t('food.verify'))}</p></body></html>`;
      const { uri } = await Print.printToFileAsync({ html });
      try {
        // Best path: share the PDF file itself.
        if (!(await Sharing.isAvailableAsync())) throw new Error('sharing unavailable');
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
      } catch {
        // Some phones will not expose the file. The system print dialog can still "Save as PDF".
        await Print.printAsync({ html });
      }
      setError('');
    } catch (e) {
      console.warn('PDF failed', e);
      setError(t('pass.pdfFailed'));
    }
  };

  return (
    <View style={{ gap: 12 }}>
      <Card>
        <TextInput
          accessibilityLabel={t('pass.name')}
          placeholder={t('pass.name')}
          value={state.profile.name}
          onChangeText={(v) => set({ name: v })}
          style={field}
        />
        <TextInput
          accessibilityLabel={t('pass.condition')}
          placeholder={t('pass.condition')}
          value={state.profile.condition}
          onChangeText={(v) => set({ condition: v })}
          style={field}
        />
        <TextInput
          accessibilityLabel={t('pass.allergies')}
          placeholder={t('pass.allergies')}
          value={state.profile.allergies}
          onChangeText={(v) => set({ allergies: v })}
          style={field}
        />
      </Card>
      <Card>
        <Title>{t('pass.include')}</Title>
        <View style={row}>
          {['meds', 'sugar', 'contact'].map((k) => (
            <Chip
              key={k}
              label={`${t(`pass.${k}`)}: ${share[k] ? 'on' : 'off'}`}
              active={share[k]}
              onPress={() => setShare({ ...share, [k]: !share[k] })}
            />
          ))}
        </View>
        <Body bold>{t('pass.emergency')}</Body>
        <View style={row}>
          {state.members.map((m) => (
            <Chip
              key={m.id}
              label={m.name}
              active={state.profile.emergencyId === m.id}
              onPress={() => set({ emergencyId: m.id })}
            />
          ))}
        </View>
        <Body>{t('pass.note')}</Body>
      </Card>
      {!fits && <Body style={{ color: colors.brick }}>{t('pass.tooLong')}</Body>}
      <BigButton label={t('pass.qr')} onPress={() => setShowQr(!showQr)} />
      {showQr && fits && (
        <Card style={{ alignItems: 'center' }}>
          <QRCode value={text} size={220} />
          <Body>{text.length} / 700</Body>
        </Card>
      )}
      <BigButton kind="quiet" icon="📄" label={t('pass.pdf')} onPress={savePdf} />
      {error ? <Body>{error}</Body> : null}
    </View>
  );
}
