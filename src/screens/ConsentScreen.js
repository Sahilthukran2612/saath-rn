import React, { useState } from 'react';
import { ScrollView, TextInput } from 'react-native';
import { BigButton, Body, Card, Title } from '../components/ui';
import { useStore } from '../state/store';
import { validPhone } from '../logic';
import { colors } from '../theme';
import { speak } from '../services/voice';

const input = {
  minHeight: 56,
  fontSize: 20,
  borderWidth: 2,
  borderColor: colors.indigo,
  borderRadius: 12,
  paddingHorizontal: 12,
  backgroundColor: colors.white,
};

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
    dispatch({ type: 'GRANT_CONSENT', guardianName: name.trim(), guardianPhone: phone, at: Date.now() });
  };

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('consentTitle')}</Title>
      <Body>{t('consentBody')}</Body>
      <Card>
        <TextInput
          accessibilityLabel={t('consentName')}
          placeholder={t('consentName')}
          value={name}
          onChangeText={setName}
          style={input}
        />
        <TextInput
          accessibilityLabel={t('consentPhone')}
          placeholder={t('consentPhone')}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          style={input}
        />
        {error && <Body style={{ color: colors.brick }}>{t('consentNeed')}</Body>}
        <BigButton kind="ok" icon="✅" label={t('consentAgree')} onPress={submit} />
      </Card>
      <Body>{t('consentLegal')}</Body>
      <BigButton
        kind="quiet"
        label={t('notMinor')}
        onPress={() => dispatch({ type: 'SET', key: 'mode', value: 'elder' })}
      />
    </ScrollView>
  );
}
