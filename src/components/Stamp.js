import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import Text from './AppText';
import { Check } from './icons';
import { colors, fonts, radii } from '../theme';
import { useReducedMotion } from './motion';
import { confirm } from '../services/haptics';
import { useScale } from './ui';

// "Done": a green capsule with a check that pops in when `show` turns true. It starts a little small and settles to
// size on a spring with a hint of give, and the phone taps once. It never loops; with reduced motion it simply
// appears. It always carries a word, not just colour.
export default function Stamp({ show, word, sub, size = 1, onLanded, silent = false }) {
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
    const a = Animated.spring(v, { toValue: 1, damping: 18, stiffness: 420, mass: 1, useNativeDriver: true });
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
        opacity: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0, 1, 1] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8 * s,
          backgroundColor: colors.leafTint,
          borderRadius: radii.pill,
          paddingHorizontal: 16 * s,
          paddingVertical: 8 * s,
        }}
      >
        <View
          style={{
            width: 26 * s,
            height: 26 * s,
            borderRadius: 13 * s,
            backgroundColor: colors.leaf,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={16 * s} color={colors.white} strokeWidth={3} />
        </View>
        <View>
          <Text
            style={{ fontFamily: fonts.semi, fontSize: 18 * s, lineHeight: 24 * s, color: colors.leafDeep }}
          >
            {word}
          </Text>
          {sub ? (
            <Text
              style={{
                fontFamily: fonts.regular,
                fontSize: 16 * s,
                lineHeight: 20 * s,
                color: colors.leafDeep,
              }}
            >
              {sub}
            </Text>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

// A small, still "done" capsule for lists. No animation, so a long list stays calm. It carries the word.
export function StampMark({ word }) {
  const k = useScale();
  const s = Math.min(k, 1.2);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.leafTint,
        borderRadius: radii.pill,
        paddingHorizontal: 10 * s,
        paddingVertical: 3,
      }}
    >
      <Check size={14 * s} color={colors.leafDeep} strokeWidth={3} />
      <Text style={{ fontFamily: fonts.semi, fontSize: 16 * s, lineHeight: 22 * s, color: colors.leafDeep }}>
        {word}
      </Text>
    </View>
  );
}
