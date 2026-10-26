---
name: saath-privacy-rules
description: Use whenever data crosses people in Saath. Privacy Dial semantics, safety events, audit log, consent rules.
---

- Privacy Dial: Safety only (0) / Routine (1) / Full (2). Event types: safety=0, routine=1, summary=2. A member receives an event when `eventType <= dial`, and safety always passes.
- Safety events always reach every member and cannot be disabled. Time Off never pauses safety alerts.
- Every view of shared data by a non-Person viewer is audit-logged once per meaningful view and is visible to the person.
- A teen controls parent visibility within guardian limits, never for safety-critical events.
- Data about a second person (e.g. a caregiver's location or contact) needs that person's consent too (interdependent privacy).
- Raw sensor data never leaves the device. Only summaries sync, and only with permission.
- Any change here must update the `canReceive` and reducer tests.
