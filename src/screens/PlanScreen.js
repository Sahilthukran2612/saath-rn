import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Lock } from '../components/icons';
import Doodle from '../components/doodles';
import { Body, Caption, Card, Glyph, Title } from '../components/ui';
import { ListGroup, ListRow, ScreenHeader } from '../components/kit';
import { Reveal } from '../components/motion';
import { LadderSection, PassportSection, VisitSection } from '../components/plan/Handover';
import { BodySection, CheckinSection, FoodSection, SchoolSection } from '../components/plan/Wellbeing';
import { useStore } from '../state/store';
import { colors } from '../theme';

const TILE_KINDS = ['Blue', 'Violet', 'Orange', 'Teal', 'Pink'];

const SECTIONS = {
  ladder: { doodle: 'steps', Comp: LadderSection, teenOnly: true },
  visit: { doodle: 'note', Comp: VisitSection },
  passport: { doodle: 'strip', Comp: PassportSection },
  checkin: { doodle: 'face', Comp: CheckinSection },
  food: { doodle: 'plate', Comp: FoodSection },
  body: { doodle: 'foot', Comp: BodySection },
  school: { doodle: 'stretch', Comp: SchoolSection, teenOnly: true },
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
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 128 }}>
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
      contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 128, gap: 16 }}
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
          <ListGroup>
            {ids.map((id, i) => (
              <ListRow
                key={id}
                lead={
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors[`tile${TILE_KINDS[i % TILE_KINDS.length]}`],
                    }}
                  >
                    <Doodle name={SECTIONS[id].doodle} size={34} color={colors[`tile${TILE_KINDS[i % TILE_KINDS.length]}Fg`]} />
                  </View>
                }
                title={t(`sec.${id}`)}
                chevron
                onPress={() => setOpen(id)}
              />
            ))}
          </ListGroup>
        </>
      )}
    </ScrollView>
  );
}
