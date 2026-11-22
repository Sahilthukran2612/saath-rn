import React, { useState } from 'react';
import { View } from 'react-native';
import { UserPlus } from '../icons';
import { BigButton, Body, Chip } from '../ui';
import { Field } from '../kit';
import { useStore } from '../../state/store';
import { validPhone } from '../../logic';
import { nowMs } from '../../services/clock';
import { colors } from '../../theme';

const ROLES = ['family', 'neighbour', 'asha', 'clinician'];
const last10 = (p) => String(p).replace(/\D/g, '').slice(-10);

// Adds an emergency contact: the people Saath reaches when an alert goes unanswered. The person types the
// number themselves, so it is theirs to share. Used in the setup flow and on the Circle tab.
export default function ContactsForm() {
  const { state, dispatch, t } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('family');
  const [msg, setMsg] = useState('');

  const add = () => {
    if (name.trim().length < 2 || !validPhone(last10(phone))) return setMsg(t('ct.bad'));
    if (state.members.some((m) => last10(m.phone) === last10(phone))) return setMsg(t('ct.dup'));
    dispatch({ type: 'CONTACT_ADD', id: String(nowMs()), name, phone: last10(phone), role });
    setName('');
    setPhone('');
    setMsg('');
  };

  return (
    <View style={{ gap: 12 }}>
      <Field label={t('ct.name')} value={name} onChangeText={setName} />
      <Field label={t('ct.phone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Body bold>{t('ct.role')}</Body>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ROLES.map((r) => (
          <Chip key={r} label={t(`role.${r}`)} active={role === r} onPress={() => setRole(r)} />
        ))}
      </View>
      {msg ? <Body style={{ color: colors.madder }}>{msg}</Body> : null}
      <BigButton icon={UserPlus} label={t('ct.save')} onPress={add} />
    </View>
  );
}
