import React from 'react';
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { ChevronLeft, ChevronRight } from './icons';
import { colors, fonts, radii, type } from '../theme';
import { Body, Caption, Glyph, Title, useScale } from './ui';
import { useReducedMotion, useSpringValue } from './motion';
import { tap } from '../services/haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---- Avatar: initials on a role colour ----
const ROLE_TONE = {
  person: [colors.indigo, colors.white],
  family: [colors.indigoTint, colors.indigo],
  neighbour: [colors.haldiTint, colors.haldiDeep],
  asha: [colors.leafTint, colors.leafDeep],
  clinician: [colors.indigoSoft, colors.indigoDeep],
};
export function Avatar({ name = '', role = 'family', size = 44 }) {
  const initials =
    name
      .replace(/\(.*?\)/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?';
  const [bg, fg] = ROLE_TONE[role] || ROLE_TONE.family;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: size * 0.4, color: fg }}>{initials}</Text>
    </View>
  );
}

// ---- Grouped list: one panel with hairline dividers instead of a card per row ----
export function ListGroup({ children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {items.map((c, i) => React.cloneElement(c, { last: i === items.length - 1 }))}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor = colors.indigo,
  iconBg = colors.indigoTint,
  lead,
  title,
  subtitle,
  trailing,
  onPress,
  last,
  label,
  chevron,
}) {
  const k = useScale();
  const body = (
    <View style={[styles.row, !last && styles.rowDivider]}>
      {lead ||
        (icon ? (
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <Glyph icon={icon} size={22 * Math.min(k, 1.2)} color={iconColor} />
          </View>
        ) : null)}
      <View style={{ flex: 1, gap: 2 }}>
        <Body bold={!!subtitle}>{title}</Body>
        {subtitle ? <Caption>{subtitle}</Caption> : null}
      </View>
      {trailing}
      {onPress && chevron !== false ? <Glyph icon={ChevronRight} size={20} color={colors.inkFaint} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || title}
      onPress={onPress}
      android_ripple={{ color: colors.indigoTint }}
    >
      {body}
    </Pressable>
  );
}

// ---- Switch: a spring-driven toggle with the state in its accessibility label ----
export function Toggle({ value, onValueChange, label }) {
  const reduced = useReducedMotion();
  const x = useSpringValue(value ? 1 : 0, { damping: 20, stiffness: 320, mass: 1 });
  const pos = x.interpolate({ inputRange: [0, 1], outputRange: [3, 27] });
  const bg = x.interpolate({ inputRange: [0, 1], outputRange: [colors.lineStrong, colors.leaf] });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={`${label}: ${value ? 'on' : 'off'}`}
      accessibilityState={{ checked: !!value }}
      onPress={() => {
        tap();
        onValueChange(!value);
      }}
      hitSlop={8}
      style={{ minHeight: 56, justifyContent: 'center' }}
    >
      <Animated.View
        style={[styles.track, { backgroundColor: reduced ? (value ? colors.leaf : colors.lineStrong) : bg }]}
      >
        <Animated.View style={[styles.knob, { transform: [{ translateX: pos }] }]} />
      </Animated.View>
    </Pressable>
  );
}

// ---- Segmented control: a thumb slides under the chosen option ----
export function Segmented({ options, value, onChange }) {
  const reduced = useReducedMotion();
  const [w, setW] = React.useState(0);
  const [x] = React.useState(() => new Animated.Value(0));
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const slot = w / options.length;
  React.useEffect(() => {
    if (!slot) return undefined;
    if (reduced) {
      x.setValue(index * slot);
      return undefined;
    }
    const a = Animated.spring(x, {
      toValue: index * slot,
      useNativeDriver: true,
      damping: 22,
      stiffness: 320,
      mass: 1,
    });
    a.start();
    return () => a.stop();
  }, [index, slot, reduced, x]);
  return (
    <View style={styles.segTrack} onLayout={(e) => setW(e.nativeEvent.layout.width - 6)}>
      {slot > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[styles.segThumb, { width: slot, transform: [{ translateX: x }] }]}
        />
      )}
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={styles.segItem}
          >
            <Text
              numberOfLines={1}
              style={{
                fontFamily: on ? fonts.bold : fonts.semi,
                fontSize: 15.5,
                color: on ? colors.indigo : colors.inkSoft,
              }}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---- Text field with a visible label, a clear focus ring and a 56 px target ----
