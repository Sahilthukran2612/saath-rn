import React from 'react';
import { BigButton, Body, Caption, Card, Title } from '../ui';
import { useStore } from '../../state/store';

// Shown on Today when a clinician has changed the plan: who set it, and how much changed. One tap marks it seen.
// The plan has already been applied by then: this tells the person, it does not ask.
export default function PlanNotice() {
  const { state, dispatch, t } = useStore();
  const p = state.carePlan;
  if (!p || p.seen || state.alert) return null;
  return (
    <Card tone="tint" style={{ gap: 8 }}>
      <Title style={{ fontSize: 20 }}>{t('plan.updated').replace('{who}', p.author)}</Title>
      <Body>{t('plan.what').replace('{meds}', String(p.meds)).replace('{tasks}', String(p.tasks))}</Body>
      {p.notes ? <Body bold>{p.notes}</Body> : null}
      <Caption>{t('plan.check')}</Caption>
      <BigButton kind="quiet" label={t('plan.gotIt')} onPress={() => dispatch({ type: 'PLAN_SEEN' })} />
    </Card>
  );
}
