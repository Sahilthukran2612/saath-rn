import CirclesSection from '../components/circle/CirclesSection';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Check, ChevronRight, Droplet, ShieldCheck, Wallet, Pill, Siren } from '../components/icons';
import { Body, Caption, Card, Glyph, PressRow, Title, useScale } from '../components/ui';
import {
  Avatar,
  Badge,
  CheckMark,
  DyeRing,
  LineChart,
  ListGroup,
  ListRow,
  ProgressRing,
  Stat,
  StageTrack,
} from '../components/kit';
import { Reveal } from '../components/motion';
import { useNav } from '../components/nav';
import { useNow } from '../components/useNow';
import { taskIcon } from '../components/taskIcons';
import RoutineEditor from '../components/RoutineEditor';
import { useStore } from '../state/store';
import { adviceText } from '../i18n/strings';
import { can, glucoseAdvice } from '../logic';
import { budgetSummary, refillStatus } from '../care';
import { overallStage, STAGES } from '../plan';
import { colors, fonts, radii } from '../theme';
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
    <View accessibilityRole="header" style={{ gap: 2 }}>
      <Title style={{ fontSize: 32, letterSpacing: -0.6 }}>{t(`greet.${key}`)}</Title>
      <Caption>{date}</Caption>
    </View>
  );
}

// One row per routine task. The check fills and the tick draws itself when it is done.
function TaskList({ big }) {
  const { state, dispatch, t } = useStore();
  const k = useScale();
  return (
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
  );
}

function TaskRow({ task, big, k, dispatch, state, t, last }) {
  const Icon = taskIcon(task);
  return (
    <PressRow
      accessibilityRole="checkbox"
      accessibilityState={{ checked: task.done }}
      accessibilityLabel={`${task.title}${task.done ? `, ${t('done')}` : ''}`}
      onPress={() => {
        if (!task.done) confirm();
        dispatch({ type: 'TOGGLE_TASK', id: task.id });
        speak(task.title, state.lang);
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
        {task.title}
      </Text>
      <CheckMark done={task.done} size={34} />
    </PressRow>
  );
}

// The memorable thing: a bandhani-style ring with one dot per task, around the "I'm OK" seal.
function ImOkHero() {
  const { state, dispatch, t } = useStore();
  const done = state.tasks.filter((x) => x.done).length;
  const [sent, setSent] = useState(false);
  useEffect(() => {
    if (!sent) return undefined;
    const h = setTimeout(() => setSent(false), 6000);
    return () => clearTimeout(h);
  }, [sent]);
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingVertical: 4 }}>
      <DyeRing total={state.tasks.length} done={done} size={264}>
        <PressRow
          accessibilityRole="button"
          accessibilityLabel={t('imOk')}
          accessibilityHint={t('imOkHint')}
          haptic={false}
          onPress={() => {
            confirm();
            dispatch({ type: 'CHECK_IN', at: Date.now() });
            speak(t('imOk'), state.lang);
            setSent(true);
          }}
          style={styles.seal}
        >
          <Glyph icon={Check} size={48} color={colors.white} strokeWidth={2.6} />
          <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: colors.white, letterSpacing: -0.2 }}>
            {t('imOk')}
          </Text>
        </PressRow>
      </DyeRing>
      <Body bold style={{ color: sent ? colors.leafDeep : colors.inkSoft, textAlign: 'center' }}>
        {sent ? t('sent.ok') : fmt(t('doneOf'), { done, total: state.tasks.length })}
      </Body>
      {!sent && <Caption>{t('imOkHint')}</Caption>}
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
        <View style={styles.hero}>
          <Title style={{ color: colors.white, fontSize: 24 }}>{t('ladder')}</Title>
          <Body style={{ color: colors.indigoSoft }}>{t(`stage.${STAGES[stage]}`)}</Body>
          <StageTrack stage={stage} />
          <PressRow
            accessibilityRole="button"
            accessibilityLabel={t('sec.ladder')}
            onPress={() => go('plan')}
            style={styles.heroLink}
          >
            <Text style={{ fontFamily: fonts.semi, fontSize: 17, color: colors.white }}>
              {t('sec.ladder')}
            </Text>
            <Glyph icon={ChevronRight} size={20} color={colors.white} />
          </PressRow>
        </View>
      </Reveal>
      <Reveal index={2}>
        <Body bold>{t('privacyDial')}</Body>
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
  const real = state.readings.filter((r) => !r.demo);
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
            {last?.demo ? <Badge label={t('demoData')} tone="haldi" /> : null}
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
            <LineChart
              values={shown.slice(-8).map((r) => r.mgdl)}
              width={300}
              height={96}
              label={t('sugarLog')}
            />
          ) : null}
          <Body>{adviceText(state.lang, advice.level)}</Body>
        </View>
      </Reveal>
      <Reveal index={2}>
        <View style={styles.statRow}>
          <Stat
            value={refill.daysLeft ?? '–'}
            label={`${t('refill')}: ${t('daysLeft')}`}
            color={refill.level === 'now' ? colors.madder : colors.indigo}
          />
          <Stat value={state.testPlan.strips} label={t('stripsLeft')} />
          <Stat value={`₹${spend.thisMonth}`} label={t('spend')} />
        </View>
        <View style={{ height: 8 }} />
        <ListGroup>
          <ListRow
            icon={Pill}
            title={t('refillTitle')}
            subtitle={`${state.meds.name}`}
            onPress={() => go('care')}
          />
          <ListRow icon={Wallet} title={t('budgetTitle')} onPress={() => go('care')} />
        </ListGroup>
      </Reveal>
      <Reveal index={3}>
        <TaskList />
      </Reveal>
    </>
  );
}