export function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  multiline,
  secureTextEntry,
  onEndEditing,
}) {
  const k = useScale();
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ gap: 4 }}>
      <Caption>{label}</Caption>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder ?? label}
        placeholderTextColor={colors.inkFaint}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        onEndEditing={onEndEditing}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          minHeight: 56,
          fontFamily: fonts.regular,
          fontSize: type.body * k,
          color: colors.ink,
          borderWidth: focus ? 2 : 1.5,
          borderColor: focus ? colors.indigo : colors.lineStrong,
          borderRadius: radii.md,
          paddingHorizontal: 14,
          backgroundColor: colors.white,
        }}
      />
    </View>
  );
}

// ---- Stage track: four nodes joined by a line; the current stage is filled haldi ----
export function StageTrack({ stage, width = 280, onDark = true }) {
  const pad = 18;
  const n = 4;
  const xs = Array.from({ length: n }, (_, i) => pad + (i * (width - pad * 2)) / (n - 1));
  const base = onDark ? colors.indigoSoft : colors.lineStrong;
  const empty = onDark ? colors.white : colors.white;
  return (
    <Svg width={width} height={36} accessibilityLabel={`${stage + 1}/${n}`}>
      <Path d={`M ${xs[0]} 18 L ${xs[n - 1]} 18`} stroke={base} strokeWidth={4} strokeLinecap="round" />
      <Path
        d={`M ${xs[0]} 18 L ${xs[stage]} 18`}
        stroke={colors.haldi}
        strokeWidth={4}
        strokeLinecap="round"
      />
      {xs.map((x, i) => (
        <Circle
          key={i}
          cx={x}
          cy={18}
          r={i === stage ? 11 : 7}
          fill={i <= stage ? colors.haldi : empty}
          stroke={i <= stage ? colors.haldiDeep : base}
          strokeWidth={2.5}
        />
      ))}
    </Svg>
  );
}

// ---- Progress ring ----
export function ProgressRing({
  size = 120,
  stroke = 10,
  progress = 0,
  color = colors.leaf,
  track = colors.indigoSoft,
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSpringValue(Math.max(0, Math.min(1, progress)));
  const offset = p.interpolate({ inputRange: [0, 1], outputRange: [c, 0] });
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

// ---- Dye ring: the one memorable element. Bandhani-style dots, one per routine task, around a live arc ----
export function DyeRing({ total, done, size = 232, children }) {
  const n = Math.max(total, 1);
  const rDots = size / 2 - 11;
  const dots = Array.from({ length: n }, (_, i) => {
    const a = (-90 + (i * 360) / n) * (Math.PI / 180);
    return { x: size / 2 + rDots * Math.cos(a), y: size / 2 + rDots * Math.sin(a), on: i < done };
  });
  const ringSize = size - 54;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* faint bandhani texture: a ring of tiny dots behind the task dots */}
        {Array.from({ length: 40 }, (_, i) => {
          const a = (i * 360 * Math.PI) / (40 * 180);
          return (
            <Circle
              key={`t${i}`}
              cx={size / 2 + (rDots - 2) * Math.cos(a)}
              cy={size / 2 + (rDots - 2) * Math.sin(a)}
              r={1.6}
              fill={colors.indigoSoft}
              opacity={0.55}
            />
          );
        })}
        {dots.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.on ? 9 : 6} fill={d.on ? colors.leaf : colors.indigoSoft} />
        ))}
      </Svg>
      <ProgressRing
        size={ringSize}
        stroke={10}
        progress={total ? done / total : 0}
        color={colors.leaf}
        track={colors.indigoTint}
      >
        {children}
      </ProgressRing>
    </View>
  );
}

