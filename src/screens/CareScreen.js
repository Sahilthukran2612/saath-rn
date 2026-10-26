import React, { useEffect } from 'react';
import { ScrollView } from 'react-native';
import { Body, Title } from '../components/ui';
import { BudgetCard, GlucoseCard, StockCard, SugarPromptCard } from '../components/care/CareCards';
import { useStore } from '../state/store';
import { can } from '../logic';

export default function CareScreen() {
  const { state, dispatch, t } = useStore();
  const allowed = can(state.role, 'viewSummary');

  // One audit entry per meaningful view: the reducer ignores Person and repeated views.
  useEffect(() => {
    if (allowed) dispatch({ type: 'VIEW', viewer: state.role, item: 'Care summary', at: Date.now() });
  }, [allowed, state.role, dispatch]);

  if (!allowed) {
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16 }}>
        <Body>{t('noAccess')}</Body>
      </ScrollView>
    );
  }
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('tabCare')}</Title>
      <SugarPromptCard />
      <GlucoseCard />
      <StockCard />
      <BudgetCard />
    </ScrollView>
  );
}