function PersonHome() {
  const { state } = useStore();
  if (state.mode === 'teen') return <TeenHome />;
  if (state.mode === 'adult') return <AdultHome />;
  return (
    <>
      <Reveal index={1}>
        <ImOkHero />
      </Reveal>
      <Reveal index={2}>
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
              title={task.title}
              trailing={<CheckMark done={task.done} size={28} />}
            />
          ))}
        </ListGroup>
      </Reveal>
    </>
  );
}

const HOUSEHOLDS = [
  { name: 'Household A', need: 'Missed medicine 2 days', hot: true },
  { name: 'Household B', need: 'Refill due in 3 days', hot: true },
  { name: 'Household C', need: 'Stable', hot: false },
];

function ProHome() {
  const { state, t } = useStore();
  return (
    <>
      <Reveal index={1}>
        <Body bold>{t('householdsRanked')}</Body>
        <View style={{ height: 8 }} />
        <ListGroup>
          {HOUSEHOLDS.map((h, i) => (
            <ListRow
              key={h.name}
              lead={
                <View style={[styles.rank, { backgroundColor: h.hot ? colors.haldiTint : colors.leafTint }]}>
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 18,
                      color: h.hot ? colors.haldiDeep : colors.leafDeep,
                    }}
                  >
                    {i + 1}
                  </Text>
                </View>
              }
              title={`${h.name} (${t('demoData')})`}
              subtitle={h.need}
              trailing={<Badge label={h.hot ? t('rankNeed') : t('rankOk')} tone={h.hot ? 'haldi' : 'leaf'} />}
            />
          ))}
        </ListGroup>
      </Reveal>
      <Reveal index={2}>
        <Card tone="tint">
          <Title style={{ fontSize: 22 }}>{t('onePage')}</Title>
          <Body>
            {can(state.role, 'viewSummary')
              ? fmt(t('doneOf'), {
                  done: state.tasks.filter((x) => x.done).length,
                  total: state.tasks.length,
                })
              : t('noAccess')}
          </Body>
          <Caption>{t('clinicianPlan')}</Caption>
        </Card>
      </Reveal>
    </>
  );
}

// The home of someone who looks after a person: who they look after and what role they have, then the list.
function MemberHome() {
  const { state, t } = useStore();
  return (
    <View style={{ gap: 14 }}>
      {state.circles.length === 0 ? (
        <Card tone="haldi" style={{ gap: 6 }}>
          <Body bold>{t('mh.empty')}</Body>
          <Caption style={{ color: colors.ink }}>{t('mo.noCode')}</Caption>
        </Card>
      ) : (
        state.circles.map((c) => (
          <Caption key={c.household_id}>
            {t('mh.line').replace('{name}', c.person_name || t('cf.someone')).replace('{role}', t(`role.${c.role}`))}
          </Caption>
        ))
      )}
      <CirclesSection />
    </View>
  );
}

export default function TodayScreen() {
  const { state, t } = useStore();
  if (state.usage === 'member')
    return (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18 }}>
        <Greeting />
        <MemberHome />
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
      <Card tone="tint" style={{ alignItems: 'center', paddingVertical: 28 }}>
        <Glyph icon={ShieldCheck} size={44} color={colors.indigo} />
        <Body bold style={{ textAlign: 'center' }}>
          {t('safetyOnlyView')}
        </Body>
      </Card>
    );
  else body = <ProHome />;
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18 }}
    >
      <Greeting />
      {body}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16 },
  taskDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  taskIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  seal: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.leaf,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    shadowColor: colors.leafDeep,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  hero: { backgroundColor: colors.indigo, borderRadius: radii.hero, padding: 22, gap: 10 },
  heroLink: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', minHeight: 44 },
  heroLight: {
    backgroundColor: colors.white,
    borderRadius: radii.hero,
    padding: 22,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
  },
  statRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 4 },
  rank: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
