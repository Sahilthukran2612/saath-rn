# Test report

## Phase 0 (2026-10-27)
Environment: Windows 11, Node 22.19, npm 11.7, Expo SDK 58, React Native 0.88.

| Check | Result |
|---|---|
| `npm test` | 47 passed, 3 suites (logic, reducer, component) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (661 modules, 1.6 MB Hermes) |
| `npx expo start` on a device or emulator | **Not run** (no device in this session) |
| `npm audit` | 5 high-severity advisories in the dependency tree, **not reviewed** |

### What broke while building
- Component tests failed at first: `@testing-library/react-native` 14 makes `render` and `fireEvent` async. Tests now `await` them.
- `npx expo install --dev ...` exited with an error on the combined package list; installing the remaining dev packages with plain `npm install` worked.
- PowerShell wrote config files with a BOM; ESLint flagged it and `--fix` stripped it.

### Note on the "existing scaffold"
`saath-rn/` from the brief was not on this machine, so it was rebuilt from the spec, already split into modules. The known problems 1 to 6 are addressed by design (see README). Problem 8 was run honestly as above.

## Phase 1 (2026-10-27)
| Check | Result |
|---|---|
| `npm test` | 82 passed, 4 suites (adds invite, guardian limit, delegation expiry, second-person consent, nudge rules, offline queue, consent gate and Circle/Today component flows) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (666 modules) |
| On a phone | The app connected in Expo Go before Phase 1; no Phase 0 feedback was given. **Phase 1 screens have not been checked on a phone.** |

Found while building: lint rule `react-hooks/purity` rejected `Date.now()` in render, so a `useNow` hook was added.

Known gaps: no voice input; tasks have a `hour` field but no reminder actually fires yet; an invite cannot reach another phone until Phase 4; delegation to a member is not delivered to them.

## Pre-Phase-2 verification on an Android emulator (2026-10-27)
Environment: Android emulator `Medium_Phone_API_37.0` (Android 17, 1080x2400), Expo Go, Expo SDK 58. Driven with `adb` (taps by accessibility label, screenshots, injected sensor values). **Not a physical phone.**

| Check | Result |
|---|---|
| App launches, Today (elder) renders | Pass |
| Simulate a fall: banner, 30 s countdown, escalation, "I'm OK" | Pass. Tally Alerts 1, Escalated 1, I'm OK 1 (counted once each) |
| Simulate long quiet: runs `isInactive`, shows "quiet for 7.0h", 60% confidence, escalates to Asha | Pass |
| Real accelerometer listener: injected impact then stillness opens the alert (90%, "impact then still") | Pass after a fix (below) |
| Circle: privacy dial, contact numbers hidden until the member agrees, invite form, Ask for help, delegation list | Pass (rendering). Invite validation message shown for a bad number. Share sheet and "Mark joined" not exercised end to end |
| Hindi UI and large-text mode | Pass: text renders, tabs and consent screen fit. Seed task titles are English (user data) |
| Teen mode shows the guardian-consent gate, in Hindi | Pass |
| Persistence: force-stop and relaunch keeps language and large text | Pass |
| `expo-doctor` | 20/20 |
| `npm audit` | 5 high advisories, all in Expo's CLI tooling (`node-forge`, `zod` via `@expo/cli`), build time only, not in the app bundle. Fix needs an Expo upgrade; left as is |

### Bugs found by running on the emulator, now fixed
1. Status bar overlapped the role chips and the Android gesture bar overlapped the tab labels. React Native's `SafeAreaView` does nothing on Android; switched to `react-native-safe-area-context`.
2. `detectFall` counted a multi-sample impact as movement afterwards, so a long impact followed by stillness was scored "walking". Stillness is now measured from the end of the impact. 3 tests added (85 total).
3. First tap on a button while the keyboard was open was swallowed by the scroll view. `keyboardShouldPersistTaps="handled"` added to every screen.
4. Large-text task titles ran to the card edge; they now wrap.

### Not verified
- Voice prompts (emulator audio was off), physical-phone behaviour, real fall dynamics, battery use.
- An injected 0.5 s impact was missed by the emulator's own sensor timing; real hardware will differ. Thresholds in `CFG` remain untuned guesses.
- Invite share sheet and the "Mark joined" button were not driven.

