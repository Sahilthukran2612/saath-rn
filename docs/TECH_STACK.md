# Saath: tech stack and why

Saath is a shared care companion for chronic illness and diabetes in low-income Indian households. The stack follows from five constraints, so each choice below is tied back to one of them.

| # | Constraint | What it forces |
|---|---|---|
| C1 | Low-end Android (8+, about 2 GB RAM) | Small app, light animation, no heavy native SDKs |
| C2 | Offline-first | All logic and data live on the phone; the server is optional |
| C3 | Free, no ads | Free tiers only, no paid hardware, no paid APIs |
| C4 | Never calculate doses, never diagnose | Plain readable rules, a guard in front of any AI text |
| C5 | Privacy: raw sensor data stays on the phone | On-device processing, the patient controls who sees what |

## 1. At a glance

| Layer | Choice | Version in the repo |
|---|---|---|
| App framework | React Native with Expo (JavaScript, not TypeScript) | Expo SDK 58, React Native 0.88, React 19.3 |
| Native code | Kotlin Expo modules, Android only | `modules/saath-foreground`, `saath-call`, `saath-sms` |
| Styling | NativeWind (Tailwind) plus RN Reusables-style components | nativewind 5 rc, tailwindcss 4.1 |
| Animation | Reanimated and Worklets | 4.7 and 0.13 |
| Graphics | react-native-svg, lucide icons, QR via react-native-qrcode-svg | 15.16 |
| Local storage | AsyncStorage for state, expo-secure-store for secrets | 2.2 |
| Backend | Supabase: Postgres with row-level security, Auth, Edge Functions | free tier |
| Push | Firebase Cloud Messaging, called from a Supabase Edge Function | free |
| AI | Groq models behind a Supabase Edge Function | free tier |
| Tests | Jest with React Native Testing Library | Jest 30, 706 tests |
| Build | Gradle through `scripts/build-apk.ps1` (Windows) | Gradle 9.4.1, JDK 17 |

## 2. Why each choice

### React Native with Expo, in JavaScript
- **One codebase for Android and iOS (C1, C3).** A small team can ship both without writing the app twice.
- **Expo's modules cover the needs** (sensors, notifications, speech, print, sharing, image picker, secure store), so we add few dependencies. The project rule is "keep dependencies minimal, prefer Expo modules".
- **JavaScript keeps the safety logic testable.** `src/logic.js` (alert rules, privacy dial, fall detection, care rules) is pure functions. Jest runs them in milliseconds, with no phone needed. We rejected a Flutter or full-Kotlin rewrite because it would throw away this tested logic.
- **Trade-off:** React Native has a larger baseline than a pure native app. We keep it lean (see Performance below).

### Kotlin native modules (Android only)
- **Why native at all:** a fall or a long quiet matters most when the app is closed. Android 8+ stops background work unless it is a visible foreground service, and Expo's background-task tools run at best every 15 minutes and are killed by battery savers. A foreground service is the only supported way to keep an accelerometer listener alive. It is visible to the person, which also fits "no silent watching".
- **Three small modules:** the foreground service, calls and SMS (so the escalation chain can ring the contacts the person typed).
- **They are Android-only on purpose.** On iOS the same abilities are not allowed in the same way, and the modules are marked `platforms: ["android"]` so iOS builds skip them.

### NativeWind and RN Reusables-style components
- **Fast to keep consistent (C1).** Utility classes and a small shared kit (`kit.js`, `ui.js`) give one design language: calm indigo, saffron accents, and brick red reserved for real alerts only.
- **Accessibility rules live in one place:** targets of at least 56 px, large type, Hindi and English parity.
- **Caveat:** NativeWind 5 and `react-native-css` are release candidates. They work in our tests and builds, but we pin exact versions so an update cannot break the look.

### Reanimated and SVG for motion and art
- **Why:** the suggestion cards, the I'm OK ring, the floating bar and the sheets are animated. Reanimated runs animation off the JavaScript thread, which suits low-end phones.
- **SVG** draws the card art, ring and charts as small vectors instead of large image files, which keeps the app small (C1) and sharp at any size.

### AsyncStorage and secure store
- **Offline-first (C2):** every screen reads from state saved on the phone. Nothing waits for a network.
- **Secure store** holds the sign-in tokens; everything else is ordinary app state.
- **Honest limit:** AsyncStorage is not encrypted. Encrypted storage is on the "not built yet" list.

