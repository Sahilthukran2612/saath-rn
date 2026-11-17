import React, { useState } from 'react';
import { View } from 'react-native';
import { BigButton, Body, Caption, Card } from '../ui';
import { Avatar, Badge, ListGroup, ListRow, ScreenHeader, Toggle } from '../kit';
import JoinCard from './JoinCard';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { colors } from '../../theme';
import { nowMs } from '../../services/clock';
import { cloudConfig, isConfigured, setMyTimeOff } from '../../services/cloud';
import { ago, describeEvent, fmt, isAlert, newest, pendingAlert } from '../../circleFeed';

// The other half of the circle: the people I look after. I only ever see what the server lets me see
// under the Privacy Dial they chose for me (row-level security), so this screen just words it.
export default function CirclesSection() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const [open, setOpen] = useState(null); // household id
  const cfg = cloudConfig();
  if (!isConfigured(cfg) && !state.demo) return null;

  const signedIn = Boolean(state.cloud.access);
  const nameOf = (c) => c.person_name || t('cf.someone');

  // Time Off: stop routine updates from one person. The server still lets safety alerts through.
  const pause = async (c, on) => {
    dispatch({ type: 'CIRCLE_TIMEOFF', id: c.household_id, on });
    if (!signedIn || c.household_id.startsWith('demo-')) return;
    const r = await setMyTimeOff(cfg, state.cloud, c.household_id, on);
    if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
    if (!r.ok) dispatch({ type: 'CIRCLE_TIMEOFF', id: c.household_id, on: !on });
  };

  const circle = state.circles.find((c) => c.household_id === open);
  if (circle) {
    const feed = state.feeds[circle.household_id] || [];
    return (
      <View style={{ gap: 14 }}>
        <ScreenHeader title={nameOf(circle)} onBack={() => setOpen(null)} backLabel={t('back')} />
        <Body bold>{t('cf.youAre').replace('{role}', t(`role.${circle.role}`))}</Body>
        <Caption>{fmt(t('cf.sees'), { level: t(`dial${circle.dial}`) })}</Caption>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Body>{t('cf.timeOff')}</Body>
            <Caption>{t('cf.timeOffNote')}</Caption>
          </View>
          <Toggle value={!!circle.time_off} label={t('cf.timeOff')} onValueChange={(on) => pause(circle, on)} />
        </View>
        {feed.length === 0 ? (
          <Body>{t('cf.empty')}</Body>
        ) : (
          <ListGroup>
            {feed.map((e, i) => (
              <ListRow
                key={e.id}
                title={describeEvent(e, nameOf(circle), t)}
                subtitle={ago(e.created_at, now, t)}
                trailing={isAlert(e) ? <Badge tone="brick" label={t('tabSafety')} /> : null}
                last={i === feed.length - 1}
              />
            ))}
          </ListGroup>
        )}
        <Caption>{t('cf.note')}</Caption>
        <Caption>{t('cf.offline')}</Caption>
      </View>
    );
  }

  return (
    <View style={{ gap: 14 }}>
      <Body bold>{t('cf.title')}</Body>
      {state.circles.length === 0 ? (
        <Caption>{t('cf.none')}</Caption>
      ) : (
        <ListGroup>
          {state.circles.map((c, i) => {
            const feed = state.feeds[c.household_id] || [];
            const alert = pendingAlert(feed, state.seen[c.household_id], now);
            const latest = feed[0];
            return (
              <ListRow
                key={c.household_id}
                lead={<Avatar name={nameOf(c)} role="person" size={44} />}
                title={nameOf(c)}
                subtitle={latest ? describeEvent(latest, nameOf(c), t) : t('cf.empty')}
                trailing={alert ? <Badge tone="brick" label={t('tabSafety')} /> : null}
                label={nameOf(c)}
                onPress={() => {
                  setOpen(c.household_id);
                  if (newest(feed)) dispatch({ type: 'SEEN_SET', id: c.household_id, at: newest(feed) });
                }}
                last={i === state.circles.length - 1}
              />
            );
          })}
        </ListGroup>
      )}
      {state.demo ? (
        <Card tone="haldi" style={{ gap: 10 }}>
          <Caption style={{ color: colors.ink }}>{t('demo.circleNote')}</Caption>
          <BigButton
            kind="quiet"
            label={t('demo.circleAdd')}
            onPress={() => dispatch({ type: 'DEMO_CIRCLE_ADD', at: nowMs() })}
          />
          {state.circles.some((c) => c.household_id === 'demo-amma') ? (
            <>
              <BigButton
                kind="quiet"
                label={t('demo.circleFall')}
                onPress={() => dispatch({ type: 'DEMO_CIRCLE_EVENT', kind: 'fall', at: nowMs() })}
              />
              <BigButton
                kind="quiet"
                label={t('demo.circleOk')}
                onPress={() => dispatch({ type: 'DEMO_CIRCLE_EVENT', kind: 'im_ok', at: nowMs() })}
              />
            </>
          ) : null}
        </Card>
      ) : null}
      <JoinCard />
    </View>
  );
}
