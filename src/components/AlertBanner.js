import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Linking, Modal, StyleSheet, View } from 'react-native';
import Text from './AppText';
import { callLink, escalationMessage, smsLink, whatsappLink } from '../care';
import { CFG } from '../logic';
import { Body, Caption, Glyph, PressRow, Title } from './ui';
import { Avatar, ProgressRing } from './kit';
import { Check, MessageCircle, Phone, Send, Siren } from './icons';
import { useReducedMotion } from './motion';
import { colors, fonts, radii } from '../theme';
import { useStore } from '../state/store';
import { speak } from '../services/voice';
import { warn } from '../services/haptics';
import { sendSms, smsAvailable } from '../services/sms';
import { startSiren, stopSiren } from '../services/siren';
import { callsAvailable, placeCall } from '../services/calls';
import { clearAlert, raiseAlert } from '../services/foreground';

// Ticks the countdown. Only depends on the alert id and phase, and dispatches without
// reading state, so there is no stale closure and each transition is counted once in the reducer.
function useEscalationClock(alertId, active, dispatch) {
  useEffect(() => {
    if (!alertId || !active) return undefined;
    const h = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(h);
  }, [alertId, active, dispatch]);
}

// A soft pulse behind the siren. It runs only while a real alert is open, and not at all when the
// phone asks for reduced motion.
function Pulse({ children }) {
  const reduced = useReducedMotion();
  const [v] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) return undefined;
    const loop = Animated.loop(
      Animated.timing(v, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [reduced, v]);
  return (
    <View style={styles.pulseWrap}>
      {!reduced && (
        <Animated.View
          style={[
            styles.pulse,
            {
              opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
              transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
            },
          ]}
        />
      )}
      {children}
    </View>
  );
}

function ActionButton({ label, icon, onPress, filled }) {
  return (
    <PressRow
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.action, filled ? styles.actionFilled : styles.actionGhost]}
    >
      {icon ? (
        <Glyph icon={icon} size={24} color={filled ? '#14523A' : colors.white} strokeWidth={2.4} />
      ) : null}
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 20,
          color: filled ? '#14523A' : colors.white,
          flexShrink: 1,
        }}
      >
        {label}
      </Text>
    </PressRow>
  );
}

