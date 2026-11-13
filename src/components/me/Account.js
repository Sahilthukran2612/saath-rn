import React, { useState } from 'react';
import { View } from 'react-native';
import { Cloud } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import { Field } from '../kit';
import { useStore } from '../../state/store';
import { cloudConfig, isConfigured, requestOtp, signIn, signInAnonymous } from '../../services/cloud';
import { validPhone } from '../../logic';
import { colors } from '../../theme';

const fmt = (s, v) => Object.entries(v).reduce((o, [k, x]) => o.replace(`{${k}}`, String(x)), s);

// Optional sign-in so the circle can get alerts from other phones. Without it, everything still
// works on this phone. Shown as "not set up" when the build has no server address.
export default function Account() {
  const { state, dispatch, t } = useStore();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = cloudConfig();
  const signedIn = Boolean(state.cloud.access);
  // SMS sign-in needs a paid SMS provider on the server, so it is off unless the build says otherwise.
  const phoneAuth = process.env.EXPO_PUBLIC_SAATH_PHONE_AUTH === '1';

  const start = async () => {
    if (busy) return;
    setBusy(true);
    const r = await signInAnonymous(cfg, undefined, state.profile.name);
    setBusy(false);
    if (!r.ok) return setMsg(r.reason === 'disabled' ? t('acc.disabled') : t('acc.failed'));
    dispatch({ type: 'CLOUD_SET', patch: r.cloud });
    setMsg('');
  };

  const send = async () => {
    if (busy) return;
    if (!validPhone(phone)) return setMsg(t('invalidPhone'));
    setBusy(true);
    const r = await requestOtp(cfg, phone);
    setBusy(false);
    setSent(r.ok);
    setMsg(r.ok ? t('acc.sent') : t('acc.failed'));
  };

  const verify = async () => {
    if (busy) return;
    setBusy(true);
    const r = await signIn(cfg, phone, code, undefined, state.profile.name);
    setBusy(false);
    if (!r.ok) return setMsg(r.reason === 'code' ? t('acc.badCode') : t('acc.failed'));
    dispatch({ type: 'CLOUD_SET', patch: r.cloud });
    setCode('');
    setMsg('');
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
          <Body>{state.cloud.phone ? fmt(t('acc.in'), { phone: `+91 ${state.cloud.phone}` }) : t('acc.inAnon')}</Body>
          {state.cloud.phone ? null : <Caption>{t('acc.anonNote')}</Caption>}
          <Caption>{fmt(t('acc.waiting'), { n: state.outbox.length })}</Caption>
          <BigButton kind="quiet" label={t('acc.out')} onPress={() => dispatch({ type: 'CLOUD_SIGN_OUT' })} />
        </View>
      ) : !phoneAuth ? (
        <View style={{ gap: 10 }}>
          <Caption>{t('acc.startNote')}</Caption>
          {msg ? <Body>{msg}</Body> : null}
          <BigButton kind="primary" label={t('acc.start')} onPress={start} />
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Caption>{t('acc.note')}</Caption>
          <Field label={t('acc.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          {sent ? (
            <Field label={t('acc.code')} value={code} onChangeText={setCode} keyboardType="number-pad" />
          ) : null}
          {msg ? <Body>{msg}</Body> : null}
          <BigButton
            kind="primary"
            label={sent ? t('acc.signIn') : t('acc.send')}
            onPress={sent ? verify : send}
          />
        </View>
      )}
    </Card>
  );
}