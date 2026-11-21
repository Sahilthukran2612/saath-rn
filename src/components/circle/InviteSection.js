import React, { useState } from 'react';
import { Share, View } from 'react-native';
import { Send, UserPlus } from '../icons';
import { BigButton, Body, Caption, Card, Chip, Glyph, Title } from '../ui';
import { Avatar, Badge, Field, ListGroup, ListRow } from '../kit';
import { useStore } from '../../state/store';
import { validPhone } from '../../logic';
import { requestSync } from '../../state/useCloudSync';
import { fmt } from '../../circleFeed';
import Sheet from '../Sheet';
import QRCode from 'react-native-qrcode-svg';
import { joinUrl } from '../../joinLink';
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
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState(null); // the invite whose QR is showing
  // A care-giver's scanned card fills the form and opens it, so the person only confirms.
  const card = state.addPrefill;
  const [seenCard, setSeenCard] = useState(null);
  if (card && seenCard !== card) {
    setSeenCard(card);
    setName(card.name);
    setPhone(card.phone);
    setRole(card.role);
    setOpen(true);
  }

  // One step for everything: the person becomes someone Saath calls when an alert goes unanswered (a contact),
  // and gets a code to follow how you are on their own phone (an invite). No second form.
  const send = async () => {
    const digits = String(phone).replace(/\D/g, '').slice(-10);
    if (name.trim().length < 2 || !validPhone(digits)) return setError(true);
    setError(false);
    const code = newCode();
    const id = String(Date.now());
    dispatch({ type: 'CONTACT_ADD', id, name: name.trim(), phone: digits, role });
    dispatch({
      type: 'INVITE_ADD',
      id,
      name: name.trim(),
      phone: digits,
      role,
      code,
      at: Date.now(),
    });
    setName('');
    setPhone('');
    setOpen(false);
    if (state.addPrefill) dispatch({ type: 'ADD_PREFILL', value: null });
    setQr({ name: name.trim(), code });
    try {
      await Share.share({ message: fmt(t(role === 'clinician' ? 'inv.messageDoctor' : 'inv.message'), { code }) });
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
          <Title style={{ fontSize: 22 }}>{t('inv.card')}</Title>
        </View>
      </View>
      {state.members.length === 0 ? <Body bold>{t('ct.empty')}</Body> : null}
      <BigButton icon={UserPlus} label={t('inviteTitle')} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('inviteTitle')}>
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
      </Sheet>
      <Sheet visible={!!qr} onClose={() => setQr(null)} title={t('inv.scan')}>
        {qr ? (
          <View style={{ alignItems: 'center', gap: 14 }}>
            <View style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 16 }}>
              <QRCode value={joinUrl(qr.code)} size={220} />
            </View>
            <Body bold>{fmt(t('inv.scanFor'), { name: qr.name })}</Body>
            <Body style={{ fontSize: 26, letterSpacing: 4 }}>{qr.code}</Body>
          </View>
        ) : null}
      </Sheet>
      {pending.length > 0 ? (
        <ListGroup>
          {pending.map((i) => (
            <ListRow
              key={i.id}
              lead={<Avatar name={i.name} role={i.role} />}
              title={i.name}
              subtitle={`${t(`role.${i.role}`)}. ${fmt(t('inv.code'), { code: i.code })}`}
              trailing={<Badge label={i.cloud ? t('inv.sentBadge') : t('invitePending')} tone={i.cloud ? 'leaf' : 'haldi'} />}
              onPress={() => setQr({ name: i.name, code: i.code })}
              label={t('inv.showQr')}
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
      ) : null}
    </Card>
  );
}
