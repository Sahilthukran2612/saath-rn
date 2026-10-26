---
name: saath-design-system
description: Use for any Saath UI work. Palette, type scale, touch targets, role-aware home screens, accessibility rules.
---

- Palette and type scale come from `src/theme.js`: indigo `#26306B` (trust), haldi `#F2B134` (warmth), leaf `#2F8F6B` (done), mist `#F6F7FB`. Brick `#B3261E` is for real safety alerts only.
- Touch targets at least 56 px. Body text 18 px or larger. Support OS font scaling and the in-app large-text mode (`useScale`).
- Icon plus word on every control. One primary action per screen.
- Copy: sentence case, plain verbs, no blame, no jargon. Errors say what happened and what to do. The same action keeps the same name across the flow.
- TalkBack labels on every control. No colour-only meaning. Motion only after a tap or for a real safety alert.
- Role-aware home: Teen (Transition Ladder, privacy dial), Elder (huge Today list, one big "I'm OK", voice), Adult T2D (sugar plan, refill days, spend), Family (status at a glance, delegate), Neighbour (safety only), ASHA/Clinician (ranked households, one-page summary).
- Avoid the generic SaaS-card look, cream plus terracotta, and neon on black.
- Also invoke `frontend-design:frontend-design` for layout and typography critique.
