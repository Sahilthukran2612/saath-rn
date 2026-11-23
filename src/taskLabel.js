// The four starter tasks are stored in English. They are shown in the person's language until the person renames
// one, after which their own words are shown exactly as typed.
export const STARTERS = { t1: 'Morning medicine', t2: 'Lunch', t3: 'Evening walk', t4: 'Sugar check' };

export function taskLabel(task, t) {
  if (!task) return '';
  return STARTERS[task.id] && task.title === STARTERS[task.id] ? t(`task.${task.id}`) : task.title;
}
