import React, { useEffect, useRef } from 'react';
import { Animated, AccessibilityInfo, Pressable, Text, View, StyleSheet } from 'react-native';
import { colors, type, sizes, text, shadow, press } from '../theme';
import { useStore } from '../state/store';

// Large-text mode scales every size; OS font scaling still applies on top.
export const useScale = () => (useStore().state.largeText ? 1.35 : 1);

// Press-in shrinks the control at once and a critically damped spring settles it back, so the
// feedback starts on touch-down and can be interrupted. Skipped when the OS asks for reduced motion.
function PressScale({ children, style, containerStyle, onPress, disabled, ...rest }) {
  const scale = useRef(new Animated.Value(1)).current;
  const reduced = useRef(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => {
        if (live) reduced.current = !!v;
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const to = (value) => {
    if (reduced.current) return;
    Animated.spring(scale, { toValue: value, useNativeDriver: true, ...press.spring }).start();
  };
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      style={containerStyle}
      onPress={onPress}
      onPressIn={() => to(press.scale)}
      onPressOut={() => to(1)}
    >
      {({ pressed }) => (
        <Animated.View style={[style, { transform: [{ scale }], opacity: pressed ? 0.92 : 1 }]}>
          {typeof children === 'function' ? children({ pressed }) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

export function Body({ children, style, bold }) {
  const k = useScale();
  // Line height follows the font size actually used, including a caller's override,
  // otherwise big emoji and large titles are clipped inside a too-short line box.
  const size = StyleSheet.flatten(style)?.fontSize ?? type.body * k;
  return (
    <Text
      style={[
        {
          fontSize: size,
          lineHeight: size * text.body.lineHeight,
          letterSpacing: text.body.letterSpacing,
          color: colors.ink,
          fontWeight: bold ? '700' : '400',
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
  const size = type.title * k;
  return (
    <Text
      accessibilityRole="header"
      style={[
        {
          fontSize: size,
          lineHeight: size * text.title.lineHeight,
          letterSpacing: text.title.letterSpacing,
          color: colors.indigo,
          fontWeight: '700',
        },
        style,
      ]}
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
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={[styles.btn, kind === 'quiet' ? styles.btnQuiet : shadow.raised, { backgroundColor: bg }, style]}
    >
      <Text
        style={{
          fontSize: type.body * k,
          letterSpacing: 0.1,
          color: fg,
          fontWeight: '700',
          textAlign: 'center',
        }}
      >
        {icon ? `${icon}  ${label}` : label}
      </Text>
    </PressScale>
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
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text
        style={{
          fontSize: type.small * k,
          letterSpacing: text.small.letterSpacing,
          color: active ? colors.white : colors.indigo,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </PressScale>
  );
}

// Tappable row used for the routine list (checkbox semantics are set by the caller).
export const PressRow = PressScale;

const styles = StyleSheet.create({
  btn: {
    minHeight: sizes.target,
    borderRadius: sizes.radius,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnQuiet: {
    borderWidth: 1.5,
    borderColor: colors.indigo,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: sizes.radius,
    padding: sizes.gutter + 4,
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    ...shadow.card,
  },
  chip: {
    minHeight: sizes.target,
    paddingHorizontal: 20,
    borderRadius: 28,
    backgroundColor: colors.indigoTint,
    justifyContent: 'center',
    marginRight: 8,
  },
  chipActive: { backgroundColor: colors.indigo },
});
