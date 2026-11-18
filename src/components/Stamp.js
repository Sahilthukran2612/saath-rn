import React, { useEffect, useState } from 'react';
import { Animated, Text, View } from 'react-native';
import { colors, fonts } from '../theme';
import { useReducedMotion } from './motion';
import { confirm } from '../services/haptics';
import { useScale } from './ui';

// The violet rubber stamp: Saath's one signature move. When `show` turns true it lands with a thump:
// it starts large and faint, drops to size on a critically damped spring, and the phone gives one firm
// tap. It never loops. With reduced motion it simply appears. The stamp carries a word, not just colour.
export default function Stamp({ show, word, sub, rotate = -6, size = 1, onLanded, silent = false }) {
  const reduced = useReducedMotion();
  const k = useScale();
  const [v] = useState(() => new Animated.Value(show ? 1 : 0));
  useEffect(() => {
    if (!show) {
      v.setValue(0);
      return undefined;
    }
    if (reduced) {
      v.setValue(1);
      onLanded?.();
      return undefined;
    }
    v.setValue(0);
    const a = Animated.spring(v, { toValue: 1, damping: 14, stiffness: 340, mass: 0.9, useNativeDriver: true });
    a.start(({ finished }) => {
      if (finished) {
        if (!silent) confirm();
        onLanded?.();
      }
    });
    return () => a.stop();
  }, [show, reduced, v]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!show && !reduced) return null;
  const s = size * Math.min(k, 1.2);
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        alignSelf: 'flex-start',
        opacity: v.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 0.7, 1] }),
        transform: [
          { rotate: `${rotate}deg` },
          { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1.7, 1] }) },
        ],
      }}
    >
      <View
        style={{
          borderWidth: 3.5 * s,
          borderColor: colors.stamp,
          borderRadius: 12 * s,
          paddingHorizontal: 14 * s,
          paddingVertical: 6 * s,
          alignItems: 'center',
        }}
      >
        {/* a second, thinner ring a little inside, as a pressed stamp leaves */}
        <View
          style={{
            borderWidth: 1.5 * s,
            borderColor: colors.stamp,
            borderRadius: 8 * s,
            paddingHorizontal: 12 * s,
            paddingVertical: 2 * s,
            alignItems: 'center',
          }}
        >
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 26 * s,
              lineHeight: 34 * s,
              letterSpacing: 1.2,
              color: colors.stamp,
            }}
          >
            {word}
          </Text>
          {sub ? (
            <Text style={{ fontFamily: fonts.semi, fontSize: 16 * s, lineHeight: 20 * s, color: colors.stamp }}>{sub}</Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}
