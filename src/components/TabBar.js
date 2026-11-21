import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import Text from './AppText';
import { HeartPulse, House, LayoutGrid, ShieldCheck, UserRound, Users } from './icons';
import { colors, fonts, roles, themeName } from '../theme';
import { PressRow, useScale, Glyph } from './ui';
import { useSpringValue } from './motion';
import useKeyboardVisible from './useKeyboard';

// Five destinations. "Me" lives behind the account avatar in the top app bar. It stays in this list so the
// screen can still be routed to.
export const TABS = [
  ['today', 'tabToday', House],
  ['circle', 'tabCircle', Users],
  ['safety', 'tabSafety', ShieldCheck],
  ['care', 'tabCare', HeartPulse],
  ['plan', 'tabPlan', LayoutGrid],
  ['me', 'tabMe', UserRound],
];

export const NAV_TABS = TABS.filter(([id]) => id !== 'me');

// Screens leave this much room under their last item, because the bar floats over them.
export const NAV_CLEARANCE = 128;
const BAR_H = 72;

function Item({ id, label, Icon, on, onPress, k }) {
  // The active pill grows out from its centre on a critically damped spring; with reduced motion it just appears.
  const v = useSpringValue(on ? 1 : 0, { damping: 22, stiffness: 380, mass: 1 });
  const scaleX = v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });
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
        <Glyph icon={Icon} size={24 * Math.min(k, 1.15)} color={on ? '#102A7A' : colors.inkSoft} strokeWidth={on ? 2.3 : 1.9} />
      </View>
      <Text
        numberOfLines={1}
        style={{
          fontFamily: on ? fonts.bold : roles.labelNav.font,
          fontSize: roles.labelNav.size * Math.min(k, 1.1),
          lineHeight: roles.labelNav.line * Math.min(k, 1.1),
          letterSpacing: roles.labelNav.track,
          color: on ? colors.ink : colors.inkSoft,
        }}
      >
        {label}
      </Text>
    </PressRow>
  );
}

// A mirror finish without a blur (a blur is slow on low-end phones): a see-through body, a bright specular band
// across the top, a soft darker reflection below it, and a lit rim. Drawn once with SVG gradients.
function Mirror() {
  const dark = themeName === 'dark';
  const top = dark ? '#FFFFFF' : '#FFFFFF';
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <LinearGradient id="body" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={top} stopOpacity={dark ? 0.5 : 0.99} />
          <Stop offset="0.48" stopColor={dark ? '#7C8CF0' : '#DCE6FF'} stopOpacity={dark ? 0.45 : 0.94} />
          <Stop offset="0.52" stopColor={dark ? '#0F1226' : '#C7D6FA'} stopOpacity={dark ? 0.93 : 0.93} />
          <Stop offset="1" stopColor={dark ? '#20264F' : '#EEF3FF'} stopOpacity={dark ? 0.97 : 0.98} />
        </LinearGradient>
        <LinearGradient id="sheen" x1="0" y1="0" x2="1" y2="0.35">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={dark ? 0.14 : 0.5} />
          <Stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#body)" />
      <Rect x="0" y="0" width="100%" height="100%" fill="url(#sheen)" />
    </Svg>
  );
}

// A floating bar, inset from the edges and detached from the bottom, like Apple's tab bars.
export default function TabBar({ tab, onChange, t, tabs = NAV_TABS }) {
  const k = useScale();
  const dark = themeName === 'dark';
  const typing = useKeyboardVisible();
  if (typing) return null; // while the keyboard is up the bar would float in the middle of the screen
  return (
    <View pointerEvents="box-none" style={styles.wrap}>
      <View style={[styles.bar, { borderColor: dark ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.95)' }]}>
        <Mirror />
        <View style={styles.row}>
          {tabs.map(([id, key, Icon]) => (
            <Item key={id} id={id} label={t(key)} Icon={Icon} on={tab === id} onPress={() => onChange(id)} k={k} />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    borderWidth: 1.5,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.35)',
    shadowColor: '#1B2A6B',
    shadowOpacity: 0.22,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  item: { minHeight: 64, alignItems: 'center', justifyContent: 'center', gap: 2 },
  iconSlot: { width: 60, height: 32, alignItems: 'center', justifyContent: 'center' },
  indicator: {
    position: 'absolute',
    width: 60,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(120,150,255,0.38)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
  },
});
