import React, { useState } from 'react';
import { View } from 'react-native';
import { ArrowRight, Check } from '../components/icons';
import { BigButton, Body, Caption, Screen, Title } from '../components/ui';
import { Field } from '../components/kit';
import Doodle from '../components/doodles';
import SetupProgress from '../components/SetupProgress';
import Account from '../components/me/Account';
import JoinCard from '../components/circle/JoinCard';
import { useStore } from '../state/store';

import { isDoctor } from '../who';
import { colors } from '../theme';

// The setup for someone who looks after a person (family, neighbour, ASHA, clinician). Their own account comes
// first, because it is how Saath knows who they are on their own phone and which circle they belong to. Then the
// code the person sent them. Their role comes from that invite. Nothing about sensors or emergency contacts:
// those belong to the person.
export default function MemberOnboardingScreen() {
  const { state, dispatch, t } = useStore();
  const doctor = isDoctor(state);
  // Signed in already (the usual way now, from the welcome screen): no account step.
  const [order] = useState(() => (state.cloud.access ? ['name', 'join'] : ['name', 'account', 'join']));
  const [index, setIndex] = useState(0);
  const step = order[index];
  const [name, setName] = useState(state.profile.name || '');
  const signedIn = Boolean(state.cloud.access);
  const joined = state.circles.length > 0;
  const back = index > 0 ? () => setIndex((n) => n - 1) : null;

  const next = () => {
    if (step === 'name') dispatch({ type: 'PROFILE_SET', patch: { name: name.trim() } });
    setIndex((n) => n + 1);
  };

  return (
    <Screen setup>
      <View style={{ alignItems: 'center', paddingTop: 8 }}>
        <Doodle name="people" size={104} />
      </View>
      <SetupProgress step={index} total={order.length} />

      {step === 'name' ? (
        <View style={{ gap: 14 }}>
          <Title style={{ fontSize: 28 }}>{t(doctor ? 'mo.nameTitleDoctor' : 'mo.nameTitle')}</Title>
          <Field label={t(doctor ? 'ob.nameDoctor' : 'ob.name')} value={name} onChangeText={setName} />
        </View>
      ) : null}

      {step === 'account' ? (
        <View style={{ gap: 14 }}>
          <Title style={{ fontSize: 28 }}>{t('mo.accountTitle')}</Title>
          <Body>{t('mo.accountNote')}</Body>
          <Account />
          {!signedIn ? <Caption style={{ color: colors.madder }}>{t('mo.needAccount')}</Caption> : null}
        </View>
      ) : null}

      {step === 'join' ? (
        <View style={{ gap: 14 }}>
          <Title style={{ fontSize: 28 }}>{t('mo.joinTitle')}</Title>
          <Body>{t('mo.joinNote')}</Body>
          <JoinCard />
          {joined ? (
            <Body bold>{t('mo.joined').replace('{n}', String(state.circles.length))}</Body>
          ) : (
            <Caption>{t('mo.noCode')}</Caption>
          )}
        </View>
      ) : null}

      <View style={{ gap: 10 }}>
        {index < order.length - 1 ? (
          <BigButton
            icon={ArrowRight}
            label={t('ob.next')}
            onPress={() => (step === 'account' && !signedIn ? null : next())}
          />
        ) : (
          <BigButton
            kind="ok"
            icon={Check}
            label={joined ? t('mo.finish') : t('mo.skip')}
            onPress={() => dispatch({ type: 'SET', key: 'onboarded', value: true })}
          />
        )}
        {back ? <BigButton kind="text" label={t('back')} onPress={back} /> : null}
      </View>
    </Screen>
  );
}
