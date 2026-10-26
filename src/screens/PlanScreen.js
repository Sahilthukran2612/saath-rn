import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { BigButton, Body, Title } from '../components/ui';
import { LadderSection, PassportSection, VisitSection } from '../components/plan/Handover';
import { BodySection, CheckinSection, FoodSection, SchoolSection } from '../components/plan/Wellbeing';
import { useStore } from '../state/store';

const SECTIONS = {
  ladder: { icon: '🪜', Comp: LadderSection, teenOnly: true },
  visit: { icon: '🩺', Comp: VisitSection },
  passport: { icon: '🪪', Comp: PassportSection },
  checkin: { icon: '🙂', Comp: CheckinSection },
  food: { icon: '🍛', Comp: FoodSection },
  body: { icon: '🦶', Comp: BodySection },
  school: { icon: '🎒', Comp: SchoolSection, teenOnly: true },
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
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
        <Body>{t('noAccess')}</Body>
      </ScrollView>
    );
  }
  const Comp = viewing ? SECTIONS[viewing].Comp : null;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{viewing ? t(`sec.${viewing}`) : t('tabPlan')}</Title>
      {viewing ? (
        <>
          <BigButton kind="quiet" label={t('back')} onPress={() => setOpen(null)} />
          <Comp />
        </>
      ) : (
        ids.map((id) => (
          <BigButton
            key={id}
            kind="quiet"
            icon={SECTIONS[id].icon}
            label={t(`sec.${id}`)}
            onPress={() => setOpen(id)}
          />
        ))
      )}
    </ScrollView>
  );
}
