import React, { useState } from 'react';
import { View } from 'react-native';
import { Users } from '../icons';
import { BigButton, Body, Caption, Card } from '../ui';
import { Avatar, Badge, Field, ListGroup, ListRow, ScreenHeader } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { colors } from '../../theme';
import { acceptInvite, cloudConfig, isConfigured, listCircles } from '../../services/cloud';
import { ago, describeEvent, fmt, isAlert, newest, pendingAlert } from '../../circleFeed';

// The other half of the circle: the people I look after. I only ever see what the server lets me see
// under the Privacy Dial they chose for me (row-level security), so this screen just words it.
export default function CirclesSection() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const [open, setOpen] = useState(null); // household id
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const cfg = cloudConfig();
  if (!isConfigured(cfg)) return null;

  const signedIn = Boolean(state.cloud.access);
  const nameOf = (c) => c.person_name || t('cf.someone');

  const join = async () => {
    if (busy) return;
    if (!signedIn) return setMsg(t('join.needSignIn'));
    setBusy(true);
    const r = await acceptInvite(cfg, state.cloud, code);
    if (r.session) dispatch({ type: 'CLOUD_SET', patch: r.session });
    if (r.ok) {
      const c = await listCircles(cfg, { ...state.cloud, ...(r.session || {}) });
      if (c.ok) dispatch({ type: 'CIRCLES_SET', circles: c.circles });
      setCode('');
      setMsg(t('join.ok'));
    } else {
      setMsg(r.reason === 'network' ? t('join.net') : t('join.bad'));
    }
    setBusy(false);
  };

  const circle = state.circles.find((c) => c.household_id === open);
  if (circle) {
    const feed = state.feeds[circle.household_id] || [];
    return (
      <View style={{ gap: 14 }}>
        <ScreenHeader title={nameOf(circle)} onBack={() => setOpen(null)} backLabel={t('back')} />
        <Caption>{fmt(t('cf.sees'), { level: t(`dial${circle.dial}`) })}</Caption>
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
      <Card style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Users size={24} color={colors.indigo} />
          <Body bold style={{ flex: 1 }}>
            {t('join.title')}
          </Body>
        </View>
        <Field label={t('join.code')} value={code} onChangeText={(v) => setCode(v.toUpperCase())} />
        {msg ? <Body>{msg}</Body> : null}
        <BigButton kind="primary" label={t('join.button')} onPress={join} />
      </Card>
    </View>
  );
}
