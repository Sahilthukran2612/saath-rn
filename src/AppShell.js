import React, { useEffect, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from './state/store';
import { colors, fonts, themeName } from './theme';
import RoleBar from './components/RoleBar';
import AlertBanner from './components/AlertBanner';
import CircleAlertBanner from './components/CircleAlertBanner';
import HeartNotice from './components/HeartNotice';
import TabBar, { NAV_TABS } from './components/TabBar';
import { ArrowLeft, UserRound } from './components/icons';
import { Glyph, PressRow, useScale } from './components/ui';
import { Badge } from './components/kit';
import { SaathMark } from './components/art';
import { Reveal } from './components/motion';
import { NavContext } from './components/nav';
import TodayScreen from './screens/TodayScreen';
import CircleScreen from './screens/CircleScreen';
import SafetyScreen from './screens/SafetyScreen';
import CareScreen from './screens/CareScreen';
import PlanScreen from './screens/PlanScreen';
import MeScreen from './screens/MeScreen';
import ConsentScreen from './screens/ConsentScreen';
import LockScreen from './screens/LockScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import RoleChoiceScreen from './screens/RoleChoiceScreen';
import MemberOnboardingScreen from './screens/MemberOnboardingScreen';
import useCloudSync from './state/useCloudSync';
import useReminders from './state/useReminders';
import { startFallListener } from './services/sensing';
import { cfgFrom } from './care';
import { askNotificationPermission, startWatching, stopWatching } from './services/foreground';
import { t as translate } from './i18n/strings';

const SCREENS = {
  today: TodayScreen,
  circle: CircleScreen,
  safety: SafetyScreen,
  care: CareScreen,
  plan: PlanScreen,
  me: MeScreen,
};

// Material 3 small top app bar: 64 high, brand or screen title, status, account.
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 16,
  },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default function AppShell({ sensing = true }) {
  const { state, dispatch, t, registry, shared } = useStore();
  const [tab, setTab] = useState('today');
  const k = useScale();
  const { impactG, inactiveHours } = state.baseline;
  useCloudSync();
  useReminders();

  useEffect(() => {
    // a phone used only to look after someone else has no one to watch: no motion sensing
    if (!sensing || !state.hydrated || state.usage === 'member') return undefined;
    return startFallListener({
      cfg: cfgFrom({ impactG, inactiveHours }),
      onFall: (r) =>
        dispatch({
          type: 'TRIGGER_ALERT',
          kind: 'fall',
          confidence: r.confidence,
          reason: r.reason,
          id: String(Date.now()),
        }),
      onActivity: (at) => dispatch({ type: 'ACTIVITY', at }),
    });
  }, [sensing, state.hydrated, state.usage, dispatch, impactG, inactiveHours]);

  // "Keep watching in the background": a visible foreground service keeps the app alive.
  // Without the notification permission it does not start, and the setting turns itself off.
  const { background, lang } = state;
  useEffect(() => {
    if (!state.hydrated) return undefined;
    if (!background || state.usage === 'member') {
      stopWatching();
      return undefined;
    }
    let cancelled = false;
    askNotificationPermission().then((ok) => {
      if (cancelled) return;
      if (ok) startWatching('Saath', translate(lang, 'bg.notice'));
      else {
        dispatch({ type: 'SET', key: 'background', value: false });
        dispatch({ type: 'SET', key: 'backgroundDenied', value: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.hydrated, background, state.usage, lang, dispatch]);

  // System Back always works: from any other screen it returns to Today, and only Today lets the app close.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'today') {
        setTab('today');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [tab]);

  // Delegations and help requests expire by themselves.
  useEffect(() => {
    const h = setInterval(() => dispatch({ type: 'EXPIRE_DELEGATIONS', now: Date.now() }), 30000);
    return () => clearInterval(h);
  }, [dispatch]);

  // A shared phone locks when the app goes to the background. Sensing keeps running for the
  // last person, and the alert is drawn over the lock screen, so safety never waits for a PIN.
  const sharedOn = registry.shared;
  const { lockNow } = shared;
  useEffect(() => {
    if (!sharedOn) return undefined;
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'background') lockNow();
    });
    return () => sub.remove();
  }, [sharedOn, lockNow]);

  if (state.hydrated && registry.shared && registry.locked) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.mist }}>
        <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
        <AlertBanner />
        <LockScreen />
      </SafeAreaView>
    );
  }

  // A fresh install runs the setup once: who uses the phone, a name, the people to reach, the alert choices.
  if (state.hydrated && !state.onboarded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.mist }}>
        <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
        <AlertBanner />
        {state.usage == null ? <RoleChoiceScreen /> : state.usage === 'member' ? <MemberOnboardingScreen /> : <OnboardingScreen />}
      </SafeAreaView>
    );
  }

  // Under-18 users need a guardian's agreement first (needs legal review).
  if (state.hydrated && state.mode === 'teen' && state.consent.status !== 'granted') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.mist }}>
        <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
        <ConsentScreen />
      </SafeAreaView>
    );
  }

  // Five destinations (the Material 3 maximum). A care-giver has two: their people and their circle.
  // "Me" is the account avatar in the top app bar for everyone.
  const tabs = state.usage === 'member' ? NAV_TABS.filter(([id]) => ['today', 'circle'].includes(id)) : NAV_TABS;
  const current = tab === 'me' || tabs.some(([id]) => id === tab) ? tab : 'today';
  const Screen = SCREENS[current];
  const onMe = current === 'me';
  const initials =
    (state.profile?.name || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || null;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.surface }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <NavContext.Provider value={setTab}>
          <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} />
          <RoleBar />
          <View style={styles.header}>
            {onMe ? (
              <PressRow
                accessibilityRole="button"
                accessibilityLabel={t('back')}
                onPress={() => setTab('today')}
                rippleColor="rgba(38,48,107,0.14)"
                style={styles.iconButton}
              >
                <Glyph icon={ArrowLeft} size={24} color={colors.ink} />
              </PressRow>
            ) : (
              <SaathMark size={32} />
            )}
            <Text
              numberOfLines={1}
              accessibilityRole="header"
              style={{
                flex: 1,
                fontFamily: fonts.bold,
                fontSize: 22 * Math.min(k, 1.2),
                lineHeight: 28 * Math.min(k, 1.2),
                color: colors.ink,
              }}
            >
              {onMe ? t('tabMe') : t('appName')}
            </Text>
            {state.background ? (
              <Badge tone="leaf" label={t('watch.bg')} />
            ) : (
              <Badge tone="indigo" label={t('watch.on')} />
            )}
            {onMe ? null : (
              <PressRow
                accessibilityRole="button"
                accessibilityLabel={t('tabMe')}
                onPress={() => setTab('me')}
                rippleColor="rgba(38,48,107,0.14)"
                style={styles.iconButton}
              >
                <View style={styles.avatar}>
                  {initials ? (
                    <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.white }}>{initials}</Text>
                  ) : (
                    <Glyph icon={UserRound} size={20} color={colors.white} />
                  )}
                </View>
              </PressRow>
            )}
          </View>
          <AlertBanner />
          <CircleAlertBanner />
          <HeartNotice />
          <View style={{ flex: 1 }}>
            {state.hydrated ? (
              <Reveal key={current} style={{ flex: 1 }}>
                <Screen />
              </Reveal>
            ) : null}
          </View>
          <TabBar tab={current} onChange={setTab} t={t} tabs={tabs} />
        </NavContext.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
