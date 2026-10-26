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

**Sampling (corrected).** An earlier draft proposed short sampling windows every 30 s. That is wrong for falls: an impact lasts a fraction of a second, so a window would miss most of them. The detector needs continuous low-rate sampling instead, and the saving has to come from a lower rate or hardware batching, not from switching the sensor off. Today the JavaScript listener samples at 10 Hz. **Battery cost has not been measured.** Next steps: profile 5 Hz against 10 Hz on a real phone, and consider Android sensor batching in the native module so the CPU can sleep between batches.

**Data gaps.** Samples can stop (battery saver, process kill). `detectFall` treats too few samples after an impact as "unsure" and asks the person. `isInactive` uses the last activity time, so a gap is shown as a gap, not as inactivity by itself.

**Battery.** Phone brands kill services differently (Xiaomi, Oppo, Vivo, Realme, Samsung, OnePlus, Huawei). The app will show a one-time, brand-specific guide to turn off battery optimisation for Saath. Not yet written.

## What is built vs not (be exact)
| Piece | Status |
|---|---|
| Detection and inactivity logic, personal baseline, confidence | Built, unit tested, and the foreground path was run on an Android emulator with injected sensor values |
| Foreground listener in Expo Go | Built, works only while the app is open |
| Foreground service | **Written and compiled, not yet run.** Local Expo module `modules/saath-foreground` (Kotlin service + module, `specialUse` type, visible ongoing notification) is autolinked. Its Kotlin compiles and the service and permissions appear in the merged manifest. A "Keep watching in the background" switch on the Me tab starts and stops it, asks for the notification permission first, and turns itself off if refused (unit-tested with a mocked native layer). **The APK was not built**, so the service has not run on a device: the C++ part of the Gradle build fails on Windows' 260-character path limit (see "Build blocker" below) |
| Headless task | Not needed with this design: the service keeps the process alive and the existing JS listener keeps running. Not yet verified that JS keeps running with the app swiped away; that needs the APK |
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

## Build blocker (Windows)
`./gradlew assembleDebug` compiles the Kotlin, resolves dependencies and installs SDK platform 37, Build-Tools 36 and the NDK, then fails in `:app:buildCMakeDebug` with `ninja: error: mkdir(...): No such file or directory`. React Native builds the generated C++ for libraries such as `react-native-safe-area-context` and `react-native-svg`, and CMake mirrors each source path under the build folder. The longest object path is about 327 characters, and Windows stops at 260. The project path appears twice in it, so even a very short folder (`D:\s`) plus a short build folder only reaches about 278.

What was tried: a virtual drive (`subst`), which breaks Gradle plugin resolution because Node returns real paths. What remains:
1. Turn on Windows long paths (`LongPathsEnabled=1`, needs an administrator) **and** use a CMake whose Ninja is long-path aware. The CMake 3.22.1 bundled with the SDK ships an older Ninja, so this may still fail; a newer CMake from the SDK Manager is the likely fix.
2. Build on Linux, WSL or a CI runner.
3. Cloud build (EAS). That uploads the project to a third party, so it needs the team's decision first.

Other build notes: Java could not reach `services.gradle.org` (IPv6), so the Gradle zip was downloaded with PowerShell and `distributionUrl` pointed at it; `-Djava.net.preferIPv4Stack=true` is set. The generated `android/` folder is not committed (it is regenerated by `npx expo prebuild`), so these edits live only on this machine.