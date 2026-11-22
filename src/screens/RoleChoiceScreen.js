import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Glyph, PressRow, Screen, ScreenTitle, Title } from '../components/ui';
import { Stethoscope } from '../components/icons';
import Doodle from '../components/doodles';
import { Segmented } from '../components/kit';
import { SaathMark } from '../components/art';
import { useStore } from '../state/store';
import { colors, radii, shadow } from '../theme';

// The first question, because it decides everything after it: do I need care, or do I look after someone?
// A person gets the setup for their own safety. Someone invited as family, neighbour, ASHA or clinician gets
// their own setup: an account, then the code the person sent. They are different people with different phones.
function Choice({ doodle, icon, title, note, onPress }) {
  return (
    <PressRow
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        backgroundColor: colors.paper,
        borderRadius: radii.lg,
        padding: 20,
        gap: 8,
        ...shadow.card,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {icon ? (
          <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Glyph icon={icon} size={52} color={colors.indigo} strokeWidth={2.2} />
          </View>
        ) : (
          <Doodle name={doodle} size={64} />
        )}
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
    <Screen setup>
      <SaathMark size={56} />
      <ScreenTitle>{t('rc.title')}</ScreenTitle>
      <Segmented
        value={state.lang}
        onChange={(v) => dispatch({ type: 'SET', key: 'lang', value: v })}
        options={[
          { value: 'en', label: 'English' },
          { value: 'hi', label: 'हिन्दी' },
        ]}
      />
      <Choice
        doodle="walker"
        title={t('rc.person')}
        note={t('rc.personNote')}
        onPress={() => pick('person')}
      />
      <Choice
        doodle="phone"
        title={t('rc.member')}
        note={t('rc.memberNote')}
        onPress={() => pick('member')}
      />
      <Choice
        icon={Stethoscope}
        title={t('rc.doctor')}
        note={t('rc.doctorNote')}
        onPress={() => pick('doctor')}
      />
      <Caption>{t('rc.change')}</Caption>
    </Screen>
  );
}
