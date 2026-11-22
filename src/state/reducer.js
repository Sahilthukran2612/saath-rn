import { addReading } from '../heart';
import { dayOf } from '../medicines';
import { planPatch } from '../carePlan';
import { markSlip } from '../suggestions';
import { CFG, clampDial, escalationChain, isDelegationActive, isInactive, validPhone } from '../logic';
import { adjustBaseline, cfgFrom, defaultBaseline } from '../care';
import { addCheckin, approveAdvance, declineAdvance, initialLadder, requestAdvance, stepBack } from '../plan';

// The routine a new install starts with. The person edits it under Me.
const DEFAULT_TASKS = [
  { id: 't1', icon: '💊', title: 'Morning medicine', done: false, hour: 8 },
  { id: 't2', icon: '🍚', title: 'Lunch', done: false, hour: 13 },
  { id: 't3', icon: '🚶', title: 'Evening walk', done: false, hour: 18 },
  { id: 't4', icon: '🩸', title: 'Sugar check', done: false, hour: 20 },
];

export const initialState = {
  hydrated: false,
  mode: 'elder', // 'teen' | 'elder' | 'adult'
  role: 'person', // how this phone is viewing: always 'person' now; kept for the reducer's audit trail
  phase: 'stable', // 'new' | 'stable' | 'crisis'
  largeText: false,
  lang: 'en',
  members: [], // the person's own emergency contacts, added in setup. Never pre-filled with made-up people
  tasks: DEFAULT_TASKS,
  readings: [],
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
  cloud: emptyCloud(), // sign-in for sync. Tokens sit unencrypted in local storage: a risk, see ARCHITECTURE
  outbox: [], // events for the circle waiting to be sent. Only when signed in, never more than 200
  outboxSeq: 0,
  joined: [], // people who joined my household from their own phones: { id, name, role, dial, time_off, share_contact }
  circles: [], // households I am a member of: { household_id, role, dial, time_off, person_name }
  feeds: {}, // household_id -> latest events I am allowed to see (kept for offline reading)
  seen: {}, // household_id -> created_at of the newest event I have looked at
  baseline: defaultBaseline(), // personal thresholds, tuned by false-alarm and missed feedback
  slips: { day: null, done: [], skipped: [] },
  carePlan: null, // the newest plan applied from a clinician: { version, author, at, notes, meds, tasks, seen }
  addPrefill: null, // a care-giver's card that was scanned: { name, phone, role }, waiting in the Add a person form
  visits: {}, // household id -> time of my last visit (an ASHA's round). Kept on this phone, never sent
  joinCode: null, // an invite code that arrived by scanning a QR, waiting to be used on the join screen
  // [{ id, name, dose, when }]: typed by the person from their prescription. Saath never suggests a dose.
  // [{ id, name, dose, when }]: typed by the person from their prescription. Saath never suggests a dose.
  medicines: [],
  medTaken: { day: null, ids: [] },
  // { 'YYYY-M-D': [medicine ids taken] }: the last 30 days, for the adherence chart.
  medLog: {},
  lastOkAt: null, // when the person last tapped "I'm OK" on Today (shown as "Last confirmed")
  readingsSyncedAt: 0, // time of the newest reading already sent to a doctor (see src/readingsSync.js)
  aiOn: true, // generated suggestion cards and the chat helper (needs internet; an anonymous summary is sent, see src/ai/context.js)
  aiCards: null, // { at, lang, cards: [...] } the newest generated cards, kept for offline use
  aiChat: [], // the last messages with the helper: [{ id, role: 'user' | 'assistant', text }]. Stays on this phone
  slipStats: {}, // slip id -> { done, skipped }: lets the pad learn which small things this person actually does
  foodPrefs: { region: 'north', diet: 'veg', disliked: [], recent: [] }, // drives the on-device meal ideas (mealGenerator.js) // suggestion slips stamped or put aside today (see suggestions.js)
  careEvents: { lastInsulinAt: null, lastMealAt: null }, // times only. Saath never records or suggests a dose
  meds: { name: '', pillsLeft: 0, perDay: 0 },
  testPlan: { perDay: 0, strips: 0 }, // set by the clinician; Saath only counts
  budget: [],
  background: false, // "keep watching in the background" (visible foreground service)
  heart: { device: null, readings: [], contact: true }, // Bluetooth heart-rate band. In memory only: never stored or sent
  siren: false, // a loud wail on this phone when nobody answers an alert (opt-in)
  reminders: false, // daily reminders on the phone, at each task's hour (opt-in)
  remindersDenied: false,
  autoSms: false, // send the alert SMS by itself when nobody answers (installed app only)
  autoSmsDenied: false, // the SMS permission was refused
  backgroundDenied: false, // the notification permission was refused, so the service did not start
  // Phase 3
  profile: { name: '', condition: '', allergies: '', emergencyId: null, myRole: null }, // myRole: how a care-giver describes themselves at sign-up
  ladder: initialLadder(),
  ladderApproval: false, // true: a parent must agree before the teen moves up a stage
  visitQuestions: [],
  checkins: [], // [{ week, mood 1-5, at }], one per week
  meals: [], // [{ id, icon, at }] icon-based meal log
  footChecks: [], // [{ at, items: [ids looked at] }]
  footPhotos: [], // [{ uri, at }] stay on the phone, never analysed
  waist: [], // [{ cm, at }]
  risk: null, // { answers, result, at } latest questionnaire
  usage: null, // 'person' (I need care), 'member' (guardian, neighbour, ASHA), 'doctor', 'both'. null until the first screen asks
  onboarded: false, // the setup flow runs once
  autoCall: false, // dial the contacts one by one when nobody answers an alert (installed app only)
  autoCallDenied: false, // the phone permissions for calling were refused
};

