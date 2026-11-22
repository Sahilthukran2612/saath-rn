import React, { useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReducedMotion } from './motion';
import Text from './AppText';
import { colors, fonts, motion, radii, shadow, sizes, text, textStyles, type } from '../theme';
import { useStore } from '../state/store';
import { useNav } from './nav';
import { Check, ChevronLeft, Lock, UserRound } from './icons';
import { tap } from '../services/haptics';

const AnimatedText = Animated.createAnimatedComponent(Text);

// Large-text mode scales every size; OS font scaling still applies on top.
export const useScale = () => (useStore().state.largeText ? 1.35 : 1);

const style = (s, k = 1) => ({
  fontFamily: s.font,
  fontSize: s.size * k,
  lineHeight: s.line * k,
  letterSpacing: s.track,
});

// Feedback starts on touch-down: the control gives a little under the finger and dims, the way Apple's controls do,
// and comes back the instant the finger lifts. Reduced motion keeps only the dim.
function usePressSpring() {
  const reduced = useReducedMotion();
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v) => {
    if (!reduced) Animated.spring(scale, { toValue: v, ...motion.press, useNativeDriver: true }).start();
  };
  return { scale, to };
}

// `style` is the visible surface (background, radius, padding); `containerStyle` only places it.
function PressScale({
  children,
  style: surface,
  containerStyle,
  onPress,
  disabled,
  haptic = true,
  rippleColor,
  ...rest
}) {
  const press = usePressSpring();
  return (
    <Animated.View style={[containerStyle, { transform: [{ scale: press.scale }] }]}>
      <Pressable
        {...rest}
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          press.to(0.97);
          if (haptic) tap();
        }}
        onPressOut={() => press.to(1)}
        style={({ pressed }) => [surface, styles.clip, pressed && { opacity: 0.72 }]}
      >
        {({ pressed }) => (typeof children === 'function' ? children({ pressed }) : children)}
      </Pressable>
    </Animated.View>
  );
}
// Tappable surface used for rows, tiles and icon buttons.
export const PressRow = PressScale;

// The account button that sits at the end of every tab's large title and opens Me.
function AccountButton() {
  const { state, t } = useStore();
  const go = useNav();
  const initials =
    (state.profile?.name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || null;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityLabel={t('tabMe')}
      onPress={() => go('me')}
      style={styles.iconButton}
    >
      <View style={styles.avatar}>
        {initials ? (
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.white }}>{initials}</Text>
        ) : (
          <Glyph icon={UserRound} size={20} color={colors.white} />
        )}
      </View>
    </PressScale>
  );
}

const BAR_H = 52;

// Every screen is built the same way. A large title opens the page, with the account button at its end; as the page
// scrolls, the title hands over to a slim bar that fades in at the top, as on an iPhone. A page inside a flow gets a
// Back button in that bar instead. Content clears the floating tab bar and the phone's own bottom inset.
// `setup` is for first-run and lock screens: no tab bar, no account button.
export function Screen({ title, subtitle, onBack, backLabel, right, setup, children }) {
  const { t } = useStore();
  const k = useScale();
  const insets = useSafeAreaInsets();
  const [y] = useState(() => new Animated.Value(0));
  const bar = y.interpolate({ inputRange: [28, 60], outputRange: [0, 1], extrapolate: 'clamp' });
  const fade = y.interpolate({ inputRange: [0, 44], outputRange: [1, 0], extrapolate: 'clamp' });
  const trailing = right !== undefined ? right : !setup && !onBack ? <AccountButton /> : null;
  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y } } }], { useNativeDriver: true })}
        contentContainerStyle={[
          setup ? styles.setup : styles.screen,
          { paddingTop: onBack ? BAR_H : setup ? 24 : 8, paddingBottom: (setup ? 32 : 120) + insets.bottom },
        ]}
      >
        {title ? (
          <Animated.View style={[styles.titleRow, { opacity: fade }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text
                accessibilityRole="header"
                style={[style(textStyles.largeTitle, Math.min(k, 1.2)), { color: colors.ink }]}
              >
                {title}
              </Text>
              {subtitle ? <Caption>{subtitle}</Caption> : null}
            </View>
            {trailing}
          </Animated.View>
        ) : null}
        {children}
      </Animated.ScrollView>
      {title || onBack ? (
        <View pointerEvents="box-none" style={styles.bar}>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.barFill, { opacity: bar }]}
          />
          {onBack ? (
            <PressScale
              accessibilityRole="button"
              accessibilityLabel={t('back')}
              onPress={onBack}
              style={styles.back}
            >
              <Glyph icon={ChevronLeft} size={28} color={colors.indigo} strokeWidth={2.4} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 18, color: colors.indigo }}>
                {backLabel || t('back')}
              </Text>
            </PressScale>
          ) : null}
          <AnimatedText
            numberOfLines={1}
            pointerEvents="none"
            style={[styles.barTitle, { opacity: bar }]}
            accessibilityElementsHidden
            importantForAccessibility="no"
          >
            {title}
          </AnimatedText>
        </View>
      ) : null}
    </View>
  );
}

// A plain scroll area, for a list inside a panel.
export function Scroll({ children, style: extra }) {
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ gap: 16 }, extra]}>
      {children}
    </ScrollView>
  );
}

// Shown instead of a tab's content when this role may not see it.
export function NoAccess({ title }) {
  const { t } = useStore();
  return (
    <Screen title={title}>
      <Card style={{ alignItems: 'center', paddingVertical: 36, gap: 12 }}>
        <Glyph icon={Lock} size={36} color={colors.inkFaint} />
        <Body style={{ textAlign: 'center' }} soft>
          {t('noAccess')}
        </Body>
      </Card>
    </Screen>
  );
}