### Process note
A PowerShell `Set-Content` round trip corrupted non-ASCII characters in six screen files (the `·` separators, emoji, Hindi). Caught from a screenshot of the log text, restored from git, and re-patched with UTF-8 safe code. A repo scan now finds no corrupted characters.
## Phase 2, JS side (2026-10-27)
| Check | Result |
|---|---|
| `npm test` | 144 passed, 7 suites (adds care logic, baseline wiring, no-dose checks, Care and alert screens, English/Hindi key parity) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (677 modules) |
| Android emulator (Expo Go) | Care screen with night check-in prompt, glucose card, stock card, budget card (Hindi and large text). Escalation shows "Reaching: Asha" with Call and Send message. **Call opened the dialer with (900) 000-0001 prefilled.** SMS composer not run. Prompt text and tips checked in Hindi after fixes |

Found by running: sugar advice and budget tips were English only in Hindi mode. They are now keys in `strings.js`, and a test fails if English and Hindi keys differ.

Not verified: foreground service (not built), push, SMS gateway, glucometer photo, voice on a device, TalkBack, a physical phone. The rule thresholds (2 hours without a meal after insulin, 4 hours without a night reading) are plain defaults that a clinician should set; they have not been clinically reviewed.
## Phase 3 (2026-10-27)
| Check | Result |
|---|---|
| `npm test` | 207 passed, 10 suites (adds plan logic, Plan screen flows, PDF fallback, readable printed passport, design checks) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1004 modules) |
| Android emulator (Expo Go) | Six-tab bar fits with large text. Plan menu, weekly check-in, body check (foot checklist saved), health passport: **QR code renders (92 of 700 characters)**, print dialog opens with a preview. Camera permission prompt appears only on tap; **Don't allow** leaves the app and checklist working |

### Bugs found by running, now fixed
1. **PDF sharing failed on the emulator**: `Sharing.shareAsync` rejected with "Not allowed to read file under given URL" and the app showed the raw error. It now shares with an explicit PDF type, falls back to the system print dialog (Save as PDF), and shows a plain message only if both fail. Three tests cover this.
2. **Printed passport used cryptic QR keys** (`n:`, `c:`) and empty lines. It now uses readable, localized labels and skips empty fields.
3. After merging the apple-design branch, **large emoji were clipped** because `Body` computed line height from its default size. It now follows the font size actually used (test added).

### Merged
The `apple-design-polish` branch from the parallel session (soft depth, spring press feedback that respects reduce-motion, selected-tab pill). Merged cleanly; no new dependencies.

