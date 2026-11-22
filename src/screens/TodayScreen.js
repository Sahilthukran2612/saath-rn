import React from 'react';
import { StyleSheet, View } from 'react-native';
import CirclesSection from '../components/circle/CirclesSection';
import Text from '../components/AppText';
import { ChevronRight, Droplet, ShieldCheck, Wallet, Pill, Siren } from '../components/icons';
import { Body, Caption, Card, Glyph, PressRow, Screen, Title, useScale } from '../components/ui';
import {
  Avatar,
  Badge,
  CheckMark,
  FitLineChart,
  ListGroup,
  ListRow,
  ProgressRing,
  SectionTitle,
  Stat,
  FitStageTrack,
} from '../components/kit';
import { useNav } from '../components/nav';
import { useNow } from '../components/useNow';
import { taskIcon } from '../components/taskIcons';
import RoutineEditor from '../components/RoutineEditor';
import SuggestionPad from '../components/SuggestionPad';
import { MedicinesNow } from '../components/care/Medicines';
import PlanNotice from '../components/care/PlanNotice';
import PatientsHome from '../components/patients/PatientsHome';
import { StampMark } from '../components/Stamp';
import Perf from '../components/Perf';
import OkRing from '../components/OkRing';
import Doodle from '../components/doodles';
import { useStore } from '../state/store';
import { looksAfterOthers } from '../who';
import { SHOW_BUDGET } from '../features';
import { adviceText, fmt } from '../i18n/strings';
import { glucoseAdvice } from '../logic';
import { budgetSummary, refillStatus } from '../care';
import { overallStage, STAGES } from '../plan';
import { taskLabel } from '../taskLabel';
import { colors, fonts, radii, sizes } from '../theme';
import { speak } from '../services/voice';
import { confirm } from '../services/haptics';

function Greeting() {
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
  return (
    <View accessibilityRole="header" style={styles.heroBlue}>
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, lineHeight: 22, color: '#EEF3FF' }}>{date}</Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.white }}>
        {t(`greet.${key}`)}
      </Text>
    </View>
  );
}

// One row per routine task. The check fills and the tick draws itself when it is done.
function TaskList({ big }) {
  const { state, dispatch, t } = useStore();
  const k = useScale();
  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{t('tasks.title')}</SectionTitle>
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
      style={[styles.taskRow, { minHeight: big ? 84 : 68 }, !last && styles.taskDivider]}
    >
      <View style={[styles.taskIcon, { backgroundColor: task.done ? colors.leafTint : colors.indigoTint }]}>
        <Glyph
          icon={Icon}
          size={24 * Math.min(k, 1.15)}
          color={task.done ? colors.leafDeep : colors.indigo}
        />
      </View>
      <Text
        style={{
          flex: 1,
          fontFamily: fonts.bold,
          fontSize: (big ? 22 : 18) * k,
          lineHeight: (big ? 22 : 18) * k * 1.3,
          color: task.done ? colors.inkSoft : colors.ink,
        }}
      >
        {taskLabel(task, t)}
      </Text>
      <CheckMark done={task.done} size={34} />
    </PressRow>
  );
}

// What needs attention now, as one stack with an even gap: a plan the doctor changed, medicines due, today's slips.
function TodayNudges() {
  return (
    <View style={{ gap: 16 }}>
      <PlanNotice />
      <MedicinesNow />
      <SuggestionPad />
    </View>
  );
}
function TeenHome() {
  const { state, t } = useStore();
  const go = useNav();
  const stage = overallStage(state.ladder);
  return (
    <>
      <Card style={{ gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Title style={{ fontSize: 22 }}>{t('ladder')}</Title>
          <Badge tone="indigo" label={t(`stage.${STAGES[stage]}`)} />
        </View>
        <FitStageTrack stage={stage} onDark={false} />
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('sec.ladder')}
          onPress={() => go('plan')}
          style={styles.heroLink}
        >
          <Text style={{ fontFamily: fonts.semi, fontSize: 17, color: colors.indigo }}>
            {t('sec.ladder')}
          </Text>
          <Glyph icon={ChevronRight} size={20} color={colors.indigo} />
        </PressRow>
      </Card>
      <TodayNudges />
      <View style={{ gap: 8 }}>
        <SectionTitle>{t('privacyDial')}</SectionTitle>
        <ListGroup>
          {state.members.map((m) => (
            <ListRow
              key={m.id}
              lead={<Avatar name={m.name} role={m.role} />}
              title={m.name}
              trailing={
                <Badge
                  label={t(`dial${m.dial}`)}
                  tone={m.dial === 2 ? 'indigo' : m.dial === 1 ? 'leaf' : 'haldi'}
                />
              }
            />
          ))}
        </ListGroup>
      </View>
      <TaskList />
    </>
  );
}

function AdultHome() {
  const { state, t } = useStore();
  const go = useNav();
  const now = useNow();
  const shown = state.readings;
  const last = shown[shown.length - 1];
  const advice = glucoseAdvice(last?.mgdl);
  const refill = refillStatus(state.meds);
  const spend = budgetSummary(state.budget, now);
  return (
    <>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Glyph icon={Droplet} size={22} color={colors.indigo} />
          <Body bold>{t('sugarPlan')}</Body>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 54,
              lineHeight: 60,
              letterSpacing: -1.5,
              color: colors.indigo,
            }}
          >
            {last ? last.mgdl : '–'}
          </Text>
          <Caption style={{ paddingBottom: 10 }}>mg/dL</Caption>
        </View>
        <Caption>{last ? t('lastReading') : t('noReading')}</Caption>
        {shown.length > 1 ? (
          <FitLineChart values={shown.slice(-8).map((r) => r.mgdl)} height={96} label={t('sugarLog')} />
        ) : null}
        <Body>{adviceText(state.lang, advice.level)}</Body>
      </Card>
      <TodayNudges />
      <View style={{ gap: 12 }}>
        <Card>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Stat
              value={refill.daysLeft ?? '–'}
              label={t('daysLeft')}
              color={refill.level === 'now' ? colors.madder : colors.indigo}
            />
            <Stat value={state.testPlan.strips} label={t('stripsLeft')} />
            {SHOW_BUDGET ? <Stat value={`₹${spend.thisMonth}`} label={t('spend')} /> : null}
          </View>
        </Card>
        <ListGroup>
          <ListRow
            icon={Pill}
            title={t('refillTitle')}
            subtitle={`${state.meds.name}`}
            onPress={() => go('care')}
          />
          {SHOW_BUDGET ? <ListRow icon={Wallet} title={t('budgetTitle')} onPress={() => go('care')} /> : null}
        </ListGroup>
      </View>
      <TaskList />
    </>
  );
}

