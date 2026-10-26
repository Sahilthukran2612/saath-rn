# Data model (local state, persisted to AsyncStorage key `saath/state/v1`)

Never persisted: `alert` (a stale countdown after restart would be wrong), `hydrated`, `lastActiveMs`, `simNowMs`.

| Field | Shape | Notes |
|---|---|---|
| `mode` | `teen` / `elder` / `adult` | Changes the home screen. `teen` requires guardian consent |
| `role` | `person` / `family` / `neighbour` / `asha` / `clinician` | Demo switcher only until accounts exist |
| `phase` | `new` / `stable` / `crisis` | Guidance and prompt limits (`phaseDefaults`) |
| `members[]` | `{ id, name, role, dial 0-2, timeOff, guardian?, phone, shareContact }` | `dial` is the Privacy Dial. `shareContact` is that member's own consent to show their number |
| `consent` | `{ status, guardianName, guardianPhone, at }` | Local record only. Does not verify identity. Needs legal review |
| `invites[]` | `{ id, name, phone, role, code, status }` | Joining is simulated |
| `delegations[]` | `{ id, kind help/task, taskId, to, expiresAt, status open/done/expired }` | Expire on their own |
| `tasks[]` | `{ id, icon, title, done, hour? }` | Rhythm Board. Edits go to `queue` |
| `queue[]`, `online`, `synced` | `{ op, at }` | Offline queue. "Go online" only simulates a sync |
| `audit[]` | `{ viewer, item, at }` | One entry per meaningful view by a non-Person viewer |
| `alert` | `{ id, kind fall/quiet, confidence, reason, phase countdown/escalating/done, remaining, stepIndex, chain[] }` | Not persisted |
| `tally` | `{ alerts, imOk, escalated, falseAlarm, missed }` | For the sensor trial and CSV export |
| `baseline` | `{ impactG, inactiveHours }` | Personal thresholds. Limits: impact 1.8 to 4.0 g, quiet 3 to 12 h. Moves 0.1 g or 0.5 h per feedback |
| `readings[]` | `{ id, mgdl, at, demo? }` | Manual entry |
| `careEvents` | `{ lastInsulinAt, lastMealAt }` | **Times only. There is no dose field anywhere** |
| `meds` | `{ name, pillsLeft, perDay }` | Refill days = `floor(pillsLeft / perDay)`. Alert at 7 days (soon) and 3 days (now) |
| `testPlan` | `{ perDay, strips }` | Set by the clinician. Saath only counts |
| `budget[]` | `{ id, amount, cat, at, demo? }` | Categories: medicine, strips, travel, other |

## Event types and the Privacy Dial
safety = 0, routine = 1, summary = 2. A member receives an event when `eventType <= dial`, and safety always passes. Time Off mutes non-safety reminders only.

## Second-person data
`canShareItem(item, consents)`: an item that involves other people is shared only when every involved person has consented. Today this covers member phone numbers.
