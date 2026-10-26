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
