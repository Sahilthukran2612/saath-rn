import React from 'react';
import Svg, { Line } from 'react-native-svg';
import { colors } from '../theme';

// A tear-off perforation: the dashed line a bill-book slip is torn along. Used as the divider in lists
// and under the header of a slip. Purely decorative, hidden from screen readers.
export default function Perf({ style, color = colors.lineStrong }) {
  return (
    <Svg
      width="100%"
      height={6}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      <Line x1="0" y1="3" x2="100%" y2="3" stroke={color} strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round" />
    </Svg>
  );
}
