import React from 'react';
import { View } from 'react-native';
import { HeartPulse } from './icons';
import { Body, Caption, Card } from './ui';
import { useStore } from '../state/store';
import { useNow } from './useNow';
import { heartStatus } from '../heart';
import { colors } from '../theme';

// A calm note (not an alarm, so not red) when the band reports a rate that stayed unusual while the person
// was still. It only prompts; the words always point to the clinician's plan.
export default function HeartNotice() {
  const { state, t } = useStore();
  const now = useNow(5000);
  const { device, readings } = state.heart;
  if (!device) return null;
  const { level } = heartStatus(readings, { stillSince: state.lastActiveMs, now });
  if (level !== 'high' && level !== 'low') return null;
  return (
    <Card tone="haldi" accessibilityRole="alert" style={{ marginHorizontal: 16, marginBottom: 8, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <HeartPulse size={24} color={colors.haldiDeep} />
        <Body bold style={{ flex: 1 }}>
          {t(level === 'high' ? 'hr.high' : 'hr.low')}
        </Body>
      </View>
      <Caption style={{ color: colors.ink }}>{t('clinicianPlan')}</Caption>
    </Card>
  );
}