export default function AlertBanner() {
  const { state, dispatch, t } = useStore();
  const al = state.alert;
  const msg = escalationMessage(state.profile.name || 'A Saath user', al?.kind);
  useEscalationClock(al?.id, al && al.phase !== 'done', dispatch);

  useEffect(() => {
    if (al) {
      warn();
      speak(`${t('areYouOk')} ${t('areYouOkSub')}`, state.lang);
      // with the phone locked or in a pocket, bring this screen up (full-screen notification)
      raiseAlert(t('areYouOk'), t('areYouOkSub'));
    } else {
      clearAlert();
    }
  }, [al?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // After the countdown, with nobody answering, text each contact in turn without a tap (only when the
  // person turned this on and the installed app can). One message per alert and step.
  const texted = useRef(new Set());
  const [autoSent, setAutoSent] = useState({ key: '', ok: null, name: '' });
  const step = al ? al.chain[al.stepIndex] : null;
  useEffect(() => {
    if (!al || al.phase !== 'escalating' || !state.autoSms || !smsAvailable || !step?.phone) return;
    const key = `${al.id}:${al.stepIndex}`;
    if (texted.current.has(key)) return;
    texted.current.add(key);
    sendSms(step.phone, msg).then((ok) => setAutoSent({ key, ok, name: step.name }));
  }, [al?.id, al?.phase, al?.stepIndex, state.autoSms]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dial the contacts one by one, without a tap, once the countdown has ended with no answer. The clock waits
  // while a call is up (CALL_START), and the next contact is dialled when it ends (CALL_END). Demo mode never
  // places a real call: a demo contact's number is fake.
  const called = useRef(new Set());
  useEffect(() => {
    if (!al || al.phase !== 'escalating' || !state.autoCall || state.demo || !callsAvailable || !step?.phone) return;
    const key = `${al.id}:${al.stepIndex}`;
    if (called.current.has(key)) return;
    called.current.add(key);
    dispatch({ type: 'CALL_START' });
    placeCall(step.phone, (seconds) => dispatch({ type: 'CALL_END', seconds }));
  }, [al?.id, al?.phase, al?.stepIndex, state.autoCall]); // eslint-disable-line react-hooks/exhaustive-deps

  // A loud wail once nobody has answered, only if the person turned it on. It plays on this phone so
  // people nearby can hear it, and works with no signal. It stops the moment the alert is answered.
  const ringing = !!al && state.siren && (al.phase === 'escalating' || al.phase === 'done');
  useEffect(() => {
    if (ringing) startSiren();
    else stopSiren();
    return () => stopSiren();
  }, [ringing]);

  if (!al) return null;
  const who = al.phase === 'escalating' ? al.chain[al.stepIndex] : null;
  const total = al.phase === 'countdown' ? CFG.countdownSec : CFG.stepSec;
  const progress = al.phase === 'done' ? 0 : al.remaining / total;
  return (
    <Modal visible transparent={false} animationType="fade" statusBarTranslucent onRequestClose={() => {}}>
      <View style={styles.screen} accessibilityLiveRegion="assertive">
        <View style={styles.top}>
          <Pulse>
            <View style={styles.sirenDisc}>
              <Glyph icon={Siren} size={34} color={colors.white} strokeWidth={2.2} />
            </View>
          </Pulse>
          <Title style={{ color: colors.white, fontSize: 38, textAlign: 'center', letterSpacing: -0.8 }}>
            {t('areYouOk')}
          </Title>
          <Body style={{ color: colors.white, textAlign: 'center', opacity: 0.92 }}>{t('areYouOkSub')}</Body>
        </View>

        <View style={styles.middle}>
          <ProgressRing
            size={188}
            stroke={12}
            progress={progress}
            color={colors.white}
            track="rgba(255,255,255,0.28)"
          >
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 64,
                lineHeight: 72,
                color: colors.white,
                letterSpacing: -2,
              }}
            >
              {al.phase === 'done' ? '–' : al.remaining}
            </Text>
            <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: colors.white, opacity: 0.9 }}>s</Text>
          </ProgressRing>

          {who ? (
            <View style={styles.contact}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Avatar name={who.name} role={who.role} size={52} />
                <View style={{ flex: 1 }}>
                  <Caption>{t('calling')}</Caption>
                  <Body bold>{who.name}</Body>
                </View>
              </View>
              {who.phone ? (
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <PressRow
                    accessibilityRole="button"
                    accessibilityLabel={`${t('callNow')} ${who.name}`}
                    onPress={() => Linking.openURL(callLink(who.phone))}
                    style={styles.actionBtn}
                  >
                    <Glyph icon={Phone} size={22} color={colors.white} />
                    <Text style={styles.actionText}>{t('callNow')}</Text>
                  </PressRow>
                  {whatsappLink(who.phone, msg) ? (
                    <PressRow
                      accessibilityRole="button"
                      accessibilityLabel={`${t('whatsapp')} ${who.name}`}
                      onPress={() => Linking.openURL(whatsappLink(who.phone, msg))}
                      style={[styles.actionBtn, { backgroundColor: colors.leaf }]}
                    >
                      <Glyph icon={Send} size={22} color={colors.white} />
                      <Text style={styles.actionText}>{t('whatsapp')}</Text>
                    </PressRow>
                  ) : null}
                  <PressRow
                    accessibilityRole="button"
                    accessibilityLabel={`${t('sendMessage')} ${who.name}`}
                    onPress={() => Linking.openURL(smsLink(who.phone, msg))}
                    style={styles.actionBtn}
                  >
                    <Glyph icon={MessageCircle} size={22} color={colors.white} />
                    <Text style={styles.actionText}>{t('sms')}</Text>
                  </PressRow>
                </View>
              ) : null}
            </View>
          ) : null}
          {/* Demo (Expo Go, no SMS module): show what would be sent instead of sending it */}
          {state.autoSms && !smsAvailable && state.demo && who?.phone ? (
            <Caption style={{ color: colors.white, textAlign: 'center' }}>
              {t('sms.simulated').replace('{name}', who.name).replace('{text}', msg)}
            </Caption>
          ) : autoSent.ok !== null && autoSent.key.startsWith(`${al.id}:`) ? (
            <Caption style={{ color: colors.white, textAlign: 'center' }}>
              {autoSent.ok ? t('sms.sentTo').replace('{name}', autoSent.name) : t('sms.failed')}
            </Caption>
          ) : null}
          {al.calling && who && al.calling === who.id ? (
            <Body bold style={{ color: colors.white, textAlign: 'center' }}>
              {t('call.calling').replace('{name}', who.name)}
            </Body>
          ) : null}
          {state.autoCall && state.demo && who?.phone ? (
            <Caption style={{ color: colors.white, textAlign: 'center' }}>
              {t('call.simulated').replace('{name}', who.name)}
            </Caption>
          ) : null}
          {al.phase === 'done' ? (
            <Body style={{ color: colors.white, textAlign: 'center' }}>
              {al.reached
                ? t('call.reached').replace('{name}', al.chain.find((m) => m.id === al.reached)?.name ?? '')
                : t('nobodyReached')}
            </Body>
          ) : null}
          <Caption style={{ color: colors.white, opacity: 0.85, textAlign: 'center' }}>
            {t('confidence')}: {Math.round(al.confidence * 100)}% ({al.reason})
          </Caption>
        </View>

        <View style={styles.bottom}>
          <ActionButton
            filled
            icon={Check}
            label={t('imOk')}
            onPress={() => dispatch({ type: 'IM_OK', at: Date.now() })}
          />
          <ActionButton label={t('falseAlarm')} onPress={() => dispatch({ type: 'FALSE_ALARM' })} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.brick,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  top: { alignItems: 'center', gap: 10 },
  middle: { alignItems: 'center', gap: 20 },
  bottom: { gap: 12 },
  pulseWrap: { width: 80, height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  pulse: { position: 'absolute', width: 72, height: 72, borderRadius: 36, backgroundColor: colors.white },
  sirenDisc: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contact: {
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: radii.lg,
    padding: 14,
    alignSelf: 'stretch',
  },
  actionBtn: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
  },
  actionText: { fontFamily: fonts.semi, fontSize: 15, color: colors.white },
  action: {
    minHeight: 64,
    borderRadius: radii.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  actionFilled: { backgroundColor: colors.white },
  actionGhost: { borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)' },
});
