import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { HeartPulse, House, LayoutGrid, ShieldCheck, UserRound, Users } from './icons';
import { colors, fonts, motion } from '../theme';
import { PressRow, useScale, Glyph } from './ui';
import { useReducedMotion } from './motion';

export const TABS = [
  ['today', 'tabToday', House],
  ['circle', 'tabCircle', Users],
  ['safety', 'tabSafety', ShieldCheck],
  ['care', 'tabCare', HeartPulse],
  ['plan', 'tabPlan', LayoutGrid],
  ['me', 'tabMe', UserRound],
];

// A pill follows the selected tab with a critically damped spring. It starts moving on touch,
// can be redirected mid-flight, and is replaced by an instant jump when reduced motion is on.
export default function TabBar({ tab, onChange, t, tabs = TABS }) {
  const k = useScale();
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(0);
  const [x] = useState(() => new Animated.Value(0));
  const index = Math.max(
    0,
    tabs.findIndex((tb) => tb[0] === tab)
  );
  const slot = width / tabs.length;

  useEffect(() => {
    if (!slot) return undefined;
    if (reduced) {
      x.setValue(index * slot);
      return undefined;
    }
    const a = Animated.spring(x, { toValue: index * slot, useNativeDriver: true, ...motion.pill });
    a.start();
    return () => a.stop();
  }, [index, slot, reduced, x]);

  return (
    <View style={styles.bar} onLayout={(e) => setWidth(e.nativeEvent.layout.width - 12)}>
      <View style={styles.inner}>
        {slot > 0 && (
          <Animated.View
            pointerEvents="none"
            style={[styles.pill, { width: slot - 6, transform: [{ translateX: x }] }]}
          />
        )}
        {tabs.map(([id, key, Icon]) => {
          const on = tab === id;
          return (
            <PressRow
              key={id}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              accessibilityLabel={t(key)}
              onPress={() => onChange(id)}
              containerStyle={{ flex: 1 }}
              style={styles.item}
            >
              <Glyph
                icon={Icon}
                size={24 * Math.min(k, 1.15)}
                color={on ? colors.indigo : colors.inkFaint}
                strokeWidth={on ? 2.3 : 1.8}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontFamily: on ? fonts.bold : fonts.semi,
                  fontSize: 13.5 * Math.min(k, 1.15),
                  color: on ? colors.indigo : colors.inkFaint,
                }}
              >
                {t(key)}
              </Text>
            </PressRow>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.white,
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  inner: { flexDirection: 'row' },
  pill: {
    position: 'absolute',
    left: 3,
    top: 0,
    bottom: 0,
    borderRadius: 20,
    backgroundColor: colors.indigoTint,
  },
  item: { minHeight: 60, alignItems: 'center', justifyContent: 'center', gap: 2, borderRadius: 20 },
});
