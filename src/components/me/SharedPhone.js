import React, { useState } from 'react';
import { View } from 'react-native';
import { Lock, Smartphone } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import { Field, Toggle } from '../kit';
import { useStore } from '../../state/store';
import { pinValid } from '../../profiles';
import { colors } from '../../theme';

const digits = (v) => v.replace(/\D/g, '').slice(0, 4);

// Several people can use one phone. Each has their own data and a 4-digit PIN.
export default function SharedPhone() {
  const { registry, shared, t } = useStore();
  const [pin, setPin] = useState('');
  const [asking, setAsking] = useState(false); // choosing a PIN, or confirming one to turn off
  const [msg, setMsg] = useState('');

  const toggle = (on) => {
    setPin('');
    setMsg('');
    setAsking(true);
    if (!on && !registry.shared) setAsking(false);
  };

  const confirm = () => {
    if (!pinValid(pin)) return setMsg(t('sp.badPin'));
    if (registry.shared) {
      if (!shared.disable(pin)) return setMsg(t('sp.wrong').replace('{n}', '-'));
    } else shared.enable(pin);
    setPin('');
    setAsking(false);
    setMsg('');
  };

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Smartphone size={24} color={colors.indigo} />
        <Body bold style={{ flex: 1 }}>
          {t('sp.title')}
        </Body>
        <Toggle value={registry.shared} label={t('sp.title')} onValueChange={toggle} />
      </View>
      <Caption>{t('sp.note')}</Caption>
      {asking ? (
        <View style={{ gap: 10 }}>
          <Field
            label={registry.shared ? t('sp.offPin') : t('sp.choosePin')}
            value={pin}
            onChangeText={(v) => setPin(digits(v))}
            keyboardType="number-pad"
            secureTextEntry
          />
          {msg ? <Body style={{ color: colors.madder }}>{msg}</Body> : null}
          <BigButton kind="primary" icon={Lock} label={t('sp.confirm')} onPress={confirm} />
        </View>
      ) : null}
      {registry.shared && !asking ? (
        <BigButton kind="quiet" icon={Lock} label={t('sp.lock')} onPress={shared.lockNow} />
      ) : null}
    </Card>
  );
}
