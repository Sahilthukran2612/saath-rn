# Paper map

This maps each idea in the project pitch ("Pitch v2") to where it lives in the app and how it was checked. I did not have the pitch text, so the "Paper section" column is blank for the team to fill in. Nothing here is a claim about what the paper says.

| Idea | Paper section | Where in the app | Checked by | Status |
|---|---|---|---|---|
| Care is a handed-over responsibility, not one person's burden | | Transition Ladder (`src/plan.js`, `plan/Handover.js`) | `plan.test.js`, `phase3.test.js` | Built, run on an emulator |
| Privacy Dial: the person decides who sees what | | `canReceive`, Circle screen | `logic.test.js`, `ui.test.js` | Built; cloud policy written, not run |
| Safety events always reach the circle, Time Off never mutes them | | `escalationChain`, reducer | `logic.test.js`, `phase1.test.js` | Built |
| Sensing is one input: detect a possible fall or long quiet, then ask | | `detectFall`, `isInactive`, `sensing.js`, alert flow | `logic.test.js`, emulator run | Logic tested on traces; never on a real fall |
| The phone cannot detect low sugar: prompt only | | `lowSugarPrompt`, `glucoseAdvice`, strings | `care.test.js`, `i18n.test.js` | Built |
| No doses | | No dose field in state, UI or schema | `care.test.js`, `schema.test.js` | Enforced by tests |
| Personal baseline: the app learns from feedback | | `adjustBaseline`, "How Saath learned from you" | `care.test.js` | Built |
| Cost is a care problem for low-income homes | | Care Budget and saving tips | `care.test.js` | Built |
| Teens move to adult care with a guardian involved | | Guardian consent step, guardian minimum dial | `phase1.test.js` | Built; needs legal review |
| One phone, many people | | Shared-phone mode (`src/profiles.js`, lock screen) | `profiles.test.js`, `phase4.test.js` | Built; Jest only |
| Local language and voice | | `strings.js`, `voice.js` | `i18n.test.js` | Hindi unreviewed by a native speaker; voice not run on a device |
| Local help: ASHA and clinician views | | Role homes (`TodayScreen.js`) | `ui.test.js` | Simulated: no real accounts |
| Evidence: trial mode and CSV export | | Safety tab sensor trial tools | `phase2.test.js` | Built; no real trial run |

## Evidence the team still owes
Anything about real users, a real fall, battery use, or comprehension in Hindi. None of that was collected. The app has only been run on an emulator.
