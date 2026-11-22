import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import { Droplet, Pill, ShieldCheck, Siren, Route } from '../components/icons';
import { Body, Caption, Card, Glyph, PressRow, Screen, Title, useScale } from '../components/ui';
import { CheckMark, ListGroup, ListRow, ProgressRing, SectionTitle } from '../components/kit';
import { useNav } from '../components/nav';
import { useNow } from '../components/useNow';
import { taskIcon } from '../components/taskIcons';
import RoutineEditor, { Reminders } from '../components/RoutineEditor';
import SuggestionPad from '../components/SuggestionPad';
import { MedicinesNow } from '../components/care/Medicines';
import PlanNotice from '../components/care/PlanNotice';
import PatientsHome from '../components/patients/PatientsHome';
import CirclesSection from '../components/circle/CirclesSection';
import { StampMark } from '../components/Stamp';
import OkRing from '../components/OkRing';
import Doodle from '../components/doodles';
import { useStore } from '../state/store';
import { looksAfterOthers } from '../who';
import { adviceText, fmt } from '../i18n/strings';
import { glucoseAdvice } from '../logic';
import { overallStage, STAGES } from '../plan';
import { taskLabel } from '../taskLabel';
import { colors, fonts, radii } from '../theme';
import { speak } from '../services/voice';
import { confirm } from '../services/haptics';

// The large title greets the person; the date sits under it.
function useGreeting() {
  const { state, t } = useStore();
  const now = useNow();
  const d = new Date(now);
  const h = d.getHours();
  const key = h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'night';
  const date = d.toLocaleDateString(state.lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return { title: t(`greet.${key}`), date };
}

// The day's routine. Each row is a checkbox: the check fills and the tick draws itself when it is done.
// Editing lives behind the Edit button, so the list stays a list.
function TaskList({ big }) {
  const { state, dispatch, t } = useStore();
  const k = useScale();
  const [editing, setEditing] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      <View style={styles.sectionRow}>
        <View style={{ flex: 1 }}>
          <SectionTitle>{t('tasks.title')}</SectionTitle>
        </View>
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('editRoutine')}
          onPress={() => setEditing(true)}
          style={styles.edit}
        >
          <Text style={{ fontFamily: fonts.regular, fontSize: 18, color: colors.indigo }}>{t('edit')}</Text>
        </PressRow>
      </View>
      <ListGroup>
        {state.tasks.map((task, i) => (
          <TaskRow
            key={task.id}
            task={task}
            big={big}
            k={k}
            dispatch={dispatch}
            state={state}
            t={t}
            last={i === state.tasks.length - 1}
          />
        ))}
      </ListGroup>
      <Reminders />
      <RoutineEditor visible={editing} onClose={() => setEditing(false)} />
    </View>
  );
}

function TaskRow({ task, big, k, dispatch, state, t, last }) {
  const Icon = taskIcon(task);
  return (
    <PressRow
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.done }}
      accessibilityLabel={`${taskLabel(task, t)}${task.done ? `, ${t('done')}` : ''}`}
      onPress={() => {
        if (!task.done) confirm();
        dispatch({ type: 'TOGGLE_TASK', id: task.id });
        speak(taskLabel(task, t), state.lang);
      }}
      haptic={false}
      style={[styles.taskRow, { minHeight: big ? 76 : 64 }, !last && styles.taskDivider]}
    >
      <View style={[styles.taskIcon, { backgroundColor: task.done ? colors.leafTint : colors.indigoTint }]}>
        <Glyph
          icon={Icon}
          size={22 * Math.min(k, 1.15)}
          color={task.done ? colors.leafDeep : colors.indigo}
          strokeWidth={2.2}
        />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.regular,
          fontSize: (big ? 21 : 18) * k,
          lineHeight: (big ? 21 : 18) * k * 1.34,
          color: task.done ? colors.inkSoft : colors.ink,
          textDecorationLine: task.done ? 'line-through' : 'none',
        }}
      >
        {taskLabel(task, t)}
      </Text>
      <CheckMark done={task.done} size={32} />
    </PressRow>
  );
}

// One row that points to the mode's own tab: a teen's handover ladder, an adult's last sugar reading.
function ModeRow() {
  const { state, t } = useStore();
  const go = useNav();
  if (state.mode === 'teen') {
    const stage = overallStage(state.ladder);
    return (
      <ListGroup>
        <ListRow
          icon={Route}
          title={t('ladder')}
          subtitle={t(`stage.${STAGES[stage]}`)}
          onPress={() => go('plan')}
          chevron
        />
      </ListGroup>
    );
  }
  if (state.mode === 'adult') {
    const last = state.readings[state.readings.length - 1];
    return (
      <ListGroup>
        <ListRow
          icon={Droplet}
          iconBg={colors.haldiTint}
          iconColor={colors.haldiDeep}
          title={last ? `${last.mgdl} mg/dL` : t('noReading')}
          subtitle={last ? adviceText(state.lang, glucoseAdvice(last.mgdl).level) : t('sugarPlan')}
          onPress={() => go('care')}
          chevron
        />
      </ListGroup>
    );
  }
  return null;
}

