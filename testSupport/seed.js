// Test data only: a household that is already set up, so reducer and screen tests do not each have to build one.
// The app itself never contains any of this. A real install starts empty (see initialState in the reducer).
// No imports on purpose: jest.setup.js uses this while it is replacing the reducer module.
const DAY = 86400000;

export const SEED = {
  members: [
    { id: 'm1', name: 'Asha (daughter)', role: 'family', dial: 2, timeOff: false, guardian: true, phone: '9000000001', shareContact: true },
    { id: 'm2', name: 'Ramesh (neighbour)', role: 'neighbour', dial: 0, timeOff: false, phone: '9000000002', shareContact: false },
    { id: 'm3', name: 'Sunita (ASHA)', role: 'asha', dial: 1, timeOff: false, phone: '9000000003', shareContact: false },
    { id: 'm4', name: 'Dr. Rao (clinic)', role: 'clinician', dial: 1, timeOff: false, phone: '9000000004', shareContact: true },
  ],
  readings: Array.from({ length: 14 }, (_, i) => i).flatMap((i) => [
    { id: `r${i}a`, mgdl: 96 + ((i * 17) % 38), at: Date.now() - (13 - i) * DAY - 5 * 3600000 },
    { id: `r${i}b`, mgdl: 118 + ((i * 29) % 52), at: Date.now() - (13 - i) * DAY - 3600000 },
  ]),
};

export const makeSeeded = (base) => ({
  ...base,
  usage: 'person',
  onboarded: true,
  members: SEED.members,
  readings: SEED.readings,
  medicines: [{ id: 'med1', name: 'Metformin', dose: 'as on the prescription', when: 'afterBreakfast' }],
  meds: { name: 'Metformin', pillsLeft: 24, perDay: 2 },
  testPlan: { perDay: 2, strips: 20 },
  budget: [
    { id: 'b1', amount: 420, cat: 'medicine', at: Date.now() - 2 * DAY },
    { id: 'b2', amount: 260, cat: 'strips', at: Date.now() - 5 * DAY },
    { id: 'b3', amount: 380, cat: 'medicine', at: Date.now() - 33 * DAY },
  ],
  profile: { ...base.profile, emergencyId: 'm1' },
});
