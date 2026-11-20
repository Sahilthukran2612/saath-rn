import React from 'react';
import { ScrollView, View } from 'react-native';
import { Body, Caption, PressRow, Title } from '../components/ui';
import Doodle from '../components/doodles';
import { Segmented } from '../components/kit';
import { SaathMark } from '../components/art';
import { useStore } from '../state/store';
import { colors, radii } from '../theme';

// The first question, because it decides everything after it: do I need care, or do I look after someone?
// A person gets the setup for their own safety. Someone invited as family, neighbour, ASHA or clinician gets
// their own setup: an account, then the code the person sent. They are different people with different phones.
function Choice({ doodle, title, note, onPress }) {
  return (
    <PressRow
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        backgroundColor: colors.paper,
        borderWidth: 1.5,
        borderColor: colors.indigo,
        borderRadius: radii.md,
        padding: 20,
        gap: 8,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Doodle name={doodle} size={64} />
        <Title style={{ fontSize: 22, flex: 1 }}>{title}</Title>
      </View>
      <Body>{note}</Body>
    </PressRow>
  );
}

export default function RoleChoiceScreen() {
  const { state, dispatch, t } = useStore();
  const pick = (usage) => dispatch({ type: 'SET', key: 'usage', value: usage });
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: 32, gap: 18 }}>
      <SaathMark size={56} />
      <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t('rc.title')}</Title>
      <Segmented
        value={state.lang}
        onChange={(v) => dispatch({ type: 'SET', key: 'lang', value: v })}
        options={[
          { value: 'en', label: 'English' },
          { value: 'hi', label: 'हिन्दी' },
        ]}
      />
      <Choice doodle="walker" title={t('rc.person')} note={t('rc.personNote')} onPress={() => pick('person')} />
      <Choice doodle="phone" title={t('rc.member')} note={t('rc.memberNote')} onPress={() => pick('member')} />
      <Caption>{t('rc.change')}</Caption>
    </ScrollView>
  );
}