import CirclesSection from '../components/circle/CirclesSection';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import { ChevronRight, Droplet, ShieldCheck, Wallet, Pill, Siren } from '../components/icons';
import { Body, Caption, Card, Glyph, PressRow, Title, useScale } from '../components/ui';
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
import { Reveal } from '../components/motion';
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
import { adviceText } from '../i18n/strings';
import { can, glucoseAdvice } from '../logic';
import { budgetSummary, refillStatus } from '../care';
import { overallStage, STAGES } from '../plan';
import { taskLabel } from '../taskLabel';
import { colors, fonts, radii, shadow } from '../theme';
import { speak } from '../services/voice';
import { confirm } from '../services/haptics';

const fmt = (s, vars) => Object.entries(vars).reduce((acc, [k, v]) => acc.replace(`{${k}}`, String(v)), s);

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
      {/* two soft circles, as in the reference: depth without an image */}
      <View pointerEvents="none" style={[styles.blob, { width: 190, height: 190, right: -50, top: -70 }]} />
      <View pointerEvents="none" style={[styles.blob, { width: 120, height: 120, right: 70, bottom: -60 }]} />
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, lineHeight: 22, color: '#EEF3FF' }}>{date}</Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.white }}>{t(`greet.${key}`)}</Text>
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
          index={i}
        />
      ))}
    </ListGroup>
    </View>
  );
}

const TILE_KINDS = ['Blue', 'Violet', 'Orange', 'Teal', 'Pink'];

function TaskRow({ task, big, k, dispatch, state, t, last, index = 0 }) {
  const Icon = taskIcon(task);
  const kind = TILE_KINDS[index % TILE_KINDS.length];
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
      <View style={[styles.taskIcon, { backgroundColor: task.done ? colors.leafTint : colors[`tile${kind}`] }]}>
        <Glyph
          icon={Icon}
          size={24 * Math.min(k, 1.15)}
          color={task.done ? colors.leafDeep : colors[`tile${kind}Fg`]}
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
      <Reveal index={1}>
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
            <Text style={{ fontFamily: fonts.semi, fontSize: 17, color: colors.indigo }}>{t('sec.ladder')}</Text>
            <Glyph icon={ChevronRight} size={20} color={colors.indigo} />
          </PressRow>
        </Card>
      </Reveal>
      <Reveal index={2}>
        <TodayNudges />
      </Reveal>
      <Reveal index={2}>
        <SectionTitle>{t('privacyDial')}</SectionTitle>
        <View style={{ height: 8 }} />
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
      </Reveal>
      <Reveal index={3}>
        <TaskList />
      </Reveal>
    </>
  );
}

function AdultHome() {
  const { state, t } = useStore();
  const go = useNav();
  const now = useNow();
  const real = state.readings;
  const shown = real.length ? real : state.readings;
  const last = shown[shown.length - 1];
  const advice = glucoseAdvice(last?.mgdl);
  const refill = refillStatus(state.meds);
  const spend = budgetSummary(state.budget, now);
  return (
    <>
      <Reveal index={1}>
        <View style={styles.heroLight}>
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
        </View>
      </Reveal>
      <Reveal index={2}>
        <TodayNudges />
      </Reveal>
      <Reveal index={2}>
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
      </Reveal>
      <Reveal index={3}>
        <TaskList />
      </Reveal>
    </>
  );
}

// Every patient mode starts with the same card: the I'm OK button inside the day's progress ring.
function PersonHome() {
  const { state } = useStore();
  const ok = (
    <Reveal index={1}>
      <OkRing />
    </Reveal>
  );
  if (state.mode === 'teen')
    return (
      <>
        {ok}
        <TeenHome />
      </>
    );
  if (state.mode === 'adult')
    return (
      <>
        {ok}
        <AdultHome />
      </>
    );
  return (
    <>
      {ok}
      <Reveal index={2}>
        <TodayNudges />
      </Reveal>
      <Reveal index={3}>
        <TaskList big />
      </Reveal>
    </>
  );
}

function FamilyHome() {
  const { state, t } = useStore();
  const done = state.tasks.filter((x) => x.done).length;
  const total = Math.max(state.tasks.length, 1);
  return (
    <>
      <Reveal index={1}>
        <View style={[styles.heroLight, { flexDirection: 'row', alignItems: 'center', gap: 18 }]}>
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
            <Title style={{ fontSize: 24 }}>{state.alert ? t('statusAlert') : t('statusOk')}</Title>
            <Body>{fmt(t('doneOf'), { done, total: state.tasks.length })}</Body>
            <Caption>
              {t('lastOk')}: {state.lastActiveMs ? new Date(state.lastActiveMs).toLocaleTimeString() : '—'}
            </Caption>
          </View>
        </View>
      </Reveal>
      <Reveal index={2}>
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
      </Reveal>
    </>
  );
}

// The neighbour's home: what they get, what they are asked to do, and what they never see.
function NeighbourHome() {
  const { state, t } = useStore();
  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.slip, { gap: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Doodle name="phone" size={64} />
          <View style={{ flex: 1, gap: 4 }}>
            <Title style={{ fontSize: 24 }}>{t('nb.title')}</Title>
          </View>
        </View>
        <Perf />
        <ListGroup>
          <ListRow icon={ShieldCheck} title={t('nb.get')} subtitle={t('nb.getSub')} />
          <ListRow icon={Siren} title={t('nb.do')} subtitle={t('nb.doSub')} />
          <ListRow icon={Pill} title={t('nb.never')} subtitle={t('nb.neverSub')} last />
        </ListGroup>
      </View>
      <CirclesSection />
    </View>
  );
}

// ASHA or clinician: only the households that really added them. No made-up households.
function RealProHome() {
  const { state, t } = useStore();
  return (
    <View style={{ gap: 14 }}>
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
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 128, gap: 18 }}>
        <PatientsHome />
      </ScrollView>
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
  else if (state.role === 'neighbour')
    body = (
      <NeighbourHome />
    );
  else body = <RealProHome />;
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, paddingBottom: 128, gap: 18 }}
    >
      <Greeting />
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  taskDivider: { borderBottomWidth: 1, borderBottomColor: colors.line },
  taskIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  slip: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: 16,
    gap: 12,
    ...shadow.card,
  },
  heroBlue: {
    backgroundColor: colors.indigo,
    borderRadius: radii.xl,
    padding: 22,
    gap: 4,
    overflow: 'hidden',
  },
  blob: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  imOkButton: {
    minHeight: 96,
    borderRadius: radii.pill,
    backgroundColor: colors.leaf,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },  hero: { backgroundColor: colors.indigo, borderRadius: radii.md, padding: 24, gap: 10 },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 48 },
  heroLight: {
    backgroundColor: colors.paper,
    borderRadius: radii.lg,
    padding: 20,
    gap: 8,
    ...shadow.card,
  },
  statRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 4 },
  rank: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
