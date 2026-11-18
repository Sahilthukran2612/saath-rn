import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { Send, UserPlus } from '../icons';
import { BigButton, Body, Caption, Card, Chip, Glyph, Title } from '../ui';
import { Avatar, Badge, Field, ListGroup, ListRow } from '../kit';
import { useStore } from '../../state/store';
import { validPhone } from '../../logic';
import { requestSync } from '../../state/useCloudSync';
import { fmt } from '../../circleFeed';
import { colors } from '../../theme';

const ROLES = ['family', 'neighbour', 'asha', 'clinician'];
const newCode = () => (Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)).slice(0, 8).toUpperCase();

// Invite by phone number. The code is shared as plain text through the phone's own share sheet (WhatsApp,
// SMS). No web link is used: there is no website for it to open. The invite only works once it has reached
// the server, so each waiting invite says whether it has, and offers Send now when it has not.
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
      await Share.share({ message: fmt(t('inv.message'), { code }) });
    } catch {
      // the invite is saved even if the share sheet is dismissed
    }
  };

  const pending = state.invites.filter((i) => i.status === 'pending');
  const unsent = pending.filter((i) => !i.cloud);
  const signedIn = !!state.cloud?.access;
  const failed = !!state.cloud?.inviteFail;
  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.indigoTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph icon={UserPlus} size={22} color={colors.indigo} />
        </View>
        <View style={{ flex: 1 }}>
          <Title style={{ fontSize: 22 }}>{t('inviteTitle')}</Title>
          <Caption>{t('inviteSub')}</Caption>
        </View>
      </View>
      <Field label={t('inviteName')} value={name} onChangeText={setName} />
      <Field label={t('invitePhone')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Caption>{t('inv.sameNumber')}</Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {ROLES.map((r) => (
          <Chip key={r} label={t(`role.${r}`)} active={role === r} onPress={() => setRole(r)} />
        ))}
      </View>
      {error ? <Body style={{ color: colors.brick }}>{t('invalidPhone')}</Body> : null}
      <BigButton icon={Send} label={t('inviteShare')} onPress={send} />
      {pending.length > 0 ? (
        <ListGroup>
          {pending.map((i) => (
            <ListRow
              key={i.id}
              lead={<Avatar name={i.name} role={i.role} />}
              title={i.name}
              subtitle={`${t(`role.${i.role}`)}. ${fmt(t('inv.code'), { code: i.code })}`}
              trailing={<Badge label={i.cloud ? t('inv.sentBadge') : t('invitePending')} tone={i.cloud ? 'leaf' : 'haldi'} />}
              onPress={state.demo ? () => dispatch({ type: 'INVITE_ACCEPT', id: i.id }) : undefined}
              label={t('inviteAcceptSim')}
              chevron={false}
            />
          ))}
        </ListGroup>
      ) : null}
      {unsent.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Body bold style={{ color: colors.madder }}>
            {signedIn ? t('inv.notSent') : t('inv.needSignIn')}
          </Body>
          {signedIn && failed ? <Body style={{ color: colors.madder }}>{t('inv.failed')}</Body> : null}
          {signedIn ? <BigButton kind="quiet" icon={Send} label={t('inv.sendNow')} onPress={requestSync} /> : null}
        </View>
      ) : pending.length > 0 ? (
        <Caption>{t('inv.sent')}</Caption>
      ) : null}
      {pending.length > 0 && state.demo ? <Caption>{t('inv.demoNote')}</Caption> : null}
    </Card>
  );
}
