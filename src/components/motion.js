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

// Material "fade through": content fades in while settling from 96% scale, on the emphasized
// decelerate curve. Used when a screen or section opens after a tap, never as idle decoration.
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
      easing: Easing.bezier(...motion.emphasizedDecelerate),
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
          transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

// A page pushed inside a tab (a Plan section, Study data) slides in from the right on a critically damped spring,
// the direction Back takes it away again. With reduced motion it just appears.
export function Push({ children, style }) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(reduced ? 1 : 0));
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return undefined;
    }
    const a = Animated.spring(v, { toValue: 1, ...motion.settle, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduced, v]);
  return (
    <Animated.View
      style={[
        { flex: 1 },
        style,
        {
          opacity: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 1, 1] }),
          transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [48, 0] }) }],
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
