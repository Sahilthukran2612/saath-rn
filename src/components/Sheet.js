import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Keyboard, Modal, PanResponder, Pressable, ScrollView, View } from 'react-native';
import { X } from './icons';
import { Title } from './ui';
import { useReducedMotion } from './motion';
import { useStore } from '../state/store';
import { colors, radii } from '../theme';

// A bottom drawer for forms, the way phones do it: it rises from the bottom edge on a critically damped spring, the
// page behind dims, a grabber at the top can be pulled down to dismiss, and the sheet lifts above the keyboard. Tap
// the dim area, the close button or the back key to close. With reduced motion it just appears.
const H = Dimensions.get('window').height;

export default function Sheet({ visible, onClose, title, children }) {
  const { t } = useStore();
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(visible);
  const [kb, setKb] = useState(0);
  const [y] = useState(() => new Animated.Value(H));
  const [dim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMounted(true);
      if (reduced) {
        y.setValue(0);
        dim.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(y, { toValue: 0, damping: 24, stiffness: 260, mass: 1, useNativeDriver: true }),
          Animated.timing(dim, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    } else if (mounted) {
      if (reduced) {
         
        setMounted(false);
        return;
      }
      Animated.parallel([
        Animated.timing(y, { toValue: H, duration: 220, useNativeDriver: true }),
        Animated.timing(dim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const a = Keyboard.addListener('keyboardDidShow', (e) => setKb(e.endCoordinates?.height || 0));
    const b = Keyboard.addListener('keyboardDidHide', () => setKb(0));
    return () => {
      a.remove();
      b.remove();
    };
  }, []);

  // Pull the grabber down to dismiss: the sheet follows the finger, and lets go past a third of its height or a flick.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  // The responder reads closeRef only when a gesture ends, never during render.
  /* eslint-disable react-hooks/refs */
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, g) => g.dy > 0 && y.setValue(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 120 || g.vy > 1) closeRef.current();
        else Animated.spring(y, { toValue: 0, damping: 24, stiffness: 260, useNativeDriver: true }).start();
      },
    }),
  );
  /* eslint-enable react-hooks/refs */
  if (!mounted) return null;
  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(8,12,40,0.45)', opacity: dim }}
        />
        <Pressable accessibilityLabel={title} accessibilityRole="button" style={{ flex: 1 }} onPress={onClose} />
        <Animated.View
          style={{
            transform: [{ translateY: y }],
            maxHeight: H * 0.9,
            backgroundColor: colors.paper,
            borderTopLeftRadius: radii.xl,
            borderTopRightRadius: radii.xl,
            paddingBottom: kb,
          }}
        >
          <View {...pan.panHandlers} style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
            <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: colors.lineStrong }} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 6, gap: 8 }}>
            <Title style={{ fontSize: 22, flex: 1 }}>{title}</Title>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('sheet.close')}
              onPress={onClose}
              hitSlop={8}
              style={{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={26} color={colors.inkSoft} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 14 }}>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
