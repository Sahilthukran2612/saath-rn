import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Droplet,
  Info,
  Minus,
  Package,
  Pill,
  Plus,
  Route,
  Syringe,
  TrendingDown,
  TrendingUp,
  Utensils,
  Wallet,
} from '../icons';
import { BigButton, Body, Caption, Card, Chip, Glyph, Title } from '../ui';
import { Badge, Field, LineChart, ListGroup, ListRow, Stat, SectionTitle } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { adviceText } from '../../i18n/strings';
import { can, glucoseAdvice } from '../../logic';
import {
  budgetSummary,
  glucoseTrend,
  lowSugarPrompt,
  refillStatus,
  stripsPlan,
  CLINICIAN_NOTE,
} from '../../care';
import Doodle from '../doodles';
import { colors, fonts, radii } from '../../theme';

const TREND_KEY = { up: 'trendUp', down: 'trendDown', steady: 'trendSteady' };
const LEVEL_KEY = { now: 'refillNow', soon: 'refillSoon', ok: 'refillOk' };
const LEVEL_COLOR = { ok: colors.leaf, soon: colors.haldi, now: colors.madder, unknown: colors.inkFaint };

// Each card heading carries a ballpoint doodle of its subject instead of an icon in a tinted square.
const HEAD_DOODLE = new Map([
  [Droplet, 'drop'],
  [Info, 'note'],
  [Pill, 'strip'],
  [Package, 'strip'],
  [Wallet, 'note'],
  [Route, 'steps'],
  [Utensils, 'plate'],
]);

function CardHead({ icon, title, right }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Doodle name={HEAD_DOODLE.get(icon) || 'note'} size={44} />
      <View style={{ flex: 1 }}>
        <Title style={{ fontSize: 22 }}>{title}</Title>
      </View>
      {right}
    </View>
  );
}
// A thin bar. Colour supports the number printed beside it; it is never the only signal.
function Bar({ value, max, color }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0));
  return (
    <View style={styles.barTrack} accessible={false}>
      <View
        style={[
          styles.barFill,
          { width: `${Math.max(pct * 100, pct > 0 ? 4 : 0)}%`, backgroundColor: color },
        ]}
      />
    </View>
  );
}

export function GlucoseCard() {
  const { state, dispatch, t } = useStore();
  const [text, setText] = useState('');
  const [w, setW] = useState(280);
  const last = state.readings[state.readings.length - 1];
  const trend = glucoseTrend(state.readings);
  const canLog = can(state.role, 'logReading');
  const submit = () => {
    const v = parseInt(text, 10);
    if (!Number.isNaN(v) && v > 0 && v < 700) {
      dispatch({ type: 'ADD_READING', id: String(Date.now()), mgdl: v, at: Date.now() });
      setText('');
    }
  };
  const TrendIcon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  return (
    <Card style={{ gap: 14 }}>
      <CardHead
        icon={Droplet}
        title={t('sugarLog')}
        right={last?.demo ? <Badge label={t('demoData')} tone="haldi" /> : null}
      />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 56,
            lineHeight: 62,
            letterSpacing: -1.6,
            color: colors.indigo,
          }}
        >
          {last ? last.mgdl : '–'}
        </Text>
        <Caption style={{ paddingBottom: 12 }}>mg/dL</Caption>
        <View style={{ flex: 1 }} />
        {trend.count > 1 ? (
          <View style={styles.trendPill}>
            <Glyph icon={TrendIcon} size={18} color={colors.indigo} />
            <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: colors.indigo }}>
              {t(TREND_KEY[trend.direction])}
            </Text>
          </View>
        ) : null}
      </View>
      {trend.count > 1 ? (
        <Caption>
          {t('average')}: {trend.avg}
        </Caption>
      ) : null}
      <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
        <LineChart
          values={state.readings.slice(-8).map((r) => r.mgdl)}
          width={w}
          height={110}
          label={t('sugarLog')}
        />
      </View>
      <Body>{adviceText(state.lang, glucoseAdvice(last?.mgdl).level)}</Body>
      {canLog ? (
        <>
          <Field
            label={t('addReading')}
            value={text}
            onChangeText={setText}
            keyboardType="number-pad"
            placeholder="mg/dL"
          />
          <BigButton icon={Plus} label={t('addReading')} onPress={submit} />
        </>
      ) : null}
    </Card>
  );
}

