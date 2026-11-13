# Saath: specification

Saath ("together") is a shared care companion for chronic illness and diabetes in low-income Indian households. Care is treated as a responsibility handed between people (parent to teen, self to family). Sensing is one input, not the solution.

This is a university HCI / UbiComp project. This file records what the app is meant to do, and what it does today. For the status of each item, `README.md` has the Real / Simulated / Future table, and `docs/TEST_REPORT.md` has what was actually run.

## People
- **Person**: elder, teen (15 to 18) moving to adult care, or adult with Type 2 diabetes.
- **Circle**: Family, Neighbour, ASHA (community health worker), Clinician. Each member has a Privacy Dial.

## Hard constraints
1. Android 8+, about 2 GB RAM, offline-first, small, free, no ads. No costly hardware.
2. Never calculate a dose. Never diagnose. The phone cannot detect low sugar: it only prompts, and the prompt always says to follow the clinician's plan, or call family, a clinic or an ASHA.
3. Sensor processing stays on the device. Raw data never leaves the phone. No reading of other apps' notifications.
4. Under-18s need a guardian's agreement step, marked "needs legal review". The app never claims legal compliance.
5. Scheme and pharmacy information is curated offline content marked "verify locally".
6. Brick red is used only for a real safety alert.
7. Hindi and English, with text to speech. Large-text mode. Targets at least 56 px, body text at least 18 px.

## Features by phase
| Phase | Feature | State |
|---|---|---|
| 0 | App runs; tabs; Today; demo mode | Built, run |
| 1 | Circle, Privacy Dial, invite, delegation, time off, audit log, routine editor, guardian consent, phase-aware guidance, offline queue | Built; invite and sync simulated |
| 2 | Fall and inactivity alert with escalation; personal baseline; glucose log and trend; low-sugar prompts; strips plan; refill days; care budget; tap-to-call and prefilled SMS | Built, run on an emulator; foreground service compiled but never run |
| 3 | Transition Ladder; Visit Prep; Health Passport (QR and PDF); weekly check-in; food guide; foot check and photo diary; diabetes risk score; school card | Built, run on an emulator |
| UI | Design system: Mukta type, line icons, dye-ring home, springs, role-aware homes | Built, viewed on an emulator |
| 4 (part) | Shared-phone mode with per-person PIN; cloud schema with row-level security; Hindi labels on the demo role strip | Built; tested in Jest only. Schema not run |
| 4 (rest) | Accounts, real roles, push (FCM), sync, ASHA and clinician views backed by real data, SMS and missed-call gateway | Not built. Needs a Supabase project, an FCM key and a gateway |
| 5 | Accessibility audit, battery tuning, signed APK, final report | Automated name audit done. TalkBack, battery and APK not done |

## The Privacy Dial
Each circle member has a dial: 0 safety only, 1 routine, 2 full. A member receives an event if it is a safety event (always) or its type number is at or below their dial. Time Off pauses routine updates for that member and never safety alerts. A guardian keeps at least Routine. A member's phone number is shown only if that member agreed. Every view by someone other than the person is logged. The rule is `canReceive` in `src/logic.js`, with tests; `docs/supabase/schema.sql` repeats it for the cloud.

## Safety flow
Accelerometer sampling at 10 Hz in memory. A hard impact followed by stillness, or a long period without movement, opens a full-screen "Are you OK?" with a 30-second countdown. "I'm OK" cancels it. With no answer, the app reaches the circle in order: family, neighbour, ASHA, clinician, with tap-to-call and prefilled SMS. "False alarm" and "missed event" feedback adjust that person's own baseline. The detector thresholds are untuned guesses.

## Not in scope
Doses, diagnosis, reading other apps' notifications, ads, location tracking (not used), microphone (blocked).

## Open questions for the team
- Who reviews food content, risk cut-offs and the low-sugar and rule thresholds (clinician or dietitian)?
- Legal review of the guardian-consent step for under-18s.
- A native Hindi speaker to read every screen.
- Which Android build route: long paths and newer CMake, Linux or WSL, or a cloud build.
