# Product

<!-- impeccable:product-schema 1 -->

## Platform

android

## Users

Saath (साथ, "together") is for households where someone lives with a long-term illness. The person is one of three modes, and the mode changes the home screen:

- **Elder**: often alone for part of the day. Wants a big "I'm OK" seal, a short routine list, and voice prompts.
- **Teen (15 to 18) with diabetes**: learning to manage it, with a handover track from "parent does" to "independent". Under-18s go through a guardian-agreement step.
- **Adult with Type 2 diabetes**: sugar readings, medicine and strip stock, monthly cost.

The **circle** is the group around them, in five roles: Person, Family, Neighbour, ASHA (community health worker), Clinician. Care-givers use their own phone, account and setup ("I look after someone"). They see only Today, Circle and Me, and their phone never senses motion.

Typical context: low-end Android phones, patchy data, little money to spare, Hindi and English speakers, varying literacy.

## Product Purpose

Make care a responsibility shared and handed over between people, not one patient tracking their own numbers. The phone watches for a fall or unusual stillness, asks "Are you OK?", and if nobody answers, goes down the circle. Each circle member sees only what the person chooses to share.

Success: the right person is reached at the dangerous moments (the elder alone at 2 pm, the teenager away at college, a handover between carers), and the person stays in charge of their own information.

## Positioning

The central object is **the circle**, not the patient's data. Sensing is one weak signal that starts a human conversation, never a verdict. It is free, offline-first, bilingual (Hindi and English), and never diagnoses or calculates a dose. A single-user health tracker or a paid fall-detector cannot truthfully claim all of that together.

## Operating Context

- Phone-side works with no internet: sensors, detector, alert flow, escalation. Accelerometer is sampled 10 times a second into an 8-second in-memory buffer.
- Alert flow: hard impact then stillness (or inactivity far beyond the person's own normal) leads to a full-screen "Are you OK?" with a 30-second countdown, spoken prompt and vibration. "I'm OK" cancels. "False alarm" cancels and makes the app slightly less sensitive for this person. If unanswered, it escalates family, neighbour, ASHA, clinician (15 s each) via Call, WhatsApp and SMS. Optionally, with consent, it sends the alert SMS by itself, and in production dials contacts one by one.
- Optional free sync via Supabase (Postgres, Row Level Security, anonymous sign-in or phone number plus password). Members join with invite codes. Push through Firebase is planned.
- Production (release) builds start empty with a first-run setup. Demo data and simulations load only on request, and demo mode never places a real call or message.
- Screens: Today, Circle, Safety, Care, Plan, Me.

## Capabilities and Constraints

- **Privacy Dial** per member: 0 safety only, 1 routine, 2 full. Safety events always go through. Time Off pauses routine updates, never safety alerts. A guardian keeps at least Routine. Every look by a non-person is logged. Phone numbers are shown only with consent.
- **Never diagnose, never calculate a dose.** No dose field exists. Insulin and meals are logged as times only. Prompts point to the clinician's plan, family, a clinic or an ASHA. Language says "may need help", never "has fallen", and alerts show confidence and a reason.
- Raw sensor data, readings, photos and passport never leave the phone. Only short fixed-kind events can sync, and only if the person signs in. No microphone, location, contacts, or other apps' notifications.
- Free and offline-first. Nothing may depend on a paid service. WhatsApp uses `wa.me` links only.
- Not a medical device, diagnosis tool or emergency service.
- Terminology: circle, Privacy Dial, Time Off, ASHA, "I'm OK", "Ask for help" (a task delegated for an hour or a day that expires itself).
- Stack: React Native with Expo (SDK 58, RN 0.88, React 19), plain JavaScript, Hermes, a single reducer plus context store, AsyncStorage, expo-secure-store, Kotlin native modules for the foreground service and SMS, Jest tests. Existing codebase at `Z:\Projects\saath-rn`.
- Every feature is labelled real, simulated or future. Do not claim something works unless it was run on a device.
- Undecided or pending: signed release APK, push delivery to a real phone, thresholds untuned across many people, anonymous sign-in on real phones. Minors' guardian consent needs legal review and the app never claims DPDP Act 2023 compliance. Data location (Tokyo) needs legal review.

## Brand Commitments

- Name: Saath (साथ). Voice: plain words, calm, no medical jargon, no alarmism.
- **Brick red appears only for a real safety alert**, so red always means "pay attention".
- Large type, large buttons (56 px or more).
- Mukta font family (3 weights) covers Devanagari and Latin so Hindi and English read as one voice.
- Drawn art (ballpoint doodles, tally marks, the violet stamp, mood faces, charts, plate diagram), not emoji or stock icons. Lucide line icons. The visual world is the kirana bill book (see DESIGN.md).
- App icon, themed icon and splash exist in the Saath identity, not yet seen on a phone.

## Evidence on Hand

- Product docs in `docs/` (SPEC, ARCHITECTURE, DATA_MODEL, DESIGN, SCREENS, TEST_REPORT, PAPER_MAP, DEMO_SCRIPT, VOICEOVER, ROLES, RBAC, PUSH, supabase/).
- Project rules in `.claude/skills/` (design, privacy, health safety, sensing, localization, testing).
- About 400 Jest tests and 33 to 40 live database policy checks, all reported passing. An emulator run covered screens, alert, Hindi, large text and Plan tools. A real fall test is reported working on a real phone, without recorded details.
- Absent, so not to be fabricated: any native-speaker Hindi review, clinician or dietitian review, TalkBack walkthrough, battery measurement, real-band Bluetooth run, two-phone circle test, user testimonials or outcomes data.

## Product Principles

1. **Never diagnose, never calculate a dose.** Sensing prompts a human conversation, and the decision stays with people.
2. **Honest uncertainty.** Show confidence and reason, say "may need help", and state what the app cannot catch.
3. **The person owns their information.** Dial, Time Off, consent, and an audit log of who looked.
4. **Dignity and calm.** Plain words, large targets, red reserved for real alerts.
5. **Free, offline-first, their language.** It must work on a cheap phone with no internet, in Hindi and English, and say what is real, simulated or future.

## Accessibility & Inclusion

Hindi and English everywhere with spoken prompts, so reading is optional. Large text support, controls at 56 px or more, every control has an accessible name (tested). TalkBack is not yet walked through. Target users include older adults and people with low literacy on low-end Android phones.
