// Who is holding this phone. There are three kinds, and they are kept apart on purpose:
//   person  "I need care"            sensors, contacts, the privacy dial, their own care
//   member  "I look after someone"   a guardian, neighbour or ASHA, for each person they were invited by
//   doctor  "I am a doctor"          their patients only; never a guardian, neighbour or ASHA to anyone
// (A person can also be `both`: someone who needs care and looks after someone.)
export const isDoctor = (state) => state.usage === 'doctor';
export const isMember = (state) => state.usage === 'member';
// Phones that look after others and so have no sensors of their own.
export const looksAfterOthers = (state) => isDoctor(state) || isMember(state);

// A doctor's patients are the circles where they are the doctor. A guardian, neighbour or ASHA sees every circle
// except the ones where they are a doctor. Anything else is hidden, not deleted.
export function circlesFor(state) {
  const all = state.circles || [];
  if (isDoctor(state)) return all.filter((c) => c.role === 'clinician');
  if (isMember(state)) return all.filter((c) => c.role !== 'clinician');
  return all;
}
export const hiddenCount = (state) => (state.circles || []).length - circlesFor(state).length;
