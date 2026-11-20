import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Moon,
  Languages,
  Eye,
  MessageCircle,
  Phone,
  RotateCcw,
  ShieldCheck,
  Siren,
  Type,
} from '../components/icons';
import { BigButton, Body, Caption, Title } from '../components/ui';
import { Avatar, Badge, ListGroup, ListRow, SectionTitle, Segmented, Toggle } from '../components/kit';
import { Reveal } from '../components/motion';
import SharedPhone from '../components/me/SharedPhone';
import Account from '../components/me/Account';
import { useStore } from '../state/store';
import { foregroundAvailable } from '../services/foreground';
import { askSmsPermission, smsAvailable } from '../services/sms';
import { callsAvailable } from '../services/calls';
import useChoices from '../state/useChoices';
import { colors } from '../theme';

// The label gets the full width and the selector sits underneath, so neither is squeezed at large text.
function LanguageRow({ lang, onChange, label }) {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.indigoTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Languages size={24} color={colors.indigoDeep} />
        </View>
        <Body>{label}</Body>
      </View>
      <Segmented
        value={lang}
        onChange={onChange}
        options={[
          { value: 'en', label: 'English' },
          { value: 'hi', label: 'हिन्दी' },
        ]}
      />
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant }} />
    </View>
  );
}

// Light, dark, or follow the phone. The look is applied when Saath opens (every screen builds its styles then),
// so the row says to reopen the app. The choice is kept on this phone only.
function ThemeRow() {
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
    <View style={{ padding: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: colors.indigoTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Moon size={24} color={colors.indigoDeep} />
        </View>
        <Body>{t('theme.title')}</Body>
      </View>
      <Segmented
        value={choice}
        onChange={pick}
        options={['auto', 'light', 'dark'].map((v) => ({ value: v, label: t(`theme.${v}`) }))}
      />
      {changed ? <Caption>{t('theme.reopen')}</Caption> : null}
    </View>
  );
}

const styles = StyleSheet.create({ warn: { color: colors.madder, paddingHorizontal: 4, paddingTop: 8 } });
export default function MeScreen() {
  const { state, dispatch, t } = useStore();
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  const choices = useChoices();
  const member = state.usage === 'member'; // looks after someone, has no sensors or emergency contacts of their own
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar name={state.profile.name || t('role.person')} role="person" size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Title style={{ fontSize: 28 }}>{state.profile.name || t('tabMe')}</Title>
          <Badge label={t(`mode.${state.mode}`)} tone="indigo" />
        </View>
      </View>

      {!member ? (
        <Reveal index={0}>
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
                    if (!smsAvailable && state.demo) return set('autoSms', true); // demo: shown on screen, not sent
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
          {!callsAvailable ? (
            <Caption style={styles.warn}>{t(state.demo ? 'call.demoNote' : 'call.unavailable')}</Caption>
          ) : null}
          {state.autoCallDenied ? <Caption style={styles.warn}>{t('call.denied')}</Caption> : null}
          {!smsAvailable ? (
            <Caption style={styles.warn}>{t(state.demo ? 'sms.demoNote' : 'sms.unavailable')}</Caption>
          ) : null}
          {state.autoSmsDenied ? <Caption style={styles.warn}>{t('sms.denied')}</Caption> : null}
        </Reveal>
      ) : null}

      <Reveal index={1}>
        <SectionTitle>{t('use.title')}</SectionTitle>
        <View style={{ height: 8 }} />
        <Segmented
          value={state.usage || 'person'}
          onChange={(v) => set('usage', v)}
          options={['person', 'member', 'both'].map((v) => ({ value: v, label: t(`use.${v}`) }))}
        />
        <View style={{ height: 18 }} />
        <Account />
        {member ? null : (
          <>
            <View style={{ height: 18 }} />
            <SharedPhone />
            <View style={{ height: 18 }} />
            <SectionTitle>{t('me.mode')}</SectionTitle>
            <View style={{ height: 8 }} />
            <Segmented
              value={state.mode}
              onChange={(v) => set('mode', v)}
              options={['teen', 'elder', 'adult'].map((v) => ({ value: v, label: t(`mode.${v}`) }))}
            />
            <View style={{ height: 16 }} />
            <SectionTitle>{t('me.phase')}</SectionTitle>
            <View style={{ height: 8 }} />
            <Segmented
              value={state.phase}
              onChange={(v) => set('phase', v)}
              options={['new', 'stable', 'crisis'].map((v) => ({ value: v, label: t(`phase.${v}`) }))}
            />
          </>
        )}
      </Reveal>

      <Reveal index={2}>
        <SectionTitle>{t('me.settings')}</SectionTitle>
        <View style={{ height: 8 }} />
        <ListGroup>
          <LanguageRow lang={state.lang} onChange={(v) => set('lang', v)} label={t('language')} />
          <ThemeRow />
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
          <ListRow
            icon={Eye}
            title={t('demoMode')}
            trailing={
              <Toggle
                value={state.demo}
                label={t('demoMode')}
                onValueChange={(v) => dispatch({ type: v ? 'DEMO_ON' : 'DEMO_OFF' })}
              />
            }
          />
        </ListGroup>
      </Reveal>

      <Reveal index={3}>
        <BigButton
          kind="quiet"
          icon={RotateCcw}
          label={t('resetData')}
          onPress={() => dispatch({ type: 'RESET' })}
        />
      </Reveal>
    </ScrollView>
  );
}
