import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../theme';

// A hairline divider between rows inside a panel. Decorative, hidden from screen readers.
export default function Perf({ style }) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[
        { height: StyleSheet.hairlineWidth, backgroundColor: colors.outlineVariant, marginVertical: 2 },
        style,
      ]}
    />
  );
}
