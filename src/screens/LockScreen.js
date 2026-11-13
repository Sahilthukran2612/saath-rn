import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { BigButton, Body, Caption, Title } from '../components/ui';
import { Avatar, Field, ListGroup, ListRow } from '../components/kit';
import { SaathMark } from '../components/art';
import { Lock, UserPlus } from '../components/icons';
import { useStore } from '../state/store';
import { pinValid, waitSeconds } from '../profiles';
import { colors } from '../theme';
import { nowMs } from '../services/clock';

// Shown when the phone is shared and locked. Safety alerts are drawn above this screen
// (AlertBanner is rendered next to it), so a fall alert never waits behind a PIN.
export default function LockScreen() {
  const { registry, shared, t } = useStore();
  const [pick, setPick] = useState(null); // profile id, or 'new'
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const say = (res) => {
    if (res.reason === 'wait') setMsg(t('sp.wait').replace('{s}', String(waitSeconds(res.reg, nowMs()) || 60)));
    else if (res.reason === 'alert') setMsg(t('sp.alertFirst'));
    else setMsg(t('sp.wrong').replace('{n}', String(res.triesLeft ?? 0)));
  };

  const open = async () => {
    if (!pinValid(pin)) return setMsg(t('sp.badPin'));
    const res = await shared.unlock(pick, pin);
    if (!res.ok) {
      setPin('');
      say(res);
    }
  };

  const create = async () => {
    if (name.trim().length < 2 || !pinValid(pin)) return setMsg(t('sp.badNew'));
    await shared.add(name, pin);
  };

  const back = () => {
    setPick(null);
    setPin('');
    setMsg('');
  };

  const person = registry.profiles.find((p) => p.id === pick);

  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 32, gap: 18 }}>
      <SaathMark size={56} />
      {pick === null ? (
        <>
          <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t('sp.who')}</Title>
          <ListGroup>
            {registry.profiles.map((p) => (
              <ListRow
                key={p.id}
                title={p.name || t('role.person')}
                lead={<Avatar name={p.name || t('role.person')} role="person" size={44} />}
                onPress={() => setPick(p.id)}
                label={p.name || t('role.person')}
              />
            ))}
            <ListRow
              icon={UserPlus}
              title={t('sp.addTitle')}
              onPress={() => setPick('new')}
              last
              label={t('sp.addTitle')}
            />
          </ListGroup>
          <Caption>{t('sp.alertNote')}</Caption>
        </>
      ) : pick === 'new' ? (
        <>
          <Title style={{ fontSize: 28 }}>{t('sp.addTitle')}</Title>
          <Field label={t('sp.name')} value={name} onChangeText={setName} />
          <Field
            label={t('sp.choosePin')}
            value={pin}
            onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
          />
          {msg ? <Body style={{ color: colors.madder }}>{msg}</Body> : null}
          <BigButton kind="primary" icon={Lock} label={t('sp.add')} onPress={create} />
          <BigButton kind="quiet" label={t('back')} onPress={back} />
        </>
      ) : (
        <>
          <Title style={{ fontSize: 28 }}>{person?.name || t('role.person')}</Title>
          <Field
            label={t('sp.enterPin')}
            value={pin}
            onChangeText={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
            keyboardType="number-pad"
            secureTextEntry
          />
          {msg ? <Body style={{ color: colors.madder }}>{msg}</Body> : null}
          <BigButton kind="primary" icon={Lock} label={t('sp.open')} onPress={open} />
          <BigButton kind="quiet" label={t('back')} onPress={back} />
        </>
      )}
      <View style={{ height: 8 }} />
    </ScrollView>
  );
}
