import { CFG, escalationChain, isInactive } from '../logic';

export const SEED = {
  members: [
    { id: 'm1', name: 'Asha (daughter)', role: 'family', dial: 2, timeOff: false },
    { id: 'm2', name: 'Ramesh (neighbour)', role: 'neighbour', dial: 0, timeOff: false },
    { id: 'm3', name: 'Sunita (ASHA)', role: 'asha', dial: 1, timeOff: false },
    { id: 'm4', name: 'Dr. Rao (clinic)', role: 'clinician', dial: 1, timeOff: false },
  ],
  tasks: [
    { id: 't1', icon: '💊', title: 'Morning medicine', done: false },
    { id: 't2', icon: '🍚', title: 'Lunch', done: false },
    { id: 't3', icon: '🚶', title: 'Evening walk', done: false },
    { id: 't4', icon: '🩸', title: 'Sugar check', done: false },
  ],
  readings: [{ id: 'r0', mgdl: 112, at: 0, demo: true }],
};

export const initialState = {
  hydrated: false,
  demo: true, // Demo mode: shows the role switcher and seeded demo data
  mode: 'elder', // 'teen' | 'elder' | 'adult'
  role: 'person', // viewer role (demo switcher until real accounts exist, Phase 4)
  phase: 'stable', // 'new' | 'stable' | 'crisis'
  largeText: false,
  lang: 'en',
  members: SEED.members,
  tasks: SEED.tasks,
  readings: SEED.readings,
  audit: [],
  alert: null,
  tally: { alerts: 0, imOk: 0, escalated: 0, falseAlarm: 0, missed: 0 },
  lastActiveMs: null,
  simNowMs: null, // virtual clock used by the "long quiet" simulation
};

const bump = (tally, key) => ({ ...tally, [key]: tally[key] + 1 });

function openAlert(state, { kind, confidence, reason, id }) {
  if (state.alert) return state; // one alert at a time: no double counting
  return {
    ...state,
    alert: {
      id,
      kind,
      confidence,
      reason,
      phase: 'countdown',
      remaining: CFG.countdownSec,
      stepIndex: 0,
      chain: escalationChain(state.members, { isSafety: true }),
    },
    tally: bump(state.tally, 'alerts'),
  };
}

export function reducer(state, a) {
  switch (a.type) {
    case 'HYDRATE':
      return { ...state, ...a.saved, alert: null, hydrated: true };
    case 'SET':
      return { ...state, [a.key]: a.value };
    case 'ACTIVITY':
      return { ...state, lastActiveMs: a.at };
    case 'TRIGGER_ALERT':
      return openAlert(state, a);
    case 'QUIET_CHECK': {
      // a.lastActiveMs and a.nowMs come from the sensing service or the fast-forward simulation
      const r = isInactive(a.lastActiveMs, a.nowMs);
      const next = { ...state, lastActiveMs: a.lastActiveMs, simNowMs: a.simulated ? a.nowMs : null };
      return r.inactive
        ? openAlert(next, { kind: 'quiet', confidence: r.confidence, reason: r.reason, id: a.id })
        : next;
    }
    case 'TICK': {
      const al = state.alert;
      if (!al || al.phase === 'done') return state;
      if (al.remaining > 1) return { ...state, alert: { ...al, remaining: al.remaining - 1 } };
      if (al.phase === 'countdown') {
        // person did not answer: this is the one place "escalated" is counted
        const done = al.chain.length === 0;
        return {
          ...state,
          alert: { ...al, phase: done ? 'done' : 'escalating', stepIndex: 0, remaining: CFG.stepSec },
          tally: bump(state.tally, 'escalated'),
        };
      }
      const nextStep = al.stepIndex + 1;
      return {
        ...state,
        alert:
          nextStep >= al.chain.length
            ? { ...al, phase: 'done', remaining: 0 }
            : { ...al, stepIndex: nextStep, remaining: CFG.stepSec },
      };
    }
    case 'IM_OK':
      return state.alert
        ? { ...state, alert: null, tally: bump(state.tally, 'imOk'), lastActiveMs: a.at, simNowMs: null }
        : state;
    case 'FALSE_ALARM':
      return state.alert
        ? { ...state, alert: null, tally: bump(state.tally, 'falseAlarm'), simNowMs: null }
        : state;
    case 'MISSED':
      return { ...state, tally: bump(state.tally, 'missed') };
    case 'RESET_TALLY':
      return { ...state, tally: initialState.tally };
    case 'TOGGLE_TASK':
      return { ...state, tasks: state.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) };
    case 'ADD_READING':
      return { ...state, readings: [...state.readings, { id: a.id, mgdl: a.mgdl, at: a.at }] };
    case 'SET_DIAL':
      return { ...state, members: state.members.map((m) => (m.id === a.id ? { ...m, dial: a.dial } : m)) };
    case 'SET_TIME_OFF':
      return { ...state, members: state.members.map((m) => (m.id === a.id ? { ...m, timeOff: a.on } : m)) };
    case 'VIEW': {
      // One entry per meaningful view, only for non-Person viewers, never twice in a row.
      if (a.viewer === 'person') return state;
      const last = state.audit[state.audit.length - 1];
      if (last && last.viewer === a.viewer && last.item === a.item) return state;
      return { ...state, audit: [...state.audit, { viewer: a.viewer, item: a.item, at: a.at }].slice(-100) };
    }
    case 'RESET':
      return { ...initialState, hydrated: true };
    default:
      return state;
  }
}
