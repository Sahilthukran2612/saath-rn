import React from 'react';
import { Animated, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Text from './AppText';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { ArrowLeft, Check, ChevronRight } from './icons';
import { colors, fonts, radii, type } from '../theme';
import { Body, Caption, Glyph, Title, useScale } from './ui';
import Perf from './Perf';
import { useSpringValue } from './motion';
import { tap } from '../services/haptics';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// ---- Avatar: initials on a role colour ----
const ROLE_TONE = {
  person: [colors.indigo, colors.white],
  family: [colors.indigoTint, colors.indigo],
  neighbour: [colors.haldiTint, colors.haldiDeep],
  asha: [colors.leafTint, colors.leafDeep],
  clinician: [colors.indigoSoft, '#102A7A'],
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

// Material list item: a leading icon in a tonal circle, headline and supporting text, trailing content.
// A chevron appears only when asked for (`chevron`); a row that opens something is signalled by its ripple.
export function ListRow({
  icon,
  iconColor = colors.indigoDeep,
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
  const body = (
    <View>
      <View style={styles.row}>
        {lead ||
          (icon ? (
            <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
              <Glyph icon={icon} size={24 * Math.min(k, 1.2)} color={iconColor} />
            </View>
          ) : null)}
        <View style={{ flex: 1, gap: 2 }}>
          <Body bold={!!subtitle}>{title}</Body>
          {subtitle ? <Caption>{subtitle}</Caption> : null}
        </View>
        {trailing}
        {onPress && chevron === true ? <Glyph icon={ChevronRight} size={24} color={colors.inkFaint} /> : null}
      </View>
      {!last ? <Perf style={{ marginLeft: hasLead ? 72 : 16, marginRight: 16 }} /> : null}
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label || title}
      onPress={onPress}
      android_ripple={{ color: 'rgba(38,48,107,0.12)' }}
    >
      {body}
    </Pressable>
  );
}

// ---- Material switch: 52 x 32 track, thumb grows when on and carries a check. State is in the label ----
export function Toggle({ value, onValueChange, label }) {
  const x = useSpringValue(value ? 1 : 0, { damping: 20, stiffness: 320, mass: 1 });
  const pos = x.interpolate({ inputRange: [0, 1], outputRange: [6, 26] });
  const thumb = x.interpolate({ inputRange: [0, 1], outputRange: [16, 24] });
  const lift = x.interpolate({ inputRange: [0, 1], outputRange: [4, 0] });
  const bg = x.interpolate({ inputRange: [0, 1], outputRange: [colors.surfaceHigh, colors.indigo] });
  const edge = x.interpolate({ inputRange: [0, 1], outputRange: [colors.outline, colors.indigo] });
  const thumbBg = x.interpolate({ inputRange: [0, 1], outputRange: [colors.outline, colors.white] });
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
      <Animated.View style={[styles.track, { backgroundColor: bg, borderColor: edge }]}>
        <Animated.View
          style={{
            position: 'absolute',
            left: pos,
            top: lift,
            width: thumb,
            height: thumb,
            borderRadius: 12,
            backgroundColor: thumbBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {value ? <Glyph icon={Check} size={16} color={colors.indigo} strokeWidth={3} /> : null}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

// ---- Segmented button: outlined group, the selected segment is a secondary container with a check ----
export function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segTrack}>
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={String(o.value)}
            accessibilityRole="button"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            android_ripple={{ color: 'rgba(38,48,107,0.12)' }}
            onPress={() => {
              tap();
              onChange(o.value);
            }}
            style={[styles.segItem, i > 0 && styles.segDivider, on && styles.segOn]}
          >
            {on ? <Glyph icon={Check} size={18} color={colors.indigoDeep} strokeWidth={2.6} /> : null}
            <Text
              numberOfLines={2}
              style={{
                fontFamily: fonts.semi,
                fontSize: 16,
                textAlign: 'center',
                color: on ? colors.indigoDeep : colors.inkSoft,
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
        placeholder={placeholder}
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
          borderWidth: focus ? 2 : 1,
          borderColor: focus ? colors.indigo : colors.outline,
          borderRadius: radii.md,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
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
        stroke={done ? colors.leaf : colors.control}
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
// A screen header inside a flow: an icon button for Back (48 target), then the headline.
export function ScreenHeader({ title, subtitle, onBack, backLabel = 'Back', right }) {
  return (
    <View style={{ gap: 4 }}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={backLabel}
          onPress={onBack}
          android_ripple={{ color: 'rgba(38,48,107,0.14)', borderless: true, radius: 28 }}
          style={styles.back}
        >
          <Glyph icon={ArrowLeft} size={24} color={colors.ink} />
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

// A small status label: tonal container, never a coloured outline. Brick only for a real alert.
export function Badge({ label, tone = 'indigo' }) {
  const t = {
    indigo: [colors.indigoTint, colors.indigoDeep],
    leaf: [colors.leafTint, colors.leafDeep],
    haldi: [colors.haldiTint, colors.haldiDeep],
    brick: [colors.brickTint, colors.brick],
  }[tone];
  return (
    <View
      style={{
        backgroundColor: t[0],
        borderRadius: radii.sm,
        paddingHorizontal: 12,
        paddingVertical: 4,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: t[1] }}>{label}</Text>
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

// Section label above a list: Material "title medium".
export function SectionTitle({ children }) {
  return (
    <View style={{ paddingTop: 12, paddingHorizontal: 4 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.semi, fontSize: 18, lineHeight: 24, color: colors.ink }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.paper,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.indigo,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
  },
  rowDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant, marginRight: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  track: { width: 52, height: 32, borderRadius: 16, borderWidth: 2 },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -12,
  },
  segTrack: {
    flexDirection: 'row',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.outline,
    overflow: 'hidden',
  },
  segItem: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segDivider: { borderLeftWidth: 1, borderLeftColor: colors.outline },
  segOn: { backgroundColor: colors.indigoTint },
});
