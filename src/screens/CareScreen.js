import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Lock } from '../components/icons';
import { Body, Caption, Card, Glyph, Title } from '../components/ui';
import { Reveal } from '../components/motion';
import Medicines from '../components/care/Medicines';
import { BudgetCard, GlucoseCard, StockCard, SugarPromptCard } from '../components/care/CareCards';
import { useStore } from '../state/store';
import { can } from '../logic';
import { colors } from '../theme';

export default function CareScreen() {
  const { state, dispatch, t } = useStore();
  const allowed = can(state.role, 'viewSummary');

  // One audit entry per meaningful view: the reducer ignores Person and repeated views.
  useEffect(() => {
    if (allowed) dispatch({ type: 'VIEW', viewer: state.role, item: 'Care summary', at: Date.now() });
  }, [allowed, state.role, dispatch]);

  if (!allowed) {
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
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 16 }}
    >
      <View style={{ gap: 2 }}>
        <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t('tabCare')}</Title>
        <Caption>{t('careSub')}</Caption>
      </View>
      <Reveal index={0}>
        <Medicines />
      </Reveal>
      <Reveal index={0}>
        <SugarPromptCard />
      </Reveal>
      <Reveal index={1}>
        <GlucoseCard />
      </Reveal>
      <Reveal index={2}>
        <StockCard />
      </Reveal>
      <Reveal index={3}>
        <BudgetCard />
      </Reveal>
    </ScrollView>
  );
}
