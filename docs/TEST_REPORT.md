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