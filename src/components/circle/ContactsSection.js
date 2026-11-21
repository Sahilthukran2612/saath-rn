import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Card } from '../ui';
import { useStore } from '../../state/store';
import ContactsForm from './ContactsForm';

// "Emergency contacts" on the Circle tab (the person's own view): who Saath reaches, in what order, and the
// form to add someone. Removing a contact is on each person's row in the list above.
export default function ContactsSection() {
  const { state, t } = useStore();
  const real = state.members;
  return (
    <Card style={{ gap: 12 }}>
      <Body bold>{t('ct.title')}</Body>
      <Caption>{t('ct.note')}</Caption>
      {real.length === 0 ? <Body bold>{t('ct.empty')}</Body> : null}
      <View>
        <ContactsForm />
      </View>
    </Card>
  );
}