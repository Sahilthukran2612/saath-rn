import React, { useState } from 'react';
import { View } from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import Text from '../AppText';
import { Activity, Droplet, Pill, Plus } from '../icons';
import { BigButton, Body, Caption, Card, Glyph, Title } from '../ui';
import { Field, LineChart, Segmented } from '../kit';
import Sheet from '../Sheet';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { useNav } from '../nav';
import { can, glucoseAdvice } from '../../logic';
import { adviceText } from '../../i18n/strings';
import { adherence, dailyReadings, heartSummary, sugarSummary, weekdayLabel } from '../../analytics';
import { colors, fonts } from '../../theme';

const RANGES = [7, 14, 30];

// A figure and its label, side by side with the others: the numbers a chart is summarising.
function StatTile({ value, label, unit }) {
  return (
    <View
      className="flex-1 gap-0.5 rounded-lg bg-secondary px-3 py-3"
      accessibilityLabel={`${label}: ${value ?? '–'}`}
      accessible
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 28, lineHeight: 32, color: colors.indigo }}>
        {value ?? '–'}
      </Text>
      <Caption>{label}</Caption>
      {unit ? <Caption>{unit}</Caption> : null}
    </View>
  );
}

// Vertical bars with a short label under each. `value` is drawn against `max`; a bar with no value is a thin stub, so a
// day with nothing logged is visible as a gap, never as a zero.
export function BarChart({ data, max, width, height = 120, color = colors.indigo, label }) {
  const top = 18;
  const bottom = 22;
  const gap = 6;
  const n = data.length;
  const bw = Math.max(6, (width - gap * (n - 1)) / n);
  const plot = height - top - bottom;
  const peak = max || Math.max(1, ...data.map((d) => d.value || 0));
  return (
    <View accessible accessibilityLabel={label}>
      <Svg width={width} height={height}>
        <Line x1={0} x2={width} y1={top + plot} y2={top + plot} stroke={colors.line} strokeWidth={1} />
        {data.map((d, i) => {
          const h = d.value ? Math.max(4, (d.value / peak) * plot) : 3;
          const x = i * (bw + gap);
          return (
            <React.Fragment key={d.key ?? i}>
              <Rect
                x={x}
                y={top + plot - h}
                width={bw}
                height={h}
                rx={Math.min(6, bw / 2)}
                fill={d.value ? color : colors.line}
              />
              {d.value && n <= 14 ? (
                <SvgText
                  x={x + bw / 2}
                  y={top + plot - h - 5}
                  fontSize={12}
                  fontFamily={fonts.semi}
                  fill={colors.inkSoft}
                  textAnchor="middle"
                >
                  {d.value}
                </SvgText>
              ) : null}
              {n <= 14 || i % 5 === 0 ? (
                <SvgText
                  x={x + bw / 2}
                  y={height - 5}
                  fontSize={12}
                  fontFamily={fonts.regular}
                  fill={colors.inkFaint}
                  textAnchor="middle"
                >
                  {d.label}
                </SvgText>
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

// Sugar over the last 7, 14 or 30 days: the numbers, the readings as a line, and each day's average as bars. It states
// what was logged and never calls a value good or bad. New readings go in through the button, in a bottom sheet.
export function SugarAnalytics() {
  const { state, dispatch, t } = useStore();
  const now = useNow(60000);
  const [days, setDays] = useState(7);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [w, setW] = useState(280);
  const canLog = can(state.role, 'logReading');
  const sum = sugarSummary(state.readings, days, now);
  const daily = dailyReadings(state.readings, days, now);
  const window = state.readings.filter((r) => r.at >= daily[0].ms - 12 * 3600000 && Number.isFinite(r.mgdl));
  const last = state.readings[state.readings.length - 1];

  const submit = () => {
    const v = parseInt(text, 10);
    if (Number.isNaN(v) || v <= 0 || v >= 700) return;
    dispatch({ type: 'ADD_READING', id: String(Date.now()), mgdl: v, at: Date.now() });
    setText('');
    setOpen(false);
  };

  return (
    <Card style={{ gap: 14 }}>
      <View className="flex-row items-center gap-3">
        <Glyph icon={Droplet} size={26} color={colors.indigo} />
        <Title style={{ fontSize: 22, flex: 1 }}>{t('sugarLog')}</Title>
        {last ? (
          <Text style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 34, color: colors.indigo }}>
            {last.mgdl}
          </Text>
        ) : null}
      </View>
      <Segmented
        value={days}
        onChange={setDays}
        options={RANGES.map((d) => ({ value: d, label: t('an.days').replace('{n}', String(d)) }))}
      />
      {sum.n === 0 ? (
        <Body>{t('an.none')}</Body>
      ) : (
        <>
          <View className="flex-row gap-2">
            <StatTile value={sum.avg} label={t('average')} unit="mg/dL" />
            <StatTile value={sum.min} label={t('an.lowest')} />
            <StatTile value={sum.max} label={t('an.highest')} />
            <StatTile value={sum.n} label={t('an.readings')} />
          </View>
          <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
            <LineChart
              values={window.slice(-30).map((r) => r.mgdl)}
              width={w}
              height={120}
              label={t('sugarLog')}
            />
          </View>
          <Caption>{t('an.dailyAvg')}</Caption>
          <BarChart
            width={w}
            height={110}
            label={t('an.dailyAvg')}
            data={daily.map((d) => ({ key: d.day, value: d.avg, label: weekdayLabel(d.ms, state.lang) }))}
          />
        </>
      )}
      <Body>{adviceText(state.lang, glucoseAdvice(last?.mgdl).level)}</Body>
      {canLog ? (
        <BigButton kind="quiet" icon={Plus} label={t('addReading')} onPress={() => setOpen(true)} />
      ) : null}
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('addReading')}>
        <Field
          label={t('an.mgdl')}
          value={text}
          onChangeText={setText}
          keyboardType="number-pad"
          placeholder="mg/dL"
        />
        <BigButton icon={Plus} label={t('an.save')} onPress={submit} />
      </Sheet>
    </Card>
  );
}

// Medicines marked taken over the last 7 days, against how many medicines the person has.
// A doctor's view of a patient's readings: the same figures and charts, read-only. It reports numbers and never says
// what they mean; reading them is the doctor's job.
export function PatientSugar({ readings, loaded = true }) {
  const { state, t } = useStore();
  const now = useNow(60000);
  const [days, setDays] = useState(14);
  const [w, setW] = useState(280);
  const sum = sugarSummary(readings, days, now);
  const daily = dailyReadings(readings, days, now);
  const window = readings.filter((r) => r.at >= daily[0].ms - 12 * 3600000 && Number.isFinite(r.mgdl));
  const last = readings[readings.length - 1];
  return (
    <Card style={{ gap: 14 }}>
      <View className="flex-row items-center gap-3">
        <Glyph icon={Droplet} size={26} color={colors.indigo} />
        <Title style={{ fontSize: 22, flex: 1 }}>{t('pt.readings')}</Title>
        {last ? (
          <Text style={{ fontFamily: fonts.bold, fontSize: 30, lineHeight: 34, color: colors.indigo }}>
            {last.mgdl}
          </Text>
        ) : null}
      </View>
      <Segmented
        value={days}
        onChange={setDays}
        options={RANGES.map((d) => ({ value: d, label: t('an.days').replace('{n}', String(d)) }))}
      />
      {sum.n === 0 ? (
        loaded ? (
          <Body>{t('pt.noReadings')}</Body>
        ) : (
          <Caption>{t('ai.thinking')}</Caption>
        )
      ) : (
        <>
          <View className="flex-row gap-2">
            <StatTile value={sum.avg} label={t('average')} unit="mg/dL" />
            <StatTile value={sum.min} label={t('an.lowest')} />
            <StatTile value={sum.max} label={t('an.highest')} />
            <StatTile value={sum.n} label={t('an.readings')} />
          </View>
          <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
            <LineChart
              values={window.slice(-60).map((r) => r.mgdl)}
              width={w}
              height={120}
              label={t('pt.readings')}
            />
          </View>
          <Caption>{t('an.dailyAvg')}</Caption>
          <BarChart
            width={w}
            height={110}
            label={t('an.dailyAvg')}
            data={daily.map((d) => ({ key: d.day, value: d.avg, label: weekdayLabel(d.ms, state.lang) }))}
          />
        </>
      )}
      <Caption>{t('pt.readingsNote')}</Caption>
    </Card>
  );
}

export function AdherenceChart() {
  const { state, t } = useStore();
  const now = useNow(60000);
  const [w, setW] = useState(280);
  if (!state.medicines.length) return null;
  const rows = adherence(state.medLog, state.medicines, 7, now);
  const total = rows.reduce((a, r) => a + r.total, 0);
  const taken = rows.reduce((a, r) => a + r.taken, 0);
  return (
    <Card style={{ gap: 12 }}>
      <View className="flex-row items-center gap-3">
        <Glyph icon={Pill} size={26} color={colors.indigo} />
        <Title style={{ fontSize: 22, flex: 1 }}>{t('an.medWeek')}</Title>
        <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: colors.indigo }}>
          {taken}/{total}
        </Text>
      </View>
      <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
        <BarChart
          width={w}
          height={110}
          max={state.medicines.length}
          color={colors.leaf}
          label={t('an.medWeek')}
          data={rows.map((r) => ({
            key: r.day,
            value: r.taken || null,
            label: weekdayLabel(r.ms, state.lang),
          }))}
        />
      </View>
    </Card>
  );
}

// Heart rate from the connected band during this session. Readings stay in memory only: this is a live view, not a
// record, and the card says so.
export function HeartAnalytics() {
  const { state, t } = useStore();
  const go = useNav();
  const [w, setW] = useState(280);
  const readings = state.heart.readings;
  const sum = heartSummary(readings);
  return (
    <Card style={{ gap: 12 }}>
      <View className="flex-row items-center gap-3">
        <Glyph icon={Activity} size={26} color={colors.indigo} />
        <Title style={{ fontSize: 22, flex: 1 }}>{t('an.heart')}</Title>
      </View>
      {sum.n < 2 ? (
        <Body>{state.heart.device ? t('an.heartWait') : t('an.heartNone')}</Body>
      ) : (
        <>
          <View className="flex-row gap-2">
            <StatTile value={sum.avg} label={t('average')} unit="bpm" />
            <StatTile value={sum.min} label={t('an.lowest')} />
            <StatTile value={sum.max} label={t('an.highest')} />
          </View>
          <View onLayout={(e) => setW(Math.floor(e.nativeEvent.layout.width))}>
            <LineChart
              values={readings.slice(-40).map((r) => r.bpm)}
              width={w}
              height={110}
              label={t('an.heart')}
              floor={50}
              ceil={120}
              markOutliers={false}
            />
          </View>
          <Caption>{t('an.heartSession')}</Caption>
        </>
      )}
      {!state.heart.device ? (
        <BigButton kind="quiet" label={t('an.connect')} onPress={() => go('safety')} />
      ) : null}
    </Card>
  );
}
