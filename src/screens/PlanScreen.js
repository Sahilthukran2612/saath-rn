import React, { useEffect, useState } from 'react';
import Doodle from '../components/doodles';
import { NoAccess, Screen, ScreenTitle } from '../components/ui';
import { ListGroup, ListRow, ScreenHeader } from '../components/kit';
import { Reveal } from '../components/motion';
import { LadderSection, PassportSection, VisitSection } from '../components/plan/Handover';
import { BodySection, CheckinSection, FoodSection, SchoolSection } from '../components/plan/Wellbeing';
import { useStore } from '../state/store';

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

  if (ids.length === 0) return <NoAccess />;
  const Comp = viewing ? SECTIONS[viewing].Comp : null;
  return (
    <Screen>
      {viewing ? (
        <>
          <ScreenHeader title={t(`sec.${viewing}`)} onBack={() => setOpen(null)} backLabel={t('back')} />
          <Reveal key={viewing}>
            <Comp />
          </Reveal>
        </>
      ) : (
        <>
          <ScreenTitle>{t('tabPlan')}</ScreenTitle>
          <ListGroup>
            {ids.map((id) => (
              <ListRow
                key={id}
                lead={<Doodle name={SECTIONS[id].doodle} size={40} />}
                title={t(`sec.${id}`)}
                chevron
                onPress={() => setOpen(id)}
              />
            ))}
          </ListGroup>
        </>
      )}
    </Screen>
  );
}
