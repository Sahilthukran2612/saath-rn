import React from 'react';
import { ScrollView, View } from 'react-native';
import { Languages, Eye, RotateCcw, ShieldCheck, Type } from '../components/icons';
import { BigButton, Body, Caption, Card, Title } from '../components/ui';
import { Avatar, Badge, ListGroup, ListRow, Segmented, Toggle } from '../components/kit';
import { Reveal } from '../components/motion';
import SharedPhone from '../components/me/SharedPhone';
import { useStore } from '../state/store';
import { foregroundAvailable } from '../services/foreground';
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
      </Reveal>

      <Reveal index={1}>
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
                onValueChange={(v) => {
                  set('demo', v);
                  if (!v) set('role', 'person');
                }}
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