// Rule-based prompt from what was logged. The phone cannot sense sugar. No dose anywhere.
export function SugarPromptCard() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const canLog = can(state.role, 'logReading');
  const lastReadingAt = state.readings.length ? state.readings[state.readings.length - 1].at : null;
  const p = lowSugarPrompt({ ...state.careEvents, lastReadingAt, nowMs: now });
  const stepKey = (s) =>
    s.startsWith('Have sugar')
      ? 'step.sugar'
      : s.startsWith('Check your sugar again')
        ? 'step.recheck'
        : s.startsWith('If you still')
          ? 'step.call'
          : 'step.night';
  return (
    <>
      {p ? (
        <Card tone="haldi" style={{ gap: 12 }}>
          <CardHead
            icon={Info}
            bg={colors.white}
            color={colors.haldiDeep}
            title={t(`prompt.${p.id}.title`)}
          />
          {p.steps.map((s, i) => (
            <View key={s} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={styles.stepNum}>
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: colors.haldiDeep }}>{i + 1}</Text>
              </View>
              <Body style={{ flex: 1 }}>{t(stepKey(s))}</Body>
            </View>
          ))}
          <Body bold>{state.lang === 'hi' ? t('clinicianPlan') : CLINICIAN_NOTE}</Body>
        </Card>
      ) : null}
      {canLog ? (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <BigButton
                kind="quiet"
                icon={Syringe}
                label={t('insulinTaken')}
                onPress={() => dispatch({ type: 'LOG_INSULIN', at: Date.now() })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <BigButton
                kind="quiet"
                icon={Utensils}
                label={t('ateMeal')}
                onPress={() => dispatch({ type: 'LOG_MEAL', at: Date.now() })}
              />
            </View>
          </View>
          <Caption style={{ textAlign: 'center' }}>{t('insulinNote')}</Caption>
        </View>
      ) : null}
    </>
  );
}

