import CirclesSection from '../components/circle/CirclesSection';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Text from '../components/AppText';
import { Check, ChevronRight, Droplet, ShieldCheck, Wallet, Pill, Siren } from '../components/icons';
import { Body, Caption, Card, Glyph, PressRow, Title, useScale } from '../components/ui';
import {
  Avatar,
  Badge,
  CheckMark,
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
import SuggestionPad from '../components/SuggestionPad';
import Stamp, { StampMark } from '../components/Stamp';
import Perf from '../components/Perf';
import Doodle from '../components/doodles';
import { useStore } from '../state/store';
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
  const person = state.role === 'person' && state.usage !== 'member';
  const total = state.tasks.length;
  const done = state.tasks.filter((x) => x.done).length;
  return (
    <View accessibilityRole="header" style={styles.heroBlue}>
      {/* two soft circles, as in the reference: depth without an image */}
      <View pointerEvents="none" style={[styles.blob, { width: 190, height: 190, right: -50, top: -70 }]} />
      <View pointerEvents="none" style={[styles.blob, { width: 120, height: 120, right: 70, bottom: -60 }]} />
      <Text style={{ fontFamily: fonts.semi, fontSize: 16, lineHeight: 22, color: '#EEF3FF' }}>{date}</Text>
      <Text style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 38, color: colors.white }}>{t(`greet.${key}`)}</Text>
      {person && total > 0 ? (
        <View style={{ gap: 10, marginTop: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 64, lineHeight: 72, color: colors.white }}>{done}</Text>
            <Text style={{ fontFamily: fonts.bold, fontSize: 24, lineHeight: 32, color: '#EEF3FF' }}>{`/ ${total}`}</Text>
            <Text style={{ fontFamily: fonts.semi, fontSize: 18, lineHeight: 26, color: '#EEF3FF', flex: 1 }}>{t('hero.done')}</Text>
          </View>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden' }}>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.white, width: `${(done / total) * 100}%` }} />
          </View>
        </View>
      ) : null}
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

// The first thing on the elder's day: one big slip. "I'm OK" is a leaf-green button the full width; pressing
// it lands the violet stamp with the time, and the day's tasks are counted in tally marks below.
function ImOkHero() {
  const { state, dispatch, t } = useStore();
  const [sentAt, setSentAt] = useState(null);
  const sent = sentAt != null;
  useEffect(() => {
    if (!sent) return undefined;
    const h = setTimeout(() => setSentAt(null), 6000);
    return () => clearTimeout(h);
  }, [sent]);
  const time = sent
    ? new Date(sentAt).toLocaleTimeString(state.lang === 'hi' ? 'hi-IN' : 'en-IN', { hour: 'numeric', minute: '2-digit' })
    : '';
  return (
    <View style={styles.slip}>
      <PressRow
        accessibilityRole="button"
        accessibilityLabel={t('imOk')}
        accessibilityHint={t('imOkHint')}
        haptic={false}
        rippleColor="rgba(255,255,255,0.24)"
        onPress={() => {
          const at = Date.now();
          dispatch({ type: 'CHECK_IN', at });
          speak(t('imOk'), state.lang);
          setSentAt(at);
        }}
        style={styles.imOkButton}
      >
        <Glyph icon={Check} size={44} color={colors.white} strokeWidth={2.8} />
        <Text style={{ fontFamily: fonts.bold, fontSize: 32, lineHeight: 40, color: colors.white }}>{t('imOk')}</Text>
      </PressRow>
      <View style={{ minHeight: sent ? 72 : 0, justifyContent: 'center' }}>
        <Stamp show={sent} word={t('imOk')} sub={time} rotate={-5} />
      </View>
      {sent ? (
        <>
          <Perf />
          <Body bold style={{ color: colors.leafDeep }}>
            {t('sent.ok')}
          </Body>
        </>
      ) : (
        <Caption>{t('imOkHint')}</Caption>
      )}
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
          <Body style={{ color: colors.white }}>{t(`stage.${STAGES[stage]}`)}</Body>
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
        <SuggestionPad />
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
        <SuggestionPad />
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
        <SuggestionPad />
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

const HOUSEHOLDS = [
  { id: 'A', need: 'ph.needA', hot: true },
  { id: 'B', need: 'ph.needB', hot: true },
  { id: 'C', need: 'ph.needC', hot: false },
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
              key={h.id}
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
              title={`${fmt(t('ph.household'), { x: h.id })} (${t('demoData')})`}
              subtitle={t(h.need)}
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
          <Caption>{t('pro.note')}</Caption>
        </Card>
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
      {state.demo ? null : <CirclesSection />}
    </View>
  );
}

// ASHA or clinician outside demo mode: only the households that really added them. No made-up households.
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
      <NeighbourHome />
    );
  else body = state.demo ? <ProHome /> : <RealProHome />;
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
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16 },
  taskDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.outlineVariant },
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
