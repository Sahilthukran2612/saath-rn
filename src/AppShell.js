import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Pressable, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useStore } from './state/store';
import { colors } from './theme';
import RoleBar from './components/RoleBar';
import AlertBanner from './components/AlertBanner';
import { useScale } from './components/ui';
import TodayScreen from './screens/TodayScreen';
import CircleScreen from './screens/CircleScreen';
import SafetyScreen from './screens/SafetyScreen';
import CareScreen from './screens/CareScreen';
import MeScreen from './screens/MeScreen';
import { startFallListener } from './services/sensing';

const TABS = [
  ['today', 'tabToday', '🏠', TodayScreen],
  ['circle', 'tabCircle', '👥', CircleScreen],
  ['safety', 'tabSafety', '🛟', SafetyScreen],
  ['care', 'tabCare', '💊', CareScreen],
  ['me', 'tabMe', '🙂', MeScreen],
];

export default function AppShell({ sensing = true }) {
  const { state, dispatch, t } = useStore();
  const [tab, setTab] = useState('today');
  const k = useScale();

  useEffect(() => {
    if (!sensing || !state.hydrated) return undefined;
    return startFallListener({
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
  }, [sensing, state.hydrated, dispatch]);

  const Screen = TABS.find((x) => x[0] === tab)[3];
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.mist }}>
      <StatusBar style="dark" />
      <RoleBar />
      <AlertBanner />
      <View style={{ flex: 1 }}>{state.hydrated ? <Screen /> : null}</View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderColor: colors.line,
        }}
      >
        {TABS.map(([id, key, icon]) => (
          <Pressable
            key={id}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === id }}
            accessibilityLabel={t(key)}
            onPress={() => setTab(id)}
            style={{ flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontSize: 22 * k }}>{icon}</Text>
            <Text
              style={{
                fontSize: 14 * k,
                color: tab === id ? colors.indigo : colors.ink,
                fontWeight: tab === id ? '700' : '400',
              }}
            >
              {t(key)}
            </Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}
