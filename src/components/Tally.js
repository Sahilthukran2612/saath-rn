import React from 'react';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme';

// Tally marks, the way a shopkeeper counts: four strokes and a fifth across them. Done tasks are drawn in
// ballpoint blue; the ones still to do are faint dashed strokes, so the whole day is visible at a glance.
// The count is always printed beside it, so the marks never carry the meaning alone.
const GAP = 12;
const H = 38;
const GROUP_W = 4 * GAP + 10;

export default function Tally({ done, total, color = colors.indigo }) {
  const n = Math.max(total, 0);
  const groups = Math.ceil(n / 5) || 1;
  const width = groups * GROUP_W;
  const strokes = [];
  for (let i = 0; i < n; i++) {
    const g = Math.floor(i / 5);
    const r = i % 5;
    const on = i < done;
    const props = on
      ? { stroke: color, strokeWidth: 3.4, opacity: 1 }
      : { stroke: colors.lineStrong, strokeWidth: 3, strokeDasharray: '3 5' };
    if (r < 4) {
      const x = g * GROUP_W + 4 + r * GAP;
      // slightly uneven, as if drawn by hand
      strokes.push(<Line key={i} x1={x} y1={4 + (i % 2)} x2={x + (r % 2 ? 1 : -1)} y2={H - 3} strokeLinecap="round" {...props} />);
    } else {
      const x0 = g * GROUP_W;
      strokes.push(<Line key={i} x1={x0} y1={H - 8} x2={x0 + GROUP_W - 2} y2={9} strokeLinecap="round" {...props} />);
    }
  }
  return (
    <Svg width={width} height={H} viewBox={`0 0 ${width} ${H}`} accessibilityElementsHidden importantForAccessibility="no">
      {strokes}
    </Svg>
  );
}
