import React, { useState } from 'react';
import { View } from 'react-native';
import { Cloud } from '../icons';
import { BigButton, Body, Caption, Card, Chip } from '../ui';
import { Field } from '../kit';
import Sheet from '../Sheet';
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

import { fmt } from '../../i18n/strings';
const last10 = (p) => String(p).replace(/\D/g, '').slice(-10);

// The account: a phone number and a password. It is how the circle's phones know who is who (the roles and who
// sees what are enforced by the server), and how the same person signs in on a second phone. No text message is
// sent, so it costs nothing. A forgotten password cannot be reset, and the screen says so. "Use without an
// account" keeps working on this phone only.
export default function Account() {
  const { state, dispatch, t } = useStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = cloudConfig();
  const signedIn = Boolean(state.cloud.access);

  const done = (r) => {
    dispatch({ type: 'CLOUD_SET', patch: r.cloud });
    // a second phone: bring the person's name over from the account
    if (r.personName && !state.profile.name) dispatch({ type: 'PROFILE_SET', patch: { name: r.personName } });
    setPassword('');
    setMsg('');
  };

  const submit = async () => {
    if (busy) return;
    if (!validPhone(last10(phone))) return setMsg(t('invalidPhone'));
    if (!passwordOk(password)) return setMsg(t('acc.short'));
    setBusy(true);
    // One button for both: a number that already has an account is signed in; a new number gets one made. The
    // server answers a wrong password and an unknown number the same way, so a failed sign-in tries to create the
    // account, and if that says the number exists, the password was wrong.
    let r = await signInPassword(cfg, last10(phone), password);
    if (!r.ok && r.reason === 'wrong') {
      const s = await signUpPassword(cfg, last10(phone), password, undefined, state.profile.name);
      r = s.ok ? s : { ok: false, reason: s.reason === 'exists' ? 'wrong' : s.reason };
    }
    setBusy(false);
    if (r.ok) return done(r);
    const reasons = { wrong: 'acc.wrongPass', confirm: 'acc.confirm', network: 'acc.failed' };
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
          <Body>
            {state.cloud.phone ? fmt(t('acc.in'), { phone: `+91 ${state.cloud.phone}` }) : t('acc.inAnon')}
          </Body>
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
          <BigButton kind="primary" label={t('acc.open')} onPress={() => setSheet(true)} />
          <BigButton kind="text" label={t('acc.quick')} onPress={quick} />
          <Caption>{t('acc.quickNote')}</Caption>
          <Sheet visible={sheet} onClose={() => setSheet(false)} title={t('acc.open')}>
            <Field label={t('acc.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Field
              label={t('acc.pass')}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!show}
            />
            <View style={{ flexDirection: 'row' }}>
              <Chip label={show ? t('acc.hide') : t('acc.show')} onPress={() => setShow(!show)} />
            </View>
            {msg ? <Body bold>{msg}</Body> : null}
            <BigButton kind="primary" label={busy ? t('acc.wait') : t('acc.continue')} onPress={submit} />
            <Caption>{t('acc.noreset')}</Caption>
          </Sheet>
        </View>
      )}
    </Card>
  );
}
