import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import { Cloud } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import Sheet from '../Sheet';
import AuthForm from '../auth/AuthForm';
import { useStore } from '../../state/store';
import { cloudConfig, deleteDeviceToken, isConfigured } from '../../services/cloud';
import { fmt } from '../../i18n/strings';
import { colors } from '../../theme';

// The account in Me: who is signed in, and signing out. Someone who set the app up before accounts were required
// can sign in or create one here, with the same two-mode form as the welcome screen.
export default function Account() {
  const { state, dispatch, t } = useStore();
  const [sheet, setSheet] = useState(false);
  const [mode, setMode] = useState('signin');
  const cfg = cloudConfig();
  const signedIn = Boolean(state.cloud.access);

  // Signing out forgets this phone's copy, so the next person to sign in never sees it, and goes back to the welcome
  // screen. What lives on the server (name, readings, the doctor's plan) comes back on the next sign-in. It asks first.
  const signOut = () =>
    Alert.alert(t('acc.out'), t('acc.outConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('acc.out'),
        style: 'destructive',
        onPress: async () => {
          // stop alerts to this phone first (best effort)
          await deleteDeviceToken(cfg, state.cloud, state.cloud.pushToken);
          const lang = state.lang;
          dispatch({ type: 'RESET' });
          dispatch({ type: 'SET', key: 'lang', value: lang });
        },
      },
    ]);

  const done = (r) => {
    dispatch({ type: 'CLOUD_SET', patch: r.cloud });
    // a second phone: bring the person's name over from the account
    if (r.personName && !state.profile.name) dispatch({ type: 'PROFILE_SET', patch: { name: r.personName } });
    setSheet(false);
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Cloud size={24} color={colors.indigo} />
        <Body bold style={{ flex: 1 }}>
          {t('acc.title')}
        </Body>
      </View>
      {!isConfigured(cfg) ? (
        <Caption>{t('acc.off')}</Caption>
      ) : signedIn ? (
        <View style={{ gap: 10 }}>
          <Body>
            {state.cloud.phone ? fmt(t('acc.in'), { phone: `+91 ${state.cloud.phone}` }) : t('acc.inAnon')}
          </Body>
          {state.cloud.phone ? <Caption>{t('acc.multi')}</Caption> : <Caption>{t('acc.anonNote')}</Caption>}
          {state.outbox.length > 0 ? (
            <Caption>{fmt(t('acc.waiting'), { n: state.outbox.length })}</Caption>
          ) : null}
          {state.cloud.pushState ? (
            <Caption style={state.cloud.pushState === 'on' ? { color: colors.leafDeep } : null}>
              {t(`push.${state.cloud.pushState}`)}
            </Caption>
          ) : null}
          <BigButton kind="quiet" label={t('acc.out')} onPress={signOut} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Caption>{t('acc.note')}</Caption>
          <BigButton kind="primary" label={t('acc.open')} onPress={() => setSheet(true)} />
          <Sheet
            visible={sheet}
            onClose={() => setSheet(false)}
            title={t(mode === 'create' ? 'auth.createTitle' : 'auth.signinTitle')}
          >
            <AuthForm mode={mode} onModeChange={setMode} onDone={done} />
          </Sheet>
        </View>
      )}
    </Card>
  );
}
