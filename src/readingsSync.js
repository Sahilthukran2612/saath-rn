// Which sugar readings this phone should upload for a doctor. The person's own consent is the Privacy Dial: nothing
// leaves the phone unless a doctor who joined the circle is at Full (2). The database enforces the same on the
// reading side (docs/supabase/readings.sql). Pure, tested.

export const doctorHasFullAccess = (joined) => (joined || []).some((m) => m.role === 'clinician' && m.dial === 2);

export function readingsToPush(state, max = 200) {
  const cloud = state.cloud || {};
  if (!cloud.access || !cloud.householdId) return [];
  if (!doctorHasFullAccess(state.joined)) return [];
  const since = state.readingsSyncedAt || 0;
  return (state.readings || [])
    .filter((r) => r.at > since && Number.isFinite(r.mgdl) && r.mgdl >= 20 && r.mgdl <= 600)
    .sort((a, b) => a.at - b.at)
    .slice(0, max)
    .map((r) => ({
      household_id: cloud.householdId,
      client_id: String(r.id).slice(0, 40),
      mgdl: Math.round(r.mgdl),
      at: new Date(r.at).toISOString(),
    }));
}
