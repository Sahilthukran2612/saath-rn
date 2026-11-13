# Saath voiceover script

Read at a calm pace. Pause about one second where you see (pause). About 7 minutes.

---

**1. Introduction**

In many Indian homes, an elder with diabetes spends part of the day alone. A teenager is slowly taking over their own care. A daughter or son lives far away and worries.

Saath, which means "together", is a care companion for these households. It works offline, it is small, it is free, and it runs on low-end Android phones.

---

**2. Today: the elder home**

This is the elder's home screen. In the middle is one big seal that says "I'm OK". Around it is one dot for every task in the day's routine.

(pause) When I tick a task, the tick draws itself and the dot fills in. The ring shows progress without needing a chart.

When I tap "I'm OK", the whole circle is told in plain words that the person is fine. Nobody has to guess.

Every button is large, and prompts can be read aloud.

---

**3. Language and large text**

On the Me tab, one switch makes all the text thirty-five percent larger. Another switch changes the whole app to Hindi. Every screen exists in both languages, and an automated test makes sure neither one falls behind.

---

**4. Circle and the privacy dial**

The circle is the group of people who look after this person: family, a neighbour, an ASHA worker and a clinician.

Each person has a privacy dial with three settings: safety only, routine, or full. The person chooses who sees what. For a teenager, a guardian can set a minimum.

A member's phone number is shown only if that member agrees. "Time off" pauses everyday updates for someone, but it never pauses safety alerts.

I can invite someone with a phone number. A wrong number gives a clear message. In this demo, invitations are simulated; real accounts come in a later phase.

"Ask for help" lets someone cover a task for a limited time, and it ends by itself.

At the bottom, a log shows who viewed what, so the person can always see who looked at their information.

---

**5. Safety and the fall alert**

Saath uses one sensor: the accelerometer. It looks for a hard impact followed by stillness, and for a long time without any movement. The readings stay on the phone and are never uploaded.

I will simulate a fall. (pause) A full-screen alert asks "Are you OK?" and starts a thirty-second countdown. It also shows how confident the guess is.

If I tap "I'm OK", the alert is cancelled. If nobody answers, Saath contacts the circle in order: family first, then the neighbour, then the ASHA, and then the clinician. Each step has Call and Message buttons.

If it was a false alarm, I tell the app. It learns this person's own pattern, so it becomes less sensitive for them.

The deep red colour is used only here. When you see red, it always means real danger.

One honest note: the fall thresholds are first guesses. I tested them on an emulator, not yet on a real fall.

---

**6. Care for diabetes**

The Care tab is for an adult with Type 2 diabetes. It shows blood sugar readings in a chart. It shows how many days of medicine and test strips are left, and a monthly spending bar, so a shortage is noticed before it happens.

Saath never calculates insulin or any medicine dose. Insulin is logged as a time only.

The phone cannot detect low blood sugar. So the app only prompts, and the prompt always says: follow your clinician's plan, or call family, a clinic or an ASHA.

---

**7. Plan**

The Plan tab has seven tools.

The Handover path helps a teenager step by step take over their own care, with a guardian approving each stage.

Visit prep collects questions and a one-page summary to take to the clinic.

The health passport puts key facts into a QR code and a printable PDF.

The weekly check-in is a short check of mood and symptoms, with a weekly summary.

The food guide shows a plate diagram and everyday foods like rice, dal and roti.

The body check has a foot checklist and a simple diabetes risk score. The camera opens only when I tap, and the app still works if I say no.

And the school card tells a teacher what to do in an emergency.

The food advice and risk cut-offs still need review by a clinician.

---

**8. Background watching**

A switch lets Saath keep watching for falls when the screen is off, using a visible notification. This works only in the installed app, not in Expo Go, so in this demo it explains why it is unavailable.

---

**9. Privacy and closing**

Saath does not use the microphone, location or contacts, and it never reads other apps' notifications. A person under eighteen needs a guardian's agreement first; that step is marked as needing legal review. Saath gives no diagnosis and no doses.

What is real today: the screens, the offline storage, the fall detector and the alert flow. What is simulated: invitations, messages and syncing. What comes next: real accounts, push notifications, a clinician view and a signed app file.

Saath. Together.
