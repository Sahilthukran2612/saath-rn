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