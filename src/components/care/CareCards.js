import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { BigButton, Body, Card, Chip, Title, useScale } from '../ui';
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
import { colors } from '../../theme';

const field = {
  minHeight: 56,
  fontSize: 20,
  borderWidth: 2,
  borderColor: colors.indigo,
  borderRadius: 12,
  paddingHorizontal: 12,
  backgroundColor: colors.white,
};
const TREND_KEY = { up: 'trendUp', down: 'trendDown', steady: 'trendSteady' };
const LEVEL_KEY = { now: 'refillNow', soon: 'refillSoon', ok: 'refillOk' };

// Number plus a word on every bar: meaning is never colour only. Brick is not used here.
function TrendChart({ readings }) {
  const k = useScale();
  const last = readings.slice(-8);
  if (last.length < 2) return null;
  const max = Math.max(...last.map((r) => r.mgdl), 200);
  return (
    <View
      style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 120 }}
      accessibilityLabel="Sugar trend"
    >
      {last.map((r) => {
        const out = r.mgdl < 70 || r.mgdl > 250;
        return (
          <View key={r.id} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
            <Body style={{ fontSize: 12 * k }}>{r.mgdl}</Body>
            <View
              style={{
                width: '100%',
                height: (r.mgdl / max) * 80,
                backgroundColor: out ? colors.haldi : colors.leaf,
                borderRadius: 4,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}

export function GlucoseCard() {
  const { state, dispatch, t } = useStore();
  const [text, setText] = useState('');
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
  return (
    <Card>
      <Title>{t('sugarLog')}</Title>
      <Body bold>{last ? `${last.mgdl} mg/dL${last.demo ? ` (${t('demoData')})` : ''}` : '—'}</Body>
      {trend.count > 1 && (
        <Body>
          {t(TREND_KEY[trend.direction])} · {t('average')}: {trend.avg}
        </Body>
      )}
      <Body>{adviceText(state.lang, glucoseAdvice(last?.mgdl).level)}</Body>
      <TrendChart readings={state.readings} />
      {canLog && (
        <>
          <TextInput
            accessibilityLabel={t('addReading')}
            keyboardType="number-pad"
            value={text}
            onChangeText={setText}
            placeholder="mg/dL"
            style={field}
          />
          <BigButton label={t('addReading')} onPress={submit} />
        </>
      )}
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
      {p && (
        <Card style={{ borderColor: colors.haldi, borderWidth: 3 }}>
          <Title>{t(`prompt.${p.id}.title`)}</Title>
          {p.steps.map((s, i) => (
            <Body key={s}>
              {i + 1}. {t(stepKey(s))}
            </Body>
          ))}
          <Body bold>{state.lang === 'hi' ? t('clinicianPlan') : CLINICIAN_NOTE}</Body>
        </Card>
      )}
      {canLog && (
        <Card>
          <BigButton
            kind="quiet"
            icon="💉"
            label={t('insulinTaken')}
            onPress={() => dispatch({ type: 'LOG_INSULIN', at: Date.now() })}
          />
          <BigButton
            kind="quiet"
            icon="🍚"
            label={t('ateMeal')}
            onPress={() => dispatch({ type: 'LOG_MEAL', at: Date.now() })}
          />
          <Body>{t('insulinNote')}</Body>
        </Card>
      )}
    </>
  );
}

export function StockCard() {
  const { state, dispatch, t } = useStore();
  const canEdit = can(state.role, 'logReading');
  const refill = refillStatus(state.meds);
  const strips = stripsPlan(state.testPlan);
  return (
    <Card>
      <Title>{t('refillTitle')}</Title>
      <Body bold>
        {state.meds.name}: {state.meds.pillsLeft} {t('pillsLeft')}
      </Body>
      <Body>
        {refill.daysLeft ?? '—'} {t('daysLeft')} · {t(LEVEL_KEY[refill.level] ?? 'refillOk')}
      </Body>
      {canEdit && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Chip
            label="−10"
            onPress={() => dispatch({ type: 'MEDS_SET', pillsLeft: state.meds.pillsLeft - 10 })}
          />
          <Chip
            label="+30"
            onPress={() => dispatch({ type: 'MEDS_SET', pillsLeft: state.meds.pillsLeft + 30 })}
          />
        </View>
      )}
      <Body bold>
        {state.testPlan.strips} {t('stripsLeft')} · {strips.daysLeft ?? '—'} {t('daysLeft')}
      </Body>
      <Body>
        {t('testPlan')}: {state.testPlan.perDay}
      </Body>
      {canEdit && (
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <Chip
            label="−5"
            onPress={() => dispatch({ type: 'STRIPS_SET', strips: state.testPlan.strips - 5 })}
          />
          <Chip
            label="+25"
            onPress={() => dispatch({ type: 'STRIPS_SET', strips: state.testPlan.strips + 25 })}
          />
        </View>
      )}
    </Card>
  );
}

const CATS = ['medicine', 'strips', 'travel', 'other'];

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
    <Card>
      <Title>{t('budgetTitle')}</Title>
      <Body bold>
        {t('thisMonth')}: ₹{s.thisMonth} · {t('lastMonth')}: ₹{s.lastMonth} · {t(TREND_KEY[s.trend])}
      </Body>
      {Object.entries(s.byCat).map(([c, v]) => (
        <Body key={c}>
          {t(`cat_${c}`)}: ₹{v}
        </Body>
      ))}
      {state.budget.some((b) => b.demo) && <Body>{t('demoData')}</Body>}
      {s.tipIds.length > 0 && <Body bold>{t('savingTips')}</Body>}
      {s.tipIds.map((id) => (
        <Body key={id}>• {t(`tip.${id}`)}</Body>
      ))}
      {canEdit && (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {CATS.map((c) => (
              <Chip key={c} label={t(`cat_${c}`)} active={cat === c} onPress={() => setCat(c)} />
            ))}
          </View>
          <TextInput
            accessibilityLabel={t('amount')}
            placeholder={t('amount')}
            keyboardType="number-pad"
            value={amount}
            onChangeText={setAmount}
            style={field}
          />
          <BigButton label={t('budgetAdd')} onPress={add} />
        </>
      )}
    </Card>
  );
}