// The patient's Today: the I'm OK ring, what needs attention now, one row for the mode, then the routine.
function PersonHome() {
  const { state, t } = useStore();
  return (
    <>
      {state.phase !== 'stable' ? (
        <Card tone="haldi">
          <Body>{t(state.phase === 'new' ? 'guidanceNew' : 'guidanceCrisis')}</Body>
        </Card>
      ) : null}
      <OkRing />
      <PlanNotice />
      <MedicinesNow />
      <SuggestionPad />
      <ModeRow />
      <TaskList big={state.mode === 'elder'} />
    </>
  );
}

// A family member on a shared phone: how the day is going, read only.
function FamilyHome() {
  const { state, t } = useStore();
  const done = state.tasks.filter((x) => x.done).length;
  const total = Math.max(state.tasks.length, 1);
  return (
    <>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ProgressRing
          size={88}
          stroke={9}
          progress={done / total}
          color={state.alert ? colors.brick : colors.leaf}
        >
          <Glyph
            icon={state.alert ? Siren : ShieldCheck}
            size={30}
            color={state.alert ? colors.brick : colors.leafDeep}
          />
        </ProgressRing>
        <View style={{ flex: 1, gap: 2 }}>
          <Title>{state.alert ? t('statusAlert') : t('statusOk')}</Title>
          <Body soft>{fmt(t('doneOf'), { done, total: state.tasks.length })}</Body>
          <Caption>
            {t('lastOk')}: {state.lastActiveMs ? new Date(state.lastActiveMs).toLocaleTimeString() : '—'}
          </Caption>
        </View>
      </Card>
      <ListGroup>
        {state.tasks.map((task) => (
          <ListRow
            key={task.id}
            icon={taskIcon(task)}
            iconBg={task.done ? colors.leafTint : colors.indigoTint}
            iconColor={task.done ? colors.leafDeep : colors.indigo}
            title={taskLabel(task, t)}
            trailing={task.done ? <StampMark word={t('sg.stamped')} /> : <CheckMark done={false} size={28} />}
          />
        ))}
      </ListGroup>
    </>
  );
}

// The neighbour: what they get, what they are asked to do, and what they never see.
function NeighbourHome() {
  const { t } = useStore();
  return (
    <>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Doodle name="phone" size={64} />
        <Title style={{ flex: 1 }}>{t('nb.title')}</Title>
      </Card>
      <ListGroup>
        <ListRow icon={ShieldCheck} title={t('nb.get')} subtitle={t('nb.getSub')} />
        <ListRow icon={Siren} title={t('nb.do')} subtitle={t('nb.doSub')} />
        <ListRow icon={Pill} title={t('nb.never')} subtitle={t('nb.neverSub')} />
      </ListGroup>
      <CirclesSection />
    </>
  );
}

// ASHA or clinician on a shared phone: only the households that really added them.
function ProHome() {
  const { state, t } = useStore();
  return (
    <>
      {state.circles.length === 0 ? (
        <Card style={{ alignItems: 'center', gap: 10, paddingVertical: 28 }}>
          <Doodle name="people" size={96} />
          <Body bold style={{ textAlign: 'center' }}>
            {t('mh.empty')}
          </Body>
          <Caption style={{ textAlign: 'center' }}>{t('mo.noCode')}</Caption>
        </Card>
      ) : null}
      <CirclesSection />
    </>
  );
}

export default function TodayScreen() {
  const { state } = useStore();
  const { title, date } = useGreeting();
  if (looksAfterOthers(state)) return <PatientsHome title={title} subtitle={date} />;
  const body =
    state.role === 'person' ? (
      <PersonHome />
    ) : state.role === 'family' ? (
      <FamilyHome />
    ) : state.role === 'neighbour' ? (
      <NeighbourHome />
    ) : (
      <ProHome />
    );
  return (
    <Screen title={title} subtitle={date}>
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'flex-end' },
  edit: { minHeight: 48, paddingHorizontal: 8, justifyContent: 'center', borderRadius: radii.md },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.paper,
  },
  taskDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
  taskIcon: { width: 40, height: 40, borderRadius: radii.sm, alignItems: 'center', justifyContent: 'center' },
});
