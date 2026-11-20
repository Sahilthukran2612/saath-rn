import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { Eye } from './icons';
import { PressRow, Glyph } from './ui';
import { useStore } from '../state/store';
import { colors, fonts } from '../theme';

const ROLES = ['person', 'family', 'neighbour', 'asha', 'clinician'];

// Demo device only: look at the app as each role. Real roles come from real accounts (Phase 4).
// It is kept small and quiet so it does not read as part of the product.
export default function RoleBar() {
  const { state, dispatch, t } = useStore();
  if (!state.demo) return null;
  return (
    <View style={styles.strip}>
      <View style={styles.tag}>
        <Glyph icon={Eye} size={16} color={colors.inkSoft} />
        <Text style={styles.tagText}>{t('demoMode')}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingRight: 16 }}
      >
        {ROLES.map((r) => {
          const on = state.role === r;
          return (
            <PressRow
              key={r}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(`role.${r}`)}
              onPress={() => dispatch({ type: 'SET', key: 'role', value: r })}
              haptic={false}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text
                style={{ fontFamily: fonts.semi, fontSize: 15, color: on ? colors.white : colors.indigo }}
              >
                {t(`role.${r}`)}
              </Text>
            </PressRow>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingVertical: 6,
    backgroundColor: colors.indigoTint,
  },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  tagText: { fontFamily: fonts.semi, fontSize: 15, color: colors.inkSoft },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: colors.paper,
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: colors.indigo },
});
