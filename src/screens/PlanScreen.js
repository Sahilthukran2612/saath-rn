import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  Backpack,
  Footprints,
  Heart,
  HeartHandshake,
  IdCard,
  Lock,
  Salad,
  Stethoscope,
} from '../components/icons';
import { Body, Caption, Card, Glyph, PressRow, Title } from '../components/ui';
import { ScreenHeader } from '../components/kit';
import { Reveal } from '../components/motion';
import { LadderSection, PassportSection, VisitSection } from '../components/plan/Handover';
import { BodySection, CheckinSection, FoodSection, SchoolSection } from '../components/plan/Wellbeing';
import { useStore } from '../state/store';
import { colors, fonts, radii } from '../theme';

const SECTIONS = {
  ladder: { icon: HeartHandshake, tone: [colors.indigo, colors.white], Comp: LadderSection, teenOnly: true },
  visit: { icon: Stethoscope, tone: [colors.indigoTint, colors.indigo], Comp: VisitSection },
  passport: { icon: IdCard, tone: [colors.haldiTint, colors.haldiDeep], Comp: PassportSection },
  checkin: { icon: Heart, tone: [colors.leafTint, colors.leafDeep], Comp: CheckinSection },
  food: { icon: Salad, tone: [colors.leafTint, colors.leafDeep], Comp: FoodSection },
  body: { icon: Footprints, tone: [colors.indigoTint, colors.indigo], Comp: BodySection },
  school: { icon: Backpack, tone: [colors.haldiTint, colors.haldiDeep], Comp: SchoolSection, teenOnly: true },
};

// The person sees every section. A family member sees only the ladder, to agree or say "not yet".
export default function PlanScreen() {
  const { state, dispatch, t } = useStore();
  const [open, setOpen] = useState(null);
  const isPerson = state.role === 'person';
  const isFamily = state.role === 'family';
  const ids = Object.keys(SECTIONS).filter((id) => {
    if (SECTIONS[id].teenOnly && state.mode !== 'teen') return false;
    if (isPerson) return true;
    return isFamily && id === 'ladder';
  });
  const viewing = open && ids.includes(open) ? open : null;

  useEffect(() => {
    if (viewing && !isPerson)
      dispatch({ type: 'VIEW', viewer: state.role, item: t(`sec.${viewing}`), at: Date.now() });
  }, [viewing, isPerson, state.role, dispatch, t]);

  if (ids.length === 0) {
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8 }}>
        <Card tone="tint" style={{ alignItems: 'center', paddingVertical: 32, gap: 12 }}>
          <Glyph icon={Lock} size={40} color={colors.indigo} />
          <Body bold style={{ textAlign: 'center' }}>
            {t('noAccess')}
          </Body>
        </Card>
      </ScrollView>
    );
  }
  const Comp = viewing ? SECTIONS[viewing].Comp : null;
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }}
    >
      {viewing ? (
        <>
          <ScreenHeader title={t(`sec.${viewing}`)} onBack={() => setOpen(null)} backLabel={t('back')} />
          <Reveal key={viewing}>
            <Comp />
          </Reveal>
        </>
      ) : (
        <>
          <View style={{ gap: 2 }}>
            <Title style={{ fontSize: 32 }}>{t('tabPlan')}</Title>
            <Caption>{t('planSub')}</Caption>
          </View>
          <View style={styles.grid}>
            {ids.map((id, i) => {
              const [bg, fg] = SECTIONS[id].tone;
              return (
                <Reveal key={id} index={i} style={styles.cell}>
                  <PressRow
                    accessibilityRole="button"
                    accessibilityLabel={t(`sec.${id}`)}
                    onPress={() => setOpen(id)}
                    style={[styles.tile, { backgroundColor: bg }]}
                  >
                    <Glyph icon={SECTIONS[id].icon} size={32} color={fg} strokeWidth={1.8} />
                    <Text style={{ fontFamily: fonts.bold, fontSize: 19, lineHeight: 24, color: fg }}>
                      {t(`sec.${id}`)}
                    </Text>
                  </PressRow>
                </Reveal>
              );
            })}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: { width: '48%', flexGrow: 1 },
  tile: { minHeight: 132, borderRadius: radii.xl, padding: 20, justifyContent: 'space-between', gap: 14 },
});