export function Body({ children, style: extra, bold, soft }) {
  const k = useScale();
  // A caller's size is a base size; large text scales it too, and the line box follows the size actually used.
  const size = (StyleSheet.flatten(extra)?.fontSize ?? type.body) * k;
  return (
    <Text
      style={[
        {
          fontFamily: bold ? fonts.semi : fonts.regular,
          letterSpacing: text.body.letterSpacing,
          color: soft ? colors.inkSoft : colors.ink,
        },
        extra,
        { fontSize: size, lineHeight: size * text.body.lineHeight },
      ]}
    >
      {children}
    </Text>
  );
}

// Supporting text. Never below 16, so it stays readable for elders.
export function Caption({ children, style: extra }) {
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
        extra,
      ]}
    >
      {children}
    </Text>
  );
}

// A heading inside a page (a panel title, a sheet title). The page title itself is the large title in Screen.
export function Title({ children, style: extra }) {
  const k = useScale();
  const size = (StyleSheet.flatten(extra)?.fontSize ?? type.title) * Math.min(k, 1.2);
  return (
    <Text
      accessibilityRole="header"
      style={[
        { fontFamily: fonts.bold, letterSpacing: text.title.letterSpacing, color: colors.ink },
        extra,
        { fontSize: size, lineHeight: size * text.title.lineHeight },
      ]}
    >
      {children}
    </Text>
  );
}

// Renders a Lucide icon component.
export function Glyph({ icon: Icon, size = 24, color = colors.ink, strokeWidth = 2 }) {
  if (!Icon) return null;
  return <Icon size={size} color={color} strokeWidth={strokeWidth} />;
}

// Capsule buttons, at least 56 tall. One filled button per screen.
//   primary  filled blue        ok    filled green (done, "I'm OK")      alert  filled brick (safety takeover only)
//   quiet    blue-tinted fill   outlined  grey fill, blue label          text   no container, lowest emphasis
const BUTTON = {
  primary: () => [colors.indigo, colors.white],
  ok: () => [colors.leaf, colors.white],
  alert: () => [colors.brick, colors.white],
  quiet: () => [colors.indigoTint, colors.indigoDeep],
  outlined: () => [colors.surfaceHigh, colors.indigo],
  text: () => ['transparent', colors.indigo],
};

export function BigButton({ label, icon, onPress, kind = 'primary', style: extra, hint }) {
  const k = useScale();
  const press = usePressSpring();
  const [bg, fg] = (BUTTON[kind] || BUTTON.primary)();
  return (
    <Animated.View style={{ transform: [{ scale: press.scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={hint}
        onPress={onPress}
        onPressIn={() => {
          press.to(0.97);
          tap();
        }}
        onPressOut={() => press.to(1)}
        style={({ pressed }) => [styles.button, { backgroundColor: bg }, pressed && { opacity: 0.8 }, extra]}
      >
        {icon ? <Glyph icon={icon} size={22 * Math.min(k, 1.2)} color={fg} strokeWidth={2.2} /> : null}
        <Text
          style={{
            fontFamily: fonts.semi,
            fontSize: type.body * k,
            lineHeight: type.body * k * 1.3,
            color: fg,
            flexShrink: 1,
            textAlign: 'center',
          }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// A flat panel on the grey page. Tones are washes for notes and warnings.
const TONE = {
  tint: () => colors.indigoTint,
  haldi: () => colors.haldiTint,
  carbon: () => colors.carbon,
  leaf: () => colors.leafTint,
};
export function Card({ children, style: extra, tone, ...rest }) {
  return (
    <View
      style={[styles.card, { backgroundColor: TONE[tone] ? TONE[tone]() : colors.paper }, extra]}
      {...rest}
    >
      {children}
    </View>
  );
}

// A filter chip: a grey capsule at rest, the blue wash with a leading check when selected.
export function Chip({ label, active, onPress, icon }) {
  const k = useScale();
  const fg = active ? colors.indigoDeep : colors.ink;
  return (
    <PressScale
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: active ? colors.indigoTint : colors.surfaceHigh }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {active ? (
          <Glyph icon={Check} size={18 * Math.min(k, 1.2)} color={colors.indigoDeep} strokeWidth={2.6} />
        ) : icon ? (
          <Glyph icon={icon} size={18 * Math.min(k, 1.2)} color={colors.inkSoft} />
        ) : null}
        <Text style={{ fontFamily: fonts.semi, fontSize: type.small * k, color: fg, flexShrink: 1 }}>
          {label}
        </Text>
      </View>
    </PressScale>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  screen: { paddingHorizontal: sizes.gutter, gap: 16 },
  setup: { paddingHorizontal: 24, gap: 18 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, marginBottom: 4 },
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: BAR_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  barFill: {
    backgroundColor: colors.mist,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.outlineVariant,
  },
  barTitle: {
    position: 'absolute',
    left: 96,
    right: 96,
    textAlign: 'center',
    fontFamily: fonts.semi,
    fontSize: 18,
    color: colors.ink,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingRight: 12,
    borderRadius: radii.md,
  },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    minHeight: sizes.target,
    borderRadius: radii.pill,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  card: { borderRadius: radii.lg, padding: 20, gap: 12, ...shadow.card },
  chip: {
    minHeight: sizes.target,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radii.pill,
    justifyContent: 'center',
  },
});
