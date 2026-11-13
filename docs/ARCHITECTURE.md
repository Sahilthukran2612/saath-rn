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

Status: the schema and policies are written in `docs/supabase/schema.sql` (`can_see_event` mirrors `canReceive`; phone numbers only through the `members_public` view; no dose columns; a trigger keeps a guardian at Routine or above). **It has not been applied to a database and the policies are untested.** The app does not call it. Next steps need a Supabase project and an FCM key: apply the schema, write policy tests, add a thin sync adapter that drains `state.queue`, add phone sign-in.

### Sync client (built, tested against a fake server)
`src/services/cloud.js` talks plain HTTP (Supabase Auth and PostgREST) to a server whose address is configuration (`EXPO_PUBLIC_SAATH_API_URL`, `EXPO_PUBLIC_SAATH_ANON_KEY`), so a blocked domain is fixed by pointing at a custom domain or proxy, not by changing code. India blocked `*.supabase.co` at ISP level from February 2026 and reportedly restored access in October 2026, which is why the address is not hard-coded and why the app stays offline-first: a fall alert, its countdown and tap-to-call never wait for a server.

Flow: the person signs in with a phone code on the Me tab. While signed in, the reducer appends fixed-kind events to `outbox` (fall or quiet alert, answering or false-alarming it, tapping I'm OK, finishing a task; capped at 200). `useCloudSync` sends them in one batch, refreshes an expired token once, and retries every minute. Events carry no readings, doses or amounts (a test checks this). Setup steps and gaps are in `docs/supabase/SETUP.md`.

Circle side: circleFeed.js words events and decides which alert needs attention (recent, unseen, not answered by the person afterwards). useCloudSync runs one ordered pass every 30 s while the app is open (send events, publish invites, share the name, read my circles and their feeds); passes never overlap because refresh tokens rotate. CirclesSection (Circle tab) lists the people I look after, shows the feed and joins with a code; CircleAlertBanner shows a fall or quiet alert on every tab until it is seen. The server decides what a member may read (row-level security against the dial); the app only words it. Sign-in tokens are kept in expo-secure-store (Android Keystore), not in the plain state file; the schema's members_read policy uses a security-definer is_member() because a policy that queried its own table would recurse.

Not done: no push (a member sees an alert only while the app is open), the dial, Time Off and shared-number settings are not yet written to the server (a joined member stays at safety only), no Call button for members, and none of it has run against a real server or two real phones.

## Shared-phone mode (Phase 4, built)
One phone, several people. `src/profiles.js` holds the pure rules: a registry of profiles, salted and stretched PIN hashes, lockout after five wrong tries (one minute, shared by all profiles so guesses cannot be multiplied by switching profile), and per-profile storage keys (the first profile keeps the original key, so older data is found). `StoreProvider` loads the active profile's state and, after a correct PIN, swaps in another person's state starting from defaults (`LOAD_PROFILE`) so nothing leaks across.

Decisions that matter for safety:
- The lock screen renders `AlertBanner` next to it, so a fall alert shows over the lock and needs no PIN.
- While an alert is open, another person cannot take over the phone ("Answer the safety alert first").
- Sensing and the foreground service keep running for the last active person when the phone is locked.
- The app locks when it goes to the background. Opening the camera (foot photo) backgrounds the app, so the person re-enters their PIN afterwards.

Limits: the PIN is not encryption. State is stored unencrypted in AsyncStorage, so someone with the phone and developer tools can read it. Removing a person is not built. A new person starts with demo data when Demo mode is on. Not run on a phone or an emulator, only in Jest.

## Build blocker (Windows)
`./gradlew assembleDebug` compiles the Kotlin, resolves dependencies and installs SDK platform 37, Build-Tools 36 and the NDK, then fails in `:app:buildCMakeDebug` with `ninja: error: mkdir(...): No such file or directory`. React Native builds the generated C++ for libraries such as `react-native-safe-area-context` and `react-native-svg`, and CMake mirrors each source path under the build folder. The longest object path is about 327 characters, and Windows stops at 260. The project path appears twice in it, so even a very short folder (`D:\s`) plus a short build folder only reaches about 278.

What was tried: a virtual drive (`subst`), which breaks Gradle plugin resolution because Node returns real paths. What remains:
1. Turn on Windows long paths (`LongPathsEnabled=1`, needs an administrator) **and** use a CMake whose Ninja is long-path aware. The CMake 3.22.1 bundled with the SDK ships an older Ninja, so this may still fail; a newer CMake from the SDK Manager is the likely fix.
2. Build on Linux, WSL or a CI runner.
3. Cloud build (EAS). That uploads the project to a third party, so it needs the team's decision first.

Other build notes: Java could not reach `services.gradle.org` (IPv6), so the Gradle zip was downloaded with PowerShell and `distributionUrl` pointed at it; `-Djava.net.preferIPv4Stack=true` is set. The generated `android/` folder is not committed (it is regenerated by `npx expo prebuild`), so these edits live only on this machine.