### Not verified
Camera capture itself, PDF "Save" to storage after the print dialog, TalkBack, a physical phone, and every Hindi screen visually (strings are unit-tested for key parity, not read by a native speaker). Food content and IDRS cut-offs need clinical review (see README).
## Foreground service (2026-10-27)
| Check | Result |
|---|---|
| `npm test` | 216 passed, 12 suites (adds the wrapper without the native module, and the Me-tab switch with a mocked native layer: permission asked first, service started with a localized notice, setting turns itself off if refused, stop on off) |
| `npm run lint` | 0 errors, 0 warnings |
| Kotlin module `SaathForegroundModule` and `SaathForegroundService` | Compiled by Gradle (class files produced, no `e:` errors) |
| Merged Android manifest | Contains the `specialUse` service, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_SPECIAL_USE`, `POST_NOTIFICATIONS`. `RECORD_AUDIO` and storage permissions are removed |
| Full `assembleDebug` | **Failed** in the C++ step (`:app:buildCMakeDebug`): Windows 260-character path limit. Not a code error. See `docs/ARCHITECTURE.md`, "Build blocker" |
| Service on a device or emulator | **Not run** (no APK) |
## UI/UX redesign (2026-10-27)
| Check | Result |
|---|---|
| `npm test` | 240 passed, 13 suites (adds icon-set guard, Toggle, Segmented, Field, drawn components at their edges, tab bar, Today by role, Circle dial and Time off, alert screen) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1157 modules) |
| Android emulator (Expo Go) | Checked visually, normal and large text: shell, Today (elder after ticking tasks, adult, family), Circle, Safety, Care, Plan menu, check-in, food guide, Me, consent, and the alert in both phases |

Bugs found by running it, now fixed:
1. Importing the whole Lucide package made the bundle 3,052 modules (about 2,000 unused icons). Icons are now imported one per file (1,157 modules).
2. All seven Mukta weights were being packaged. Only the three used are imported now.
3. The "Time off" switches had no visible label; the member rows repeated the role under the name.
4. "Language" broke mid-word at large text because the selector squeezed it; the selector now sits under the label.
5. On the consent screen the status bar icons were white on a light background (nearly invisible).
6. Task-name editing dispatched on every keystroke and would have filled the offline queue; it saves on blur again.
7. The adult home still showed fixed demo numbers (12 days, 640); it now reads the real stock, strips and budget.

Not verified: TalkBack, a physical phone, contrast with a measuring tool, a native-speaker read of every Hindi screen, dark mode (not built). See `docs/DESIGN.md`.

## Phase 4 (part) and Phase 5 audit (2026-11-13)
Built: shared-phone mode (profiles, PIN, lock screen), a cloud schema with row-level security (design only), Hindi labels on the demo role strip, an automated accessibility-name audit.

| Check | Result |
|---|---|
| `npm test` | 278 passed, 17 suites (adds `profiles`, `phase4`, `a11y`, `schema`) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1161 modules) |
| On an emulator or phone | **Not run.** Shared-phone mode and the lock screen were tested in Jest only |
| `docs/supabase/schema.sql` | **Not applied to any database.** Tests only check the file for dose columns, the safety rule, RLS on every table and the phone-number view |

Covered by tests: a wrong PIN shows tries left, five wrong tries lock the keypad for a minute across all profiles, the right PIN opens the right person's data, a safety alert is drawn over the lock screen, another person cannot take over while an alert is open, a new person can be added, the mode cannot be turned off without the PIN, and every control (buttons, switches, tabs, text inputs) has a name on all six tabs for eight role/mode/language combinations, every Plan tool and the alert.

Found by testing: my first alert-takeover test picked the wrong profile (the last active person is the one whose alert it is), which showed the rule works but my test did not set it up right; the test now says so. A Plan-tool audit failed because the Handover tile is teen-only; the audit now runs as a teen.

Not verified: any of this on a device, the camera round trip when the app locks on background, TalkBack, battery use, the signed APK (still blocked on the Windows build limit), and the SQL itself.

## Phone sign-in and sync client (2026-11-13)
| Check | Result |
|---|---|
| `npm test` | 301 passed, 18 suites (adds `cloud`: config, sign-in, household find or create, batch send, token refresh, outbox rules, account card) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1165 modules) |
| Against a real Supabase project | **Not run.** There is no project. Every network test uses a fake `fetch` |

Covered by tests: network failures never throw and keep events for later; a wrong code is reported as a code problem; events go in one request and leave the outbox only when it succeeds; a 401 refreshes once and retries; a second alert while one is open is not queued twice; undoing a task queues nothing; sugar readings, insulin times and budget amounts never enter the outbox; sign-out empties it.

Found while building: the Today "I'm OK" button dispatched `ACTIVITY`, which the fall listener also sends on every movement, so using it for sync would have flooded the circle. It now dispatches its own `CHECK_IN`. A helper declared as a `const` arrow was read before its definition when the initial state was built; it is now a hoisted function (the tests caught it at import).

Context: Supabase was blocked by Indian ISPs from February 2026 and reportedly restored in October 2026 (not confirmed from a primary source). The server address is configuration for that reason; see `docs/supabase/SETUP.md`.
## Circle side and secure tokens (2026-11-13)
| Check | Result |
|---|---|
| `npm test` | 330 passed, 19 suites (adds `circle-cloud`; schema checks extended) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1170 modules) |
| Real server, two real phones | **Not run.** No Supabase project exists. Every network test uses a fake `fetch` |

Covered by tests: event wording in English and Hindi with no leftover placeholders; which alert needs attention (recent, unseen, not answered afterwards, newest first across circles); join with a code (good, short, rejected, no network, signed out); circles and feed requests; token refresh on circle calls; invites marked as published so they are not sent twice; tokens never in the plain state file, present in the secure store, per profile, removed on sign-out, and an older state file with tokens is read then cleaned; banner appears and clears; list and feed screens; hidden when the build has no server.

Found while building: the first schema draft had a policy on `members` that queried `members`, which Postgres rejects as infinite recursion; it now uses a security-definer `is_member()` and a test guards it (a real database was not available to confirm the original failure, this is from how Postgres row-level security works). One test failed because the feed row on the Circle tab repeats the banner text; the test now checks the banner by its button.

Not verified: everything against a real database; two phones talking to each other; battery cost of polling every 30 s; the secure store on a device; Hindi wording by a native speaker.
## Live database policy tests (2026-11-13)
Project `saath-rn` (ref `hothcnoyrfelsagiagwi`, region ap-northeast-1 Tokyo, not Mumbai). The schema was applied with the Supabase CLI and `docs/supabase/policy_tests.sql` was run against it. The script acts as real authenticated users (role `authenticated` plus a JWT subject, so row-level security applies) inside one transaction that always rolls back; afterwards the project had 0 households, 0 events and 0 users.

**Result: 24 passed, 0 failed.** Covered: a new member sees safety events only; the person raises the dial to routine, then full, and the member sees more; Time Off hides routine and summary but never safety; a stranger sees no events, households, members or invites; a member cannot raise their own dial, change their role or insert themselves; a member can raise a safety event but not a routine one; a stranger cannot write; a number is hidden from others until its owner shares it, then visible; a code works once; a bad code is refused; the person cannot join their own circle; members cannot read invites; `my_circles` returns the person's name.

What this does not show: the app talking to the server. **Phone sign-in is switched off on the project and there is no SMS provider**, so nobody can sign in yet. Two real phones, polling, the banner and invite publishing remain untested against the real server. The test numbers and SMS settings are not configured. A first change to enable them was blocked by the permission check and was not retried.
## Free sign-in, no SMS (2026-11-13)
Phone sign-in needs a paid SMS provider, which the project cannot afford, so the default is now an anonymous account (`signInAnonymous`): one button, no number. Phone codes are kept behind `EXPO_PUBLIC_SAATH_PHONE_AUTH=1`.

| Check | Result |
|---|---|
| `npm test` | 334 passed, 19 suites (adds anonymous sign-in against a fake server, default and anonymous Account card states) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1170 modules) |
| Real server | One real request: `POST /auth/v1/signup` answered 422 `anonymous_provider_disabled`. The setting is off; it needs the owner to switch it on in the dashboard. Nothing was created |

Trade-off recorded: an anonymous account is lost if the app data is cleared or the phone changes; the circle must invite the person again. The app says so on the Me tab (English and Hindi).
## RLS review for anonymous accounts (2026-11-13)
Supabase warns that anonymous users run as the `authenticated` role and are subject to the policies for it. The policies were reviewed with that in mind. They already returned nothing to an account that is not a member (every check goes through `auth.uid()`), but a free anonymous account could still: make unlimited households, flood its own tables, send over-long text, and guess six-character invite codes at full speed.

Changes (`docs/supabase/schema.sql`): every policy now says `to authenticated`; the `anon` role has no table or function grants; one household per account; length limits on text; invite codes must be 6 to 12 letters or digits (the app now makes 8); caps of 30 members, 30 open invites, 60 safety events an hour and 300 other events an hour per household; `accept_invite` records wrong codes and locks an account out after 10 in 15 minutes (a wrong code now returns null instead of an error so the attempt is kept). The app shows a separate message when locked out.

Live result on project `saath-rn`, 2026-11-13: schema re-applied from scratch (`reset_dev.sql`, which refuses to run if any data exists, then `schema.sql`), `policy_tests.sql` **33 passed, 0 failed**, afterwards 0 households, 0 events, 0 users, 0 grants to `anon`, 0 policies that are not authenticated-only. The tests now act as anonymous accounts (`is_anonymous` claim) and as a signed-out client.

Found while doing it: my first trigger put a `CASE ... THEN` inside a plpgsql `IF`, which plpgsql splits at the first `THEN` (syntax error); fixed with a variable and a test that guards against the pattern. `R` is a built-in PowerShell alias, so my first batch of edits silently did nothing; I caught it by reading the result back.

Still true: the limits stop casual abuse, not a determined one. Anyone can still make anonymous accounts (Supabase rate-limits sign-ups per IP; switch on CAPTCHA before the project is public). The free plan has size and inactivity limits. Re-run `policy_tests.sql` after any schema change. The app has still not signed in to the server: anonymous sign-in is off until the owner switches it on.

## WhatsApp alert button (2026-11-13)
| Check | Result |
|---|---|
| `npm test` | 345 passed, 19 suites (adds `whatsappLink` cases and the three-button contact card) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1170 modules) |
| On a phone | **Not run.** Whether WhatsApp opens with the right chat and text is unchecked |

The contact card on the alert screen now shows Call, WhatsApp and SMS as three labelled buttons of at least 56 px (the old round buttons were 52 px). The WhatsApp button is hidden when the stored number cannot be a phone number. Numbers are normalised for India (10 digits, +91, 91 or a leading 0 all reach the same chat). The message text is the existing one and still avoids claiming a diagnosis, and now uses the person's profile name when there is one.

Limits: it is one tap by a person, not an automatic message. Free automatic alerting needs push notifications, which are not built (see `docs/supabase/SETUP.md`).


## Sensors, native build and demo simulations (2026-11-16)
| Check | Result |
|---|---|
| `npm test` | 400 passed, 23 suites (adds `sms`, `heart`, `heart-ui`, `demo`) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo export --platform android` | Bundles (1185 modules) |
| Debug APK (`assembleDebug`) | **Builds**, twice: 159 MB, then 160 MB with the SMS module and Bluetooth library. Not installed or run on a phone |

