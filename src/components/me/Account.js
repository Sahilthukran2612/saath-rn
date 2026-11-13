import React, { useState } from 'react';
import { View } from 'react-native';
import { Cloud } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import { Field } from '../kit';
import { useStore } from '../../state/store';
import { cloudConfig, isConfigured, requestOtp, signIn } from '../../services/cloud';
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
    const r = await signIn(cfg, phone, code);
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
          <Body>{fmt(t('acc.in'), { phone: `+91 ${state.cloud.phone}` })}</Body>
          <Caption>{fmt(t('acc.waiting'), { n: state.outbox.length })}</Caption>
          <BigButton kind="quiet" label={t('acc.out')} onPress={() => dispatch({ type: 'CLOUD_SIGN_OUT' })} />
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
