import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from './AppText';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { ChevronLeft, ChevronRight } from './icons';
import { colors, fonts, motion, radii, themeName, type } from '../theme';
import { Caption, Glyph, Title, useScale } from './ui';
import { useSpringValue } from './motion';
import { tap } from '../services/haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---- Avatar: initials on a soft role colour ----
const ROLE_TONE = {
  person: () => [colors.indigo, colors.white],
  family: () => [colors.indigoTint, colors.indigoDeep],
  neighbour: () => [colors.haldiTint, colors.haldiDeep],
  asha: () => [colors.leafTint, colors.leafDeep],
  clinician: () => [colors.stampTint, colors.stamp],
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
  const [bg, fg] = (ROLE_TONE[role] || ROLE_TONE.family)();
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

// ---- Grouped list: one flat panel, rows separated by hairlines inset to the text ----
export function ListGroup({ children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, style]}>
      {items.map((c, i) => React.cloneElement(c, { last: i === items.length - 1 }))}
    </View>
  );
}

// A row: an icon on a soft tile, a title, an optional second line, trailing content. A row that opens a page shows
// a chevron (`chevron`); a pressed row highlights the way a table cell does.
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
  const hasLead = !!(lead || icon);
  const content = (
    <>
      <View style={styles.row}>
        {lead ||
          (icon ? (
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <Glyph icon={icon} size={20 * Math.min(k, 1.2)} color={iconColor} strokeWidth={2.2} />
            </View>
          ) : null)}
        <View style={{ flex: 1, gap: 1 }}>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: type.body * k,
              lineHeight: type.body * k * 1.36,
              color: colors.ink,
            }}
          >
            {title}
          </Text>
          {subtitle ? <Caption>{subtitle}</Caption> : null}
        </View>
        {trailing}
        {onPress && chevron === true ? (
          <Glyph icon={ChevronRight} size={20} color={colors.control} strokeWidth={2.4} />
        ) : null}
      </View>
      {!last ? <View style={[styles.separator, { marginLeft: hasLead ? 66 : 16 }]} /> : null}
    </>
  );
  if (!onPress) return <View>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || title}
      onPress={onPress}
      onPressIn={tap}
      style={({ pressed }) => pressed && { backgroundColor: colors.surfaceHigh }}
    >
      {content}
    </Pressable>
  );
}

// ---- Switch: the familiar capsule with a sliding knob. Green when on; the off track is dark enough to see ----
export function Toggle({ value, onValueChange, label }) {
  const x = useSpringValue(value ? 1 : 0, motion.snappy);
  const left = x.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  const bg = x.interpolate({ inputRange: [0, 1], outputRange: [colors.control, colors.leaf] });
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
      style={{ minHeight: 56, minWidth: 56, justifyContent: 'center', alignItems: 'center' }}
    >
      <Animated.View style={[styles.track, { backgroundColor: bg }]}>
        <Animated.View style={[styles.knob, { left }]} />
      </Animated.View>
    </Pressable>
  );
}

// ---- Segmented control: a grey track and a raised thumb that slides to the choice on a spring ----
export function Segmented({ options, value, onChange }) {
  const k = useScale();
  const [w, setW] = useState(0);
  const n = options.length;
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value)
  );
  const pos = useSpringValue(index, motion.snappy);
  const seg = w > 0 ? (w - 6) / n : 0;
  return (
    <View style={styles.segTrack} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {seg > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.segThumb, { width: seg, transform: [{ translateX: Animated.multiply(pos, seg) }] }]}
        />
      ) : null}
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
              numberOfLines={2}
              style={{
                fontFamily: on ? fonts.semi : fonts.regular,
                fontSize: type.small * Math.min(k, 1.2),
                textAlign: 'center',
                color: on ? colors.ink : colors.inkSoft,
                flexShrink: 1,
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

// ---- Text field: a label above a soft grey well, 56 tall, a blue ring while focused ----
export function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  placeholder,
  multiline,
  secureTextEntry,
  onEndEditing,
  onBlur,
}) {
  const k = useScale();
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Caption>{label}</Caption>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={colors.inkFaint}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        onEndEditing={onEndEditing}
        onFocus={() => setFocus(true)}
        onBlur={() => {
          setFocus(false);
          if (onBlur) onBlur();
        }}
        style={[
          styles.input,
          { fontSize: type.body * k, borderColor: focus ? colors.indigo : 'transparent' },
          multiline && { minHeight: 96, textAlignVertical: 'top', paddingTop: 14 },
        ]}
      />
    </View>
  );
}

// ---- Stage track: four steps joined by a line; done steps are filled ----
export function StageTrack({ stage, width = 280 }) {
  const pad = 14;
  const n = 4;
  const xs = Array.from({ length: n }, (_, i) => pad + (i * (width - pad * 2)) / (n - 1));
  return (
    <Svg width={width} height={32} accessibilityLabel={`${stage + 1}/${n}`}>
      <Path
        d={`M ${xs[0]} 16 L ${xs[n - 1]} 16`}
        stroke={colors.surfaceHigh}
        strokeWidth={6}
        strokeLinecap="round"
      />
      <Path
        d={`M ${xs[0]} 16 L ${xs[stage]} 16`}
        stroke={colors.indigo}
        strokeWidth={6}
        strokeLinecap="round"
      />
      {xs.map((x, i) => (
        <Circle
          key={i}
          cx={x}
          cy={16}
          r={i === stage ? 11 : 7}
          fill={i <= stage ? colors.indigo : colors.paper}
          stroke={i <= stage ? colors.indigo : colors.control}
          strokeWidth={2}
        />
      ))}
      <Circle cx={xs[stage]} cy={16} r={4} fill={colors.white} />
    </Svg>
  );
}

