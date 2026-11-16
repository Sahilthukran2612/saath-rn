# Saath: the whole project, from the idea to the code

*Saath* (साथ) is Hindi for "together". This file explains what we are building, why, how, and with what. It is meant to be read top to bottom by a teacher, a teammate, or you in six months. Where something is built but not yet checked on a real device, or not built at all, it says so. Nothing here is a claim that a feature works unless the "Status" section says it was run.

---

## 1. In one paragraph

Saath is a free Android app for households where someone lives with a long-term illness, mainly elders living alone for part of the day, teenagers with diabetes who are learning to manage it themselves, and adults with Type 2 diabetes. It lets that person and the people around them (family, a neighbour, an ASHA community health worker, a clinician) share the work of care. The phone watches for a fall or a long period of stillness, asks "Are you OK?", and if nobody answers, reaches the circle. Every circle member sees only what the person chooses to share. The app works without internet, costs nothing to run, speaks Hindi and English, and never diagnoses or calculates a dose.

---

## 2. Why this exists: the philosophy

### 2.1 Care is a responsibility that moves between people
Most health apps assume one user: a patient who tracks their own numbers. Real care in an Indian household is not like that. A parent manages a child's diabetes, the child slowly takes it over, a daughter in another city worries, a neighbour has a spare key, an ASHA worker visits monthly. The care is a *responsibility handed from person to person*, and the dangerous moments are the handovers and the gaps (the elder alone at 2 pm, the teenager at college away from the parent).

So Saath's central object is not "the patient's data". It is **the circle**, and the app's job is to make handing care over, and covering for each other, easy and safe.

### 2.2 Sensing is one input, not the solution
A fall detector is easy to build and easy to oversell. A phone can notice a hard impact followed by stillness. It cannot know why, cannot see the person, and cannot detect low blood sugar at all. A product that pretends otherwise is dangerous. Saath treats sensing as **one weak signal that starts a human conversation**: "We noticed something. Are you OK?" The person answers, or the circle is asked to check. The decision always stays with people.

### 2.3 The principles we hold ourselves to