// ---- Check mark: the fill grows and the tick draws itself when a task is done ----
const AnimatedPath = Animated.createAnimatedComponent(Path);
export function CheckMark({ done, size = 32 }) {
  const p = useSpringValue(done ? 1 : 0, { damping: 18, stiffness: 340, mass: 1 });
  const r = p.interpolate({ inputRange: [0, 1], outputRange: [0, size / 2 - 1] });
  const dash = p.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  const c = size / 2;
  const s = size / 32;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={c}
        cy={c}
        r={c - 1.5}
        stroke={done ? colors.leaf : colors.lineStrong}
        strokeWidth={2.2}
        fill="none"
      />
      <AnimatedCircle cx={c} cy={c} r={r} fill={colors.leaf} />
      <AnimatedPath
        d={`M ${9 * s} ${16.5 * s} L ${14 * s} ${21 * s} L ${23 * s} ${11.5 * s}`}
        stroke={colors.white}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="26 26"
        strokeDashoffset={dash}
      />
    </Svg>
  );
}

// ---- Line chart: smooth path with a soft fill. Numbers are always printed, never colour only ----
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}
export function LineChart({ values, width = 300, height = 120, color = colors.indigo, label }) {
  if (values.length < 2) return null;
  const padX = 14;
  const padY = 16;
  const lo = Math.min(...values, 70) - 10;
  const hi = Math.max(...values, 180) + 10;
  const pts = values.map((v, i) => ({
    x: padX + (i * (width - padX * 2)) / (values.length - 1),
    y: padY + ((hi - v) * (height - padY * 2)) / (hi - lo),
    v,
  }));
  const line = smoothPath(pts);
  const area = `${line} L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;
  return (
    <View accessibilityLabel={label} accessible={!!label}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.22" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#fill)" />
        <Path d={line} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        {pts.map((p, i) => {
          const out = p.v < 70 || p.v > 250;
          const lastPt = i === pts.length - 1;
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={lastPt ? 6 : 4}
              fill={out ? colors.haldi : colors.white}
              stroke={out ? colors.haldiDeep : color}
              strokeWidth={2.5}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// ---- Header, badge, stat ----
export function ScreenHeader({ title, subtitle, onBack, backLabel = 'Back', right }) {
  return (
    <View style={{ gap: 6 }}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          hitSlop={10}
          style={styles.back}
        >
          <Glyph icon={ChevronLeft} size={24} color={colors.indigo} />
          <Text style={{ fontFamily: fonts.semi, fontSize: type.body, color: colors.indigo }}>
            {backLabel}
          </Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Title>{title}</Title>
          {subtitle ? <Caption>{subtitle}</Caption> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function Badge({ label, tone = 'indigo' }) {
  const t = {
    indigo: [colors.indigoTint, colors.indigo],
    leaf: [colors.leafTint, colors.leafDeep],
    haldi: [colors.haldiTint, colors.haldiDeep],
    brick: [colors.brickTint, colors.brick],
  }[tone];
  return (
    <View
      style={{
        backgroundColor: t[0],
        borderRadius: radii.pill,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontFamily: fonts.semi, fontSize: 15, color: t[1] }}>{label}</Text>
    </View>
  );
}

export function Stat({ value, label, color = colors.indigo }) {
  return (
    <View style={{ flex: 1, gap: 0 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 36, letterSpacing: -0.4, color }}>
        {value}
      </Text>
      <Caption>{label}</Caption>
    </View>
  );
}

export function SectionTitle({ children }) {
  return (
    <View style={{ paddingTop: 8 }}>
      <Body bold>{children}</Body>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 64,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  track: { width: 56, height: 32, borderRadius: 16, justifyContent: 'center' },
  knob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, alignSelf: 'flex-start' },
  segTrack: { flexDirection: 'row', backgroundColor: colors.indigoTint, borderRadius: radii.md, padding: 3 },
  segThumb: {
    position: 'absolute',
    left: 3,
    top: 3,
    bottom: 3,
    borderRadius: radii.md - 3,
    backgroundColor: colors.white,
    shadowColor: '#1B1E2B',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  segItem: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
});
