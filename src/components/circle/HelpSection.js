import React, { useState } from 'react';
import { View } from 'react-native';
import { HandHeart, Hourglass } from '../icons';
import { BigButton, Caption, Card, Chip, Glyph, Title } from '../ui';
import { Badge, ListGroup, ListRow, Avatar } from '../kit';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { isDelegationActive } from '../../logic';
import { speak } from '../../services/voice';
import { confirm } from '../../services/haptics';
import { taskIcon } from '../taskIcons';
import { taskLabel } from '../../taskLabel';
import { colors } from '../../theme';

const HOUR = 3600000;

// One-tap "ask for help" and time-limited task delegation. Asking should cost little effort
// and no guilt, so the wording is plain and the request expires by itself.
export default function HelpSection() {
  const { state, dispatch, t } = useStore();
  const [to, setTo] = useState(state.members[0]?.id);
  const [taskId, setTaskId] = useState(state.tasks[0]?.id);
  const nameOf = (id) => state.members.find((m) => m.id === id)?.name ?? '?';
  const now = useNow();

  const send = (type, ms) => {
    if (!to) return;
    confirm();
    dispatch({
      type,
      id: String(Date.now()),
      to,
      taskId: type === 'DELEGATE' ? taskId : null,
      expiresAt: Date.now() + ms,
      at: Date.now(),
    });
    speak(t('helpSent'), state.lang);
  };

  return (
    <Card style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: colors.haldiTint,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Glyph icon={HandHeart} size={22} color={colors.haldiDeep} />
        </View>
        <View style={{ flex: 1 }}>
          <Title style={{ fontSize: 22 }}>{t('delegateTitle')}</Title>
          <Caption>{t('helpSub')}</Caption>
        </View>
      </View>
      <BigButton icon={HandHeart} label={t('helpButton')} onPress={() => send('HELP_REQUEST', HOUR)} />
      <Caption>{t('delegateTitle')}</Caption>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {state.members.map((m) => (
          <Chip key={m.id} label={m.name} active={to === m.id} onPress={() => setTo(m.id)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {state.tasks.map((x) => (
          <Chip
            key={x.id}
            label={taskLabel(x, t)}
            icon={taskIcon(x)}
            active={taskId === x.id}
            onPress={() => setTaskId(x.id)}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <BigButton kind="quiet" label={t('delegateFor')} onPress={() => send('DELEGATE', HOUR)} />
        </View>
        <View style={{ flex: 1 }}>
          <BigButton kind="quiet" label={t('delegateDay')} onPress={() => send('DELEGATE', 24 * HOUR)} />
        </View>
      </View>
      {state.delegations.length > 0 ? (
        <ListGroup>
          {state.delegations
            .slice(-5)
            .reverse()
            .map((d) => {
              const active = isDelegationActive(d, now);
              const task = state.tasks.find((x) => x.id === d.taskId);
              const member = state.members.find((m) => m.id === d.to);
              const status =
                d.status === 'done' ? (
                  <Badge label={t('done')} tone="leaf" />
                ) : active ? (
                  <Badge
                    label={t('delegation.open').replace('{time}', new Date(d.expiresAt).toLocaleTimeString())}
                    tone="haldi"
                  />
                ) : (
                  <Badge label={t('expired')} tone="indigo" />
                );
              return (
                <ListRow
                  key={d.id}
                  lead={<Avatar name={member?.name ?? '?'} role={member?.role} />}
                  title={d.kind === 'help' ? t('helpButton') : (task ? taskLabel(task, t) : '—')}
                  subtitle={nameOf(d.to)}
                  trailing={status}
                  onPress={active ? () => dispatch({ type: 'DELEGATION_DONE', id: d.id }) : undefined}
                  label={active ? t('markDone') : undefined}
                  chevron={false}
                />
              );
            })}
        </ListGroup>
      ) : null}
      {state.delegations.some((d) => isDelegationActive(d, now)) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Glyph icon={Hourglass} size={16} color={colors.inkSoft} />
          <Caption>{t('markDone')}</Caption>
        </View>
      ) : null}
    </Card>
  );
}
