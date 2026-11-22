import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  FlaskConical,
  Languages,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Siren,
  Sparkles,
  Type,
} from '../components/icons';
import { BigButton, Body, Caption, Card, Glyph, Screen } from '../components/ui';
import { Avatar, Badge, ListGroup, ListRow, SectionTitle, Segmented, Toggle } from '../components/kit';
import SharedPhone from '../components/me/SharedPhone';
import Account from '../components/me/Account';
import StudyData from '../components/me/StudyData';
import { useNav } from '../components/nav';
import { useStore } from '../state/store';
import { foregroundAvailable } from '../services/foreground';
import { askSmsPermission, smsAvailable } from '../services/sms';
import { callsAvailable } from '../services/calls';
import useChoices from '../state/useChoices';
import { isDoctor, looksAfterOthers, usesAi } from '../who';
import { colors, radii } from '../theme';

// A setting whose choice sits underneath its label, so neither is squeezed at large text.
function ChoiceRow({ icon, label, children, note }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={styles.tile}>
          <Glyph icon={icon} size={20} color={colors.indigo} strokeWidth={2.2} />
        </View>
        <Body>{label}</Body>
      </View>
      {children}
      {note ? <Caption>{note}</Caption> : null}
    </View>
  );
}

// Light, dark, or follow the phone. The look is applied when Saath opens (every screen builds its styles then),
// so the row says to reopen the app. The choice is kept on this phone only.
function ThemeChoice() {
  const { t } = useStore();
  const [choice, setChoice] = useState('auto');
  const [changed, setChanged] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('saath.theme')
      .then((v) => v && setChoice(v))
      .catch(() => {});
  }, []);
  const pick = (v) => {
    setChoice(v);
    setChanged(true);
    AsyncStorage.setItem('saath.theme', v).catch(() => {});
  };
  return (
    <ChoiceRow icon={Moon} label={t('theme.title')} note={changed ? t('theme.reopen') : null}>
      <Segmented
        value={choice}
        onChange={pick}
        options={['auto', 'light', 'dark'].map((v) => ({ value: v, label: t(`theme.${v}`) }))}
      />
    </ChoiceRow>
  );
}

function Section({ title, children }) {
  return (
    <View style={{ gap: 8 }}>
      {title ? <SectionTitle>{title}</SectionTitle> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  warn: { color: colors.madder, paddingHorizontal: 4 },
  tile: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.indigoTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant, marginLeft: 66 },
});

