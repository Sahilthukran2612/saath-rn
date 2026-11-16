import React, { useState } from 'react';
import { View } from 'react-native';
import { Cloud } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import { Field, Segmented } from '../kit';
import { useStore } from '../../state/store';
import {
  cloudConfig,
  deleteDeviceToken,
  isConfigured,
  passwordOk,
  signInAnonymous,
  signInPassword,
  signUpPassword,
} from '../../services/cloud';
import { validPhone } from '../../logic';

const fmt = (s, v) => Object.entries(v).reduce((o, [k, x]) => o.replace(`{${k}}`, String(x)), s);
const last10 = (p) => String(p).replace(/\D/g, '').slice(-10);

// The account: a phone number and a password. It is how the circle's phones know who is who (the roles and who
// sees what are enforced by the server), and how the same person signs in on a second phone. No text message is
// sent, so it costs nothing. A forgotten password cannot be reset, and the screen says so. "Use without an
// account" keeps working on this phone only.
export default function Account() {
  const { state, dispatch, t } = useStore();
  const [mode, setMode] = useState('create'); // 'create' | 'signin'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [again, setAgain] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = cloudConfig();
  const signedIn = Boolean(state.cloud.access);

  const done = (r) => {
    dispatch({ type: 'CLOUD_SET', patch: r.cloud });
    // a second phone: bring the person's name over from the account
    if (r.personName && !state.profile.name) dispatch({ type: 'PROFILE_SET', patch: { name: r.personName } });
    setPassword('');
    setAgain('');
    setMsg('');
  };

  const submit = async () => {
    if (busy) return;
    if (!validPhone(last10(phone))) return setMsg(t('invalidPhone'));
    if (!passwordOk(password)) return setMsg(t('acc.short'));
    if (mode === 'create' && password !== again) return setMsg(t('acc.mismatch'));
    setBusy(true);
    const r =
      mode === 'create'
        ? await signUpPassword(cfg, last10(phone), password, undefined, state.profile.name)
        : await signInPassword(cfg, last10(phone), password);
    setBusy(false);
    if (r.ok) return done(r);
    const reasons = { exists: 'acc.exists', wrong: 'acc.wrong', confirm: 'acc.confirm', network: 'acc.failed' };
    return setMsg(t(reasons[r.reason] || 'acc.failed'));
  };

  const quick = async () => {
    if (busy) return;
    setBusy(true);
    const r = await signInAnonymous(cfg, undefined, state.profile.name);
    setBusy(false);
    if (!r.ok) return setMsg(r.reason === 'disabled' ? t('acc.disabled') : t('acc.failed'));
    return done(r);
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Cloud size={24} color="#26306B" />
        <Body bold style={{ flex: 1 }}>
          {t('acc.title')}
        </Body>
      </View>
      {!isConfigured(cfg) ? (
        <Caption>{t('acc.off')}</Caption>
      ) : signedIn ? (
        <View style={{ gap: 10 }}>
          <Body>{state.cloud.phone ? fmt(t('acc.in'), { phone: `+91 ${state.cloud.phone}` }) : t('acc.inAnon')}</Body>
          {state.cloud.phone ? <Caption>{t('acc.multi')}</Caption> : <Caption>{t('acc.anonNote')}</Caption>}
          <Caption>{fmt(t('acc.waiting'), { n: state.outbox.length })}</Caption>
          {state.cloud.pushState ? <Caption>{t(`push.${state.cloud.pushState}`)}</Caption> : null}
          <BigButton
            kind="quiet"
            label={t('acc.out')}
            onPress={async () => {
              // stop alerts to this phone first (best effort), then forget the account here
              await deleteDeviceToken(cfg, state.cloud, state.cloud.pushToken);
              dispatch({ type: 'CLOUD_SIGN_OUT' });
            }}
          />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Caption>{t('acc.note')}</Caption>
          <Segmented
            value={mode}
            onChange={(v) => {
              setMode(v);
              setMsg('');
            }}
            options={[
              { value: 'create', label: t('acc.create') },
              { value: 'signin', label: t('acc.signin.tab') },
            ]}
          />
          <Field label={t('acc.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field label={t('acc.pass')} value={password} onChangeText={setPassword} secureTextEntry />
          {mode === 'create' ? (
            <Field label={t('acc.pass2')} value={again} onChangeText={setAgain} secureTextEntry />
          ) : null}
          {mode === 'create' ? <Caption>{t('acc.noreset')}</Caption> : null}
          {msg ? <Body bold>{msg}</Body> : null}
          <BigButton kind="primary" label={mode === 'create' ? t('acc.create') : t('acc.signIn')} onPress={submit} />
          <BigButton kind="quiet" label={t('acc.quick')} onPress={quick} />
          <Caption>{t('acc.quickNote')}</Caption>
        </View>
      )}
    </Card>
  );
}