| Principle | What it means in the app |
|---|---|
| **Never diagnose, never calculate a dose** | There is no field for a dose. Insulin is logged as a *time* only. Prompts end with "follow your clinician's plan, or call family, a clinic or an ASHA". Tests check that no text contains a diagnosis or an amount. |
| **Honest uncertainty** | Alerts show a confidence figure and a reason. Docs and the UI say "may need help", never "has fallen". The app says it cannot promise to catch every fall. |
| **The person is in charge of their information** | The Privacy Dial (safety only, routine, full) is set per circle member by the person. A member's phone number is shown only if that member agreed. Time Off pauses routine updates but **never** safety alerts. Every look by a non-person is logged. |
| **Privacy by design** | Raw sensor data never leaves the phone. Only a short event ("possible fall") can sync, and only if the person signs in. Other apps' notifications are never read. No microphone, no location, no contacts. |
| **Dignity and calm** | Large type, large buttons (56 px or more), plain words, no alarms unless there is a real reason. **Brick red is used only for a real safety alert**, so red always means "pay attention". |
| **Free and offline-first** | The people we design for often have a low-end phone, patchy data and no money to spare. Nothing in the app needs a paid service. It must work with no internet. |
| **Their language** | Hindi and English everywhere, with spoken prompts, so literacy and language are not barriers. |
| **Minors need a guardian** | Under-18s go through a guardian-agreement step. It is marked "needs legal review" and the app never claims legal compliance (India's DPDP Act 2023). |
| **Say what is real** | Every feature is labelled real, simulated or future. We do not claim something works unless it was run. |

### 2.4 What Saath is not
It is not a medical device, not a diagnosis tool, not an emergency service. It does not replace a clinician, a glucometer, or calling an ambulance. It is a *companion and a nudge* inside a human circle.

---

## 3. Who it is for

**The person** (one of three modes, which change the home screen):
- **Elder**: a big "I'm OK" seal, a short routine list, voice prompts.
- **Teen (15 to 18)**: a handover track from "parent does" to "independent", a guardian-consent step.
- **Adult with Type 2 diabetes**: sugar readings, medicine and strip stock, monthly cost.

**The circle** (five roles): Person, Family, Neighbour, ASHA, Clinician. Each can be seen as a read-only view (family: "All is well", neighbour: safety only, ASHA/clinician: households ranked by need).

---

## 4. What the app does

### 4.1 Today
A greeting, one hero, then the day's routine. For the elder, the hero is the **dye ring**: one dot per task around an "I'm OK" seal; as tasks are ticked the dots fill. Tapping "I'm OK" tells the circle in plain words.

### 4.2 Circle
The member list with avatars, the **Privacy Dial** per member, **Time Off**, an invite form (name, phone, role), **Ask for help** (a task delegated for one hour or one day that expires by itself), a "who viewed what" log, and, once synced, **People I look after** with a feed of what the server allows you to see.

### 4.3 Safety
Status and what Saath has learned about *this person's* normal ("How Saath learned from you"). Trial tools to simulate a fall or a long quiet, a tally of alerts, and a CSV export for sensor trials.

### 4.4 The alert (the heart of the app)
1. The accelerometer sees a hard impact followed by stillness (or the person has been inactive far longer than their own normal).
2. A full-screen **"Are you OK?"** appears with a 30-second countdown, a spoken prompt and a vibration.
3. **"I'm OK"** cancels it. **"False alarm"** cancels it *and teaches the app* to be a little less sensitive for this person.
4. If nobody answers, Saath goes down the circle in order (family, neighbour, ASHA, clinician), 15 seconds each. For each contact the person (or someone beside them) has **Call**, **WhatsApp** and **SMS** buttons.
5. Optionally, with the person's permission, Saath **sends the alert SMS by itself** to each contact in turn, without a tap.

### 4.5 Care (diabetes layer)
Sugar readings with a trend chart and plain-language advice; night check-in prompts; medicine stock and **days left**; test-strip plan; a monthly **care budget** with saving tips. Insulin and meals are logged as times only. The phone cannot detect low sugar, so any "this looks low" message only prompts.

### 4.6 Plan (handover, wellbeing, local help)
**Transition ladder** (parent does, together, you with backup, independent, with optional parent approval and stepping back without shame), **Visit prep** (facts and questions for the clinic), **Health passport** (QR code and PDF, only what the person ticks), **Weekly check-in** (five drawn faces), **Food guide** (plate diagram, regional foods), **Body check** (foot checklist, optional photo diary, waist, diabetes risk questionnaire), **School card** for a teacher.

### 4.7 Me
Language, large text, mode, phase of illness, **shared phone** (several people, each with their own data and PIN), **keep watching in the background**, **send the alert SMS by itself**, **account and sync**, and a reset.

---

## 5. How it works

### 5.1 The big picture

```
 PHONE (works with no internet)                        SERVER (optional, free tier)
 ------------------------------------------------      -----------------------------
 sensors  -> detector -> alert flow -> escalation  --> SMS / call / WhatsApp (phone's own plan)
   |            |            |
   |            |            +--> outbox (events) ----> Supabase: Postgres + Row Level Security
 accelerometer  thresholds        queue, retried                |
 heart band     learned from      when online                   v
 (Bluetooth)    feedback                              circle members' phones poll and
                                                      show what the dial allows
 local state (AsyncStorage)  tokens (Secure Store)
```

Everything left of the arrows works offline. The server only carries short events to other phones.

### 5.2 A fall, step by step (and what needs what)

| Step | Where it happens | Needs |
|---|---|---|
| Sample the accelerometer (10 times a second, 8-second buffer in memory) | Phone | Nothing |
| Decide "hard impact, then still" with a confidence and reason | Phone (`detectFall` in `src/logic.js`) | Nothing |
| Show "Are you OK?", speak it, vibrate, count down 30 s | Phone | Nothing |
| Offer Call / WhatsApp / SMS for the contact | Phone | Call and SMS: mobile signal only. WhatsApp: internet |
| Send the SMS without a tap (if the person turned it on) | Phone, native module | Mobile signal and the person's own SMS plan |
| Tell the circle's other phones | Outbox, then server | Internet. Delivered late if offline |
| Circle member sees a banner | Member's phone, polling every 30 s while Saath is open | Internet on both phones, no push yet |

With **no signal at all**, nothing can leave the phone. It can only warn people nearby (voice and vibration) and keep the event queued.

### 5.3 The Privacy Dial
Each member has a dial: **0 safety only, 1 routine, 2 full**. A member receives an event if it is a safety event (always), or its level is at or below their dial and they are not on Time Off. A guardian keeps at least Routine. This one rule, `canReceive`, is written three times on purpose, and tested each time: in the app (`src/logic.js`), in the database policy (`can_see_event` in `docs/supabase/schema.sql`), and in tests that compare them.

### 5.4 Learning one person's normal
The app starts with default thresholds. A "false alarm" makes the impact threshold a little higher and the quiet threshold a little longer for that person; a "missed event" makes them more sensitive. The result is shown in plain words so the person can see and reset it. This is a simple rule, not machine learning, so it can be explained and tested.

### 5.5 Sync and accounts (optional)
Signing in is free and needs no phone number: **Allow anonymous sign-ins** is a free Supabase setting, and "Turn on sync" creates an account for that phone. Circles still work because people join with an **invite code**, not a number. The trade-off is that an anonymous account cannot be recovered: if the app's data is cleared, the circle must invite the person again. Phone-code sign-in exists behind a flag but needs a paid SMS provider, so it is off.

The person's phone writes short events (fall or quiet alert, answering it, "I'm OK", a task finished) into an **outbox**, sent in batches and retried. Members join with `accept_invite(code)`, a server function that adds them at "safety only" and locks an account out of guessing after ten wrong codes in 15 minutes.

### 5.6 Why polling and not push
Push notifications through Firebase Cloud Messaging are free and would wake a member's phone even when Saath is closed. They need a Firebase project and key and a server trigger, which are not set up yet. Until then members see an alert only while Saath is open. This is the largest remaining gap for a safety app and is listed as next work.

---

### 5.7 Production mode, accounts, calls and push (added 2026-11-16)
- **Production mode.** An installed (release) build starts empty: no demo people, no fake phone numbers, no invented readings or costs. A first-run setup asks who uses the phone, a name, the people to reach (real numbers) and how alerts should work. Demo data is loaded only on request (Me, Demo mode) and removed again, and **demo mode never places a real call or message**, so a demo contact's fake number can never be dialled. The Expo Go development build keeps the demo data.
- **Automatic calls.** After the countdown, Saath dials contact 1; when that call ends it dials contact 2, and so on. Android does not say whether an outgoing call was answered, so a call that lasts about 50 seconds is taken as someone answering and the chain stops; shorter ones move on. The clock waits while a call is up. With the phone locked, a full-screen notification brings Saath up first (the phone may ask the person to allow "full screen notifications"). **Not tested on a phone.**
- **Accounts and roles.** An account is a phone number and a password (no text message, so no cost; the same login works on a second phone; a forgotten password cannot be reset). Roles are enforced by the database: see `docs/RBAC.md`.
- **Push.** Code, table, trigger and server function are written and tested without Firebase; it needs your Firebase project: see `docs/PUSH.md`.

---

## 6. Technologies, and why each was chosen

### 6.1 The app
| Choice | Why |
|---|---|
| **React Native with Expo (SDK 58, React Native 0.88, React 19), plain JavaScript** | One codebase, fast iteration, runs in Expo Go for quick tests, and ships as an Android APK. JavaScript (not TypeScript) keeps it approachable for the team. |
| **Hermes, new architecture** | Smaller and faster on low-end phones. |
| **A single reducer plus a context store** (`src/state`) | One predictable place where every change is made, so rules (consent, caps, privacy) are easy to test and nothing hides in components. |
| **AsyncStorage** | Offline-first local persistence, namespaced per profile. |
| **expo-secure-store** | Sign-in tokens go in the phone's Keystore, not in the plain state file. |
| **expo-sensors (Accelerometer)** | The one motion sensor for falls and inactivity. Built in to every phone. |
| **expo-speech** | Spoken prompts in Hindi and English, so reading is optional. |
| **expo-haptics** | A felt tap on a press, a warning buzz on an alert. |
| **expo-image-picker (camera, on tap only)** | The optional foot-check photo. Never used silently. |
| **expo-print, expo-sharing and react-native-qrcode-svg** | Health passport as a PDF and a QR code that works offline. |
| **react-native-svg** | The dye ring, mood faces, charts and the plate diagram are drawn, not emoji or stock icons. |
| **Lucide icons (one file per icon)** | Consistent line icons without bundling 2,000 unused ones. |
| **Mukta font (3 weights)** | One family covers Devanagari and Latin, so Hindi and English look like one voice. |

### 6.2 Native code (Kotlin, installed build only)
| Module | Purpose | Why native |
|---|---|---|
| `saath-foreground` | A visible foreground service so Saath can keep watching with the screen off. | Android only lets a visible service keep an app alive. |
| `saath-sms` | Send an SMS without a tap (`SmsManager`), with the `SEND_SMS` permission, only when the person turned it on. | Expo has no API for it. Google Play restricts this permission, which suits a directly installed APK, not a store release. |
| `react-native-ble-plx` | Read a Bluetooth heart-rate band (standard BLE Heart Rate service). | Bluetooth Low Energy needs native code. |

In Expo Go and in tests these modules are absent, so each wrapper in `src/services` is a safe no-op.

### 6.3 Backend (optional, free)
| Choice | Why |
|---|---|
| **Supabase** (Postgres, Auth, REST) | A free tier, real SQL, and **Row Level Security**, which lets the database itself enforce the Privacy Dial instead of trusting the app. |
| **Anonymous sign-in** | Free and number-free, because SMS codes cost money. |
| **Configurable server address** | Supabase's main domain was blocked by Indian ISPs from February 2026 and reportedly restored in October 2026. The address is a setting, so a custom domain or proxy can replace it without a code change. |
| **WhatsApp `wa.me` links** | Free, because the person's own phone sends it with one tap. Automatic sending from a server needs the paid business API, and unofficial automation breaks WhatsApp's rules, so we do not use it. |
| **Firebase Cloud Messaging** (planned) | Free push, the right automatic channel for members. |

### 6.4 Quality tooling
Jest with jest-expo and Testing Library (hundreds of automated tests; 400 at the last full run), ESLint (including React hooks purity rules), Prettier, `expo-doctor`, and SQL policy tests that run against the real database.

---

## 7. Sensors and devices

| Hardware | Used for | Status |
|---|---|---|
| **Accelerometer** (inside the phone) | Fall and long-stillness detection | Built. Verified on traces and an emulator by us. **You report a real fall test worked on a real phone; we have not recorded the details.** The thresholds are still defaults, not tuned across many people. |
| **Speaker** | Spoken prompts (text to speech) | Built. Run on an emulator with audio off, so voice has not been heard on a device by us. |
| **Vibration motor** | Press feedback, alert buzz | Built. Not felt on a device by us. |
| **Camera** (on tap only) | Foot-check photo diary | Built. Permission prompt and the "Don't allow" path checked on an emulator; capture itself not. |
| **Bluetooth heart-rate band** (an IoT device) | Live heart rate, and a prompt only if it stays unusual while the person is still | Logic and screen built and tested without hardware. **Not yet run against a real band.** A phone running a BLE tester app can stand in as a band for a demo. |
| **Mobile network** (SMS, calls) | Reaching contacts | Call and SMS via the phone's own app: built. Automatic SMS: built, **not yet run on a phone**. |
| **Not used, on purpose** | Microphone, GPS, contacts, other apps' notifications, glucose | The phone cannot sense blood sugar. Location and microphone are blocked or unused. (Android 11 and earlier require the location permission for any Bluetooth scan; Saath never reads the location.) |

### 7.1 Demo simulations (for the presentation)
Three things need hardware or a server that is not available on a stage. Each has a clearly labelled demo that goes through the *same* screens, wording and logic as the real thing, and says on screen that it is a demo. They appear only while **Demo mode** is on (the default).

| Real thing | Demo stand-in | What it shows |
|---|---|---|
| A Bluetooth heart-rate band | **Try a simulated band** on Safety, with Resting, High while resting, Low while resting | The live rate, and the calm note that appears only when the rate stays unusual while the person is still |
| An SMS sent without a tap | Turn on **Send the alert SMS by itself** in Expo Go: the alert screen shows "Demo: would send to Asha: ..." | The exact message and the contact order, with nothing actually sent |
| A family member's phone, receiving the alert | **Demo: add a person I look after**, **they may have fallen**, **they say they are OK** on Circle | The red banner on every tab, the feed worded in plain language, the dial level, and how an answer clears it |

The demo buttons replace only the second phone and the hardware. The detector, the privacy rule, the escalation and the wording are the real code.

A heart-rate band never makes Saath diagnose. The app only says the rate "has stayed high/low while you were still" and points to the clinician's plan. The default limits (120 and 40 beats a minute, while still for two minutes) are placeholders a clinician must set.

---

## 8. Privacy and safety in practice

**Stays on the phone, always:** raw accelerometer samples, heart-rate readings, sugar readings, insulin times, meals, budget, check-ins, photos, the health passport.

**Can leave the phone, only if the person signs in:** a short event with a fixed kind (`fall`, `quiet`, `im_ok`, `false_alarm`, `task_done`), at most a task title, no readings, no amounts. Unsent events are capped at 200.

**Defences in the database** (applied to the project and tested live): every policy applies only to signed-in users; the signed-out role has no access; one household per account; text length limits; caps on members, invites and events per hour; wrong-invite lockout; phone numbers visible to others only through a view that checks consent.

**Known weaknesses, stated plainly:**
- The shared-phone PIN is a deterrent, not encryption. Data on the phone is not encrypted.
- Anonymous accounts can be made by anyone; limits slow abuse but do not stop a determined person. Turn on CAPTCHA before the server is public.
- Where the data is stored (the project is in Tokyo) and the guardian-consent step both **need legal review**.
- Hindi has not been read through by a native speaker. Food guidance, the diabetes-risk cut-offs and every rule threshold need review by a clinician or dietitian.

---

## 9. How we know it works (and what we have not checked)

- **Automated:** every rule that decides who sees what, when an alert escalates, and what the text may say is in pure functions with tests. Screens are tested with Testing Library, including English, Hindi, large text, each role, and an accessibility check that every control has a name.
- **Live database:** 33 policy checks run as anonymous accounts and as a signed-out client, inside a transaction that rolls back. All passed.
- **Emulator:** the screens, the alert and its escalation, Hindi, large text, the Plan tools and the camera-permission path were driven on an Android emulator.
- **Real phone:** the app runs in Expo Go on a real phone. The user reports a real fall test works.

**Not checked:** TalkBack, a native-speaker read of Hindi, battery cost of sensing, the foreground service and automatic SMS on a phone, a real Bluetooth band, two real phones talking through the server, and sync with anonymous sign-in switched on.

---

## 10. Status at a glance

| Area | Status |
|---|---|
| Today, Circle, Safety, Care, Plan, Me screens; Hindi/English; large text; design system | Built and run on an emulator |
| Fall and inactivity detection, alert, escalation, learning from feedback | Built; real fall reported working; thresholds untuned |
| Privacy Dial, Time Off, consent for contact numbers, audit log | Built and unit-tested |
| Care layer (sugar, stock, strips, budget), handover ladder, passport, check-in, food, body check, school card | Built and run on an emulator |
| Shared-phone mode with PIN | Built; tested in Jest only |
| Cloud sync, invites, circle feed and banner | Built; policies tested live; the app's own client code ran end to end against the live server (two throwaway accounts: sign-in, events, invite, join, feed under the dial). **Not yet run from the app on a phone or with two real phones** |
| WhatsApp / SMS / Call buttons on the alert | Built; not run on a phone |
| Automatic SMS, foreground service | Kotlin written; **needs an installed build, not yet run** |
| Bluetooth heart-rate band | Built and tested without hardware; **not yet run on a band**. A labelled demo simulation exists for the presentation |
| Demo simulations (band, SMS, a person I look after) | Built and tested; for the presentation |
| Daily task reminders (local notifications) | Built and tested with the notification layer mocked; not seen firing on a phone |
| Loud alarm when nobody answers | Built; sound file and logic tested; not heard on a phone |
| Dial written to the server for joined members; member-side Time Off | Dial verified against the live server in a two-account run; screen tested; Time Off against a fake server |
| App icon, themed icon, splash | Generated in the Saath identity; not yet seen on a phone |
| Standalone release APK (no PC needed) | **Builds** (`dist\saath.apk`, 37.3 MB, arm64-v8a and armeabi-v7a, app code and siren inside). Signed with the debug key, so it installs but is not a Play Store build. **Not yet installed or run on a phone** |
| Production mode: empty first run, setup flow, real contacts, demo only on request | Built and tested (Jest); not run on a phone |
| Automatic calls one by one, lock-screen alert, wake lock while watching | Kotlin and logic written; logic tested with the native layer mocked; compiles in the release build; **not run on a phone** |
| Account with phone number and password; roles enforced by the database | Client tested against a fake server; roles and limits verified live (40 policy checks); **the phone sign-in switch on the server must be turned on by the owner** |
| Push notifications (FCM) | Firebase project set up and credentials verified; server function deployed and tested; trigger on; **not yet delivered to a real phone** (`docs/PUSH.md`) |
| Signed release APK | **Not built.** See section 12 |

---

## 11. Repository map

```
App.js, index.js            entry; loads fonts, wraps the store
src/AppShell.js             header, tabs, alerts, lock screen, sync hook
src/logic.js, care.js,      pure rules: privacy dial, escalation, fall detector,
  plan.js, heart.js,          care rules, handover, heart band parsing and prompts
  profiles.js, circleFeed.js
src/state/                  reducer, store, cloud sync hook
src/screens/                Today, Circle, Safety, Care, Plan, Me, Consent, Lock
src/components/             design system (ui, kit, art, icons), alert banners, sections
src/services/               sensing, storage, voice, haptics, foreground, sms, ble, cloud
src/i18n/strings.js         English and Hindi (a test enforces the same keys)
modules/                    Kotlin: saath-foreground, saath-sms
docs/                       SPEC, ARCHITECTURE, DATA_MODEL, DESIGN, SCREENS, TEST_REPORT,
                            PAPER_MAP, supabase/ (schema.sql, policy_tests.sql, SETUP.md),
                            DEMO_SCRIPT.md, VOICEOVER.md
__tests__/                  the automated tests
.claude/skills/             project rules for design, privacy, health safety, sensing, localization, testing
```

---

## 12. Running it, and the build problem

**Quick demo (no build):** `npx expo start` in the project folder, then open the app in Expo Go on a phone on the same Wi-Fi. Everything works except what needs native code (background service, automatic SMS, Bluetooth).

**Full app (native features):** needs an installed APK. On Windows the C++ part of the Android build fails because the build tool (Ninja 1.10.2 bundled with the SDK) cannot open paths longer than 260 characters, even with Windows long paths switched on. We tried replacing the tool with a newer download, which was blocked as unsafe, so the working approach is to build from a copy at a very short path (`Z:\s`) with the C++ build folder also on a short path. Other routes: build on Linux, WSL or a CI runner. The first successful APK is still pending.

**Free tier and the server:** a free Supabase project is paused after inactivity and has no backups. A paused server means no circle sync, but each person's phone keeps working fully offline, including fall detection and tap-to-call.

---

## 13. What comes next

1. Finish the first installed APK and run it on a phone: foreground service, automatic SMS, Bluetooth band.
2. Switch on anonymous sign-in and test the circle for real with two phones.
3. Push notifications through Firebase (free), the main remaining gap.
4. Write the per-member dial, Time Off and shared-number choices to the server (today every joined member stays at "safety only").
5. A loud local siren, and secure the circle member's own Call button with consented numbers.
6. A clinician or dietitian review of food, risk and rule thresholds; a native Hindi read-through; legal review of consent and data location.
7. A TalkBack walk-through, a battery measurement, and a tuning study of the fall thresholds with more than one person.

---

## 14. Glossary

- **ASHA**: Accredited Social Health Activist, a community health worker in India's public health system.
- **Circle**: the group of people around the person who share the care.
- **Privacy Dial**: the person's setting for how much each circle member sees (safety only, routine, full).
- **Row Level Security (RLS)**: database rules that decide, row by row, what each signed-in user may read or write.
- **Foreground service**: an Android feature that keeps an app running with a visible notification.
- **BLE**: Bluetooth Low Energy, used by most heart-rate bands and chest straps.
- **DPDP Act 2023**: India's Digital Personal Data Protection Act, which treats under-18s' data specially.
- **Anonymous sign-in**: an account made without a phone number, email or password.
