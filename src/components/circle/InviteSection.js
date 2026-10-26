import React, { useState } from 'react';
import { Share, TextInput, View } from 'react-native';
import { BigButton, Body, Card, Chip, Title } from '../ui';
import { useStore } from '../../state/store';
import { inviteLink, validPhone } from '../../logic';
import { colors } from '../../theme';

const ROLES = ['family', 'neighbour', 'asha', 'clinician'];
const ROLE_LABEL = { family: 'Family', neighbour: 'Neighbour', asha: 'ASHA', clinician: 'Clinician' };
const newCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

// Invite by phone number or link. The link is shared through the phone's own share sheet
// (WhatsApp, SMS). Joining is simulated until real accounts exist (Phase 4).
export default function InviteSection() {
  const { state, dispatch, t } = useStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('family');
  const [error, setError] = useState(false);

  const send = async () => {
    if (name.trim().length < 2 || !validPhone(phone)) return setError(true);
    setError(false);
    const code = newCode();
    dispatch({
      type: 'INVITE_ADD',
      id: String(Date.now()),
      name: name.trim(),
      phone,
      role,
      code,
      at: Date.now(),
    });
    setName('');
    setPhone('');
    try {
      await Share.share({ message: `${t('inviteTitle')}: ${inviteLink(code)}` });
    } catch {
      // the invite is saved even if the share sheet is dismissed
    }
  };

  const field = {
    minHeight: 56,
    fontSize: 20,
    borderWidth: 2,
    borderColor: colors.indigo,
    borderRadius: 12,
    paddingHorizontal: 12,
  };
  return (
    <Card>
      <Title>{t('inviteTitle')}</Title>
      <TextInput
        accessibilityLabel={t('inviteName')}
        placeholder={t('inviteName')}
        value={name}
        onChangeText={setName}
        style={field}
      />
      <TextInput
        accessibilityLabel={t('invitePhone')}
        placeholder={t('invitePhone')}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        style={field}
      />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {ROLES.map((r) => (
          <Chip key={r} label={ROLE_LABEL[r]} active={role === r} onPress={() => setRole(r)} />
        ))}
      </View>
      {error && <Body style={{ color: colors.brick }}>{t('invalidPhone')}</Body>}
      <BigButton icon="📨" label={t('inviteShare')} onPress={send} />
      {state.invites
        .filter((i) => i.status === 'pending')
        .map((i) => (
          <View key={i.id} style={{ gap: 6 }}>
            <Body>
              {i.name} · {ROLE_LABEL[i.role]} · {t('invitePending')}
            </Body>
            <Chip
              label={t('inviteAcceptSim')}
              onPress={() => dispatch({ type: 'INVITE_ACCEPT', id: i.id })}
            />
          </View>
        ))}
    </Card>
  );
}
