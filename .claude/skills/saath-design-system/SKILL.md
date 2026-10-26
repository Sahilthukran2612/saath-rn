---
name: saath-design-system
description: Use for any Saath UI work. Tokens, Mukta type, Lucide icons by file, springs, lists over cards, the dye ring, role-aware homes, accessibility.
---

Full write-up in `docs/DESIGN.md`. The rules below are the ones that get broken most easily.

**Tokens and type**
- Colours and sizes come from `src/theme.js` only. Brick red is for a real safety alert and nothing else.
- Text is Mukta (`fonts.regular | semi | bold`). Never set `fontWeight` with a custom family; pick the family. Import font weights by path in `App.js`, never from the package root.
- Body 18 or more, supporting text 16 or more, targets 56 or more. Everything must work at large-text 1.35x.

**Structure**
- A greeting header, one hero, then divided lists (`ListGroup`, `ListRow`). Do not put every item in its own card. Vary radii by role.
- No ALL CAPS labels, no "A · B · C" meta strings, no numbered markers unless the content is a real sequence.
- One primary action per screen. Buttons are `BigButton` (`primary`, `ok`, `quiet`; `alert` only on the safety takeover).
- Choices that have state use `Toggle` or `Segmented`, and the state is in the accessibility label.

**Icons**
- Line icons come from `src/components/icons.js`, one import per icon. Never `import ... from 'lucide-react-native'` (it bundles about 2,000 icons). Add a line to `icons.js` to use a new one.
- No emoji as icons. Faces, plate, mark, rings and charts are drawn in SVG (`components/art.js`, `components/kit.js`).

**Motion**
- Springs, critically damped, start on touch-down, interruptible. Motion is tap-triggered or tied to a real alert; no idle loops.
- Use `useReducedMotion`; with it on, change instantly. Do not read refs during render (`useState(() => new Animated.Value(x))`, not `useRef(...).current`).
- Do not call `Date.now()` in render; use `useNow()` or `nowMs()` from `services/clock`.

**Role-aware homes**: Elder (dye ring and "I'm OK", big list, voice), Teen (handover track, dial), Adult (sugar, refill, strips, spend, real numbers), Family (status ring, read only), Neighbour (safety only), ASHA and clinician (ranked households, one-page summary).

**Accessibility**: label every control, never use colour alone (print the number), hide decorative graphics, keep the Hindi and English string files in step (a test enforces it).

Also invoke the Anthropic `frontend-design` skill for critique, and `apple-design` for spring and feedback principles (it is written for the web; translate to React Native `Animated`).
