import React from 'react';
import { View } from 'react-native';
import { Caption, Glyph, PressRow, Screen, Title, useScale } from '../components/ui';
import Text from '../components/AppText';
import { ChevronRight, Stethoscope } from '../components/icons';
import Doodle from '../components/doodles';
import { Segmented } from '../components/kit';
import { useStore } from '../state/store';
import { colors, fonts, radii } from '../theme';

// The first question, because it decides everything after it: do I need care, or do I look after someone?
// A person gets the setup for their own safety. Someone invited as family, neighbour, ASHA or clinician gets
// their own setup: an account, then the code the person sent. They are different people with different phones.
function Choice({ lead, title, note, onPress }) {
  const k = useScale();
  return (
    <PressRow
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={{
        backgroundColor: colors.paper,
        borderRadius: radii.lg,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
      }}
    >
      {lead}
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            fontFamily: fonts.semi,
            fontSize: 19 * Math.min(k, 1.2),
            lineHeight: 25 * Math.min(k, 1.2),
            color: colors.ink,
          }}
        >
          {title}
        </Text>
        <Caption>{note}</Caption>
      </View>
      <Glyph icon={ChevronRight} size={20} color={colors.control} strokeWidth={2.4} />
    </PressRow>
  );
}

export default function RoleChoiceScreen() {
  const { state, dispatch, t } = useStore();
  const pick = (usage) => dispatch({ type: 'SET', key: 'usage', value: usage });
  return (
    <Screen setup>
      <View style={{ alignItems: 'center', gap: 12, paddingTop: 16, paddingBottom: 8 }}>
        <Doodle name="people" size={132} />
        <Title style={{ fontSize: 30, textAlign: 'center' }}>{t('rc.title')}</Title>
      </View>
      <Segmented
        value={state.lang}
        onChange={(v) => dispatch({ type: 'SET', key: 'lang', value: v })}
        options={[
          { value: 'en', label: 'English' },
          { value: 'hi', label: 'हिन्दी' },
        ]}
      />
      <View style={{ gap: 12 }}>
        <Choice
          lead={<Doodle name="heart" size={56} color={colors.leaf} />}
          title={t('rc.person')}
          note={t('rc.personNote')}
          onPress={() => pick('person')}
        />
        <Choice
          lead={<Doodle name="people" size={56} />}
          title={t('rc.member')}
          note={t('rc.memberNote')}
          onPress={() => pick('member')}
        />
        <Choice
          lead={
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: colors.stampTint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Glyph icon={Stethoscope} size={28} color={colors.stamp} strokeWidth={2.2} />
            </View>
          }
          title={t('rc.doctor')}
          note={t('rc.doctorNote')}
          onPress={() => pick('doctor')}
        />
      </View>
      <Caption style={{ textAlign: 'center' }}>{t('rc.change')}</Caption>
    </Screen>
  );
}
