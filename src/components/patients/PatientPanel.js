import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Check, ClipboardList } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import Sheet from '../Sheet';
import { Badge, ListGroup, ListRow, ScreenHeader, Toggle } from '../kit';
import CarePlanBuilder from '../circle/CarePlanBuilder';
import { useStore } from '../../state/store';
import { colors } from '../../theme';
import { useNow } from '../useNow';
import { cloudConfig, fetchReadings, isConfigured, setMyTimeOff } from '../../services/cloud';
import { PatientSugar } from '../care/CareCharts';
import { visitStatus } from '../../visits';
import { ago, describeEvent, fmt, isAlert, pendingAlert } from '../../circleFeed';

// One person I look after, shown for my role with them. A guardian sees how they are doing; a neighbour sees safety
// only (the server lets nothing else through); a doctor sees the same and also writes their care plan. The server
// decides what each role may read under the person's privacy dial: this screen never widens it.
export default function PatientPanel({ circle, onBack }) {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const cfg = cloudConfig();
  const name = circle.person_name || t('cf.someone');
  const feed = state.feeds[circle.household_id] || [];
  const alert = pendingAlert(feed, state.seen[circle.household_id], now);
  const signedIn = Boolean(state.cloud.access);
  const doctor = circle.role === 'clinician';
  const [planOpen, setPlanOpen] = useState(false);
  const visit = visitStatus(state.visits[circle.household_id], now);

  // A doctor reads the patient's sugar readings from the server. The database answers only while the patient has
  // this doctor at Full, so an empty list means none were shared, not that none exist.
  const [readings, setReadings] = useState([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (!doctor || !signedIn || !isConfigured(cfg)) return undefined;
    let live = true;
    fetchReadings(cfg, state.cloud, circle.household_id).then((r) => {
      if (!live) return;
      if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
      if (r.ok) setReadings(r.readings);
      setLoaded(true);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circle.household_id, doctor, signedIn]);

  // Time Off: stop routine updates from this person. The server still lets safety alerts through.
  const pause = async (on) => {
    dispatch({ type: 'CIRCLE_TIMEOFF', id: circle.household_id, on });
    if (!signedIn || !isConfigured(cfg)) return;
    const r = await setMyTimeOff(cfg, state.cloud, circle.household_id, on);
    if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
    if (!r.ok) dispatch({ type: 'CIRCLE_TIMEOFF', id: circle.household_id, on: !on });
  };

  return (
    <View style={{ gap: 14 }}>
      <ScreenHeader title={name} onBack={onBack} backLabel={t('back')} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Badge tone="indigo" label={t(`role.${circle.role}`)} />
        <Caption style={{ flex: 1 }}>{fmt(t('cf.sees'), { level: t(`dial${circle.dial}`) })}</Caption>
      </View>
      <Body bold>{t('cf.youAre').replace('{role}', t(`role.${circle.role}`))}</Body>
      <Caption>{t('cf.note')}</Caption>

      {alert ? (
        <Card style={{ backgroundColor: colors.brickTint }}>
          <Body bold style={{ color: colors.brick }}>
            {describeEvent(alert, name, t)}
          </Body>
          <Caption>{ago(alert.created_at, now, t)}</Caption>
        </Card>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Body>{t('cf.timeOff')}</Body>
          <Caption>{t('cf.timeOffNote')}</Caption>
        </View>
        <Toggle value={!!circle.time_off} label={t('cf.timeOff')} onValueChange={pause} />
      </View>

      {feed.length === 0 ? (
        <Body>{t('cf.empty')}</Body>
      ) : (
        <ListGroup>
          {feed.map((e, i) => (
            <ListRow
              key={e.id}
              title={describeEvent(e, name, t)}
              subtitle={ago(e.created_at, now, t)}
              trailing={isAlert(e) ? <Badge tone="brick" label={t('tabSafety')} /> : null}
              last={i === feed.length - 1}
            />
          ))}
        </ListGroup>
      )}

      {circle.role === 'asha' ? (
        <Card style={{ gap: 12 }}>
          <Body bold>{t('vis.title')}</Body>
          <Caption>
            {visit.days == null
              ? t('vis.never')
              : visit.days === 0
                ? t('vis.today')
                : t('vis.ago').replace('{n}', String(visit.days))}
          </Caption>
          <BigButton
            icon={Check}
            label={t('vis.mark')}
            onPress={() => dispatch({ type: 'VISIT_MARK', id: circle.household_id, at: Date.now() })}
          />
        </Card>
      ) : null}
      {doctor ? <PatientSugar readings={readings} loaded={loaded} /> : null}
      {doctor ? (
        <Card style={{ gap: 12 }}>
          <Body bold>{t('plan.build')}</Body>
          <BigButton icon={ClipboardList} label={t('plan.editBtn')} onPress={() => setPlanOpen(true)} />
        </Card>
      ) : null}
      <Sheet visible={planOpen} onClose={() => setPlanOpen(false)} title={t('plan.build')}>
        <CarePlanBuilder circle={circle} />
      </Sheet>
    </View>
  );
}
