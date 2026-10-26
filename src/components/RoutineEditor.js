import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { BigButton, Body, Card, Chip, Title } from './ui';
import { useStore } from '../state/store';
import { useNow } from './useNow';
import { shouldNudge } from '../logic';
import { colors } from '../theme';
import { speak } from '../services/voice';

// Rhythm Board editing. Works offline: every change goes into a queue that "syncs" later.
// Reminders respect Time Off (any member on Time Off) and the sleep window; safety is never muted.
export default function RoutineEditor() {
  const { state, dispatch, t } = useStore();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const timeOff = state.members.some((m) => m.timeOff);
  const nudge = shouldNudge({ nowMs: now, timeOff, phase: state.phase });

  const add = () => {
    const title = text.trim();
    if (!title) return;
    dispatch({ type: 'TASK_ADD', id: String(Date.now()), title, at: Date.now() });
    speak(`${t('addTask')}: ${title}`, state.lang);
    setText('');
  };

  return (
    <Card>
      <Body>
        {nudge.ok ? t('remindersOn') : `${t('remindersPaused')} (${nudge.reason})`}
        {state.queue.length > 0 ? ` · ${t('waiting')}: ${state.queue.length}` : ''}
      </Body>
      <Chip
        label={t(state.online ? 'goOffline' : 'goOnline')}
        onPress={() => dispatch({ type: 'SET_ONLINE', online: !state.online })}
      />
      <Chip label={t('editRoutine')} active={open} onPress={() => setOpen(!open)} />
      {open && (
        <View style={{ gap: 10 }}>
          <Title>{t('editRoutine')}</Title>
          {state.tasks.map((x) => (
            <View key={x.id} style={{ gap: 6 }}>
              <TextInput
                accessibilityLabel={t('taskName')}
                defaultValue={x.title}
                onEndEditing={(e) => {
                  const v = e.nativeEvent.text.trim();
                  if (v && v !== x.title) dispatch({ type: 'TASK_EDIT', id: x.id, title: v, at: Date.now() });
                }}
                style={{
                  minHeight: 56,
                  fontSize: 18,
                  borderWidth: 1,
                  borderColor: colors.line,
                  borderRadius: 12,
                  paddingHorizontal: 12,
                }}
              />
              <Chip
                label={`${t('remove')}: ${x.title}`}
                onPress={() => dispatch({ type: 'TASK_DELETE', id: x.id, at: Date.now() })}
              />
            </View>
          ))}
          <TextInput
            accessibilityLabel={t('taskName')}
            placeholder={t('taskName')}
            value={text}
            onChangeText={setText}
            style={{
              minHeight: 56,
              fontSize: 18,
              borderWidth: 2,
              borderColor: colors.indigo,
              borderRadius: 12,
              paddingHorizontal: 12,
            }}
          />
          <BigButton label={t('addTask')} onPress={add} />
        </View>
      )}
    </Card>
  );
}
