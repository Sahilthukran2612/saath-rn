import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import Doodle from '../components/doodles';
import { NoAccess, PressRow, Screen, useScale } from '../components/ui';
import { Push } from '../components/motion';
import { LadderSection, PassportSection, VisitSection } from '../components/plan/Handover';
import { BodySection, CheckinSection, FoodSection, SchoolSection } from '../components/plan/Wellbeing';
import { useStore } from '../state/store';
import { colors, fonts, radii } from '../theme';

// Each section has its own picture and a colour that belongs to its subject: blue for the doctor and papers,
// violet for how you feel, green for food and movement.
const SECTIONS = {
  ladder: { doodle: 'steps', Comp: LadderSection, teenOnly: true, tone: 'indigo' },
  visit: { doodle: 'calendar', Comp: VisitSection, tone: 'indigo' },
  passport: { doodle: 'note', Comp: PassportSection, tone: 'indigo' },
  checkin: { doodle: 'face', Comp: CheckinSection, tone: 'stamp' },
  food: { doodle: 'plate', Comp: FoodSection, tone: 'leaf' },
  body: { doodle: 'foot', Comp: BodySection, tone: 'leaf' },
  school: { doodle: 'stretch', Comp: SchoolSection, teenOnly: true, tone: 'leaf' },
};

function Tile({ id, onPress }) {
  const { t } = useStore();
  const k = useScale();
  const s = SECTIONS[id];
  return (
    <PressRow
      accessibilityRole="button"
      accessibilityLabel={t(`sec.${id}`)}
      onPress={onPress}
      containerStyle={styles.tileWrap}
      style={styles.tile}
    >
      <Doodle name={s.doodle} size={64} color={colors[s.tone]} />
      <Text
        style={{
          fontFamily: fonts.semi,
          fontSize: 18 * Math.min(k, 1.2),
          lineHeight: 24 * Math.min(k, 1.2),
          color: colors.ink,
        }}
      >
        {t(`sec.${id}`)}
      </Text>
    </PressRow>
  );
}

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

  if (ids.length === 0) return <NoAccess title={t('tabPlan')} />;
  if (viewing) {
    const Comp = SECTIONS[viewing].Comp;
    return (
      <Push key={viewing}>
        <Screen title={t(`sec.${viewing}`)} onBack={() => setOpen(null)} backLabel={t('tabPlan')}>
          <Comp />
        </Screen>
      </Push>
    );
  }
  return (
    <Screen title={t('tabPlan')}>
      <View style={styles.grid}>
        {ids.map((id) => (
          <Tile key={id} id={id} onPress={() => setOpen(id)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tileWrap: { width: '48%', flexGrow: 1 },
  tile: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    minHeight: 148,
    justifyContent: 'space-between',
  },
});
