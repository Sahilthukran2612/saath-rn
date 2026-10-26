# Architecture

## Layers
```
screens / components      React Native views, one primary action per screen
state (reducer + store)   one reducer, AsyncStorage persistence, offline queue
care.js, logic.js         pure functions: privacy dial, escalation, detection, glucose rules, budget
services                  sensing (accelerometer), voice (expo-speech), storage, export
i18n/strings.js           every UI string in English and Hindi, key parity enforced by a test
```
Rules that live in pure functions are unit tested without a device. The reducer is the only place state changes, so counts (alerts, escalated) are incremented once per transition.

## Background sensing: decision (Phase 2)
**Problem.** Expo Go only senses while the app is open. A fall or long quiet matters most when the app is closed. Android 8+ stops background work unless it is a visible foreground service.

**Decision.** Use `expo prebuild` and a development client, with a **foreground service** started from a small native module. The service shows a persistent notification ("Saath is helping notice when you may need help"), samples the accelerometer on a duty cycle, and calls the same `detectFall` / `isInactive` logic through a headless JS task.

**Why this and not the alternatives.**
| Option | Verdict |
|---|---|
| Stay in Expo Go | Cannot run in the background. Fine for demos only. Current state. |
| `expo-task-manager` / background fetch | Runs at best every 15 minutes and is killed by battery savers. Cannot catch a fall. |
| Foreground service (chosen) | The only supported way to keep an accelerometer listener alive. Visible to the user, which also fits "no silent watching". |
| Flutter / Kotlin rewrite | Not worth losing the tested JS logic and Expo tooling. |

**Duty cycle (planned).** Sample at 10 Hz in 5 s windows every 30 s while the phone is moving or screen on; drop to a low-rate wake-up when the phone has been still. A window that detects an impact switches to continuous sampling for the 3 s stillness check. All numbers live in `CFG`.

**Data gaps.** Samples can stop (battery saver, process kill). `detectFall` treats too few samples after an impact as "unsure" and asks the person. `isInactive` uses the last activity time, so a gap is shown as a gap, not as inactivity by itself.

**Battery.** Phone brands kill services differently (Xiaomi, Oppo, Vivo, Realme, Samsung, OnePlus, Huawei). The app will show a one-time, brand-specific guide to turn off battery optimisation for Saath. Not yet written.

## What is built vs not (be exact)
| Piece | Status |
|---|---|
| Detection and inactivity logic, personal baseline, confidence | Built, unit tested, and the foreground path was run on an Android emulator with injected sensor values |
| Foreground listener in Expo Go | Built, works only while the app is open |
| Foreground service, duty cycling, headless task | **Not built.** Needs `expo prebuild` and the Android NDK. Not attempted because the system drive had about 4.5 GB free; see TEST_REPORT |
| Escalation step 1: push to the circle | **Not built.** Needs accounts and FCM (Phase 4). The UI shows the contact being reached but does not send a push |
| Escalation fallback: tap-to-call and prefilled SMS | Built. Opens the dialer or SMS app with the number and text filled in. The person must tap Call or Send. Run on the emulator (dialer opened with the right number). SMS composer not run |
| Optional SMS gateway | **Not built.** Needs a server and a provider. Configurable endpoint planned |
| Glucometer photo | **Not built.** Needs camera and a manual fallback. Manual entry is the only path today |

## Not tested
Real devices, real falls, battery drain, brand-specific background kills, TalkBack, voice on a device speaker.

## Privacy by design
Raw accelerometer samples stay in memory inside `sensing.js` (8 s buffer) and are never stored or sent. Only the event (alert kind, confidence, reason) enters state. Phone numbers are used to build `tel:` and `sms:` links on the device; they are shown to the circle only if that member agreed (`shareContact`). See `docs/DATA_MODEL.md`.

## Phase 4 sync (planned)
Supabase Postgres with row-level security that implements the Privacy Dial (a row of type safety is visible to every member, routine to dial >= 1, summary to dial = 2), plus FCM for push. The app stays local-first: the existing `queue` is the sync queue.
