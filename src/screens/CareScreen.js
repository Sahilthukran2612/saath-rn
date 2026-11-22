import React, { useEffect } from 'react';
import { NoAccess, Screen } from '../components/ui';
import Medicines from '../components/care/Medicines';
import { BudgetCard, StockCard, SugarPromptCard } from '../components/care/CareCards';
import { SHOW_BUDGET, SHOW_HEART } from '../features';
import { AdherenceChart, HeartAnalytics, SugarAnalytics } from '../components/care/CareCharts';
import { useStore } from '../state/store';
import { can } from '../logic';

export default function CareScreen() {
  const { state, dispatch, t } = useStore();
  const allowed = can(state.role, 'viewSummary');

  // One audit entry per meaningful view: the reducer ignores Person and repeated views.
  useEffect(() => {
    if (allowed) dispatch({ type: 'VIEW', viewer: state.role, item: 'Care summary', at: Date.now() });
  }, [allowed, state.role, dispatch]);

  if (!allowed) return <NoAccess title={t('tabCare')} />;
  return (
    <Screen title={t('tabCare')}>
      <Medicines />
      <SugarPromptCard />
      <SugarAnalytics />
      <AdherenceChart />
      {SHOW_HEART ? <HeartAnalytics /> : null}
      <StockCard />
      {SHOW_BUDGET ? <BudgetCard /> : null}
    </Screen>
  );
}
