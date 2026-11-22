import { useEffect } from 'react';
import { useStore } from './store';
import { cancelReminders, scheduleReminders } from '../services/reminders';

// Keeps the phone's scheduled reminders in step with the routine: when the setting is on and a task's
// time or name changes, the schedule is rebuilt. When it is off, nothing stays scheduled.
export default function useReminders() {
  const { state, t } = useStore();
  const { hydrated, reminders, lang } = state;
  const key = JSON.stringify(state.tasks.map((x) => [x.id, x.title, x.hour ?? null]));
  useEffect(() => {
    if (!hydrated) return;
    if (!reminders) {
      cancelReminders();
      return;
    }
    scheduleReminders(
      JSON.parse(key).map(([id, title, hour]) => ({ id, title, hour })),
      (title) => t('rem.body').replace('{title}', title)
    );
    // t changes every render; the language is what matters for the wording
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, reminders, key, lang]);
}
