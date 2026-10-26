import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BigButton, Body, Caption, Card, Title } from '../components/ui';
import { Field } from '../components/kit';
import { SaathMark } from '../components/art';
import { Check } from '../components/icons';
import { useStore } from '../state/store';
import { validPhone } from '../logic';
import { colors } from '../theme';
import { speak } from '../services/voice';
import { nowMs } from '../services/clock';

// Guardian-consent step for under-18s. It records who agreed, on this phone only.
// It does NOT verify identity: real verifiable consent needs legal review and accounts.
export default function ConsentScreen() {
  const { state, dispatch, t } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (name.trim().length < 2 || !validPhone(phone)) {
      setError(true);
      speak(t('consentNeed'), state.lang);
      return;
    }
    dispatch({ type: 'GRANT_CONSENT', guardianName: name.trim(), guardianPhone: phone, at: nowMs() });
  };

  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 24, paddingTop: 32, gap: 18 }}
    >
      <SaathMark size={56} />
      <View style={{ gap: 6 }}>
        <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t('consentTitle')}</Title>
        <Body>{t('consentBody')}</Body>
        <Caption>{t('consentSub')}</Caption>
      </View>
      <Card style={{ gap: 14 }}>
        <Field label={t('consentName')} value={name} onChangeText={setName} />
        <Field label={t('consentPhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        {error ? <Body style={{ color: colors.madder }}>{t('consentNeed')}</Body> : null}
        <BigButton kind="ok" icon={Check} label={t('consentAgree')} onPress={submit} />
      </Card>
      <Card tone="haldi">
        <Caption style={{ color: colors.ink }}>{t('consentLegal')}</Caption>
      </Card>
      <BigButton
        kind="quiet"
        label={t('notMinor')}
        onPress={() => dispatch({ type: 'SET', key: 'mode', value: 'elder' })}
      />
    </ScrollView>
  );
}
