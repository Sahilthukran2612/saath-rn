# Saath (React Native, Expo, JavaScript)

Shared care companion for chronic illness and diabetes, for low-income Indian households. University HCI / UbiComp project ("Pitch v2"). Care is a responsibility handed between people (parent to teen, self to family). Sensing is one input, not the solution.

## Hard constraints
- Low-end Android (8+, about 2 GB RAM), offline-first, small, free, no ads. No CGM or costly hardware (optional cheap Bluetooth behind flags).
- Never calculate doses. Never diagnose. The phone cannot detect low sugar: prompts only.
- On-device sensor processing; raw data never leaves the phone. Do not read other apps' notifications.
- Minors need guardian consent (DPDP Act 2023): build the step, mark "needs legal review", never claim compliance.
- Scheme and pharmacy info is curated offline content marked "verify locally".

## Skills (in `.claude/skills/`)
saath-design-system, saath-privacy-rules, saath-health-safety, saath-sensing, saath-localization, saath-testing-and-reporting. Use them.

## Layout
`src/logic.js` pure logic (CFG, canReceive, escalationChain, detectFall, isInactive, glucoseAdvice, care rules). `src/state` reducer and store. `src/screens`, `src/components`, `src/services`, `src/i18n`, `src/theme.js`. Tests in `__tests__`.

## Rules of work
- Never change `src/logic.js` behaviour without updating its tests.
- After each phase: build, run, test, lint, then report **Works / Simulated / Broken / Next / Risks**. Do not claim something works unless it was run. Commit per phase.
- Expo APIs change between SDKs: check the docs for the installed SDK (58) before using an API.
- Keep dependencies minimal. Prefer Expo modules.

## Phases
0 make it run. 1 Circle, privacy, routine (invite, delegation, Rhythm Board, consent, phase-aware UI). 2 Safety Net and diabetes layer (foreground service, escalation via push/SMS, glucose, refill, budget). 3 handover, wellbeing, local help (Transition Ladder, Visit Prep, Health Passport QR/PDF, food, foot check). 4 accounts (Supabase with RLS for the dial, FCM), ASHA view, shared-phone mode, full localization. 5 polish and evidence (a11y audit, battery, APK, test report). Optional: Bluetooth devices, coarse location, on-device baseline ML.

## Deliverables
README, docs/SPEC.md, SCREENS.md, DATA_MODEL.md, ARCHITECTURE.md, TEST_REPORT.md, PAPER_MAP.md, and a final real / simulated / future table.
