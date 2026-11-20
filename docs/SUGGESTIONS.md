# Suggestion slips: how they are made

The person's Today screen shows a pad of up to four **slips**: small things for today, in two kinds, **Care** (reminders from what the person has entered) and **Habit** (small daily routines that fit the hour). They are drawn as bill-book slips and are stamped when done. Code: `src/suggestions.js` (rules), `src/components/SuggestionPad.js` (the animated pad), `src/components/Stamp.js`, `src/components/doodles.js`. Tests: `__tests__/suggestions.test.js`, `__tests__/pad.test.js`.

## How a slip is generated

Nothing is generated in the sense of AI. The whole system is:

1. **A fixed set of hand-written cards** (16 rules). Each has an English and a Hindi title and body in `src/i18n/strings.js` (`sg.<id>.t`, `sg.<id>.b`). No text is composed at run time except numbers (days left, number of questions).
2. **An eligibility rule per card**, using only what is already on the phone: the clock, meals logged, routine, medicine and strip counts, the last foot check, the weekly check-in, the clinic-visit questions, the teen's Ladder stage.
3. **A ranking**: care reminders from the person's own entries first (refill about to run out 90, strips 80, a hard week 88, then lesser care reminders), then habits that fit this hour (a walk 20 minutes to 3 hours after a logged meal, a plate reminder at meal times, wind-down after 9 pm, and so on).
4. **The pad** is the top four. A slip stamped or put aside ("Not today") is gone for that calendar day and the pad comes back fresh the next morning. This is stored on the phone (`slips` in the app state).

Nothing is sent anywhere and no network is needed.

## Rules that are enforced and tested

- No dose, no medicine instruction, no diagnosis, no sugar level in any slip. A test scans every slip text in both languages for dose and diagnosis words.
- The phone cannot see sugar, so no slip says what a reading means. Care slips point to the clinic, chemist, ASHA or family.
- **Still open today** (	ask): a task on the person's own daily list whose hour passed an hour ago and is not ticked. It only points at the list and never says what to take. It is not shown after a hard week or in a crisis phase.
- Foot and shoe slips show only for diabetes, or when no condition is written. Habit slips are capped at two (one when there are two or more care reminders). The generic stretch slip was removed.
- After a hard week (the weekly check-in falls to 1 or 2) or in a crisis phase, **only** company, rest, the check-in, refill and strip reminders, the visit questions, water and sleep can appear. No walk, stretch, meal, foot, reading or ladder slip adds to the load.
- A real alert hides the pad completely.
- Water carries "if your clinic has told you to limit fluids, follow that". Meals say "as your clinic advised".
- Teens do not get the foot slip. The Ladder slip is for teens only.

## Not verified

- The wording of the habit and plate slips has **not** been reviewed by a clinician or dietitian. The plate proportions are the common plate method and the same starter content as the food guide.
- The Hindi has not been reviewed by a native speaker.
- The pad has not been seen or used on a phone; the stamp and tear-off animations are untested on low-end hardware.
- Ranking numbers are judgement, not tuned on real use.
