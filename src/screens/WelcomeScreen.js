import React, { useState } from 'react';
import { View } from 'react-native';
import { BigButton, Body, Screen, Title } from '../components/ui';
import { Segmented } from '../components/kit';
import Doodle from '../components/doodles';
import { Push } from '../components/motion';
import AuthForm from '../components/auth/AuthForm';
import { useStore } from '../state/store';
import { cloudConfig } from '../services/cloud';
import { lookupAccount } from '../accountRole';

// The first screen. Two doors: a new person creates an account, someone who already has one signs in. Each does
// only its own job.
//   Create  -> "How will you use Saath?" -> that role's setup.
//   Sign in -> the role is worked out from the account (doctor, care-giver, patient or both), the name comes from
//              the account, and the person goes straight in. A patient is asked only for what lives on this phone:
//              who to call in an emergency and how alerts work, both skippable.
export default function WelcomeScreen() {
  const { state, dispatch, t } = useStore();
  const [mode, setMode] = useState(null); // null: the two doors; 'signin' | 'create': the form

  const done = async (r, how) => {
    if (how === 'create') {
      dispatch({ type: 'CLOUD_SET', patch: r.cloud });
      return;
    }
    const cloud = { ...state.cloud, ...r.cloud };
    const found = await lookupAccount(cloudConfig(), cloud);
    const name = r.personName || '';
    // the account's own name wins on a new phone, and is marked as sent so this phone never pushes a blank over it
    dispatch({ type: 'CLOUD_SET', patch: { ...r.cloud, ...(found.session || {}), sentName: name } });
    if (name) dispatch({ type: 'PROFILE_SET', patch: { name } });
    dispatch({ type: 'CIRCLES_SET', circles: found.circles });
    dispatch({ type: 'SET', key: 'usage', value: found.usage });
    if (found.usage === 'person' || found.usage === 'both')
      dispatch({ type: 'SET', key: 'returning', value: true });
    else dispatch({ type: 'SET', key: 'onboarded', value: true });
  };

  if (mode) {
    return (
      <Push key={mode}>
        <Screen
          setup
          title={t(mode === 'create' ? 'auth.createTitle' : 'auth.signinTitle')}
          onBack={() => setMode(null)}
        >
          <AuthForm mode={mode} onModeChange={setMode} onDone={done} />
        </Screen>
      </Push>
    );
  }
  return (
    <Screen setup>
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 40, paddingBottom: 12 }}>
        <Doodle name="people" size={148} />
        <Title style={{ fontSize: 40, textAlign: 'center' }}>Saath</Title>
        <Body soft style={{ textAlign: 'center' }}>
          {t('auth.tagline')}
        </Body>
      </View>
      <Segmented
        value={state.lang}
        onChange={(v) => dispatch({ type: 'SET', key: 'lang', value: v })}
        options={[
          { value: 'en', label: 'English' },
          { value: 'hi', label: 'हिन्दी' },
        ]}
      />
      <View style={{ gap: 12, paddingTop: 8 }}>
        <BigButton label={t('auth.create')} onPress={() => setMode('create')} />
        <BigButton kind="outlined" label={t('auth.have')} onPress={() => setMode('signin')} />
      </View>
    </Screen>
  );
}
