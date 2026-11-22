import React, { useEffect, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Text from './AppText';
import { Check } from './icons';
import { Body, Glyph, PressRow, useScale } from './ui';
import { ProgressRing } from './kit';
import { useNow } from './useNow';
import { useStore } from '../state/store';
import { speak } from '../services/voice';
import { colors, fonts, radii, shadow } from '../theme';

// The patient's Today card. One round "I'm OK" button sits inside one progress ring, and the ring fills as the day's
// tasks are done: nothing else on the card is a second progress indicator. Tapping the button tells the circle you
// are fine; below it, a pill says when you last did. Brick red is never used here: it is only for a real alert.

const fmt = (s, vars) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

export default function OkRing() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const k = useScale();
  const { width } = useWindowDimensions();
  const hi = state.lang === 'hi';
  const locale = hi ? 'hi-IN' : 'en-IN';

  const total = state.tasks.length;
  const done = state.tasks.filter((x) => x.done).length;
  const size = Math.max(200, Math.min(264, width - 40 - 48)); // screen padding 20, card padding 24
  const stroke = 18;
  const inner = size - stroke * 2 - 26;

  const [sentAt, setSentAt] = useState(null);
  useEffect(() => {
    if (sentAt == null) return undefined;
    const h = setTimeout(() => setSentAt(null), 6000);
    return () => clearTimeout(h);
  }, [sentAt]);

  const last = state.lastOkAt;
  const today = last != null && sameDay(last, now);
  const time = last != null ? new Date(last).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' }) : '';
  const lastLine =
    last == null
      ? t('ok.never')
      : today
        ? fmt(t('ok.lastToday'), { time })
        : fmt(t('ok.lastEarlier'), { date: new Date(last).toLocaleDateString(locale, { day: 'numeric', month: 'short' }), time });

  return (
    <View
      style={{
        backgroundColor: colors.paper,
        borderRadius: radii.xl,
        padding: 24,
        gap: 18,
        alignItems: 'center',
        ...shadow.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'stretch' }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: today ? colors.leaf : colors.haldi }} />
        <Text
          numberOfLines={2}
          accessibilityRole="header"
          style={{ flex: 1, fontFamily: fonts.bold, fontSize: 13 * Math.min(k, 1.2), letterSpacing: hi ? 0 : 0.8, color: colors.inkSoft, textTransform: 'uppercase' }}
        >
          {t('ok.title')}
        </Text>
        <View style={{ backgroundColor: today ? colors.leafTint : colors.haldiTint, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14 * Math.min(k, 1.2), color: today ? colors.leafDeep : colors.haldiDeep }}>
            {today ? t('ok.statusOk') : t('ok.statusWait')}
          </Text>
        </View>
      </View>

      <ProgressRing size={size} stroke={stroke} progress={total ? done / total : 0} color={colors.leaf} track={colors.line}>
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('imOk')}
          accessibilityHint={t('imOkHint')}
          haptic={false}
          rippleColor="rgba(31,122,74,0.18)"
          onPress={() => {
            const at = Date.now();
            dispatch({ type: 'CHECK_IN', at });
            speak(t('imOk'), state.lang);
            setSentAt(at);
          }}
          containerStyle={{ borderRadius: inner / 2 }}
          style={{
            width: inner,
            height: inner,
            borderRadius: inner / 2,
            backgroundColor: colors.leafTint,
            borderWidth: 1.5,
            borderColor: 'rgba(31,122,74,0.28)',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            ...shadow.card,
          }}
        >
          <Glyph icon={Check} size={30} color={colors.leaf} strokeWidth={2.8} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 26 * Math.min(k, 1.15), lineHeight: 34 * Math.min(k, 1.15), color: colors.ink }}>{t('imOk')}</Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14 * Math.min(k, 1.15), letterSpacing: hi ? 0.5 : 0, color: colors.indigo }}>
            {hi ? "I'M OK" : 'मैं ठीक हूँ'}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14 * Math.min(k, 1.15), color: colors.inkSoft }}>
            {sentAt != null ? t('ok.sent') : t('ok.tap')}
          </Text>
        </PressRow>
      </ProgressRing>

      {total > 0 ? (
        <Text accessibilityLabel={fmt(t('doneOf'), { done, total })} style={{ fontFamily: fonts.bold, fontSize: 18 * Math.min(k, 1.2), color: colors.ink }}>
          {`${done} / ${total} ${t('hero.done')}`}
        </Text>
      ) : null}

      <View style={{ backgroundColor: colors.mist, borderRadius: radii.pill, paddingHorizontal: 16, paddingVertical: 9, alignSelf: 'center' }}>
        <Text style={{ fontFamily: fonts.semi, fontSize: 15 * Math.min(k, 1.2), color: colors.ink, textAlign: 'center' }}>{lastLine}</Text>
      </View>

      {sentAt != null ? (
        <Body bold style={{ color: colors.leafDeep, textAlign: 'center' }}>
          {t('sent.ok')}
        </Body>
      ) : null}
    </View>
  );
}
