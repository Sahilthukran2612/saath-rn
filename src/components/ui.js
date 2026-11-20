import React, { useState } from 'react';
import { Animated, Pressable, View, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text as UiText } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useReducedMotion } from './motion';
import Text from './AppText';
import { colors, fonts, type, sizes, text, shadow, radii, roles } from '../theme';
import { useStore } from '../state/store';
import { Check } from './icons';
import { tap } from '../services/haptics';

// Large-text mode scales every size; OS font scaling still applies on top.
export const useScale = () => (useStore().state.largeText ? 1.35 : 1);

// The small spring every pressable control shares: it gives a little under the finger on touch-down and returns on
// release. Reduced motion keeps only the ripple.
function usePressSpring() {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v) => {
    if (!reduced) Animated.spring(scale, { toValue: v, damping: 20, stiffness: 420, mass: 1, useNativeDriver: true }).start();
  };
  return { scale, to };
}
// Material state layer: a ripple clipped to the control's own shape, with a light haptic on touch-down.
// `style` is the visible surface (background, radius, padding); `containerStyle` only places it.
function PressScale({
  children,
  style,
  containerStyle,
  onPress,
  disabled,
  haptic = true,
  rippleColor = 'rgba(38,48,107,0.14)',
  ...rest
}) {
  // Feedback starts on touch-down, not on release: the control gives a little under the finger on a critically
  // damped spring, and comes back the instant it lets go. Reduced motion keeps only the ripple.
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v) =>
    reduced
      ? null
      : Animated.spring(scale, { toValue: v, damping: 20, stiffness: 420, mass: 1, useNativeDriver: true }).start();
  return (
    <Animated.View style={[containerStyle, { transform: [{ scale }] }]}>
      <Pressable
        {...rest}
        disabled={disabled}
        android_ripple={{ color: rippleColor, foreground: true }}
        onPress={onPress}
        onPressIn={() => {
          to(0.97);
          if (haptic) tap();
        }}
        onPressOut={() => to(1)}
        style={({ pressed }) => [style, styles.clip, pressed && { opacity: 0.96 }]}
      >
        {({ pressed }) => (typeof children === 'function' ? children({ pressed }) : children)}
      </Pressable>
    </Animated.View>
  );
}

const roleStyle = (role, k = 1) => ({
  fontFamily: role.font,
  fontSize: role.size * k,
  lineHeight: role.line * k,
  letterSpacing: role.track,
});

export function Body({ children, style, bold, soft }) {
  const k = useScale();
  // Line height follows the font size actually used, including a caller's override,
  // otherwise big glyphs and large titles are clipped inside a too-short line box.
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

// Smaller supporting text (Material "body medium"). Never below 16 so it stays readable for elders.
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

// Headline (Material "headline small"). Neutral on-surface colour, like Google's own apps.
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
          color: colors.ink,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// Renders a Lucide icon component (or, for older call sites, an emoji string).
export function Glyph({ icon: Icon, size = 24, color = colors.ink, strokeWidth = 1.9 }) {
  if (!Icon) return null;
  if (typeof Icon === 'string') return <Text style={{ fontSize: size }}>{Icon}</Text>;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

// Buttons are React Native Reusables' Button on NativeWind classes: full-pill, at least 56 tall. One filled button
// per screen. Kinds:
//   primary  filled, blue              ok       filled, leaf green (done, "I'm OK")
//   alert    filled, brick (real safety alerts only)
//   quiet    tonal (secondary)         outlined outline, no fill      text   no container, lowest emphasis
const BUTTON_VARIANT = { primary: 'default', ok: 'default', alert: 'destructive', quiet: 'secondary', outlined: 'outline', text: 'ghost' };

export function BigButton({ label, icon, onPress, kind = 'primary', style, hint }) {
  const k = useScale();
  const press = usePressSpring();
  const fg = {
    primary: colors.white,
    ok: colors.white,
    alert: colors.white,
    quiet: colors.indigoDeep,
    outlined: colors.indigo,
    text: colors.indigo,
  }[kind];
  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Button
        variant={BUTTON_VARIANT[kind]}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={onPress}
        onPressIn={() => {
          press.to(0.97);
          tap();
        }}
        onPressOut={() => press.to(1)}
        className={cn('h-auto min-h-14 rounded-full px-6 py-3', kind === 'ok' && 'bg-leaf active:bg-leaf/90')}
        style={style}
      >
        {icon ? <Glyph icon={icon} size={24 * Math.min(k, 1.2)} color={fg} /> : null}
        <UiText
          className="text-center"
          style={{
            fontFamily: fonts.bold,
            fontSize: type.body * k,
            lineHeight: type.body * k * 1.3,
            color: fg,
            flexShrink: 1,
          }}
        >
          {label}
        </UiText>
      </Button>
    </Animated.View>
  );
}

// A filled card: bill-white on the page, depth from a soft shadow. Tones are washes for notes and warnings.
export function Card({ children, style, tone, ...rest }) {
  const toneStyle = tone === 'tint' ? styles.cardTint : tone === 'haldi' ? styles.cardHaldi : tone === 'carbon' ? styles.cardCarbon : null;
  return (
    <View className="gap-2.5 rounded-lg bg-card p-5" style={[shadow.card, toneStyle, style]} {...rest}>
      {children}
    </View>
  );
}

// Filter chip: outlined at rest, a blue wash with a leading check when selected.
export function Chip({ label, active, onPress, icon }) {
  const k = useScale();
  const fg = active ? colors.indigoDeep : colors.inkSoft;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <View className="flex-row items-center gap-2">
        {active ? (
          <Glyph icon={Check} size={18 * Math.min(k, 1.2)} color={colors.indigoDeep} strokeWidth={2.4} />
        ) : icon ? (
          <Glyph icon={icon} size={18 * Math.min(k, 1.2)} color={fg} />
        ) : null}
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
  clip: { overflow: 'hidden' },
  btn: {
    minHeight: sizes.target,
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  // a slip: white bill paper with a ballpoint-blue edge; tint is a pale wash, haldi the yellow copy, carbon the pink copy
  card: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: sizes.gutter,
    gap: 10,
    ...shadow.card,
  },
  cardTint: { backgroundColor: colors.indigoTint },
  cardHaldi: { backgroundColor: colors.haldiTint },
  cardCarbon: { backgroundColor: colors.carbon },
  chip: {
    minHeight: sizes.target - 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.indigoTint, borderColor: 'transparent' },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});

// Re-exported so components can opt into a raised surface without importing the theme.
export const raised = shadow.raised;
