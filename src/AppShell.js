import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useStore } from './state/store';
import { colors, fonts } from './theme';
import RoleBar from './components/RoleBar';
import AlertBanner from './components/AlertBanner';
import TabBar from './components/TabBar';
import { useScale } from './components/ui';
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

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 6,
  },
});

export default function AppShell({ sensing = true }) {
  const { state, dispatch, t } = useStore();
  const [tab, setTab] = useState('today');
  const k = useScale();
  const { impactG, inactiveHours } = state.baseline;

  useEffect(() => {
    if (!sensing || !state.hydrated) return undefined;
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
  }, [sensing, state.hydrated, dispatch, impactG, inactiveHours]);

  // "Keep watching in the background": a visible foreground service keeps the app alive.
  // Without the notification permission it does not start, and the setting turns itself off.
  const { background, lang } = state;
  useEffect(() => {
    if (!state.hydrated) return undefined;
    if (!background) {
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
  }, [state.hydrated, background, lang, dispatch]);

  // Delegations and help requests expire by themselves.
  useEffect(() => {
    const h = setInterval(() => dispatch({ type: 'EXPIRE_DELEGATIONS', now: Date.now() }), 30000);
    return () => clearInterval(h);
  }, [dispatch]);

  // Under-18 users need a guardian's agreement first (needs legal review).
  if (state.hydrated && state.mode === 'teen' && state.consent.status !== 'granted') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.mist }}>
        <StatusBar style="dark" />
        <ConsentScreen />
      </SafeAreaView>
    );
  }

  const Screen = SCREENS[tab];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.mist }}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <NavContext.Provider value={setTab}>
          <StatusBar style="dark" />
          <RoleBar />
          <View style={styles.header}>
            <SaathMark size={34} />
            <Text
              style={{
                fontFamily: fonts.bold,
                fontSize: 22 * Math.min(k, 1.2),
                color: colors.indigo,
                letterSpacing: -0.3,
              }}
            >
              {t('appName')}
            </Text>
            <View style={{ flex: 1 }} />
            {state.background ? (
              <Badge tone="leaf" label={t('watch.bg')} />
            ) : (
              <Badge tone="indigo" label={t('watch.on')} />
            )}
          </View>
          <AlertBanner />
          <View style={{ flex: 1 }}>
            {state.hydrated ? (
              <Reveal key={tab} style={{ flex: 1 }}>
                <Screen />
              </Reveal>
            ) : null}
          </View>
          <TabBar tab={tab} onChange={setTab} t={t} />
        </NavContext.Provider>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
