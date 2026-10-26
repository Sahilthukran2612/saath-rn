---
name: saath-sensing
description: Use for sensor work in Saath. Foreground service, duty cycling, gaps, thresholds in CFG, confidence, feedback, safe testing.
---

- Background sensing needs a visible Android foreground service. Expo Go cannot do this; use a dev client (`expo prebuild`). Document the decision in `docs/ARCHITECTURE.md`.
- Duty-cycle the accelerometer. Handle data gaps explicitly: a gap after an impact is "unsure", not "fall".
- All thresholds live in `CFG` (`src/logic.js`) and are tunable.
- Show confidence on every sensed state. If unsure, ask the person.
- "False alarm" and "missed event" feedback adjusts the personal baseline with simple explainable rules. No black-box ML.
- Test with synthetic traces first (spike+still, spike+walking, no spike, sensor gap, phone on table).
- Never test falls with real older adults. Use the simulate buttons and the tally.
- Document battery-optimization guidance per phone brand.
