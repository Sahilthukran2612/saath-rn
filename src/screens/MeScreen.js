import React from 'react';
import { ScrollView, View } from 'react-native';
import { BigButton, Body, Chip, Title } from '../components/ui';
import { useStore } from '../state/store';

const MODES = [
  ['teen', 'Teen'],
  ['elder', 'Elder'],
  ['adult', 'Adult T2D'],
];
const PHASES = [
  ['new', 'New diagnosis'],
  ['stable', 'Stable'],
  ['crisis', 'Crisis'],
];

export default function MeScreen() {
  const { state, dispatch, t } = useStore();
  const set = (key, value) => dispatch({ type: 'SET', key, value });
  const row = { flexDirection: 'row', flexWrap: 'wrap', gap: 6 };
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('tabMe')}</Title>
      <View style={row}>
        {MODES.map(([k, l]) => (
          <Chip key={k} label={l} active={state.mode === k} onPress={() => set('mode', k)} />
        ))}
      </View>
      <View style={row}>
        {PHASES.map(([k, l]) => (
          <Chip key={k} label={l} active={state.phase === k} onPress={() => set('phase', k)} />
        ))}
      </View>
      <Body bold>{t('language')}</Body>
      <View style={row}>
        <Chip label="English" active={state.lang === 'en'} onPress={() => set('lang', 'en')} />
        <Chip label="हिन्दी" active={state.lang === 'hi'} onPress={() => set('lang', 'hi')} />
      </View>
      <Chip
        label={`${t('largeText')}: ${state.largeText ? 'on' : 'off'}`}
        active={state.largeText}
        onPress={() => set('largeText', !state.largeText)}
      />
      <Chip
        label={`${t('demoMode')}: ${state.demo ? 'on' : 'off'}`}
        active={state.demo}
        onPress={() => {
          set('demo', !state.demo);
          if (state.demo) set('role', 'person');
        }}
      />
      <BigButton kind="quiet" label="Reset app data" onPress={() => dispatch({ type: 'RESET' })} />
    </ScrollView>
  );
}
