import React, { useState } from 'react';
import { View } from 'react-native';
import { Users } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import { Field } from '../kit';
import { useStore } from '../../state/store';
import { acceptInvite, cloudConfig, listCircles } from '../../services/cloud';
import { colors } from '../../theme';

// How someone who looks after a person gets their place in that person's circle: the person invites them
// (name, role, phone number) and sends a code; they enter it here, signed in with that same number. Their role
// comes from the invite, not from anything they choose. Used on the Circle tab and in the care-giver setup.
export default function JoinCard({ onJoined }) {
  const { state, dispatch, t } = useStore();
  const [typed, setCode] = useState(null);
  const code = typed ?? state.joinCode ?? ''; // a scanned code fills the box; typing replaces it
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = cloudConfig();
  const signedIn = Boolean(state.cloud.access);

  const join = async () => {
    if (busy) return;
    if (!signedIn) return setMsg(t('join.needSignIn'));
    setBusy(true);
    const r = await acceptInvite(cfg, state.cloud, code);
    if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
    if (r.ok) {
      const c = await listCircles(cfg, { ...state.cloud, ...(r.session || {}) });
      if (c.ok) dispatch({ type: 'CIRCLES_SET', circles: c.circles });
      setCode('');
      dispatch({ type: 'JOIN_CODE', code: null });
      setMsg(t('join.ok'));
      onJoined?.();
    } else {
      setMsg(r.reason === 'network' ? t('join.net') : r.reason === 'limit' ? t('join.limit') : t('join.bad'));
    }
    setBusy(false);
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Users size={24} color={colors.indigo} />
        <Body bold style={{ flex: 1 }}>
          {t('join.title')}
        </Body>
      </View>
      <Caption>{t('join.boundNote')}</Caption>
      <Field label={t('join.code')} value={code} onChangeText={(v) => setCode(v.toUpperCase())} />
      {msg ? <Body>{msg}</Body> : null}
      <BigButton kind="primary" label={t('join.button')} onPress={join} />
    </Card>
  );
}