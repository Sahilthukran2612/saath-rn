# Saath ("together")

A shared care companion for people living with a chronic illness such as diabetes, built for low-income Indian households. Care is a responsibility handed between people (parent and teen, self and family, neighbour, ASHA worker, clinician). The phone's sensors are one input, not the solution. Expo SDK 58, React Native, plain JavaScript, with small local Kotlin modules for Android. Offline-first, low-end Android, free, no ads. Product rules are in `CLAUDE.md`; the full explanation is in `project.md`.

## Run it
```
npm install
npm test            # 30 suites, 556 tests (Jest)
npm run lint
npx expo start      # Expo Go: demo only, native features are missing
```
For the real app (calls, SMS, lock-screen alert, background watching, push) build the standalone APK on Windows with `scripts/build-apk.ps1 -Release`. It produces `dist\saath.apk`. See `docs/ARCHITECTURE.md` for why the script exists.
Backend setup (free Supabase project, Firebase push) is in `docs/supabase/SETUP.md` and `docs/PUSH.md`. Without a `.env` the app runs fully offline.

## Two kinds of phone
- **"I need care"**: the person. Sets up emergency contacts, gets the fall/quiet watching, reminders, alerts.
- **"I look after someone"**: a guardian, neighbour, ASHA worker or doctor. They say which at sign-up, create their own account, and join with an invite code (typed, or scanned as a QR) that is bound to their phone number. They see only what each person's Privacy Dial allows. The role belongs to each person they look after, so one phone can be a guardian for one person, a neighbour for another and a doctor for a third. They get one screen, "People I look after" (a doctor's says "My patients"), most urgent first.

How people are added: the person taps **Add a person** once (name, number, role). That makes them an emergency contact and an invite at the same time, with a QR to scan. A doctor can instead show **their own card** (**Add my patient**); the person scans it, confirms once, and shows a code back. No details are typed twice.

Details: `docs/ROLES.md` (how each person gets in) and `docs/RBAC.md` (who can see what, enforced by the database).

## Real, simulated, future
"Run" means seen working in this project's own testing. "Phone" means seen on a physical Android phone. Only the fall test has been confirmed on a phone (by the project owner).

| Area | Status |
|---|---|
| Privacy Dial, escalation order, Time Off never skipping safety, fall and inactivity detection, care rules (glucose prompts, refill, budget, Transition Ladder, Visit Prep, IDRS, food guide) | **Real logic**, unit-tested. Detection tested on synthetic traces |
| Fall detection from the phone's accelerometer | **Phone**: a real fall test worked. Not measured for battery or false-alarm rate |
| Alert flow: countdown, escalating steps, siren, show-over-lock-screen alert, WhatsApp / SMS / Call buttons | Built and tested with native parts mocked. **Not seen on a phone** except as noted above |
| Automatic calls to contacts one by one (stops if a call lasts about 50 s, a stated guess) | Built, compiles, tested with the call layer mocked. **Not run on a phone**; background launch rules differ by phone brand |
| Automatic alert SMS, daily reminders, siren sound | Built, tested with native parts mocked. Not seen or heard on a phone |
| Accounts: phone number + password (no paid SMS), anonymous use, sign-out, several phones per account | **Run against the live server** with throwaway accounts (deleted afterwards) |
| Circle: number-bound invite codes (single use, lockout after wrong tries), join, role, dial, feed, Time Off | **Run against the live server**. Database rules checked by 45 live policy tests |
| Push notifications (Firebase) | Server chain run up to Google. **No notification delivered to a real phone yet** (needs two phones) |
| Two-phone flows (invite then join, helper receiving the alert) | **Not run**: only one phone available |
| Bluetooth heart-rate band | Built with the native layer mocked; not run with a real band. A labelled simulated band exists for the demo |
| Demo mode (simulated band, on-screen SMS and calls, stand-in family phone, sample people) | Built and tested. Always labelled as a demo; never places a real call or message |
| Shared-phone mode (profiles, PIN) | Unit-tested. Not run on a phone. The PIN deters, it does not encrypt |
| Guardian consent for under-18s | Records a name and number. **Does not verify identity. Needs legal review. Not a compliance claim** |
| Food guide content, IDRS cut-offs | Starter content by this project. **Needs clinician or dietitian review before real use** |
| Health Passport QR/PDF, foot check, weekly check-in | Built; run on an Android emulator earlier, not on a phone |
| Hindi and English | Complete and parity-checked by test. **No native-speaker review yet** |
| Accessibility | Automated audit (every control named, 56 px targets, computed contrast ratios). **TalkBack not run** |
| Suggestion slips on Today (16 fixed rules, made on the phone from what the person entered; no doses, no diagnosis; hard weeks only get company and rest; animated stamp and tear-off) | Built, 14 rule tests and 5 screen tests, see docs/SUGGESTIONS.md. **Not seen on a phone; wording not clinician-reviewed; Hindi not native-reviewed** |
| Counter Stamp touches (slips, stamped I'm OK, doodles) inside the newer look | Built; colours audited by computed contrast tests, light and dark |
| Release APK | Builds (`dist\saath.apk`, about 46 MB, both phone CPU types). The owner installed an earlier build on a phone; **the newest build has not been tried on a phone yet** |

| Role dashboards: guardian, neighbour, ASHA (household visits, "Visit due"), doctor (patients, care plan builder) | Built and covered by tests; the doctor view was looked at on an emulator. **Not run with two phones** |
| Doctor care plans: a doctor in the circle publishes medicines, tasks and a note; the person's phone applies the newest by itself and says who set it | Server table and rules **run against the live server** (anonymous read and write refused). End-to-end flow tested in code. **Not run with two phones** |
| Join by QR (saath://join/CODE, doctor card saath://add/...) | Link handling run on an emulator; **no real camera scan yet** |
| Care analytics: sugar over 7/14/30 days, medicines taken, heart rate (this session only) | Built; sugar and medicine charts seen on an emulator. Numbers are reported, never labelled good or bad |
| Generated meal ideas and adaptive suggestion cards (region, diet, hour, what was given, what was turned down; habits the person skips fall away) | Built and tested. **Food names and Hindi wording need a dietitian and native-speaker review** (docs/REVIEW_SHEET.md) |
| Look: electric blue, pastel tiles, dark mode (Phone / Light / Dark), bottom drawers for forms, NativeWind + React Native Reusables for shared parts | Seen on an emulator in English and Hindi, light and dark. **Not seen on a phone**; only the shared components are on NativeWind so far |

Not built: SMS gateway or missed-call alerts, glucometer photo, voice input, forgotten-password recovery, encrypted local storage, CAPTCHA and extra abuse limits for a public launch. iOS is configured (docs/IOS.md) but has never run.

## Known limits
- Saath helps notice when someone may need help. It cannot promise to catch every fall and it does not sense blood sugar. It never calculates doses and never diagnoses.
- Android does not say whether an outgoing call was answered, so "reached" is a guess from call length.
- Data on the phone is not encrypted. A forgotten account password cannot be reset.
- The server project is in Tokyo; a legal review (data location, guardian consent under India's DPDP Act) has not been done.
- Free-tier servers can pause when unused.
- Demo data is labelled as such. Scheme and pharmacy information will be marked "verify locally".

## More
`docs/SPEC.md`, `SCREENS.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `TEST_REPORT.md`, `PAPER_MAP.md`, `DEMO_SCRIPT.md`, `VOICEOVER.md`.
