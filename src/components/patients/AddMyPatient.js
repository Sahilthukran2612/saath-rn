import React, { useState } from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { UserPlus } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import Sheet from '../Sheet';
import { useStore } from '../../state/store';
import { addUrl } from '../../joinLink';

// A care-giver adds someone to look after by showing their own card: the person scans it, confirms once, and shows an
// invite code back. Nobody types a name or number. The card is the care-giver's name, role and sign-in number.
export default function AddMyPatient() {
  const { state, t } = useStore();
  const [open, setOpen] = useState(false);
  const role = state.profile.myRole || 'family';
  const phone = state.cloud.phone || '';
  const ready = phone.length === 10 && (state.profile.name || '').trim().length >= 2;
  return (
    <Card style={{ gap: 12 }}>
      <Body bold>{t(role === 'clinician' ? 'amp.titleDoctor' : 'amp.title')}</Body>
      <BigButton icon={UserPlus} label={t(role === 'clinician' ? 'amp.btnDoctor' : 'amp.btn')} onPress={() => setOpen(true)} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={t(role === 'clinician' ? 'amp.btnDoctor' : 'amp.btn')}>
        {ready ? (
          <View style={{ alignItems: 'center', gap: 14 }}>
            <View style={{ padding: 14, backgroundColor: '#FFFFFF', borderRadius: 16 }}>
              <QRCode value={addUrl({ name: state.profile.name, phone, role })} size={220} />
            </View>
            <Body bold style={{ textAlign: 'center' }}>{t('amp.scan')}</Body>
            <Caption style={{ textAlign: 'center' }}>{t('amp.then')}</Caption>
          </View>
        ) : (
          <Body>{t('amp.needAccount')}</Body>
        )}
      </Sheet>
    </Card>
  );
}
