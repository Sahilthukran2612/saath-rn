import React from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { HeartPulse, House, LayoutGrid, ShieldCheck, UserRound, Users } from './icons';
import { colors, fonts, roles } from '../theme';
import { PressRow, useScale, Glyph } from './ui';
import { useSpringValue } from './motion';

// Five destinations, the Material 3 maximum. "Me" lives behind the account avatar in the top app bar,
// the way Google's own apps do it. It stays in this list so the screen can still be routed to.
export const TABS = [
  ['today', 'tabToday', House],
  ['circle', 'tabCircle', Users],
  ['safety', 'tabSafety', ShieldCheck],
  ['care', 'tabCare', HeartPulse],
  ['plan', 'tabPlan', LayoutGrid],
  ['me', 'tabMe', UserRound],
];

export const NAV_TABS = TABS.filter(([id]) => id !== 'me');

function Item({ id, label, Icon, on, onPress, k }) {
  // The active indicator grows out from its centre on a critically damped spring; with reduced
  // motion it simply appears (useSpringValue handles that).
  const v = useSpringValue(on ? 1 : 0, { damping: 22, stiffness: 380, mass: 1 });
  const scaleX = v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  return (
    <PressRow
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      style={styles.item}
      rippleColor="transparent"
    >
      <View style={styles.iconSlot}>
        <Animated.View style={[styles.indicator, { opacity: v, transform: [{ scaleX }] }]} />
        <Glyph
          icon={Icon}
          size={24 * Math.min(k, 1.15)}
          color={on ? '#102A7A' : colors.inkSoft}
          strokeWidth={on ? 2.3 : 1.9}
        />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: on ? fonts.bold : roles.labelNav.font,
          fontSize: roles.labelNav.size * Math.min(k, 1.15),
          lineHeight: roles.labelNav.line * Math.min(k, 1.15),
          letterSpacing: roles.labelNav.track,
          color: on ? colors.ink : colors.inkSoft,
        }}
      >
        {label}
      </Text>
    </PressRow>
  );
}

// Material 3 navigation bar: tonal surface, a 64 x 32 pill behind the active icon, labels always shown.
export default function TabBar({ tab, onChange, t, tabs = NAV_TABS }) {
  const k = useScale();
  return (
    <View style={styles.bar}>
      {tabs.map(([id, key, Icon]) => (
        <Item key={id} id={id} label={t(key)} Icon={Icon} on={tab === id} onPress={() => onChange(id)} k={k} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceContainer,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 8,
  },
  item: { minHeight: 64, alignItems: 'center', justifyContent: 'flex-start', gap: 4 },
  iconSlot: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    width: 64,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.indigoSoft,
  },
});
