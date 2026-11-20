import React from 'react';
import { View } from 'react-native';
import { Caption } from './ui';
import { useStore } from '../state/store';
import { colors } from '../theme';

// The same step bar for every setup flow: a filled track and the words "Step 2 of 4".
export default function SetupProgress({ step, total }) {
  const { t } = useStore();
  return (
    <View style={{ gap: 8 }}>
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 1, max: total, now: step + 1 }}
        style={{ height: 8, borderRadius: 4, backgroundColor: colors.indigoTint, overflow: 'hidden' }}
      >
        <View
          style={{
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.indigo,
            width: `${((step + 1) / total) * 100}%`,
          }}
        />
      </View>
      <Caption>{t('ob.step').replace('{n}', String(step + 1)).replace('{total}', String(total))}</Caption>
    </View>
  );
}