### Supabase (Postgres, Auth, Edge Functions)
- **Free tier (C3)** with a real database, so the circle, the invites and the doctor's view can work across phones.
- **Row-level security enforces the privacy dial in the database (C5).** Who sees an event or a sugar reading is decided by SQL policies (`can_see_event`, the readings policy), not by app code that a modified client could bypass. The rules are tested in `docs/supabase/policy_tests.sql`.
- **Plain HTTP from the app.** The app talks to Supabase through its REST and Auth endpoints with `fetch` (`src/services/cloud.js`) and does not use the Supabase client library. This keeps the bundle small and lets the sync code be tested against a fake server.
- **Edge Functions** hold the two things that need a secret: `push` (sends notifications) and `ai` (calls Groq). Keys never reach the phone.
- **Trade-offs:** free-tier projects can pause after inactivity, and there is no password reset yet. A forgotten password cannot be recovered.

### Firebase Cloud Messaging for push
- **Why:** it is free and is the standard route to reach an Android phone when Saath is closed.
- **Only safety events are pushed** (event type 0), in each person's language. A database trigger calls the `push` function, which looks up who may see the event and their device tokens.
- **Status:** built and covered by tests against fakes, but **never run on two real phones**. On iOS, push needs Apple's push service, which needs a paid developer account, so it is not part of the free iOS build.

### Groq behind the `ai` Edge Function
- **Why AI at all:** the suggestion cards and the helper chat go beyond what fixed rules can say. The rule-based care cards always come first and still work offline.
- **Why Groq:** a free tier and fast answers. Models in use: a larger model for answers and a smaller one as a topic classifier.
- **Why a relay:** the key stays on the server, with daily and per-address limits (`ai_usage`).
- **Safety design (C4):**
  1. Only patients get the helper and AI cards.
  2. Emergency wording is answered on the phone and never sent anywhere.
  3. The server classifies the topic and fails closed: off-topic or unsure gets one fixed refusal.
  4. Only an anonymous summary is sent (language, time of day, counts, flags), never names, readings or numbers.
  5. A guard on the phone checks every reply and replaces anything with a dose, a diagnosis or the meaning of a reading with a fixed safe line.
- **Limit:** the guard is pattern-based. It is tested but not clinician-reviewed.

### Jest and Testing Library
- **706 automated tests** cover the safety logic, the privacy rules, the sync code, the screens in both languages, and the AI guard. The project rule is that nothing is claimed to work unless it was run.
- **Not covered:** two-phone flows, push, a real fall, and battery use. These are listed as unverified in the real, simulated and future table.

### Gradle script for Windows builds
- **Why a script:** the C++ part of the React Native build creates paths over 260 characters, which Windows' build tool cannot open. `scripts/build-apk.ps1` builds from a very short folder instead. It produces a standalone release APK (arm64 and armv7) or an x86_64 build for the emulator.

## 3. Choices we rejected

| Option | Why not |
|---|---|
| Flutter or a Kotlin rewrite | Loses the tested JavaScript logic and Expo tooling |
| Expo background tasks for sensing | Run every 15 minutes at best and are killed by battery savers, so they cannot catch a fall |
| Firebase as the whole backend | Its database rules are weaker than SQL row-level security for a per-person privacy dial |
| Calling the AI directly from the phone | Would put a secret key in the app |
| Bluetooth heart-rate band | Built, but hidden (`SHOW_HEART = false`) because it is untested on real devices and needs extra hardware |
| Care budget | Built, but hidden (`SHOW_BUDGET = false`) for now |
| Paid SMS or call APIs | Against the free rule. The phone's own SIM places the call or SMS |

## 4. Performance and size (C1)
- Android release APK is about 44 MB for the phone build. This was measured; battery use was **not** measured.
- Sensing runs at 10 Hz in JavaScript today. Profiling 5 Hz against 10 Hz, and Android sensor batching, are next steps.
- The app avoids heavy libraries: no map, no video, no analytics SDK, no ads.

## 5. What is real
| Status | Items |
|---|---|
| Real, and run | Privacy and alert rules (unit-tested); accounts, circle and AI on the live server; the Android release build |
| Built, not run on devices | Invite and QR with two phones; doctor readings and care plans; push; Bluetooth band |
| Not built yet | iOS build; TalkBack testing; encrypted storage; password reset |

On iOS the Android-only modules (fall sensing, auto call, SMS, siren) are absent, and the iOS version has never been built or run.

## 6. Where to find things
- App code: `src/` (`logic.js`, `state/`, `screens/`, `components/`, `services/`, `ai/`, `i18n/`)
- Native modules: `modules/`
- Backend: `supabase/functions/` (push, ai) and `docs/supabase/*.sql` (schema, readings, ai, policy tests)
- Tests: `__tests__/`
- Related docs: `ARCHITECTURE.md`, `DIAGRAMS.md`, `ALL_DIAGRAMS.mmd`, `AI.md`, `TEST_REPORT.md`
