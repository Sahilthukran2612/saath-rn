import React from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, type, sizes } from '../theme';
import { useStore } from '../state/store';

// Large-text mode scales every size; OS font scaling still applies on top.
export const useScale = () => (useStore().state.largeText ? 1.35 : 1);

export function Body({ children, style, bold }) {
  const k = useScale();
  return (
    <Text style={[{ fontSize: type.body * k, color: colors.ink, fontWeight: bold ? '700' : '400' }, style]}>
      {children}
    </Text>
  );
}

export function Title({ children, style }) {
  const k = useScale();
  return (
    <Text
      accessibilityRole="header"
      style={[{ fontSize: type.title * k, color: colors.indigo, fontWeight: '700' }, style]}
    >
      {children}
    </Text>
  );
}

// One primary action per screen: kind="primary" (indigo/leaf); "alert" is brick, for real safety alerts only.
export function BigButton({ label, icon, onPress, kind = 'primary', style, hint }) {
  const k = useScale();
  const bg = { primary: colors.indigo, ok: colors.leaf, alert: colors.brick, quiet: colors.white }[kind];
  const fg = kind === 'quiet' ? colors.indigo : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          opacity: pressed ? 0.85 : 1,
          borderWidth: kind === 'quiet' ? 2 : 0,
          borderColor: colors.indigo,
        },
        style,
      ]}
    >
      <Text style={{ fontSize: type.body * k, color: fg, fontWeight: '700' }}>
        {icon ? `${icon}  ${label}` : label}
      </Text>
    </Pressable>
  );
}

export function Card({ children, style, ...rest }) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  );
}

export function Chip({ label, active, onPress }) {
  const k = useScale();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.indigo }]}
    >
      <Text
        style={{ fontSize: type.small * k, color: active ? colors.white : colors.indigo, fontWeight: '600' }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minHeight: sizes.target,
    borderRadius: sizes.radius,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.radius,
    padding: sizes.gutter,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  chip: {
    minHeight: sizes.target,
    paddingHorizontal: 16,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.indigo,
    justifyContent: 'center',
    marginRight: 8,
  },
});
