import { CFG, clampDial, escalationChain, isDelegationActive, isInactive } from '../logic';

export const SEED = {
  members: [
    // Demo numbers are fake. shareContact is that member's own consent to show their number to the circle.
    {
      id: 'm1',
      name: 'Asha (daughter)',
      role: 'family',
      dial: 2,
      timeOff: false,
      guardian: true,
      phone: '9000000001',
      shareContact: true,
    },
    {
      id: 'm2',
      name: 'Ramesh (neighbour)',
      role: 'neighbour',
      dial: 0,
      timeOff: false,
      phone: '9000000002',
      shareContact: false,
    },
    {
      id: 'm3',
      name: 'Sunita (ASHA)',
      role: 'asha',
      dial: 1,
      timeOff: false,
      phone: '9000000003',
      shareContact: false,
    },
    {
      id: 'm4',
      name: 'Dr. Rao (clinic)',
      role: 'clinician',
      dial: 1,
      timeOff: false,
      phone: '9000000004',
      shareContact: true,
    },
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
  invites: [], // { id, name, phone, role, code, status: 'pending' | 'accepted' }
  delegations: [], // { id, kind: 'help' | 'task', taskId, to, expiresAt, status: 'open' | 'done' | 'expired' }
  consent: { status: 'none', guardianName: '', guardianPhone: '', at: null }, // minors: needs legal review
  queue: [], // offline queue of changes waiting to sync
  online: false, // no backend yet (Phase 4): "going online" only simulates a sync
  synced: 0,
};

// Changes that must reach other phones go through the offline queue.
const enqueue = (state, a) => ({ ...state, queue: [...state.queue, { op: a.type, at: a.at ?? 0 }] });

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
      return enqueue(
        { ...state, tasks: state.tasks.map((t) => (t.id === a.id ? { ...t, done: !t.done } : t)) },
        a
      );
    case 'TASK_ADD':
      return enqueue(
        {
          ...state,
          tasks: [
            ...state.tasks,
            { id: a.id, icon: a.icon || '📌', title: a.title, done: false, hour: a.hour ?? null },
          ],
        },
        a
      );
    case 'TASK_EDIT':
      return enqueue(
        {
          ...state,
          tasks: state.tasks.map((t) =>
            t.id === a.id ? { ...t, title: a.title, hour: a.hour ?? t.hour } : t
          ),
        },
        a
      );
    case 'TASK_DELETE':
      return enqueue({ ...state, tasks: state.tasks.filter((t) => t.id !== a.id) }, a);
    case 'ADD_READING':
      return { ...state, readings: [...state.readings, { id: a.id, mgdl: a.mgdl, at: a.at }] };
    case 'SET_DIAL': {
      // Clamp to the guardian limit for teens. Safety alerts are not governed by the dial.
      const dial = clampDial(state.members.find((m) => m.id === a.id) || {}, a.dial, state.mode);
      return { ...state, members: state.members.map((m) => (m.id === a.id ? { ...m, dial } : m)) };
    }
    case 'SET_SHARE_CONTACT':
      return {
        ...state,
        members: state.members.map((m) => (m.id === a.id ? { ...m, shareContact: a.on } : m)),
      };
    case 'INVITE_ADD':
      return enqueue(
        {
          ...state,
          invites: [
            ...state.invites,
            { id: a.id, name: a.name, phone: a.phone, role: a.role, code: a.code, status: 'pending' },
          ],
        },
        a
      );
    case 'INVITE_ACCEPT': {
      // Simulated until accounts exist. A new member starts at Safety only (most private).
      const inv = state.invites.find((i) => i.id === a.id && i.status === 'pending');
      if (!inv) return state;
      return {
        ...state,
        invites: state.invites.map((i) => (i.id === a.id ? { ...i, status: 'accepted' } : i)),
        members: [
          ...state.members,
          {
            id: `m-${inv.id}`,
            name: inv.name,
            role: inv.role,
            dial: 0,
            timeOff: false,
            phone: inv.phone,
            shareContact: false,
          },
        ],
      };
    }
    case 'DELEGATE':
    case 'HELP_REQUEST':
      return enqueue(
        {
          ...state,
          delegations: [
            ...state.delegations,
            {
              id: a.id,
              kind: a.type === 'HELP_REQUEST' ? 'help' : 'task',
              taskId: a.taskId ?? null,
              to: a.to,
              expiresAt: a.expiresAt,
              status: 'open',
            },
          ],
        },
        a
      );
    case 'DELEGATION_DONE':
      return {
        ...state,
        delegations: state.delegations.map((d) =>
          d.id === a.id && d.status === 'open' ? { ...d, status: 'done' } : d
        ),
      };
    case 'EXPIRE_DELEGATIONS':
      return {
        ...state,
        delegations: state.delegations.map((d) =>
          d.status === 'open' && !isDelegationActive(d, a.now) ? { ...d, status: 'expired' } : d
        ),
      };
    case 'GRANT_CONSENT':
      return {
        ...state,
        consent: {
          status: 'granted',
          guardianName: a.guardianName,
          guardianPhone: a.guardianPhone,
          at: a.at,
        },
      };
    case 'REVOKE_CONSENT':
      return { ...state, consent: initialState.consent };
    case 'SET_ONLINE': {
      // Simulated sync: going online clears the queue and counts what was sent.
      const flush = a.online && state.queue.length > 0;
      return {
        ...state,
        online: a.online,
        queue: flush ? [] : state.queue,
        synced: state.synced + (flush ? state.queue.length : 0),
      };
    }
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
