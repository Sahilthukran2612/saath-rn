import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors, themeName } from '../theme';

// Spot illustrations: soft filled shapes on a 64 grid, drawn in one colour with a lighter tint of it, white for
// highlights and one warm turmeric accent. Each sits on a pale halo so it reads as a small picture at 40 px and as
// a hero at 120. Figures are drawn with thick round strokes, like pictograms, so they stay legible when small.
// Provenance: authored in this project as SVG. No stock art, no AI-generated art.
const WARM = '#FFC93C';
const WARM_DEEP = '#D99100';

const limbs = (c, w = 6) => ({
  stroke: c,
  strokeWidth: w,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  fill: 'none',
});

const D = {
  glass: (c) => (
    <>
      <Path d="M20 15 H44 L40.6 50 Q40.2 54 36.4 54 H27.6 Q23.8 54 23.4 50 Z" fill={c} opacity={0.28} />
      <Path d="M22.2 31 H41.8 L40.6 50 Q40.2 54 36.4 54 H27.6 Q23.8 54 23.4 50 Z" fill={c} />
      <Path d="M27 36 L27.6 45" {...limbs(colors.white, 3)} />
      <Path d="M49 9 Q53 15 49 19 Q45 15 49 9 Z" fill={WARM} />
    </>
  ),
  walker: (c) => (
    <>
      <Circle cx="29" cy="13" r="6" fill={c} />
      <Path d="M29.5 22 L27.5 36" {...limbs(c, 7)} />
      <Path d="M29 26 L21 32 M29 26 L37 31" {...limbs(c, 5)} />
      <Path d="M27.5 36 L21 51 M27.5 36 L35 42 L36 52" {...limbs(c, 6)} />
      <Path d="M44 29 L47 54" {...limbs(WARM_DEEP, 3.5)} />
    </>
  ),
  plate: (c) => (
    <>
      <Circle cx="32" cy="34" r="20" fill={c} opacity={0.28} />
      <Circle cx="32" cy="34" r="15" fill={colors.white} />
      <Path d="M32 19 A15 15 0 0 0 32 49 Z" fill={c} />
      <Path d="M32 34 L32 19 A15 15 0 0 1 47 34 Z" fill={WARM} />
      <Path d="M8 14 V26 M11.5 14 V26 M8 26 Q9.75 30 11.5 26 M9.75 28 V52" {...limbs(c, 2.6)} />
      <Path d="M56 14 Q60 22 56 30 V52" {...limbs(c, 2.6)} />
    </>
  ),
  foot: (c) => (
    <>
      <Path d="M25 14 Q18 24 21.5 40 Q23.5 53 32 54 Q42 54 42 44 Q42 34 38.6 26 Q35 14 25 14 Z" fill={c} />
      <Path d="M27 24 Q25 32 27 40" {...limbs(colors.white, 3)} opacity={0.6} />
      <Circle cx="42" cy="14" r="3.2" fill={c} />
      <Circle cx="48" cy="19" r="2.8" fill={c} opacity={0.75} />
      <Circle cx="51" cy="26" r="2.4" fill={c} opacity={0.55} />
      <Path d="M50 40 L52 44 L56 45 L52 47 L50 51 L48 47 L44 45 L48 44 Z" fill={WARM} />
    </>
  ),
  strip: (c) => (
    <>
      <Rect x="9" y="16" width="46" height="32" rx="8" fill={c} opacity={0.28} />
      {[20, 32, 44].map((x) =>
        [27, 38].map((y) => (
          <Circle key={`${x}${y}`} cx={x} cy={y} r="4.6" fill={x === 44 && y === 38 ? WARM : c} />
        ))
      )}
    </>
  ),
  drop: (c) => (
    <>
      <Path d="M32 9 Q17 28 17 39 A15 15 0 0 0 47 39 Q47 28 32 9 Z" fill={c} />
      <Path d="M24.5 40 Q24.5 46.5 30.5 48" {...limbs(colors.white, 3.2)} />
      <Circle cx="50" cy="15" r="4" fill={WARM} />
    </>
  ),
  note: (c) => (
    <>
      <Path d="M16 9 H39 L48 18 V55 H16 Z" fill={colors.white} />
      <Path d="M16 9 H39 L48 18 V55 H16 Z" stroke={c} strokeWidth={2.6} fill="none" strokeLinejoin="round" />
      <Path d="M39 9 V18 H48 Z" fill={c} />
      <Path d="M22 28 H42 M22 36 H42 M22 44 H33" {...limbs(c, 3)} opacity={0.55} />
      <Circle cx="44" cy="48" r="6" fill={WARM} />
    </>
  ),
  face: (c) => (
    <>
      <Circle cx="32" cy="32" r="21" fill={WARM} />
      <Circle cx="24.5" cy="28" r="2.8" fill={c} />
      <Circle cx="39.5" cy="28" r="2.8" fill={c} />
      <Path d="M23 37 Q32 46 41 37" {...limbs(c, 3.2)} />
    </>
  ),
  steps: (c) => (
    <>
      <Rect x="8" y="42" width="14" height="12" rx="3" fill={c} opacity={0.35} />
      <Rect x="22" y="32" width="14" height="22" rx="3" fill={c} opacity={0.65} />
      <Rect x="36" y="22" width="14" height="32" rx="3" fill={c} />
      <Path d="M44 9 L54 9 L54 19 M54 9 L43 20" {...limbs(WARM_DEEP, 3.5)} />
    </>
  ),
  phone: (c) => (
    <>
      <Rect x="17" y="8" width="26" height="48" rx="6" fill={c} />
      <Rect x="20" y="13" width="20" height="34" rx="2.5" fill={colors.white} />
      <Path d="M27 51.5 H33" {...limbs(colors.white, 2.6)} />
      <Path d="M48.5 22 Q52.5 28 48.5 34 M53 16 Q60 28 53 40" {...limbs(WARM_DEEP, 3.2)} />
    </>
  ),
  stretch: (c) => (
    <>
      <Circle cx="32" cy="14" r="6" fill={c} />
      <Path d="M32 22 V38" {...limbs(c, 7)} />
      <Path d="M32 26 L19 13 M32 26 L45 13" {...limbs(c, 5)} />
      <Path d="M32 38 L24 54 M32 38 L40 54" {...limbs(c, 6)} />
      <Circle cx="13" cy="44" r="3" fill={WARM} />
      <Circle cx="51" cy="44" r="3" fill={WARM} />
    </>
  ),
  moon: (c) => (
    <>
      <Path d="M40 10 A23 23 0 1 0 54 42 A18 18 0 0 1 40 10 Z" fill={c} />
      <Path d="M51 12 L52.6 15.8 L56.4 17.4 L52.6 19 L51 22.8 L49.4 19 L45.6 17.4 L49.4 15.8 Z" fill={WARM} />
    </>
  ),
  // Larger scenes for setup and empty states.
  people: (c) => (
    <>
      <Circle cx="18" cy="24" r="6" fill={c} opacity={0.5} />
      <Path d="M7 46 Q7 33 18 33 Q29 33 29 46 Z" fill={c} opacity={0.5} />
      <Circle cx="46" cy="24" r="6" fill={c} opacity={0.5} />
      <Path d="M35 46 Q35 33 46 33 Q57 33 57 46 Z" fill={c} opacity={0.5} />
      <Circle cx="32" cy="21" r="7.5" fill={c} />
      <Path d="M18 52 Q18 33 32 33 Q46 33 46 52 Z" fill={c} />
      <Circle cx="32" cy="44" r="4" fill={WARM} />
    </>
  ),
  shield: (c) => (
    <>
      <Path d="M32 8 L50 15 V31 Q50 47 32 56 Q14 47 14 31 V15 Z" fill={c} />
      <Path d="M32 8 L50 15 V31 Q50 47 32 56 Z" fill={colors.white} opacity={0.18} />
      <Path d="M23.5 32 L29.5 38 L41 26" {...limbs(colors.white, 4.5)} />
      <Circle cx="52" cy="50" r="4" fill={WARM} />
    </>
  ),
  heart: (c) => (
    <>
      <Path
        d="M32 53 Q11 40 11 25 Q11 14 21.5 14 Q28.5 14 32 21 Q35.5 14 42.5 14 Q53 14 53 25 Q53 40 32 53 Z"
        fill={c}
      />
      <Path d="M16 31 H24 L27.5 24 L32 38 L35.5 29 H48" {...limbs(colors.white, 3.2)} />
      <Circle cx="52" cy="11" r="4" fill={WARM} />
    </>
  ),
  calendar: (c) => (
    <>
      <Rect x="11" y="14" width="42" height="40" rx="8" fill={colors.white} />
      <Path d="M19 14 H45 Q53 14 53 22 V26 H11 V22 Q11 14 19 14 Z" fill={c} />
      <Path d="M22 9 V18 M42 9 V18" {...limbs(c, 4)} />
      {[19, 29, 39].map((x) =>
        [34, 44].map((y) => (
          <Rect key={`${x}${y}`} x={x} y={y} width="6" height="6" rx="1.6" fill={c} opacity={0.4} />
        ))
      )}
      <Rect x="39" y="44" width="6" height="6" rx="1.6" fill={WARM_DEEP} />
    </>
  ),
};

export const SPOTS = Object.keys(D);

export default function Doodle({ name = 'note', size = 64, color = colors.indigo, halo = true }) {
  const art = D[name] || D.note;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {halo ? (
        <Circle cx="32" cy="32" r="31" fill={color} opacity={themeName === 'dark' ? 0.2 : 0.1} />
      ) : null}
      <G>{art(color)}</G>
    </Svg>
  );
}