// Every patient mode starts with the same card: the I'm OK button inside the day's progress ring.
function PersonHome() {
  const { state } = useStore();
  return (
    <>
      <OkRing />
      {state.mode === 'teen' ? (
        <TeenHome />
      ) : state.mode === 'adult' ? (
        <AdultHome />
      ) : (
        <>
          <TodayNudges />
          <TaskList big />
        </>
      )}
    </>
  );
}

function FamilyHome() {
  const { state, t } = useStore();
  const done = state.tasks.filter((x) => x.done).length;
  const total = Math.max(state.tasks.length, 1);
  return (
    <>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
        <ProgressRing
          size={96}
          stroke={10}
          progress={done / total}
          color={state.alert ? colors.brick : colors.leaf}
        >
          <Glyph
            icon={state.alert ? Siren : ShieldCheck}
            size={34}
            color={state.alert ? colors.brick : colors.leafDeep}
          />
        </ProgressRing>
        <View style={{ flex: 1, gap: 2 }}>
          <Title style={{ fontSize: 22 }}>{state.alert ? t('statusAlert') : t('statusOk')}</Title>
          <Body>{fmt(t('doneOf'), { done, total: state.tasks.length })}</Body>
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

// The neighbour's home: what they get, what they are asked to do, and what they never see.
function NeighbourHome() {
  const { t } = useStore();
  return (
    <View style={{ gap: 16 }}>
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Doodle name="phone" size={64} />
          <Title style={{ flex: 1, fontSize: 22 }}>{t('nb.title')}</Title>
        </View>
        <Perf />
        <ListGroup>
          <ListRow icon={ShieldCheck} title={t('nb.get')} subtitle={t('nb.getSub')} />
          <ListRow icon={Siren} title={t('nb.do')} subtitle={t('nb.doSub')} />
          <ListRow icon={Pill} title={t('nb.never')} subtitle={t('nb.neverSub')} last />
        </ListGroup>
      </Card>
      <CirclesSection />
    </View>
  );
}

// ASHA or clinician: only the households that really added them. No made-up households.
function RealProHome() {
  const { state, t } = useStore();
  return (
    <View style={{ gap: 16 }}>
      {state.circles.length === 0 ? (
        <Card tone="haldi" style={{ gap: 6 }}>
          <Body bold>{t('mh.empty')}</Body>
          <Caption style={{ color: colors.ink }}>{t('mo.noCode')}</Caption>
        </Card>
      ) : null}
      <CirclesSection />
    </View>
  );
}

export default function TodayScreen() {
  const { state, t } = useStore();
  if (looksAfterOthers(state))
    return (
      <Screen>
        <PatientsHome />
      </Screen>
    );
  let body;
  if (state.role === 'person')
    body = (
      <>
        {state.phase !== 'stable' && (
          <Card tone="haldi">
            <Body bold>{t(state.phase === 'new' ? 'guidanceNew' : 'guidanceCrisis')}</Body>
          </Card>
        )}
        <PersonHome />
        <RoutineEditor />
      </>
    );
  else if (state.role === 'family') body = <FamilyHome />;
  else if (state.role === 'neighbour') body = <NeighbourHome />;
  else body = <RealProHome />;
  return (
    <Screen>
      <Greeting />
      {body}
    </Screen>
  );
}

const styles = StyleSheet.create({
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  taskDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  taskIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroBlue: { backgroundColor: colors.indigo, borderRadius: radii.xl, padding: 22, gap: 4 },
  heroLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    minHeight: sizes.target,
  },
});