The Windows build problem is worked around, not fixed: building from a copy at `Z:\s` with the C++ build folder at `Z:/c` keeps every path under 260 characters (`scripts/build-apk.ps1`). Replacing the SDK's Ninja with a newer one was refused as unsafe and not done.

Bugs found by reading the code back, not by tests: an edit of mine had silently removed the alert and step from the key that makes each contact get one SMS (it was just a colon, so only one contact would ever have been texted per app session), and the same edit damaged the check that shows the "message sent" line. Both are fixed. A test now advances the escalation with the countdown and checks each contact is texted once. The earlier test had passed with the bug because it never advanced a step.

Demo simulations (labelled on screen, only in Demo mode): a simulated heart-rate band, the automatic SMS shown instead of sent when the SMS module is absent, and stand-in buttons for a family member's phone. They go through the real feed, banner, wording and heart-rate logic.

Not run: automatic SMS, the foreground service and the Bluetooth band on a phone; the app against a real band; two real phones.

## Live end-to-end check with anonymous sign-in (2026-11-16)
Anonymous sign-in was switched on in the project (a real sign-up returned an anonymous account and a token). The app's own client code (`src/services/cloud.js`) was then run against the live server in plain Node (not the jest-expo setup, which replaces `fetch` with a stub), with three throwaway anonymous accounts: a person, a circle member and a stranger.