export default function MeScreen() {
  const { state, dispatch, t } = useStore();
  const go = useNav();
  const [page, setPage] = useState(null);
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  const choices = useChoices();
  const member = looksAfterOthers(state);
  const doctor = isDoctor(state); // looks after someone, has no sensors or emergency contacts of their own
  if (page === 'study') return <StudyData onBack={() => setPage(null)} />;

  // Erasing everything cannot be undone, so it asks once.
  const reset = () =>
    Alert.alert(t('resetData'), t('reset.confirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('resetData'), style: 'destructive', onPress: () => dispatch({ type: 'RESET' }) },
    ]);

  return (
    <Screen title={state.profile.name || t('tabMe')} onBack={() => go('today')} backLabel={t('tabToday')}>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar name={state.profile.name || t('role.person')} role="person" size={56} />
        <Badge
          label={doctor ? t('role.clinician') : member ? t('use.member') : t(`mode.${state.mode}`)}
          tone="indigo"
        />
      </Card>

      {member ? null : (
        <Section title={t('me.alerts')}>
          <ListGroup>
            <ListRow
              icon={ShieldCheck}
              title={t('bg.title')}
              subtitle={t('bg.note')}
              trailing={
                <Toggle
                  value={state.background}
                  label={t('bg.title')}
                  onValueChange={(on) => {
                    set('backgroundDenied', false);
                    set('background', on);
                  }}
                />
              }
            />
            <ListRow
              icon={Phone}
              title={t('call.title')}
              subtitle={t('call.note')}
              trailing={
                <Toggle value={state.autoCall} label={t('call.title')} onValueChange={choices.autoCall} />
              }
            />
            <ListRow
              icon={MessageCircle}
              title={t('sms.title')}
              subtitle={t('sms.note')}
              trailing={
                <Toggle
                  value={state.autoSms}
                  label={t('sms.title')}
                  onValueChange={async (on) => {
                    set('autoSmsDenied', false);
                    if (!on) return set('autoSms', false);
                    if (await askSmsPermission()) set('autoSms', true);
                    else {
                      set('autoSms', false);
                      set('autoSmsDenied', true);
                    }
                  }}
                />
              }
            />
            <ListRow
              icon={Siren}
              title={t('siren.title')}
              subtitle={t('siren.note')}
              trailing={
                <Toggle
                  value={state.siren}
                  label={t('siren.title')}
                  onValueChange={(on) => set('siren', on)}
                />
              }
            />
          </ListGroup>
          {!foregroundAvailable ? <Caption style={styles.warn}>{t('bg.unavailable')}</Caption> : null}
          {state.backgroundDenied ? <Caption style={styles.warn}>{t('bg.denied')}</Caption> : null}
          {!callsAvailable ? <Caption style={styles.warn}>{t('call.unavailable')}</Caption> : null}
          {state.autoCallDenied ? <Caption style={styles.warn}>{t('call.denied')}</Caption> : null}
          {!smsAvailable ? <Caption style={styles.warn}>{t('sms.unavailable')}</Caption> : null}
          {state.autoSmsDenied ? <Caption style={styles.warn}>{t('sms.denied')}</Caption> : null}
        </Section>
      )}

      {doctor ? null : (
        <Section title={t('use.title')}>
          <Segmented
            value={state.usage || 'person'}
            onChange={(v) => set('usage', v)}
            options={['person', 'member', 'both'].map((v) => ({ value: v, label: t(`use.${v}`) }))}
          />
        </Section>
      )}

      <Account />

      {member ? null : (
        <>
          <SharedPhone />
          <Section title={t('me.mode')}>
            <Segmented
              value={state.mode}
              onChange={(v) => set('mode', v)}
              options={['teen', 'elder', 'adult'].map((v) => ({ value: v, label: t(`mode.${v}`) }))}
            />
          </Section>
          <Section title={t('me.phase')}>
            <Segmented
              value={state.phase}
              onChange={(v) => set('phase', v)}
              options={['new', 'stable', 'crisis'].map((v) => ({ value: v, label: t(`phase.${v}`) }))}
            />
          </Section>
        </>
      )}

      <Section title={t('me.settings')}>
        <ListGroup>
          <ChoiceRow icon={Languages} label={t('language')}>
            <Segmented
              value={state.lang}
              onChange={(v) => set('lang', v)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'hi', label: 'हिन्दी' },
              ]}
            />
          </ChoiceRow>
          <View style={styles.sep} />
          <ThemeChoice />
          <View style={styles.sep} />
          {usesAi(state) ? (
            <ListRow
              icon={Sparkles}
              title={t('ai.setting')}
              subtitle={t('ai.settingNote')}
              trailing={
                <Toggle
                  value={state.aiOn !== false}
                  label={t('ai.setting')}
                  onValueChange={(v) => set('aiOn', v)}
                />
              }
            />
          ) : null}
          <ListRow
            icon={Type}
            title={t('largeText')}
            trailing={
              <Toggle
                value={state.largeText}
                label={t('largeText')}
                onValueChange={(v) => set('largeText', v)}
              />
            }
          />
        </ListGroup>
      </Section>

      {member ? null : (
        <ListGroup>
          <ListRow icon={FlaskConical} title={t('study.title')} onPress={() => setPage('study')} chevron />
        </ListGroup>
      )}

      <BigButton kind="text" label={t('resetData')} onPress={reset} />
    </Screen>
  );
}
