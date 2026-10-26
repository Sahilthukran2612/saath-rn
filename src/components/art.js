import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Mood faces drawn as SVG so they match the line weight of the icon set and scale cleanly.
// The mouth curve and brows change with the level (1 very hard ... 5 very good).
export function MoodFace({ level = 3, size = 40, color = colors.indigo, fill = 'none' }) {
  const mouths = {
    1: 'M 14 29 Q 20 23 26 29',
    2: 'M 14 28 Q 20 25 26 28',
    3: 'M 14 27 L 26 27',
    4: 'M 14 25 Q 20 31 26 25',
    5: 'M 13 24 Q 20 34 27 24',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Circle cx="20" cy="20" r="17" stroke={color} strokeWidth="2.2" fill={fill} />
      <Circle cx="14.5" cy="16.5" r="1.8" fill={color} />
      <Circle cx="25.5" cy="16.5" r="1.8" fill={color} />
      {level === 1 && (
        <Path
          d="M 11 12.5 L 17 14.5 M 29 12.5 L 23 14.5"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      <Path
        d={mouths[level] || mouths[3]}
        stroke={color}
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

// The plate model: half vegetables, a quarter protein, a quarter grain. Drawn, so it works offline and at any size.
export function PlateDiagram({ size = 140 }) {
  const c = size / 2;
  const r = size / 2 - 6;
  const arc = (d, fill) => (
    <Path d={d} fill={fill} stroke={colors.white} strokeWidth={3} strokeLinejoin="round" />
  );
  return (
    <Svg width={size} height={size} accessibilityLabel="Plate model">
      <Circle cx={c} cy={c} r={r + 4} fill={colors.white} stroke={colors.lineStrong} strokeWidth={2} />
      {arc(`M ${c - r} ${c} A ${r} ${r} 0 0 1 ${c + r} ${c} Z`, colors.leaf)}
      {arc(`M ${c} ${c} L ${c - r} ${c} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`, colors.haldi)}
      {arc(`M ${c} ${c} L ${c} ${c + r} A ${r} ${r} 0 0 0 ${c + r} ${c} Z`, colors.indigoSoft)}
    </Svg>
  );
}

// The Saath mark: two arcs held together, "with you". Used on the header and the consent screen.
export function SaathMark({ size = 36, color = colors.indigo, accent = colors.haldi }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40">
      <Rect x="0" y="0" width="40" height="40" rx="12" fill={color} />
      <Path
        d="M 12 24 A 8 8 0 0 1 28 24"
        stroke={colors.white}
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      <Path d="M 12 24 A 8 8 0 0 0 20 32" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" />
      <Circle cx="20" cy="14" r="3.2" fill={accent} />
    </Svg>
  );
}

// A quiet ikat-like band used as a header motif: repeating diamonds in two tints.
export function IkatBand({ width = 320, height = 14, color = colors.indigoSoft, accent = colors.haldi }) {
  const step = 14;
  const n = Math.ceil(width / step);
  return (
    <Svg width={width} height={height}>
      {Array.from({ length: n }, (_, i) => {
        const x = i * step + step / 2;
        const mid = height / 2;
        return (
          <Path
            key={i}
            d={`M ${x - 6} ${mid} L ${x} ${mid - 6} L ${x + 6} ${mid} L ${x} ${mid + 6} Z`}
            fill={i % 4 === 0 ? accent : color}
            opacity={i % 4 === 0 ? 0.9 : 0.55}
          />
        );
      })}
    </Svg>
  );
}