| Step | Result |
|---|---|
| Person signs in anonymously, household created | ok |
| Three events sent in one batch (fall, task_done, im_ok) | all 3 accepted |
| Person publishes an invite; member tries a wrong code | published; wrong code reads as "invalid" |
| Member joins with the code; reusing the code | joined; reuse refused |
| Member's circle list | one circle, the person's name, role family, dial 0 (safety only) |
| Member's feed at dial 0 | only the fall |
| Person raises the member's dial to 1 | accepted (204) |
| Member's feed at dial 1 | fall, task_done, im_ok |
| Member tries to raise their own dial to 2 | refused (400) |
| A stranger reads the household's feed | 0 events |

All eight test accounts (and their households) were deleted afterwards by ID, and the leftover wrong-code counters were cleared. The project was left empty.

One earlier run failed at "household" even though the household had been created: the response did not arrive inside the client's 8-second timeout. The client treats that as "try again later" and the retry finds the household (one per account), so nothing is duplicated, but the timeout may be tight on a slow connection. Not changed.

Still not run: the app on a phone doing this, two real phones, and the circle member seeing the banner from real server data (the demo stand-ins show that screen).

## Reminders, loud alarm, dial sync, icons, version fixes (2026-11-16)
| Check | Result |
|---|---|
| `npm test` | 437 passed, 26 suites (adds `reminders`, `siren`, `dial-sync`) |
| `npm run lint` | 0 errors, 0 warnings |
| `npx expo-doctor` | 20/20 (it was 18/20 until the two fixes below) |

Found by `expo-doctor`, not by tests: `expo-audio` (the siren) needs `expo-asset` as a peer dependency, and without it the installed app could crash even though Expo Go works; it is now installed. The `expo-audio` plugin could also have added a microphone permission, so it is configured with `microphonePermission: false` (the app never records). Eleven SDK 58 patch versions were out of date and were aligned with `npx expo install --fix`.

Tested: reminder rules (whole hours only, nothing inside the 22:00 to 07:00 sleep window, stepping an hour at a time and clearing at the ends), the reminder toggle (permission asked, refused path, schedule rebuilt when a time changes, Hindi wording), the siren (silent during the countdown, plays when nobody answers, stops when answered, the sound file is a valid, loud, unclipped 1.6 s mono wav under 100 KB), and the dial on the server (member list, exactly the new level sent, bad levels never sent, refusal reverts the screen and says so, Time Off targets only my own row, token refresh).

