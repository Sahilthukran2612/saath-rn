import React, { useEffect, useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { BigButton, Body, Card, Title } from '../components/ui';
import { useStore } from '../state/store';
import { can, glucoseAdvice } from '../logic';
import { colors } from '../theme';

export default function CareScreen() {
  const { state, dispatch, t } = useStore();
  const [text, setText] = useState('');
  const allowed = can(state.role, 'viewSummary');
  const canLog = can(state.role, 'logReading');

  // One audit entry per meaningful view: the reducer ignores Person and repeated views.
  useEffect(() => {
    if (allowed) dispatch({ type: 'VIEW', viewer: state.role, item: 'Care summary', at: Date.now() });
  }, [allowed, state.role, dispatch]);

  if (!allowed) {
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
        <Body>{t('noAccess')}</Body>
      </ScrollView>
    );
  }
  const last = state.readings[state.readings.length - 1];
  const advice = glucoseAdvice(last?.mgdl);
  const submit = () => {
    const v = parseInt(text, 10);
    if (!Number.isNaN(v) && v > 0 && v < 700) {
      dispatch({ type: 'ADD_READING', id: String(Date.now()), mgdl: v, at: Date.now() });
      setText('');
    }
  };
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('tabCare')}</Title>
      <Card>
        <Body bold>{last ? `${last.mgdl} mg/dL${last.demo ? ` (${t('demoBanner')})` : ''}` : '—'}</Body>
        <Body>{advice.text}</Body>
      </Card>
      {canLog && (
        <Card>
          <TextInput
            accessibilityLabel={t('addReading')}
            keyboardType="number-pad"
            value={text}
            onChangeText={setText}
            placeholder="mg/dL"
            style={{
              minHeight: 56,
              fontSize: 20,
              borderWidth: 2,
              borderColor: colors.indigo,
              borderRadius: 12,
              paddingHorizontal: 12,
            }}
          />
          <BigButton label={t('addReading')} onPress={submit} />
        </Card>
      )}
    </ScrollView>
  );
}
