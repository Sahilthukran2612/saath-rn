import React, { useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Text from './AppText';
import { HeartPulse, House, LayoutGrid, ShieldCheck, UserRound, Users } from './icons';
import { colors, motion, textStyles, themeName } from '../theme';
import { PressRow, useScale, Glyph } from './ui';
import { useSpringValue } from './motion';
import useKeyboardVisible from './useKeyboard';

// Five destinations. "Me" opens from the account button beside each large title; it stays in this list so the
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

const BAR_H = 68;
const PAD = 6;

function Item({ label, Icon, on, onPress, k }) {
  return (
    <PressRow
      accessibilityRole="tab"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      style={styles.item}
    >
      <Glyph
        icon={Icon}
        size={24 * Math.min(k, 1.15)}
        color={on ? colors.indigo : colors.inkSoft}
        strokeWidth={on ? 2.4 : 2}
      />
      <Text
        numberOfLines={1}
        style={{
          fontFamily: textStyles.tab.font,
          fontSize: textStyles.tab.size * Math.min(k, 1.1),
          lineHeight: textStyles.tab.line * Math.min(k, 1.1),
          color: on ? colors.indigo : colors.inkSoft,
        }}
      >
        {label}
      </Text>
    </PressRow>
  );
}

// A floating bar, inset from the edges and lifted above the phone's own gesture area. One soft highlight slides to
// the chosen tab on a spring, so the eye follows the move instead of seeing two tabs blink.
export default function TabBar({ tab, onChange, t, tabs = NAV_TABS }) {
  const k = useScale();
  const insets = useSafeAreaInsets();
  const typing = useKeyboardVisible();
  const [w, setW] = useState(0);
  const index = Math.max(
    0,
    tabs.findIndex(([id]) => id === tab)
  );
  const pos = useSpringValue(index, motion.snappy);
  if (typing) return null; // with the keyboard up the bar would float in the middle of the screen
  const seg = w > 0 ? (w - PAD * 2) / tabs.length : 0;
  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 8) + 6 }]}>
      <View style={styles.bar} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {seg > 0 ? (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.highlight,
              { width: seg, transform: [{ translateX: Animated.multiply(pos, seg) }] },
            ]}
          />
        ) : null}
        {tabs.map(([id, key, Icon]) => (
          <Item key={id} label={t(key)} Icon={Icon} on={tab === id} onPress={() => onChange(id)} k={k} />
        ))}
      </View>
    </View>
  );
}

const dark = themeName === 'dark';
const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: {
    height: BAR_H,
    borderRadius: BAR_H / 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    backgroundColor: dark ? 'rgba(44,44,46,0.97)' : 'rgba(255,255,255,0.97)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: dark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)',
    shadowColor: '#000',
    shadowOpacity: dark ? 0.5 : 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  highlight: {
    position: 'absolute',
    left: PAD,
    top: PAD,
    bottom: PAD,
    borderRadius: (BAR_H - PAD * 2) / 2,
    backgroundColor: colors.indigoTint,
  },
  item: {
    height: BAR_H - PAD * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: (BAR_H - PAD * 2) / 2,
  },
});
