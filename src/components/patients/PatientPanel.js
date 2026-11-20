import React from 'react';
import { View } from 'react-native';
import { Body, Caption, Card } from '../ui';
import { Badge, ListGroup, ListRow, ScreenHeader, Toggle } from '../kit';
import CarePlanBuilder from '../circle/CarePlanBuilder';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { cloudConfig, isConfigured, setMyTimeOff } from '../../services/cloud';
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

  // Time Off: stop routine updates from this person. The server still lets safety alerts through.
  const pause = async (on) => {
    dispatch({ type: 'CIRCLE_TIMEOFF', id: circle.household_id, on });
    if (!signedIn || circle.household_id.startsWith('demo-') || !isConfigured(cfg)) return;
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
        <Card style={{ borderColor: '#B3261E', borderWidth: 2 }}>
          <Body bold style={{ color: '#B3261E' }}>
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

      {doctor ? <CarePlanBuilder circle={circle} /> : null}
    </View>
  );
}
