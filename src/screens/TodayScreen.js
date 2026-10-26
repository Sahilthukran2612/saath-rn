import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { BigButton, Body, Card, PressRow, Title, useScale } from '../components/ui';
import { useStore } from '../state/store';
import RoutineEditor from '../components/RoutineEditor';
import { glucoseAdvice, can } from '../logic';
import { colors, shadow, sizes } from '../theme';
import { speak } from '../services/voice';

function TaskList({ big }) {
  const { state, dispatch, t } = useStore();
  const k = useScale();
  return (
    <View style={{ gap: 10 }}>
      {state.tasks.map((task) => (
        <PressRow
          key={task.id}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: task.done }}
          accessibilityLabel={`${task.title}${task.done ? `, ${t('done')}` : ''}`}
          onPress={() => {
            dispatch({ type: 'TOGGLE_TASK', id: task.id });
            speak(task.title, state.lang);
          }}
          style={{
            minHeight: big ? 80 : 56,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: sizes.radius,
            backgroundColor: task.done ? colors.leaf : colors.white,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: task.done ? colors.leaf : colors.line,
            ...shadow.card,
          }}
        >
          <Body style={{ fontSize: (big ? 34 : 26) * k }}>{task.icon}</Body>
          <Body
            bold
            style={{
              flexShrink: 1,
              color: task.done ? colors.white : colors.ink,
              fontSize: (big ? 26 : 18) * k,
            }}
          >
            {task.title}
          </Body>
        </PressRow>
      ))}
    </View>
  );
}

const DemoNote = () => {
  const { state, t } = useStore();
  return state.demo ? <Body style={{ color: colors.indigo }}>{t('demoBanner')}</Body> : null;
};

function PersonHome() {
  const { state, dispatch, t } = useStore();
  const last = state.readings[state.readings.length - 1];
  if (state.mode === 'elder') {
    return (
      <>
        <BigButton
          kind="ok"
          icon="✅"
          label={t('imOk')}
          hint={t('imOkHint')}
          style={{ minHeight: 110 }}
          onPress={() => {
            dispatch({ type: 'ACTIVITY', at: Date.now() });
            speak(t('imOk'), state.lang);
          }}
        />
        <Body>{t('imOkHint')}</Body>
        <TaskList big />
      </>
    );
  }
  if (state.mode === 'teen') {
    return (
      <>
        <Card>
          <Title>{t('ladder')}</Title>
          <Body bold>{t('ladderNow')}</Body>
          <Body>① Parent does ② Together ③ You, with backup ④ Independent</Body>
        </Card>
        <Card>
          <Body bold>{t('privacyDial')}</Body>
          <Body>{state.members.map((m) => `${m.name}: ${t(`dial${m.dial}`)}`).join('\n')}</Body>
        </Card>
        <TaskList />
      </>
    );
  }
  const advice = glucoseAdvice(last?.mgdl);
  return (
    <>
      <Card>
        <Title>{t('sugarPlan')}</Title>
        <Body bold>{last ? `${last.mgdl} mg/dL` : '—'}</Body>
        <Body>{advice.text}</Body>
      </Card>
      <Card>
        <Body bold>
          {t('refill')}: 12 {t('daysLeft')}
        </Body>
        <Body>{t('spend')}: ₹ 640</Body>
        <DemoNote />
      </Card>
      <TaskList />
    </>
  );
}

function FamilyHome() {
  const { state, t } = useStore();
  const done = state.tasks.filter((x) => x.done).length;
  return (
    <Card>
      <Title>{t('statusGlance')}</Title>
      <Body>
        {done}/{state.tasks.length} {t('done')}
      </Body>
      <Body>
        {t('lastOk')}: {state.lastActiveMs ? new Date(state.lastActiveMs).toLocaleTimeString() : '—'}
      </Body>
      <Body bold style={{ color: state.alert ? colors.brick : colors.leaf }}>
        {state.alert ? t('areYouOk') : '✓'}
      </Body>
    </Card>
  );
}

const HOUSEHOLDS = [
  { name: 'Household A (demo)', need: 'Missed medicine 2 days' },
  { name: 'Household B (demo)', need: 'Refill due in 3 days' },
  { name: 'Household C (demo)', need: 'Stable' },
];

function ProHome() {
  const { state, t } = useStore();
  return (
    <>
      <Card>
        <Title>{t('householdsRanked')}</Title>
        {HOUSEHOLDS.map((h, i) => (
          <Body key={h.name}>
            {i + 1}. {h.name}: {h.need}
          </Body>
        ))}
        <DemoNote />
      </Card>
      <Card>
        <Title>{t('onePage')}</Title>
        <Body>
          {can(state.role, 'viewSummary')
            ? `${state.tasks.filter((x) => x.done).length}/${state.tasks.length} ${t('done')}`
            : t('noAccess')}
        </Body>
        <Body>{t('clinicianPlan')}</Body>
      </Card>
    </>
  );
}

export default function TodayScreen() {
  const { state, t } = useStore();
  let body;
  if (state.role === 'person')
    body = (
      <>
        {state.phase !== 'stable' && (
          <Card>
            <Body bold>{t(state.phase === 'new' ? 'guidanceNew' : 'guidanceCrisis')}</Body>
          </Card>
        )}
        <PersonHome />
        <RoutineEditor />
      </>
    );
  else if (state.role === 'family') body = <FamilyHome />;
  else if (state.role === 'neighbour')
    body = (
      <Card>
        <Body>{t('safetyOnlyView')}</Body>
      </Card>
    );
  else body = <ProHome />;
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, gap: 14 }}>
      <Title>{t('tabToday')}</Title>
      {body}
    </ScrollView>
  );
}
