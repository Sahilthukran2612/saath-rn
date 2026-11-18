import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Droplet, FileText, ListChecks, Package, Phone, Pill, Plus, Send, X } from '../icons';
import { BigButton, Body, Caption, Card, Chip, Title } from '../ui';
import { Badge, Field, ListGroup, ListRow, StageTrack, Toggle, SectionTitle } from '../kit';
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
import { colors, radii } from '../../theme';

const fmt = (s, vars) =>
  Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v ?? '—')), s);
const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 8 };

// The person decides when they are ready. A parent may agree or say "not yet".
// Going back a step is allowed and neutral.
export function LadderSection() {
  const { state, dispatch, t } = useStore();
  const isPerson = state.role === 'person';
  const isFamily = state.role === 'family';
  const stage = overallStage(state.ladder);
  return (
    <View style={{ gap: 14 }}>
      <View style={styles.hero}>
        <Caption style={{ color: colors.indigoSoft }}>{t('ladder.teenOnly')}</Caption>
        <Title style={{ color: colors.white, fontSize: 26 }}>{t(`stage.${STAGES[stage]}`)}</Title>
        <StageTrack stage={stage} />
      </View>
      {isPerson ? (
        <ListGroup>
          <ListRow
            title={t('ladder.needApproval')}
            trailing={
              <Toggle
                value={state.ladderApproval}
                label={t('ladder.needApproval')}
                onValueChange={(v) => dispatch({ type: 'SET', key: 'ladderApproval', value: v })}
              />
            }
          />
        </ListGroup>
      ) : null}
      {state.ladder.map((s) => (
        <Card key={s.id} style={{ gap: 12 }}>
          <View
            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
          >
            <Title style={{ fontSize: 22, flex: 1 }}>{t(`skill.${s.id}`)}</Title>
            {s.pending ? <Badge label={t('ladder.waiting')} tone="haldi" /> : null}
          </View>
          <StageTrack stage={s.stage} onDark={false} />
          <Body bold>{t(`stage.${STAGES[s.stage]}`)}</Body>
          {isPerson && !s.pending && s.stage < STAGES.length - 1 ? (
            <BigButton
              label={t('ladder.ready')}
              onPress={() => dispatch({ type: 'LADDER_REQUEST', id: s.id })}
            />
          ) : null}
          {isPerson && s.stage > 0 ? (
            <BigButton
              kind="quiet"
              label={t('ladder.back')}
              onPress={() => dispatch({ type: 'LADDER_BACK', id: s.id })}
            />
          ) : null}
          {isFamily && s.pending ? (
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
          ) : null}
        </Card>
      ))}
      <Caption>{t('ladder.backNote')}</Caption>
    </View>
  );
}

function summaryText(state, t, now) {
  const s = visitSummary({ ...state, nowMs: now });
  return s.lines.map((l) => {
    if (l.id === 'sugar') return fmt(t('visit.sugar'), l);
    if (l.id === 'routine') return fmt(t('visit.routine'), l);
    if (l.id === 'stock') return fmt(t('visit.stock'), l);
    if (l.id === 'strips') return fmt(t('visit.strips'), l);
    return t('visit.noSugar');
  });
}
const VISIT_ICONS = [Droplet, ListChecks, Pill, Package];

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
    <View style={{ gap: 16 }}>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('visit.facts')}</SectionTitle>
        <ListGroup>
          {lines.map((l, i) => (
            <ListRow key={l} icon={VISIT_ICONS[i] || Droplet} title={l} />
          ))}
        </ListGroup>
        <Caption>{t('food.verify')}</Caption>
      </View>
      <Card style={{ gap: 12 }}>
        <Title style={{ fontSize: 22 }}>{t('visit.questions')}</Title>
        {state.visitQuestions.map((x, i) => (
          <View key={`${i}-${x}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Body style={{ flex: 1 }}>{`${i + 1}. ${x}`}</Body>
            <Chip
              label={`${t('remove')}: ${i + 1}`}
              icon={X}
              onPress={() => dispatch({ type: 'VISIT_Q_REMOVE', index: i })}
            />
          </View>
        ))}
        <View style={row}>
          {['visit.s1', 'visit.s2', 'visit.s3'].map((k) => (
            <Chip key={k} label={t(k)} onPress={() => add(t(k))} />
          ))}
        </View>
        <Field label={t('visit.qPlaceholder')} value={q} onChangeText={setQ} />
        <BigButton kind="quiet" icon={Plus} label={t('visit.addQ')} onPress={() => add(q)} />
      </Card>
      <BigButton icon={Send} label={t('visit.share')} onPress={share} />
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

  const toggles = [
    ['meds', Pill],
    ['sugar', Droplet],
    ['contact', Phone],
  ];
  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 12 }}>
        <Field label={t('pass.name')} value={state.profile.name} onChangeText={(v) => set({ name: v })} />
        <Field
          label={t('pass.condition')}
          value={state.profile.condition}
          onChangeText={(v) => set({ condition: v })}
        />
        <Field
          label={t('pass.allergies')}
          value={state.profile.allergies}
          onChangeText={(v) => set({ allergies: v })}
        />
      </Card>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('pass.include')}</SectionTitle>
        <ListGroup>
          {toggles.map(([k, Icon]) => (
            <ListRow
              key={k}
              icon={Icon}
              title={t(`pass.${k}`)}
              trailing={
                <Toggle
                  value={share[k]}
                  label={t(`pass.${k}`)}
                  onValueChange={(v) => setShare({ ...share, [k]: v })}
                />
              }
            />
          ))}
        </ListGroup>
      </View>
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('pass.emergency')}</SectionTitle>
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
        <Caption>{t('pass.note')}</Caption>
      </View>
      {!fits ? (
        <Card tone="haldi">
          <Body bold>{t('pass.tooLong')}</Body>
        </Card>
      ) : null}
      <BigButton label={t('pass.qr')} onPress={() => setShowQr(!showQr)} />
      {showQr && fits ? (
        <View style={styles.qrCard}>
          <View style={styles.qrBox}>
            <QRCode value={text} size={220} />
          </View>
          <Caption>{text.length} / 700</Caption>
        </View>
      ) : null}
      <BigButton kind="quiet" icon={FileText} label={t('pass.pdf')} onPress={savePdf} />
      {error ? <Body style={{ color: colors.madder }}>{error}</Body> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.indigo, borderRadius: radii.md, padding: 22, gap: 8 },
  qrCard: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.white,
    borderRadius: radii.md,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  qrBox: {
    padding: 14,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.indigoTint,
  },
});
