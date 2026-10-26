# Saath

Shared care companion for chronic illness and diabetes (Expo, React Native, JavaScript). Offline-first, low-end Android, free. See `CLAUDE.md` for the product rules.

## Setup
```
npm install
npm test          # jest: logic, reducer, component tests
npm run lint
npx expo start    # then open in Expo Go on an Android phone
```
APK build and the dev client (needed for background sensing) come in Phase 2 and 5.

## Permissions
None requested yet. The foreground accelerometer needs no permission. Phase 2 adds foreground-service and notification permissions.

## Real, simulated, future
| Area | Status |
|---|---|
| Privacy Dial rule (`canReceive`), escalation order, Time Off never skips safety | Real (unit-tested) |
| Fall detector on synthetic traces | Real logic, tested on traces only |
| Live accelerometer listener (app open, Expo Go) | Written, **not run on a device** |
| Inactivity check | Real logic; "Simulate long quiet" fast-forwards a virtual clock |
| Fall / quiet alert, countdown, escalation, tally, CSV export | Real in-app flow, simulated triggers |
| Role switcher | Simulated (Demo mode). Real roles need accounts (Phase 4) |
| Audit log | Real, one entry per meaningful view by a non-Person viewer |
| Hindi / English, voice prompts | Partly real. A few labels are still English only. Voice not run on a device |
| Background sensing, push, SMS, accounts, sync | Future (Phase 2 and 4) |
| Invite by phone or link, delegation expiry, guardian limit, second-person consent for contact numbers, `shouldNudge`, phase defaults | Real logic (unit-tested) |
| Invite link share, joining, offline queue "sync", Rhythm Board edit | Simulated: local only, "Mark joined" and "Go online" are demo buttons. Real delivery needs accounts (Phase 4) |
| Guardian consent for under-18s | Records a name and number on this phone. **Does not verify identity. Needs legal review. Not a compliance claim** |
| Voice confirm on Rhythm Board | Speaks on add and tick. Speech recognition (voice input) not built |
| Per-task times and reminders actually firing | Future (needs local notifications, Phase 2) |
| Glucose trend, refill, budget, Transition Ladder detail, Health Passport | Future (Phase 2 and 3). Home cards show labelled demo values |

## Known limits
- Never tested on a physical phone or in Expo Go (no device available in this session).
- Saath helps notice when someone may need help. It cannot promise to catch every fall and it does not sense blood sugar.
- Demo data is labelled as such. Scheme and pharmacy info will be marked "verify locally".
