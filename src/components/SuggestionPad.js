import React, { useMemo, useRef, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Text from './AppText';
import { Body, Caption, Title, PressRow, Glyph, useScale } from './ui';
import { ChevronRight } from './icons';
import Doodle from './doodles';
import Stamp from './Stamp';
import Perf from './Perf';
import { useReducedMotion } from './motion';
import { useNow } from './useNow';
import { useNav } from './nav';
import { useStore } from '../state/store';
import { buildPad, stampedToday } from '../suggestions';
import { fmt } from '../circleFeed';
import { colors, fonts, radii } from '../theme';

// A pad of bill-book slips. The top slip is today's most useful small thing; behind it sit the pink and
// yellow carbon copies of the next ones. "Stamp it" presses the violet stamp, then the slip tears off along
// its perforation and the next is revealed. "Not today" tears it off without a stamp. Everything is
// tap-triggered; nothing moves while you are only looking.

const TEAR_MS = 320;

// One slip. `key` is the slip id, so a fresh one mounts clean for each new top slip.
function TopSlip({ slip, index, total, onDone, lang, nowMs }) {
  const { t } = useStore();
  const go = useNav();
  const reduced = useReducedMotion();
  const k = useScale();
  const [stamped, setStamped] = useState(false);
  const [x] = useState(() => new Animated.Value(0));
  const busy = useRef(false);
  const title = t(`sg.${slip.id}.t`);
  const body = fmt(t(`sg.${slip.id}.b`), slip.params || {});
  const care = slip.kind === 'care';

  const tear = (how) => {
    if (busy.current) return;
    busy.current = true;
    const finish = () => onDone(slip.id, how);
    if (reduced) return finish();
    Animated.timing(x, {
      toValue: 1,
      duration: TEAR_MS,
      easing: Easing.bezier(0.4, 0, 1, 1),
      useNativeDriver: true,
    }).start(finish);
  };
  const stamp = () => {
    if (busy.current || stamped) return;
    setStamped(true);
    // let the stamp land and be seen, then tear the slip away
    setTimeout(() => tear('done'), reduced ? 0 : 650);
  };

  return (
    <Animated.View
      accessible
      accessibilityRole="summary"
      accessibilityLabel={fmt(t('sg.a11y'), { i: index + 1, n: total, title })}
      style={{
        transform: [
          { translateX: x.interpolate({ inputRange: [0, 1], outputRange: [0, 460] }) },
          { rotate: x.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '7deg'] }) },
        ],
        opacity: x.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }),
      }}
    >
      <View style={{ backgroundColor: colors.paper, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.indigo, padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View
            style={{
              backgroundColor: care ? colors.carbon : colors.haldi,
              borderRadius: radii.pill,
              paddingHorizontal: 14,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontFamily: fonts.semi, fontSize: 16 * Math.min(k, 1.2), color: care ? colors.carbonDeep : '#5E4800' }}>
              {t(`sg.kind.${slip.kind}`)}
            </Text>
          </View>
          <Caption>{fmt(t('sg.left'), { n: total - index })}</Caption>
        </View>
        <Perf />
        <View style={{ flexDirection: 'row', gap: 14, alignItems: 'flex-start' }}>
          <View style={{ paddingTop: 2 }}>
            <Doodle name={slip.doodle} size={72} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Title style={{ fontSize: 22 * k, color: colors.indigoDeep }}>{title}</Title>
            <Body>{body}</Body>
          </View>
        </View>
        <View style={{ minHeight: stamped ? 70 : 0, justifyContent: 'center' }}>
          <Stamp show={stamped} word={t('sg.stamped')} sub={new Date(nowMs).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short' })} />
        </View>
        {stamped ? null : (
          <View style={{ gap: 8 }}>
            <PressRow
              accessibilityRole="button"
              accessibilityLabel={t('sg.stamp')}
              onPress={stamp}
              rippleColor="rgba(255,255,255,0.24)"
              style={{ minHeight: 56, borderRadius: radii.pill, backgroundColor: colors.indigo, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: 18 * k, color: colors.white }}>{t('sg.stamp')}</Text>
            </PressRow>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {slip.tab ? (
                <PressRow
                  accessibilityRole="button"
                  accessibilityLabel={t('sg.open')}
                  onPress={() => go(slip.tab)}
                  style={{ flex: 1, minHeight: 56, borderRadius: radii.pill, backgroundColor: colors.indigoTint, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }}
                >
                  <Text style={{ fontFamily: fonts.bold, fontSize: 18 * k, color: colors.indigoDeep }}>{t('sg.open')}</Text>
                  <Glyph icon={ChevronRight} size={20} color={colors.indigoDeep} />
                </PressRow>
              ) : null}
              <PressRow
                accessibilityRole="button"
                accessibilityLabel={t('sg.skip')}
                onPress={() => tear('skip')}
                style={{ flex: 1, minHeight: 56, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fonts.semi, fontSize: 18 * k, color: colors.inkSoft }}>{t('sg.skip')}</Text>
              </PressRow>
            </View>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// Carbon copies peeking out beneath the top slip: pink, then yellow, each a little off.
function Copies({ count }) {
  const layers = [
    { bg: colors.carbon, rot: '-0.5deg', dy: 7, dx: 2 },
    { bg: colors.haldi, rot: '0.5deg', dy: 14, dx: -2 },
  ].slice(0, Math.min(count, 2));
  return (
    <>
      {layers
        .map((l, i) => (
          <View
            key={i}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: l.dy,
              bottom: -l.dy,
              borderRadius: radii.md,
              backgroundColor: l.bg,
              borderWidth: 1.5,
              borderColor: colors.indigo,
              transform: [{ rotate: l.rot }, { translateX: l.dx }],
            }}
          />
        ))
        .reverse()}
    </>
  );
}

export default function SuggestionPad() {
  const { state, dispatch, t } = useStore();
  const now = useNow(60000);
  const ctx = useMemo(
    () => ({
      nowMs: now,
      mode: state.mode,
      phase: state.phase,
      meds: state.meds,
      testPlan: state.testPlan,
      careEvents: state.careEvents,
      meals: state.meals,
      footChecks: state.footChecks,
      checkins: state.checkins,
      readings: state.readings,
      visitQuestions: state.visitQuestions,
      ladder: state.ladder,
      condition: state.profile?.condition,
    }),
    [now, state.mode, state.phase, state.meds, state.testPlan, state.careEvents, state.meals, state.footChecks, state.checkins, state.readings, state.visitQuestions, state.ladder, state.profile?.condition],
  );
  const pad = useMemo(() => buildPad(ctx, state.slips), [ctx, state.slips]);
  const stampedCount = stampedToday(ctx, state.slips).length;
  const onDone = (id, how) => dispatch({ type: 'SLIP', id, how, now: Date.now() });

  if (state.alert) return null; // a real alert owns the screen; no suggestions over it
  if (pad.length === 0 && stampedCount === 0) return null;

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Title style={{ fontSize: 22 }}>{t('sg.title')}</Title>
      </View>
      {pad.length === 0 ? (
        <View style={{ backgroundColor: colors.paper, borderRadius: radii.md, borderWidth: 1.5, borderColor: colors.indigo, padding: 16, gap: 10 }}>
          <Stamp show word={t('sg.stamped')} silent />
          <Body>{t('sg.allDone')}</Body>
        </View>
      ) : (
        <View style={{ paddingBottom: pad.length > 1 ? 18 : 0 }}>
          <Copies count={pad.length - 1} />
          <TopSlip key={pad[0].id} slip={pad[0]} index={0} total={pad.length} onDone={onDone} lang={state.lang} nowMs={now} />
        </View>
      )}
      <Caption>{t('sg.note')}</Caption>
    </View>
  );
}
