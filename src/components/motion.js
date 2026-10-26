import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';
import { motion } from '../theme';

// Reduced motion: when the phone asks for it, movement is replaced by an instant change.
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.()
      .then((v) => alive && setReduced(!!v))
      .catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', (v) => setReduced(!!v));
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);
  return reduced;
}

// A short rise-and-fade when a screen opens after a tap. Not used for idle decoration.
export function Reveal({ children, index = 0, style }) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return undefined;
    }
    const a = Animated.timing(v, {
      toValue: 1,
      duration: motion.enterMs,
      delay: Math.min(index, 8) * motion.staggerMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    a.start();
    return () => a.stop();
  }, [reduced, index, v]);
  return (
    <Animated.View
      style={[
        style,
        {
          opacity: v,
          transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// Animates a number toward a target with a critically damped spring. Reads the live value, so it
// can be redirected mid-flight.
export function useSpringValue(target, config = motion.settle) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(target));
  useEffect(() => {
    if (reduced) {
      v.setValue(target);
      return undefined;
    }
    const a = Animated.spring(v, { toValue: target, useNativeDriver: false, ...config });
    a.start();
    return () => a.stop();
  }, [target, reduced, v]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}
