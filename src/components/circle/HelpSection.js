import React, { useState } from 'react';
import { View } from 'react-native';
import { BigButton, Body, Card, Chip, Title } from '../ui';
import { useStore } from '../../state/store';
import { useNow } from '../useNow';
import { isDelegationActive } from '../../logic';
import { speak } from '../../services/voice';

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
    <Card>
      <BigButton
        kind="primary"
        icon="🙋"
        label={t('helpButton')}
        onPress={() => send('HELP_REQUEST', HOUR)}
      />
      <Title>{t('delegateTitle')}</Title>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {state.members.map((m) => (
          <Chip key={m.id} label={m.name} active={to === m.id} onPress={() => setTo(m.id)} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {state.tasks.map((x) => (
          <Chip
            key={x.id}
            label={`${x.icon} ${x.title}`}
            active={taskId === x.id}
            onPress={() => setTaskId(x.id)}
          />
        ))}
      </View>
      <BigButton kind="quiet" label={t('delegateFor')} onPress={() => send('DELEGATE', HOUR)} />
      <BigButton kind="quiet" label={t('delegateDay')} onPress={() => send('DELEGATE', 24 * HOUR)} />
      {state.delegations
        .slice(-5)
        .reverse()
        .map((d) => {
          const active = isDelegationActive(d, now);
          const task = state.tasks.find((x) => x.id === d.taskId);
          return (
            <View key={d.id} style={{ gap: 6 }}>
              <Body>
                {d.kind === 'help' ? t('helpButton') : (task?.title ?? '—')} → {nameOf(d.to)} ·{' '}
                {d.status === 'done'
                  ? t('done')
                  : active
                    ? `${t('expires')} ${new Date(d.expiresAt).toLocaleTimeString()}`
                    : t('expired')}
              </Body>
              {active && (
                <Chip label={t('markDone')} onPress={() => dispatch({ type: 'DELEGATION_DONE', id: d.id })} />
              )}
            </View>
          );
        })}
    </Card>
  );
}