Real server check (the dial): in the earlier live run a member at dial 0 saw only the fall; after the person raised the dial the same member saw fall, task and "I'm OK"; a member trying to raise their own dial was refused (400); a stranger saw nothing. The screen that sets the dial calls the same code.

Not run on a phone: a reminder actually appearing, the siren heard, the icon and splash on a real launcher, the dial screen against the live server from the app UI.

A bug of mine caught on the way: the first release-build line in `scripts/build-apk.ps1` had a quoting error, so no build ran at all; the script now parses (checked) and the argument is quoted.

## Standalone release APK (2026-11-16)
| Check | Result |
|---|---|
| `scripts\build-apk.ps1 -Release` | **BUILD SUCCESSFUL in 8m 48s** (third attempt) |
| Output | `dist\saath.apk`, 37.3 MB; native libraries for `arm64-v8a` and `armeabi-v7a`; `assets/index.android.bundle` (the app's JavaScript) and the siren sound inside |
| Installed or run on a phone | **Not yet** |

Three attempts: (1) failed because my release line in the script had a quoting error, so Gradle never ran; (2) failed at "createBundleReleaseJsAndAssets" with `Unable to resolve "./dist/abort-controller"`, because the script's copy step excluded every folder named `dist` and so also dropped `dist` folders inside installed libraries (debug builds do not bundle the JavaScript, which is why this only showed in a release build); fixed by excluding only the project's own `dist` by full path; (3) succeeded.

Permissions, read from the built APK with `aapt2`: the first release build still carried "draw over other apps", activity recognition, biometric and fingerprint, and the Firebase receive permission, all added by libraries and none used by Saath. They are now blocked in `app.json` and absent from the rebuilt APK, as are microphone and storage. What remains: camera (foot photo), Bluetooth (heart-rate band, and location only up to Android 11 where the system requires it for any Bluetooth scan), SMS send (automatic alert SMS, opt-in), notifications, vibration, internet, foreground service, wake lock and boot-completed (so reminders survive a restart), and audio settings (siren). The APK is signed with the debug key: it installs, but it is not a Play Store build, and Google Play would also reject the SMS permission.

## Production mode, automatic calls, phone and password accounts, push (2026-11-16)
| Check | Result |
|---|---|
| `npm test` | 505 passed, 28 suites (adds `production`, `push`; `cloud` and `dial-sync` extended) |
| `npm run lint` | 0 errors, 0 warnings |
| Live policy tests (`policy_tests.sql`) | **40 passed, 0 failed**, including device addresses (own rows only, no other user's, no stranger, capped at 8, no signed-out access). Run while the project holds real data (1 account, 1 household, 2 events): the script rolls back and the counts were identical afterwards |
| Migration | `002_push_tokens.sql` applied to the live project (additive; no data touched) |
| Release APK | see the next section |

What the tests cover: a real install starts empty with no fake number anywhere in it; contacts (10 digits, +91 and 0 prefixes, duplicates, a limit of 12, removal moves the emergency contact on); demo on and off removes exactly what it added and leaves real entries; the setup flow end to end in English and Hindi; the alert clock waiting during a call, moving on after a short call, stopping after a long one, and releasing a call that never reports its end; the alert screen dialling each contact once and showing who is being called; demo mode never dialling; the Safety trial card warning that a real run reaches real contacts; password sign-up and sign-in against a fake server (short password, bad number, existing number, a server that still wants confirmation, wrong password, no network); push registration, refusal, missing Firebase, and removal on sign-out; the server function's wording and recipient rule (equal to the app's `canReceive` for every dial and event type).

Found while doing it: the first sync pass was skipped in tests because the app-state check treated "not active" as background; it now skips only a real background, which also means the sync pass now runs in signed-in tests (two dial tests assumed their request was the first one and now look for it by method). The storage key moved to `saath/state/v2` so state saved while the app held demo people is not carried into production (two token tests used the old key). A bare regular expression in the schema test treated `create table if not exists` as a table called "if". An earlier burst of 15 failures in one run was the machine being overloaded while a build ran; rerunning with fewer workers showed only the real failures.

Not tested: any of the native pieces on a phone (calling, call-end detection, lock-screen launch, wake lock), the phone sign-up against the real server (the Phone provider is off: the project still answers `phone provider enabled: false`), and any message through Firebase.