// The stage track, stretched to the width it is given.
export function FitStageTrack(props) {
  const [w, setW] = useState(0);
  return (
    <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
      {w > 0 ? <StageTrack {...props} width={w} /> : <View style={{ height: 32 }} />}
    </View>
  );
}

// ---- Progress ring ----
export function ProgressRing({
  size = 120,
  stroke = 10,
  progress = 0,
  color = colors.leaf,
  track = colors.surfaceHigh,
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

// ---- Check mark: the fill grows and the tick draws itself when a task is done ----
const AnimatedPath = Animated.createAnimatedComponent(Path);
export function CheckMark({ done, size = 32 }) {
  const p = useSpringValue(done ? 1 : 0, motion.settle);
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
        stroke={done ? colors.leaf : colors.control}
        strokeWidth={2}
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

// ---- Line chart: a smooth line over a soft fill. Numbers are always printed nearby, never colour only ----
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
export function LineChart({
  values,
  width = 300,
  height = 120,
  color = colors.indigo,
  label,
  floor = 70,
  ceil = 180,
  markOutliers = true,
}) {
  if (values.length < 2) return null;
  const padX = 10;
  const padY = 14;
  const lo = Math.min(...values, floor) - 10;
  const hi = Math.max(...values, ceil) + 10;
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
            <Stop offset="0" stopColor={color} stopOpacity="0.18" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#fill)" />
        <Path d={line} stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
        {pts.map((p, i) => {
          const out = markOutliers && (p.v < 70 || p.v > 250);
          const lastPt = i === pts.length - 1;
          if (!out && !lastPt) return null;
          return (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={lastPt ? 6 : 5}
              fill={out ? colors.haldi : colors.paper}
              stroke={out ? colors.haldiDeep : color}
              strokeWidth={2.5}
            />
          );
        })}
      </Svg>
    </View>
  );
}

// A line chart that fills whatever space it is given, so it always reaches both edges of its panel.
export function FitLineChart(props) {
  const [w, setW] = useState(0);
  return (
    <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
      {w > 0 ? <LineChart {...props} width={w} /> : <View style={{ height: props.height || 120 }} />}
    </View>
  );
}

// A heading inside a flow: Back, then the title. Prefer Screen's own `onBack` for whole pages.
export function ScreenHeader({ title, subtitle, onBack, backLabel = 'Back', right }) {
  return (
    <View style={{ gap: 4 }}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          style={styles.back}
        >
          <Glyph icon={ChevronLeft} size={28} color={colors.indigo} strokeWidth={2.4} />
          <Text style={{ fontFamily: fonts.regular, fontSize: 18, color: colors.indigo }}>{backLabel}</Text>
        </Pressable>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Title style={{ fontSize: 28 }}>{title}</Title>
          {subtitle ? <Caption>{subtitle}</Caption> : null}
        </View>
        {right}
      </View>
    </View>
  );
}

// A small status capsule. Brick only for a real alert.
const BADGE = {
  indigo: () => [colors.indigoTint, colors.indigoDeep],
  leaf: () => [colors.leafTint, colors.leafDeep],
  haldi: () => [colors.haldiTint, colors.haldiDeep],
  brick: () => [colors.brickTint, colors.brick],
};
export function Badge({ label, tone = 'indigo' }) {
  const [bg, fg] = (BADGE[tone] || BADGE.indigo)();
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, lineHeight: 22, color: fg }}>{label}</Text>
    </View>
  );
}

export function Stat({ value, label, color = colors.ink }) {
  const k = useScale();
  return (
    <View style={{ flex: 1, gap: 0 }}>
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 30 * Math.min(k, 1.2),
          lineHeight: 38 * Math.min(k, 1.2),
          letterSpacing: -0.4,
          color,
        }}
      >
        {value}
      </Text>
      <Caption>{label}</Caption>
    </View>
  );
}

// The heading over a group of rows or panels.
export function SectionTitle({ children }) {
  const k = useScale();
  return (
    <View style={{ paddingTop: 12, paddingHorizontal: 4 }}>
      <Text
        accessibilityRole="header"
        style={{
          fontFamily: fonts.bold,
          fontSize: 20 * Math.min(k, 1.2),
          lineHeight: 26 * Math.min(k, 1.2),
          color: colors.ink,
        }}
      >
        {children}
      </Text>
    </View>
  );
}

const dark = themeName === 'dark';
const styles = StyleSheet.create({
  group: { backgroundColor: colors.paper, borderRadius: radii.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant },
  iconBox: { width: 36, height: 36, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
  track: { width: 52, height: 32, borderRadius: 16 },
  knob: {
    position: 'absolute',
    top: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    marginLeft: -8,
    alignSelf: 'flex-start',
  },
  segTrack: {
    flexDirection: 'row',
    minHeight: 56,
    padding: 3,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceHigh,
  },
  segThumb: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 11,
    backgroundColor: dark ? '#5A5A5F' : colors.white,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  input: {
    minHeight: 56,
    borderRadius: radii.md,
    borderWidth: 2,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    color: colors.ink,
  },
  badge: { alignSelf: 'flex-start', borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 3 },
});
