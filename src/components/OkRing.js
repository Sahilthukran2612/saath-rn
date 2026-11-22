import React, { useEffect, useState } from 'react';
import { Animated, Easing, View, useWindowDimensions } from 'react-native';
import Text from './AppText';
import { Check } from './icons';
import { Caption, Glyph, PressRow, useScale } from './ui';
import { ProgressRing } from './kit';
import { useReducedMotion } from './motion';
import { useNow } from './useNow';
import { useStore } from '../state/store';
import { speak } from '../services/voice';
import { confirm } from '../services/haptics';
import { fmt } from '../i18n/strings';
import { colors, fonts, radii } from '../theme';

// The patient's Today card: one round "I'm OK" button inside one ring that fills as the day's tasks are done.
// Tapping it tells the circle you are fine, with a firm haptic and one green pulse that rings out from the button,
// the app's single signature motion. Brick red never appears here: it is only for a real alert.
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export default function OkRing() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const k = useScale();
  const reduced = useReducedMotion();
  const { width } = useWindowDimensions();
  const hi = state.lang === 'hi';
  const locale = hi ? 'hi-IN' : 'en-IN';

  const total = state.tasks.length;
  const done = state.tasks.filter((x) => x.done).length;
  const size = Math.max(196, Math.min(240, width - 40 - 40));
  const stroke = 14;
  const inner = size - stroke * 2 - 20;

  const [sentAt, setSentAt] = useState(null);
  const [pulse] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (sentAt == null) return undefined;
    const h = setTimeout(() => setSentAt(null), 6000);
    return () => clearTimeout(h);
  }, [sentAt]);

  const last = state.lastOkAt;
  const today = last != null && sameDay(last, now);
  const time =
    last != null ? new Date(last).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }) : '';
  const lastLine =
    last == null
      ? t('ok.never')
      : today
        ? fmt(t('ok.lastToday'), { time })
        : fmt(t('ok.lastEarlier'), {
            date: new Date(last).toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
            time,
          });

  const press = () => {
    const at = Date.now();
    confirm();
    dispatch({ type: 'CHECK_IN', at });
    speak(t('imOk'), state.lang);
    setSentAt(at);
    if (!reduced) {
      pulse.setValue(0);
      Animated.timing(pulse, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  };

  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderRadius: radii.xl,
        paddingVertical: 24,
        paddingHorizontal: 20,
        gap: 14,
        alignItems: 'center',
      }}
    >
      <ProgressRing
        size={size}
        stroke={stroke}
        progress={total ? done / total : 0}
        color={colors.indigo}
        track={colors.surfaceHigh}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: colors.leaf,
            opacity: pulse.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.35, 0] }),
            transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.28] }) }],
          }}
        />
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('imOk')}
          accessibilityHint={t('imOkHint')}
          haptic={false}
          onPress={press}
          containerStyle={{ borderRadius: inner / 2 }}
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: colors.leaf,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Glyph icon={Check} size={34} color={colors.white} strokeWidth={3} />
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 28 * Math.min(k, 1.15),
              lineHeight: 36 * Math.min(k, 1.15),
              color: colors.white,
            }}
          >
            {t('imOk')}
          </Text>
          <Text
            style={{
              fontFamily: fonts.semi,
              fontSize: 16 * Math.min(k, 1.15),
              color: 'rgba(255,255,255,0.86)',
            }}
          >
            {sentAt != null ? t('ok.sent') : hi ? "I'm OK" : 'मैं ठीक हूँ'}
          </Text>
        </PressRow>
      </ProgressRing>

      <View style={{ alignItems: 'center', gap: 2 }}>
        {total > 0 ? (
          <Text
            accessibilityLabel={fmt(t('doneOf'), { done, total })}
            style={{
              fontFamily: fonts.semi,
              fontSize: 20 * Math.min(k, 1.2),
              lineHeight: 26 * Math.min(k, 1.2),
              color: colors.ink,
            }}
          >
            {`${done} / ${total} ${t('hero.done')}`}
          </Text>
        ) : null}
        {sentAt != null ? (
          <Caption style={{ textAlign: 'center', color: colors.leafDeep, fontFamily: fonts.semi }}>
            {t('sent.ok')}
          </Caption>
        ) : null}
        <Caption style={{ textAlign: 'center', color: today ? colors.leafDeep : colors.inkSoft }}>
          {lastLine}
        </Caption>
      </View>
    </View>
  );
}
