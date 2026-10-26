import React, { useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, fonts, type, sizes, text, shadow, press, radii } from '../theme';
import { useStore } from '../state/store';
import { useReducedMotion } from './motion';
import { tap } from '../services/haptics';

// Large-text mode scales every size; OS font scaling still applies on top.
export const useScale = () => (useStore().state.largeText ? 1.35 : 1);

// Press-in shrinks the control at once and a critically damped spring settles it back, so the
// feedback starts on touch-down and can be interrupted. Skipped when the OS asks for reduced motion.
function PressScale({ children, style, containerStyle, onPress, disabled, haptic = true, ...rest }) {
  const [scale] = useState(() => new Animated.Value(1));
  const reduced = useReducedMotion();
  const to = (value) => {
    if (reduced) return;
    Animated.spring(scale, { toValue: value, useNativeDriver: true, ...press.spring }).start();
  };
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={containerStyle}
      onPress={onPress}
      onPressIn={() => {
        to(press.scale);
        if (haptic) tap();
      }}
      onPressOut={() => to(1)}
    >
      {({ pressed }) => (
        <Animated.View style={[style, { transform: [{ scale }], opacity: pressed ? 0.94 : 1 }]}>
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

export function Body({ children, style, bold, soft }) {
  const k = useScale();
  // Line height follows the font size actually used, including a caller's override,
  // otherwise big emoji and large titles are clipped inside a too-short line box.
  const size = StyleSheet.flatten(style)?.fontSize ?? type.body * k;
  return (
    <Text
      style={[
        {
          fontFamily: bold ? fonts.bold : fonts.regular,
          fontSize: size,
          lineHeight: size * text.body.lineHeight,
          letterSpacing: text.body.letterSpacing,
          color: soft ? colors.inkSoft : colors.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// Smaller supporting text. Never below 16 so it stays readable for elders.
export function Caption({ children, style }) {
  const k = useScale();
  const size = type.small * k;
  return (
    <Text
      style={[
        {
          fontFamily: fonts.regular,
          fontSize: size,
          lineHeight: size * text.small.lineHeight,
          letterSpacing: text.small.letterSpacing,
          color: colors.inkSoft,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Title({ children, style }) {
  const k = useScale();
  const size = StyleSheet.flatten(style)?.fontSize ?? type.title * k;
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontFamily: fonts.bold,
          fontSize: size,
          lineHeight: size * text.title.lineHeight,
          letterSpacing: text.title.letterSpacing,
          color: colors.indigo,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// Renders a Lucide icon component (or, for older call sites, an emoji string).
export function Glyph({ icon: Icon, size = 22, color = colors.ink, strokeWidth = 1.9 }) {
  if (!Icon) return null;
  if (typeof Icon === 'string') return <Text style={{ fontSize: size }}>{Icon}</Text>;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

// One primary action per screen: kind="primary" (indigo); "ok" is leaf; "alert" is brick, only for real
// safety alerts; "quiet" is a tonal secondary button.
export function BigButton({ label, icon, onPress, kind = 'primary', style, hint }) {
  const k = useScale();
  const bg = { primary: colors.indigo, ok: colors.leaf, alert: colors.brick, quiet: colors.indigoTint }[kind];
  const fg = kind === 'quiet' ? colors.indigo : colors.white;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={[styles.btn, kind === 'quiet' ? null : shadow.raised, { backgroundColor: bg }, style]}
    >
      <View style={styles.btnRow}>
        {icon ? <Glyph icon={icon} size={22 * k} color={fg} /> : null}
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: type.body * k,
            letterSpacing: 0.1,
            color: fg,
            textAlign: 'center',
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

// A flat panel. Depth is reserved for the hero and raised controls, so most surfaces stay quiet.
export function Card({ children, style, tone, ...rest }) {
  const toneStyle = tone === 'tint' ? styles.cardTint : tone === 'haldi' ? styles.cardHaldi : null;
  return (
    <View style={[styles.card, toneStyle, style]} {...rest}>
      {children}
    </View>
  );
}

export function Chip({ label, active, onPress, icon }) {
  const k = useScale();
  const fg = active ? colors.white : colors.indigo;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View style={styles.btnRow}>
        {icon ? <Glyph icon={icon} size={18 * k} color={fg} /> : null}
        <Text
          style={{
            fontFamily: fonts.semi,
            fontSize: type.small * k,
            letterSpacing: text.small.letterSpacing,
            color: fg,
            flexShrink: 1,
          }}
        >
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

// Tappable row used for the routine list (checkbox semantics are set by the caller).
export const PressRow = PressScale;

const styles = StyleSheet.create({
  btn: {
    minHeight: sizes.target,
    borderRadius: radii.lg,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: sizes.gutter,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  cardTint: { backgroundColor: colors.indigoTint, borderColor: 'transparent' },
  cardHaldi: { backgroundColor: colors.haldiTint, borderColor: 'transparent' },
  chip: {
    minHeight: sizes.target - 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.indigoTint,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.indigo },
});
