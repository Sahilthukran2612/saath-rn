import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Bell, BellRing, Minus, Pencil, Plus, X } from './icons';
import { BigButton, Caption, Chip } from './ui';
import { formatHour, reminderPlan, stepHour, validHour } from '../reminders';
import { askReminderPermission } from '../services/reminders';
import { Field, ListGroup, ListRow, SectionTitle, Toggle } from './kit';
import { useStore } from '../state/store';
import { useNow } from './useNow';
import { shouldNudge } from '../logic';
import { speak } from '../services/voice';
import { nowMs } from '../services/clock';
import { taskLabel } from '../taskLabel';
import Sheet from './Sheet';
import { colors } from '../theme';

// One task name. The text is local while typing and saved when the person finishes, so the offline
// queue gets one change per edit, not one per letter.
function TaskField({ task, label, removeLabel }) {
  const { dispatch, t } = useStore();
  const [value, setValue] = useState(taskLabel(task, t));
  const latest = useRef(value);
  const timer = useRef(null);
  // Saved a moment after typing stops, and when the box loses focus or the keyboard is closed. Android's back
  // button closes the keyboard without ending the edit, so waiting for the end alone lost the change.
  const save = (text = latest.current) => {
    clearTimeout(timer.current);
    const v = text.trim();
    if (v && v !== taskLabel(task, t)) dispatch({ type: 'TASK_EDIT', id: task.id, title: v, at: nowMs() });
  };
  const change = (text) => {
    latest.current = text;
    setValue(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => save(text), 700);
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const move = (delta) =>
    dispatch({ type: 'TASK_HOUR', id: task.id, hour: stepHour(task.hour, delta), at: nowMs() });
  const asleep = validHour(task.hour) && reminderPlan([task]).length === 0;
  return (
    <View style={{ gap: 8 }}>
      <Field label={label} value={value} onChangeText={change} onEndEditing={() => save()} onBlur={() => save()} />
      <View style={{ flexDirection: 'row', justifyContent: 'flex-start' }}>
        <Chip
          label={removeLabel}
          icon={X}
          onPress={() => dispatch({ type: 'TASK_DELETE', id: task.id, at: nowMs() })}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Caption style={{ flex: 1 }}>
          {validHour(task.hour)
            ? t('rem.at').replace('{time}', formatHour(task.hour))
            : t('rem.none')}
        </Caption>
        <Chip label={t('rem.earlier')} icon={Minus} onPress={() => move(-1)} />
        <Chip label={t('rem.later')} icon={Plus} onPress={() => move(1)} />
      </View>
      {asleep ? <Caption>{t('rem.sleep')}</Caption> : null}
    </View>
  );
}

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
    dispatch({ type: 'TASK_ADD', id: String(nowMs()), title, at: nowMs() });
    speak(`${t('addTask')}: ${title}`, state.lang);
    setText('');
  };

  return (
    <View style={{ gap: 8 }}>
      <SectionTitle>{t('rem.section')}</SectionTitle>
      <ListGroup>
        <ListRow
          icon={nudge.ok ? BellRing : Bell}
          iconBg={nudge.ok ? colors.leafTint : colors.haldiTint}
          iconColor={nudge.ok ? colors.leafDeep : colors.haldiDeep}
          title={nudge.ok ? t('remindersOn') : `${t('remindersPaused')} (${nudge.reason})`}
        />
        <ListRow
          icon={Bell}
          title={t('rem.toggle')}
          subtitle={state.remindersDenied ? t('rem.denied') : t('rem.note')}
          trailing={
            <Toggle
              value={state.reminders}
              label={t('rem.toggle')}
              onValueChange={async (on) => {
                dispatch({ type: 'SET', key: 'remindersDenied', value: false });
                if (on && !(await askReminderPermission())) {
                  dispatch({ type: 'SET', key: 'reminders', value: false });
                  dispatch({ type: 'SET', key: 'remindersDenied', value: true });
                  return;
                }
                dispatch({ type: 'SET', key: 'reminders', value: on });
              }}
            />
          }
        />
        <ListRow icon={Pencil} title={t('editRoutine')} onPress={() => setOpen(true)} chevron />
      </ListGroup>
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('editRoutine')}>
        {state.tasks.map((x) => (
          <TaskField key={x.id} task={x} label={t('taskName')} removeLabel={`${t('remove')}: ${taskLabel(x, t)}`} />
        ))}
        <Field label={t('taskName')} value={text} onChangeText={setText} />
        <BigButton icon={Plus} label={t('addTask')} onPress={add} />
      </Sheet>
    </View>
  );
}
