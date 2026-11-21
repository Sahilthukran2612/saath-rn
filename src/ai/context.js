// What may leave the phone for the AI, and nothing else. It is a short, anonymous summary of the day: no name, no
// phone number, no medicine names or doses, no sugar numbers, no contacts, no location, no raw sensor data.
// Only coarse facts the model needs to word a helpful card: language, time of day, who the phone is for,
// how the routine is going, and a few yes/no flags.

const partOfDay = (hour) => (hour < 5 ? 'night' : hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night');

export function buildAiContext(state, nowMs = Date.now()) {
  const tasks = state.tasks || [];
  const readings = state.readings || [];
  const day = new Date(nowMs);
  const startOfDay = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  return {
    lang: state.lang === 'hi' ? 'hi' : 'en',
    partOfDay: partOfDay(day.getHours()),
    weekend: day.getDay() === 0 || day.getDay() === 6,
    mode: ['teen', 'elder', 'adult'].includes(state.mode) ? state.mode : 'adult',
    phase: ['new', 'stable', 'crisis'].includes(state.phase) ? state.phase : 'stable',
    hasCondition: Boolean(state.profile?.condition),
    onMedicines: (state.medicines || []).length > 0,
    tasksDone: tasks.filter((x) => x.done).length,
    tasksTotal: tasks.length,
    sugarLoggedToday: readings.some((r) => r.at >= startOfDay),
    region: state.foodPrefs?.region || 'north',
    diet: state.foodPrefs?.diet || 'veg',
    // what this person tends to do, so the model can lean toward it. Counts only, never content.
    likes: Object.entries(state.slipStats || {})
      .filter(([, v]) => (v.done || 0) > (v.skipped || 0))
      .map(([k]) => k)
      .slice(0, 6),
    avoids: Object.entries(state.slipStats || {})
      .filter(([, v]) => (v.skipped || 0) > (v.done || 0))
      .map(([k]) => k)
      .slice(0, 6),
  };
}
