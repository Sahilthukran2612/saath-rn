import React from 'react';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { colors } from '../theme';

// Ballpoint doodles for the suggestion slips: drawn by hand as single-stroke SVG on a 64 grid, the way
// someone would sketch on the back of a bill. Each is drawn twice, the second pass a hair off and fainter,
// so the line looks pressed twice by a pen instead of plotted by a machine.
// Provenance: authored in this project as SVG paths. No stock art, no AI-generated art.
const D = {
  glass: (
    <>
      <Path d="M20 14 L24 52 Q24.5 55 28 55 L36 55 Q39.5 55 40 52 L44 14" />
      <Path d="M19 14 H45" />
      <Path d="M22 29 Q27 26 32 29 T42 29" />
      <Path d="M48 10 Q50 14 48 17 Q46 14 48 10 Z" />
    </>
  ),
  walker: (
    <>
      <Circle cx="30" cy="11" r="5" />
      <Path d="M30 17 L28 34 L19 52 M28 34 L38 41 L40 55 M29 22 L20 31 M29 22 L40 28" />
      <Path d="M46 29 L50 57" />
    </>
  ),
  plate: (
    <>
      <Circle cx="33" cy="34" r="19" />
      <Circle cx="33" cy="34" r="12" />
      <Path d="M7 12 V28 M4 12 V22 M10 12 V22 M7 28 V54" />
      <Path d="M58 12 Q63 22 58 30 V54" />
    </>
  ),
  foot: (
    <>
      <Path d="M24 10 Q17 22 21 40 Q23 53 32 55 Q43 55 43 44 Q43 33 39 24 Q35 10 24 10 Z" />
      <Circle cx="42" cy="11" r="2.6" />
      <Circle cx="48" cy="16" r="2.4" />
      <Circle cx="51" cy="23" r="2.2" />
    </>
  ),
  strip: (
    <>
      <Rect x="7" y="15" width="50" height="34" rx="5" />
      <Circle cx="20" cy="27" r="5" />
      <Circle cx="32" cy="27" r="5" />
      <Circle cx="44" cy="27" r="5" />
      <Circle cx="20" cy="39" r="5" />
      <Circle cx="32" cy="39" r="5" />
      <Circle cx="44" cy="39" r="5" />
    </>
  ),
  drop: (
    <>
      <Path d="M32 7 Q18 27 18 38 A14 14 0 0 0 46 38 Q46 27 32 7 Z" />
      <Path d="M25 40 Q25 46 31 47" />
    </>
  ),
  note: (
    <>
      <Path d="M15 7 H40 L50 17 V57 H15 Z" />
      <Path d="M40 7 V17 H50" />
      <Path d="M21 29 H44 M21 37 H44 M21 45 H35" />
    </>
  ),
  face: (
    <>
      <Circle cx="32" cy="32" r="23" />
      <Circle cx="24" cy="27" r="2.2" />
      <Circle cx="40" cy="27" r="2.2" />
      <Path d="M21 38 Q32 49 43 38" />
    </>
  ),
  steps: (
    <>
      <Path d="M6 54 H22 V42 H36 V30 H50 V18 H58" />
      <Path d="M52 11 L58 18 L51 24" />
    </>
  ),
  phone: (
    <>
      <Path d="M19 8 H41 Q44 8 44 11 V53 Q44 56 41 56 H19 Q16 56 16 53 V11 Q16 8 19 8 Z" />
      <Path d="M26 48 H34" />
      <Path d="M50 22 Q54 28 50 34 M54 15 Q60 28 54 41" />
    </>
  ),
  stretch: (
    <>
      <Circle cx="32" cy="11" r="5" />
      <Path d="M32 17 V38 M32 23 L17 9 M32 23 L47 9 M32 38 L23 57 M32 38 L41 57" />
    </>
  ),
  moon: (
    <>
      <Path d="M42 9 A23 23 0 1 0 55 40 A19 19 0 0 1 42 9 Z" />
      <Path d="M52 12 V19 M48.5 15.5 H55.5" />
    </>
  ),
};

export const DOODLES = Object.keys(D);

export default function Doodle({ name = 'note', size = 64, color = colors.indigo, strokeWidth = 2.6 }) {
  const art = D[name] || D.note;
  const common = { fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <G {...common} stroke={color} strokeWidth={strokeWidth} opacity={0.35} transform="translate(0.9 0.7)">
        {art}
      </G>
      <G {...common} stroke={color} strokeWidth={strokeWidth}>
        {art}
      </G>
    </Svg>
  );
}
