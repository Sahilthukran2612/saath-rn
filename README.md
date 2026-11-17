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
| Personal baseline from false-alarm / missed feedback, glucose trend, low-sugar prompts (insulin logged and no meal, night check-in), strips plan, refill days, Care Budget, tap-to-call / prefilled SMS links | Real logic (unit-tested). Run on an Android emulator: night prompt, budget, stock, Call opens the dialer with the right number |
| Transition Ladder (4 stages, 4 skills, teen confirms, optional parent approval, step back), Visit Prep, Health Passport QR and PDF, weekly check-in, food guide (curated JSON, verify locally), foot check, waist, diabetes risk (IDRS), teen school card | Real. Logic unit-tested. Run on an Android emulator: Plan menu, QR code, print-to-PDF dialog, check-in, body check, camera permission prompt and deny path. Hindi and English |
| Food guide content and the IDRS cut-offs | Starter content written by this project. **Needs review by a clinician or dietitian and a check against the original IDRS source before any real use** |
| Foot photo diary | Camera permission only on tap. Photos stay on the phone and are not analysed. Camera capture itself not run (emulator camera not exercised) |
| Push to the circle, SMS gateway, glucometer photo | Future. Push needs accounts (Phase 4), the gateway needs a server, the photo needs the camera |
| True background sensing (foreground service) | **Written and compiled, not run.** Kotlin module and Me-tab switch exist and are unit-tested with the native layer mocked. The APK could not be built on Windows (260-character path limit in the C++ build); see `docs/ARCHITECTURE.md` |
| Voice confirm on Rhythm Board | Speaks on add and tick. Speech recognition (voice input) not built |
| Per-task times and reminders actually firing | Future (needs local notifications, Phase 2) |
| Shared-phone mode: profiles with their own data, 4-digit PIN (salted hash), lock on background, 5 wrong tries lock the keypad for a minute, safety alert drawn over the lock screen | Real logic and screens, unit-tested (Jest). **Not run on a phone or emulator yet.** The PIN is a deterrent on a shared phone, not encryption: data on the device is not encrypted |
| Cloud schema with row-level security that implements the Privacy Dial (`docs/supabase/schema.sql`) | **Applied** to the Supabase project saath-rn (ap-northeast-1, Tokyo) on 2026-11-13 and **tested against the live database**: 33 policy checks pass (docs/supabase/policy_tests.sql). Anonymous sign-in is switched on, and the app's own cloud code was run against it end to end on 2026-11-16 (two throwaway accounts, since deleted): sign-in, events, invite, join, feed under the dial. **Not yet from the app on a phone, and not with two real phones** |
| Free sign-in with no phone number (anonymous account), optional phone-code sign-in (needs a paid SMS provider, off by default), and event sync to a Supabase-compatible server (configurable address, outbox, batch send, token refresh), "Account and sync" card on Me | Written and tested against a **fake server only**. Off unless `.env` has a URL and key. Never run against a real project. See `docs/supabase/SETUP.md` |
| Circle side: join with an invite code, "People I look after" list and feed (worded from what the server allows), alert banner for a fall or long quiet, invites published to the server, sign-in tokens in the phone's secure store | Written and tested against a **fake server only**; never run against a real project or two real phones. Reads happen every 30 s **while the app is open**: no push |
| WhatsApp as a free way to alert the circle: during an alert the person's phone offers Call, WhatsApp and SMS for the contact being reached; WhatsApp opens the chat with the message ready and one tap sends it | Real logic (unit-tested) and button on the alert screen. **Not run on a phone**: whether WhatsApp opens with the right chat and text is unchecked. It is a tap, not automatic: nothing is sent unless the person taps Send |
| Push to a member's phone (FCM), per-member dial, Time Off and shared-number settings written to the server, Call button for members, SMS and missed-call gateway | Future. Need an FCM key, more server work and a gateway provider. Until the dial is synced, every joined member sees safety events only |
| Automatic alert SMS (Kotlin module, permission, per-step sending), Bluetooth heart-rate band (parser, prompts, Safety card, calm note) | Built and unit-tested with the native layer mocked; the APK compiles with both. **Not run on a phone or a real band** |
| Demo simulations for the presentation: a simulated heart-rate band, the alert SMS shown on screen instead of sent, and a stand-in for a family member's phone (banner, feed) | Built and tested. They appear only in Demo mode and say on screen that they are a demo. See `docs/DEMO_SCRIPT.md` |
| Daily task reminders at each task's hour (local notifications on the phone; no server, no internet; sleep window respected; opt-in; per-task time on the routine editor) | Real logic (unit-tested); scheduling tested with the notification layer mocked. **Not seen firing on a phone** |
| Loud alarm when nobody answers (a generated siren that loops on this phone; opt-in; stops when the alert is answered; works with no signal) | Built; logic and the sound file are tested, playback is mocked. **Not heard on a phone** |
| The privacy dial written to the server for people who joined from their own phones (Circle, "Joined on their own phones"), and a member's own Time Off | Verified against the live server for the dial (a member's feed grew from the fall alone to all three events when raised). Time Off from the member side is tested against a fake server only. A demo stand-in exists for the presentation |
| App icon, adaptive and themed icon, and splash screen in the Saath identity (generated by `scripts/make-icons.ps1`) | Generated and viewed; not yet seen on a phone |
| Standalone release APK that carries the app inside it (`scripts/build-apk.ps1 -Release`) | **Builds**: `dist\saath.apk`, 37.3 MB, for both phone CPU types, with the app's code and the siren inside, and the unneeded permissions removed (checked with `aapt2`). **Not installed or run on a phone yet** |
| **Production mode**: an installed build starts empty (no demo people, no fake numbers), runs a first-run setup, takes real emergency contacts, and loads demo data only on request. Demo mode never places a real call or message | Built and unit-tested. Not yet run on a phone |
| **Automatic calls**: after the countdown Saath dials contact 1, then contact 2 when that call ends, and stops if a call lasts about 50 seconds (a stated guess: Android does not say whether an outgoing call was answered). A full-screen notification brings the alert up over the lock screen | Kotlin module and logic written; logic tested with the native layer mocked; the APK compiles. **Not run on a phone**: background launch rules differ by phone brand and Android version |
| **Account with a phone number and password** (no SMS cost; works on a second phone; no password reset) and **roles enforced by the database** (`docs/RBAC.md`) | Client unit-tested against a fake server; roles, limits and the dial verified against the live database (40 policy checks). Phone confirmations are off and the whole flow was **verified against the live project** (sign-up, duplicate refused, second-phone sign-in, wrong password refused, joining a circle). Not yet tried from the app on a phone |
| **Push notifications** for circle members (Firebase Cloud Messaging) | Firebase project set up; credentials verified with Google and FCM; server function deployed and tested (refuses without the secret, skips routine events); trigger on; device-address table live. A safety event was run through the live chain (trigger, function, Firebase) and the function reached Google; **no notification has been delivered to a real phone yet**: needs the installed app on two phones (`docs/PUSH.md`) |
| Accessibility audit: every control has a name, across 8 role/mode/language homes, all Plan tools and the alert | Automated (Jest). **TalkBack not run on a device** |

## Known limits
- Tested on an Android emulator through Expo Go, never on a physical phone. The background service has not run on any device.
- Saath helps notice when someone may need help. It cannot promise to catch every fall and it does not sense blood sugar.
- Demo data is labelled as such. Scheme and pharmacy info will be marked "verify locally".