export function StockCard() {
  const { state, dispatch, t } = useStore();
  const canEdit = can(state.role, 'logReading');
  const refill = refillStatus(state.meds);
  const strips = stripsPlan(state.testPlan);
  return (
    <Card style={{ gap: 18 }}>
      <CardHead
        icon={Pill}
        title={t('refillTitle')}
        right={
          <Badge
            label={t(LEVEL_KEY[refill.level] ?? 'refillOk')}
            tone={refill.level === 'now' ? 'brick' : refill.level === 'soon' ? 'haldi' : 'leaf'}
          />
        }
      />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 36, color: colors.indigo, letterSpacing: -0.8 }}>
            {refill.daysLeft ?? '–'}
          </Text>
          <Body>{t('daysLeft')}</Body>
        </View>
        <Bar value={refill.daysLeft ?? 0} max={30} color={LEVEL_COLOR[refill.level]} />
        <Caption>
          {state.meds.name}: {state.meds.pillsLeft} {t('pillsLeft')}
        </Caption>
        {canEdit ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip
              label="−10"
              onPress={() => dispatch({ type: 'MEDS_SET', pillsLeft: state.meds.pillsLeft - 10 })}
            />
            <Chip
              label="+30"
              onPress={() => dispatch({ type: 'MEDS_SET', pillsLeft: state.meds.pillsLeft + 30 })}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.rule} />
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 36, color: colors.indigo, letterSpacing: -0.8 }}>
            {state.testPlan.strips}
          </Text>
          <Body>{t('stripsLeft')}</Body>
        </View>
        <Bar value={strips.daysLeft ?? 0} max={30} color={LEVEL_COLOR[strips.level]} />
        <Caption>
          {strips.daysLeft ?? '–'} {t('daysLeft')}
        </Caption>
        <Caption>
          {t('testPlan')}: {state.testPlan.perDay}
        </Caption>
        {canEdit ? (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Chip
              label="−5"
              onPress={() => dispatch({ type: 'STRIPS_SET', strips: state.testPlan.strips - 5 })}
            />
            <Chip
              label="+25"
              onPress={() => dispatch({ type: 'STRIPS_SET', strips: state.testPlan.strips + 25 })}
            />
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const CATS = [
  ['medicine', Pill, colors.indigo],
  ['strips', Droplet, colors.haldi],
  ['travel', Route, colors.leaf],
  ['other', Package, colors.inkFaint],
];

export function BudgetCard() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState('medicine');
  const s = budgetSummary(state.budget, now);
  const canEdit = can(state.role, 'logReading');
  const add = () => {
    const v = parseInt(amount, 10);
    if (!Number.isNaN(v) && v > 0 && v < 100000) {
      dispatch({ type: 'BUDGET_ADD', id: String(Date.now()), amount: v, cat, at: Date.now() });
      setAmount('');
    }
  };
  return (
    <Card style={{ gap: 14 }}>
      <CardHead
        icon={Wallet}
        title={t('budgetTitle')}
        right={state.budget.some((b) => b.demo) ? <Badge label={t('demoData')} tone="haldi" /> : null}
      />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Stat value={`₹${s.thisMonth}`} label={t('thisMonth')} />
        <Stat value={`₹${s.lastMonth}`} label={t('lastMonth')} color={colors.inkSoft} />
        <View style={styles.trendPill}>
          <Glyph
            icon={s.trend === 'up' ? TrendingUp : s.trend === 'down' ? TrendingDown : Minus}
            size={18}
            color={colors.indigo}
          />
          <Text style={{ fontFamily: fonts.semi, fontSize: 16, color: colors.indigo }}>
            {t(TREND_KEY[s.trend])}
          </Text>
        </View>
      </View>
      {s.thisMonth > 0 ? (
        <>
          <View style={styles.stack} accessible={false}>
            {CATS.filter(([id]) => s.byCat[id]).map(([id, , color]) => (
              <View key={id} style={{ flex: s.byCat[id], backgroundColor: color }} />
            ))}
          </View>
          {CATS.filter(([id]) => s.byCat[id]).map(([id, Icon, color]) => (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.swatch, { backgroundColor: color }]} />
              <Glyph icon={Icon} size={18} color={colors.inkSoft} />
              <Body style={{ flex: 1 }}>{t(`cat_${id}`)}</Body>
              <Body bold>₹{s.byCat[id]}</Body>
            </View>
          ))}
        </>
      ) : null}
      {s.tipIds.length > 0 ? (
        <View style={{ gap: 8 }}>
          <SectionTitle>{t('savingTips')}</SectionTitle>
          <ListGroup>
            {s.tipIds.map((id) => (
              <ListRow
                key={id}
                icon={Info}
                iconBg={colors.haldiTint}
                iconColor={colors.haldiDeep}
                title={t(`tip.${id}`)}
              />
            ))}
          </ListGroup>
        </View>
      ) : null}
      {canEdit ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {CATS.map(([id, Icon]) => (
              <Chip
                key={id}
                label={t(`cat_${id}`)}
                icon={Icon}
                active={cat === id}
                onPress={() => setCat(id)}
              />
            ))}
          </View>
          <Field label={t('amount')} value={amount} onChangeText={setAmount} keyboardType="number-pad" />
          <BigButton icon={Plus} label={t('budgetAdd')} onPress={add} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  tile: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.indigoTint,
    borderRadius: radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  stepNum: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: colors.indigoTint, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5 },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line },
  stack: { flexDirection: 'row', height: 14, borderRadius: 7, overflow: 'hidden', gap: 2 },
  swatch: { width: 12, height: 12, borderRadius: 6 },
});