// What a fresh install starts with. There is no demo mode: no made-up people, numbers, readings or costs, and nothing
// is simulated. `productionState` is the same object under its older name.
export const productionState = initialState;
export const startState = initialState;

function emptyCloud() {
  return { phone: '', userId: null, access: null, refresh: null, householdId: null };
}

// Changes that must reach other phones go through the offline queue.
const enqueue = (state, a) => ({ ...state, queue: [...state.queue, { op: a.type, at: a.at ?? 0 }] });

const bump = (tally, key) => ({ ...tally, [key]: tally[key] + 1 });

// After a call to the contact being reached ends. A call that lasted long enough is taken as someone
// answering, and the chain stops; anything shorter (no answer, busy, declined) moves on to the next contact.
// Android does not tell an app whether an outgoing call was answered, so this length is a stated guess.
function afterCall(state, seconds) {
  const al = state.alert;
  if (!al || al.phase !== 'escalating') return state;
  const clear = { hold: false, heldFor: 0, calling: null };
  if (seconds >= CFG.callReachedSec) {
    return {
      ...state,
      alert: { ...al, ...clear, phase: 'done', remaining: 0, reached: al.chain[al.stepIndex]?.id ?? null },
    };
  }
  const next = al.stepIndex + 1;
  return {
    ...state,
    alert:
      next >= al.chain.length
        ? { ...al, ...clear, phase: 'done', remaining: 0 }
        : { ...al, ...clear, stepIndex: next, remaining: CFG.stepSec },
  };
}

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

