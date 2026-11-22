import React, { useState } from 'react';
import { View } from 'react-native';
import { BigButton, Body, Caption, Chip } from '../ui';
import { Field } from '../kit';
import { useStore } from '../../state/store';
import { cloudConfig, passwordOk, signInPassword, signUpPassword } from '../../services/cloud';
import { validPhone } from '../../logic';
import { colors } from '../../theme';

const last10 = (p) => String(p).replace(/\D/g, '').slice(-10);

// The phone number and password form, in one of two modes that never cross: "signin" only signs in to an account
// that exists, "create" only makes a new one. A mistyped number can no longer make an empty account by surprise,
// and a number that already has an account is sent to sign-in with the number kept. No text message is sent, so it
// costs nothing; a forgotten password cannot be reset, and the create mode says so.
// `onDone(result, mode)` may be async; the button stays busy until it finishes.
export default function AuthForm({ mode, onModeChange, onDone }) {
  const { t } = useStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const create = mode === 'create';

  const switchTo = (m) => {
    setMsg('');
    onModeChange(m);
  };

  const submit = async () => {
    if (busy) return;
    if (!validPhone(last10(phone))) return setMsg(t('invalidPhone'));
    if (!passwordOk(password)) return setMsg(t('acc.short'));
    setBusy(true);
    setMsg('');
    const cfg = cloudConfig();
    const r = create
      ? await signUpPassword(cfg, last10(phone), password)
      : await signInPassword(cfg, last10(phone), password);
    if (r.ok) {
      try {
        await onDone(r, mode);
      } finally {
        setBusy(false);
      }
      return undefined;
    }
    setBusy(false);
    if (create && r.reason === 'exists') {
      setPassword('');
      onModeChange('signin');
      return setMsg(t('auth.exists'));
    }
    const reasons = {
      wrong: 'auth.wrong',
      confirm: 'acc.confirm',
      network: 'acc.failed',
      invalid: 'auth.wrong',
    };
    return setMsg(t(reasons[r.reason] || 'acc.failed'));
  };

  return (
    <View style={{ gap: 14 }}>
      <Field
        label={t('acc.phone')}
        value={phone}
        onChangeText={(v) => {
          setPhone(v);
          setMsg('');
        }}
        keyboardType="phone-pad"
      />
      <Field
        label={t('acc.pass')}
        value={password}
        onChangeText={(v) => {
          setPassword(v);
          setMsg('');
        }}
        secureTextEntry={!show}
      />
      <View style={{ flexDirection: 'row' }}>
        <Chip label={show ? t('acc.hide') : t('acc.show')} onPress={() => setShow(!show)} />
      </View>
      {msg ? (
        <Body bold style={{ color: colors.madder }}>
          {msg}
        </Body>
      ) : null}
      <BigButton
        kind="primary"
        label={busy ? t('acc.wait') : create ? t('auth.create') : t('auth.signin')}
        onPress={submit}
      />
      {create ? <Caption>{t('acc.noreset')}</Caption> : null}
      <BigButton
        kind="text"
        label={create ? t('auth.have') : t('auth.toCreate')}
        onPress={() => switchTo(create ? 'signin' : 'create')}
      />
    </View>
  );
}
