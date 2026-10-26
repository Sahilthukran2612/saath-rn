// Trial tally as CSV so the team can collect about 20 scripted trials.
export function tallyToCsv(tally, now = new Date()) {
  const head = 'exported_at,alerts,im_ok,escalated,false_alarm,missed';
  const row = [
    now.toISOString(),
    tally.alerts,
    tally.imOk,
    tally.escalated,
    tally.falseAlarm,
    tally.missed,
  ].join(',');
  return `${head}\n${row}\n`;
}