function baseReducer(state, a) {
  switch (a.type) {
    case 'HYDRATE':
      return { ...state, ...a.saved, alert: null, hydrated: true };
    // Another person's data replaces everything, starting from defaults so nothing leaks across.
    case 'LOAD_PROFILE':
      return { ...startState, ...a.saved, alert: null, hydrated: true };
    case 'SET':
      return { ...state, [a.key]: a.value };
    case 'ACTIVITY':
      return { ...state, lastActiveMs: a.at };
    // The person tapped "I'm OK" on Today (not the alert). Counts as activity and tells the circle.
    case 'CHECK_IN':
      return { ...state, lastActiveMs: a.at, lastOkAt: a.at };
    case 'TRIGGER_ALERT':
      return openAlert(state, a);
    case 'QUIET_CHECK': {
      // a.lastActiveMs and a.nowMs come from the sensing service or the fast-forward simulation
      const cfg = cfgFrom(state.baseline);
      const r = isInactive(a.lastActiveMs, a.nowMs, cfg, cfg.inactiveHours);
      const next = { ...state, lastActiveMs: a.lastActiveMs, simNowMs: a.simulated ? a.nowMs : null };
      return r.inactive
        ? openAlert(next, { kind: 'quiet', confidence: r.confidence, reason: r.reason, id: a.id })
        : next;
    }
    case 'TICK': {
      const al = state.alert;
      if (!al || al.phase === 'done') return state;
      if (al.hold) {
        // a call is in progress: the clock waits for it to end, but never forever
        const held = (al.heldFor || 0) + 1;
        return held >= CFG.callMaxHoldSec
          ? afterCall(state, 0)
          : { ...state, alert: { ...al, heldFor: held } };
      }
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
        ? {
            ...state,
            alert: null,
            tally: bump(state.tally, 'falseAlarm'),
            baseline: adjustBaseline(state.baseline, state.alert.kind, 'false_alarm'),
            simNowMs: null,
          }
        : state;
    case 'MISSED':
      return {
        ...state,
        tally: bump(state.tally, 'missed'),
        baseline: adjustBaseline(state.baseline, a.kind || 'fall', 'missed'),
      };
    case 'LADDER_REQUEST':
      return enqueue(
        { ...state, ladder: requestAdvance(state.ladder, a.id, { needsApproval: state.ladderApproval }) },
        a
      );
    case 'LADDER_APPROVE':
      return enqueue({ ...state, ladder: approveAdvance(state.ladder, a.id) }, a);
    case 'LADDER_DECLINE':
      return { ...state, ladder: declineAdvance(state.ladder, a.id) };
    case 'LADDER_BACK':
      return enqueue({ ...state, ladder: stepBack(state.ladder, a.id) }, a);
    case 'PROFILE_SET':
      return { ...state, profile: { ...state.profile, ...a.patch } };
    case 'VISIT_Q_ADD': {
      const text = String(a.text || '').trim();
      return text ? { ...state, visitQuestions: [...state.visitQuestions, text].slice(-20) } : state;
    }
    case 'VISIT_Q_REMOVE':
      return { ...state, visitQuestions: state.visitQuestions.filter((_, i) => i !== a.index) };
    case 'CHECKIN':
      return { ...state, checkins: addCheckin(state.checkins, a.mood, a.at) };
    case 'MEAL_LOG':
      return { ...state, meals: [...state.meals, { id: a.id, icon: a.icon, at: a.at }].slice(-60) };
    case 'FOOT_CHECK':
      return { ...state, footChecks: [...state.footChecks, { at: a.at, items: a.items }].slice(-60) };
    case 'FOOT_PHOTO':
      return { ...state, footPhotos: [...state.footPhotos, { uri: a.uri, at: a.at }].slice(-30) };
    case 'WAIST_ADD':
      return a.cm > 30 && a.cm < 250
        ? { ...state, waist: [...state.waist, { cm: a.cm, at: a.at }].slice(-60) }
        : state;
    case 'RISK_SET':
      return { ...state, risk: { answers: a.answers, result: a.result, at: a.at } };
    case 'RESET_BASELINE':
      return { ...state, baseline: defaultBaseline() };
    case 'LOG_INSULIN': // time only: there is deliberately no dose field
      return { ...state, careEvents: { ...state.careEvents, lastInsulinAt: a.at } };
    case 'LOG_MEAL':
      return { ...state, careEvents: { ...state.careEvents, lastMealAt: a.at } };
    case 'MEDS_SET':
      return { ...state, meds: { ...state.meds, pillsLeft: Math.max(0, a.pillsLeft) } };
    case 'STRIPS_SET':
      return { ...state, testPlan: { ...state.testPlan, strips: Math.max(0, a.strips) } };
    case 'BUDGET_ADD':
      return { ...state, budget: [...state.budget, { id: a.id, amount: a.amount, cat: a.cat, at: a.at }] };
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
    case 'TASK_HOUR':
      return enqueue(
        { ...state, tasks: state.tasks.map((t) => (t.id === a.id ? { ...t, hour: a.hour } : t)) },
        a
      );
    case 'TASK_DELETE':
      return enqueue({ ...state, tasks: state.tasks.filter((t) => t.id !== a.id) }, a);
    case 'ADD_READING':
      return {
        ...state,
        readings: [...state.readings, { id: a.id, mgdl: a.mgdl, at: a.at }],
        testPlan: { ...state.testPlan, strips: Math.max(0, state.testPlan.strips - 1) },
      };
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
    case 'HEART_DEVICE':
      return { ...state, heart: { device: a.device, readings: [], contact: true } };
    case 'HEART_READING':
      return state.heart.device
        ? {
            ...state,
            heart: {
              ...state.heart,
              readings: addReading(state.heart.readings, a.bpm, a.at),
              contact: a.contact,
            },
          }
        : state;
    case 'CALL_START':
      return state.alert && state.alert.phase === 'escalating'
        ? {
            ...state,
            alert: {
              ...state.alert,
              hold: true,
              heldFor: 0,
              calling: state.alert.chain[state.alert.stepIndex]?.id ?? null,
            },
          }
        : state;
    case 'CALL_END':
      return afterCall(state, Number(a.seconds) || 0);
    case 'CONTACT_ADD': {
      const name = String(a.name || '').trim();
      const digits = String(a.phone || '')
        .replace(/\D/g, '')
        .slice(-10);
      const role = ['family', 'neighbour', 'asha', 'clinician'].includes(a.role) ? a.role : 'family';
      const real = state.members;
      if (name.length < 2 || !validPhone(digits) || real.length >= 12) return state;
      if (real.some((m) => String(m.phone).replace(/\D/g, '').slice(-10) === digits)) return state;
      const member = { id: a.id, name, role, dial: 0, timeOff: false, phone: digits, shareContact: true };
      return {
        ...state,
        members: [...state.members, member],
        profile:
          state.profile.emergencyId && state.members.some((m) => m.id === state.profile.emergencyId)
            ? state.profile
            : { ...state.profile, emergencyId: a.id },
      };
    }
    case 'CONTACT_REMOVE': {
      const members = state.members.filter((m) => m.id !== a.id);
      return {
        ...state,
        members,
        // a person added in one step has an invite with the same id: taking the person away takes the invite too
        invites: state.invites.filter((i) => !(i.id === a.id && i.status === 'pending')),
        profile:
          state.profile.emergencyId === a.id
            ? { ...state.profile, emergencyId: members[0]?.id ?? null }
            : state.profile,
      };
    }
    case 'CLOUD_SET':
      return { ...state, cloud: { ...state.cloud, ...a.patch } };
    case 'CLOUD_SIGN_OUT':
      return { ...state, cloud: emptyCloud(), outbox: [], joined: [], circles: [], feeds: {}, seen: {} };
    case 'JOINED_SET':
      return { ...state, joined: a.members };
    case 'JOINED_DIAL':
      return {
        ...state,
        joined: state.joined.map((m) =>
          m.id === a.id && [0, 1, 2].includes(a.dial) ? { ...m, dial: a.dial } : m
        ),
      };
    case 'CIRCLE_TIMEOFF':
      return {
        ...state,
        circles: state.circles.map((c) => (c.household_id === a.id ? { ...c, time_off: !!a.on } : c)),
      };
    case 'CIRCLES_SET':
      return { ...state, circles: a.circles };
    case 'FEED_SET':
      return { ...state, feeds: { ...state.feeds, [a.id]: a.events.slice(0, 30) } };
    case 'SEEN_SET':
      return { ...state, seen: { ...state.seen, [a.id]: a.at } };
    case 'SLIP': {
      const prev = state.slipStats?.[a.id] || { done: 0, skipped: 0 };
      const key = a.how === 'done' ? 'done' : 'skipped';
      return {
        ...state,
        slips: markSlip(state.slips, a.id, a.how, a.now),
        slipStats: { ...state.slipStats, [a.id]: { ...prev, [key]: prev[key] + 1 } },
      };
    }
    case 'READINGS_RESTORE': {
      // This account's readings that are on the server but not on this phone (a new phone, or cleared data). Each is
      // added once, by its id, so polling again never duplicates anything; readings typed here are kept as they are.
      const have = new Set(state.readings.map((r) => r.id));
      const add = (a.readings || []).filter(
        (r) => r && r.id && !have.has(r.id) && Number.isFinite(r.at) && Number.isFinite(r.mgdl)
      );
      if (!add.length) return state;
      return { ...state, readings: [...state.readings, ...add].sort((x, y) => x.at - y.at) };
    }
    case 'READINGS_SYNCED':
      return { ...state, readingsSyncedAt: Math.max(state.readingsSyncedAt || 0, Number(a.at) || 0) };
    case 'AI_CARDS':
      return { ...state, aiCards: { at: a.at, lang: a.lang, cards: (a.cards || []).slice(0, 7) } };
    case 'AI_CHAT_ADD':
      return {
        ...state,
        aiChat: [
          ...(state.aiChat || []),
          {
            id: a.id,
            role: a.role === 'assistant' ? 'assistant' : 'user',
            text: String(a.text).slice(0, 700),
          },
        ].slice(-30),
      };
    case 'AI_CHAT_CLEAR':
      return { ...state, aiChat: [] };
    case 'MED_ADD':
      return {
        ...state,
        medicines: [...state.medicines, { id: a.id, name: a.name, dose: a.dose || '', when: a.when }].slice(
          -30
        ),
      };
    case 'MED_REMOVE':
      return { ...state, medicines: state.medicines.filter((m) => m.id !== a.id) };
    case 'MED_TAKEN': {
      const today = dayOf(a.now);
      const base = state.medTaken?.day === today ? state.medTaken : { day: today, ids: [] };
      const ids = base.ids.includes(a.id) ? base.ids.filter((x) => x !== a.id) : [...base.ids, a.id];
      const log = { ...state.medLog, [today]: ids };
      // keys are 'YYYY-M-D' without padding, so order them as dates, not as text
      const asTime = (k) => {
        const [y, m, d] = k.split('-').map(Number);
        return new Date(y, m - 1, d).getTime();
      };
      const days = Object.keys(log).sort((x, y) => asTime(x) - asTime(y));
      for (const d of days.slice(0, Math.max(0, days.length - 30))) delete log[d];
      return { ...state, medTaken: { day: today, ids }, medLog: log };
    }
    case 'PLAN_APPLY': {
      // Only a newer plan is applied, so polling again never redoes or undoes anything.
      if (state.carePlan && String(a.version) <= String(state.carePlan.version)) return state;
      return { ...state, ...planPatch(state, a.plan, { version: a.version, author: a.author, at: a.at }) };
    }
    case 'PLAN_SEEN':
      return state.carePlan ? { ...state, carePlan: { ...state.carePlan, seen: true } } : state;
    case 'ADD_PREFILL':
      return { ...state, addPrefill: a.value || null };
    case 'VISIT_MARK':
      return { ...state, visits: { ...state.visits, [a.id]: a.at } };
    case 'USAGE_IF_NEW':
      return state.usage == null ? { ...state, usage: a.value } : state;
    case 'JOIN_CODE':
      return { ...state, joinCode: a.code || null };
    case 'FOOD_PREFS':
      return { ...state, foodPrefs: { ...state.foodPrefs, ...a.patch } };
    case 'FOOD_NOT': {
      const f = state.foodPrefs;
      return { ...state, foodPrefs: { ...f, disliked: [...new Set([...f.disliked, ...a.ids])].slice(-30) } };
    }
    case 'FOOD_TAKE': {
      const f = state.foodPrefs;
      return { ...state, foodPrefs: { ...f, recent: [...f.recent, ...a.ids].slice(-18) } };
    }
    case 'FOOD_RESET':
      return { ...state, foodPrefs: { ...state.foodPrefs, disliked: [], recent: [] } };
    case 'INVITE_SYNCED':
      return { ...state, invites: state.invites.map((i) => (i.id === a.id ? { ...i, cloud: true } : i)) };
    case 'OUTBOX_SENT':
      return { ...state, outbox: state.outbox.filter((e) => !a.ids.includes(e.id)) };
    case 'RESET':
      return { ...startState, hydrated: true };
    default:
      return state;
  }
}

// What the circle should hear about, as plain events (0 safety, 1 routine). Fixed kinds only, and no
// dose, amount or reading values: the circle gets "something happened", not medical numbers.
function eventFor(prev, next, a) {
  switch (a.type) {
    case 'TRIGGER_ALERT':
      return next.alert && !prev.alert ? { eventType: 0, kind: a.kind } : null;
    case 'IM_OK':
      return prev.alert ? { eventType: 0, kind: 'im_ok' } : null;
    case 'CHECK_IN':
      return { eventType: 1, kind: 'im_ok' };
    case 'FALSE_ALARM':
      return prev.alert ? { eventType: 0, kind: 'false_alarm' } : null;
    case 'TOGGLE_TASK': {
      const was = prev.tasks.find((t) => t.id === a.id);
      const now = next.tasks.find((t) => t.id === a.id);
      return was && now && !was.done && now.done
        ? { eventType: 1, kind: 'task_done', detail: now.title }
        : null;
    }
    default:
      return null;
  }
}

export function reducer(state, a) {
  const next = baseReducer(state, a);
  if (!next.cloud?.access || next === state) return next;
  const e = eventFor(state, next, a);
  if (!e) return next;
  const seq = next.outboxSeq + 1;
  return { ...next, outboxSeq: seq, outbox: [...next.outbox, { id: seq, ...e }].slice(-200) };
}
