import React from 'react';
import { ScrollView, View } from 'react-native';
import { Languages, Eye, MessageCircle, Phone, RotateCcw, ShieldCheck, Siren, Type } from '../components/icons';
import { BigButton, Body, Caption, Card, Title } from '../components/ui';
import { Avatar, Badge, ListGroup, ListRow, Segmented, Toggle } from '../components/kit';
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
    <View style={{ padding: 16, gap: 12, borderBottomWidth: 1, borderBottomColor: colors.line }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: colors.indigoTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Languages size={22} color={colors.indigo} />
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
    </View>
  );
}

export default function MeScreen() {
  const { state, dispatch, t } = useStore();
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  const choices = useChoices();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Avatar name={state.profile.name || t('role.person')} role="person" size={64} />
        <View style={{ flex: 1, gap: 4 }}>
          <Title style={{ fontSize: 28, letterSpacing: -0.5 }}>{state.profile.name || t('tabMe')}</Title>
          <Badge label={t(`mode.${state.mode}`)} tone="indigo" />
        </View>
      </View>

      <Reveal index={0}>
        <Card tone="tint" style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ShieldCheck size={24} color={colors.indigo} />
            <Body bold style={{ flex: 1 }}>
              {t('bg.title')}
            </Body>
            <Toggle
              value={state.background}
              label={t('bg.title')}
              onValueChange={(on) => {
                set('backgroundDenied', false);
                set('background', on);
              }}
            />
          </View>
          <Caption>{t('bg.note')}</Caption>
          {!foregroundAvailable ? <Body bold>{t('bg.unavailable')}</Body> : null}
          {state.backgroundDenied ? <Body bold>{t('bg.denied')}</Body> : null}
        </Card>
        <View style={{ height: 12 }} />
        <Card tone="tint" style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Phone size={24} color={colors.indigo} />
            <Body bold style={{ flex: 1 }}>
              {t('call.title')}
            </Body>
            <Toggle value={state.autoCall} label={t('call.title')} onValueChange={choices.autoCall} />
          </View>
          <Caption>{t('call.note')}</Caption>
          {!callsAvailable ? <Body bold>{t(state.demo ? 'call.demoNote' : 'call.unavailable')}</Body> : null}
          {state.autoCallDenied ? <Body bold>{t('call.denied')}</Body> : null}
        </Card>
        <View style={{ height: 12 }} />
        <Card tone="tint" style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <MessageCircle size={24} color={colors.indigo} />
            <Body bold style={{ flex: 1 }}>
              {t('sms.title')}
            </Body>
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
          </View>
          <Caption>{t('sms.note')}</Caption>
          {!smsAvailable ? <Body bold>{t(state.demo ? 'sms.demoNote' : 'sms.unavailable')}</Body> : null}
          {state.autoSmsDenied ? <Body bold>{t('sms.denied')}</Body> : null}
        </Card>
        <View style={{ height: 12 }} />
        <Card tone="tint" style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Siren size={24} color={colors.indigo} />
            <Body bold style={{ flex: 1 }}>
              {t('siren.title')}
            </Body>
            <Toggle value={state.siren} label={t('siren.title')} onValueChange={(on) => set('siren', on)} />
          </View>
          <Caption>{t('siren.note')}</Caption>
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Account />
        <View style={{ height: 18 }} />
        <SharedPhone />
        <View style={{ height: 18 }} />
        <Body bold>{t('me.mode')}</Body>
        <View style={{ height: 8 }} />
        <Segmented
          value={state.mode}
          onChange={(v) => set('mode', v)}
          options={['teen', 'elder', 'adult'].map((v) => ({ value: v, label: t(`mode.${v}`) }))}
        />
        <View style={{ height: 16 }} />
        <Body bold>{t('me.phase')}</Body>
        <View style={{ height: 8 }} />
        <Segmented
          value={state.phase}
          onChange={(v) => set('phase', v)}
          options={['new', 'stable', 'crisis'].map((v) => ({ value: v, label: t(`phase.${v}`) }))}
        />
      </Reveal>

      <Reveal index={2}>
        <Body bold>{t('me.settings')}</Body>
        <View style={{ height: 8 }} />
        <ListGroup>
          <LanguageRow lang={state.lang} onChange={(v) => set('lang', v)} label={t('language')} />
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
