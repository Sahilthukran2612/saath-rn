# Design system

Saath is for elders, teens and families in Indian households, often used in seconds and sometimes under stress. The design aims to be calm, large and clear. One element is allowed to be memorable; everything else stays quiet.

## Identity
Indian textile dyes: **neel** (indigo) for trust, **haldi** for warmth, **leaf** for done, **madder** for warm emphasis. Brick red is reserved for a real safety alert and is used nowhere else.

| Token | Value | Use |
|---|---|---|
| indigo / indigoDeep | `#26306B` / `#171D4A` | primary actions, titles, hero panels |
| indigoTint / indigoSoft | `#E8EAF5` / `#C9CEEA` | selected states, quiet buttons, unfilled dots |
| haldi / haldiTint / haldiDeep | `#F2B134` / `#FDF1D6` / `#8A5B00` | notes, "demo data", the current ladder stage |
| leaf / leafTint / leafDeep | `#2F8F6B` / `#E3F2EC` / `#1D6B4E` | done, "I'm OK" |
| madder | `#9B3D2E` | low stock, missed counts, form errors |
| brick | `#B3261E` | **safety alert only** |
| mist / white / ink / inkSoft / inkFaint | `#F6F7FB` / `#FFFFFF` / `#1B1E2B` / `#4A4F66` / `#626780` | surfaces and text |

## Type
**Mukta** (Regular, SemiBold, Bold), one family that carries Devanagari and Latin together, so Hindi and English look like one voice. Only these three weights are packaged (imported by path in `App.js`); the other four would add about 1.6 MB. Body is 18, supporting text 16, titles 22 to 32 with slightly tight tracking. Large-text mode scales everything by 1.35.

## The memorable element: the dye ring
On the elder home, "I'm OK" is a round leaf seal inside a ring. The ring has one bandhani-style dot per routine task around a faint ring of tiny dots; as tasks are done, dots turn leaf and grow while a leaf arc sweeps round. It shows progress without a chart and it is the first thing seen.

## Structure
- A greeting header, one hero, then **divided lists**, not a card for every item. Depth is reserved for the hero and raised buttons. Radii vary on purpose: 28 for heroes, 20 for panels, 16 for fields and segmented controls, a full pill for chips.
- Settings and choices use controls that show their state: switches with the state in their accessibility label, a segmented control with a sliding thumb for the privacy dial, mode and language.
- No ALL CAPS labels, no middle-dot meta strings, no numbered markers unless the content is a real sequence (steps are).

## Icons
Lucide line icons (ISC licence), imported **one per file** through `src/components/icons.js`. Importing the whole package bundles about 2,000 unused icons, which tripled the module count when it happened once. To add an icon, add one line to `icons.js`; a test checks every export is a real component. Drawn in SVG by hand: the mood faces, the plate model, the Saath mark, the progress ring, the dye ring, the check mark and the charts. Emoji are no longer used as icons (task data still stores one so older saved data works, and `taskIcon` maps it to a line icon).

## Motion
Springs, critically damped, starting on touch-down and interruptible. All of it is tap-triggered or tied to a real alert; nothing loops while idle except the soft pulse behind the siren on an open alert.
- press: scale to 0.97 and back, with a light haptic
- tab pill: slides between tabs on a spring
- screens: a short rise and fade when a tab opens
- check marks: the fill grows and the tick draws itself
- ring and dye ring: the arc springs to its new value
- switches and segmented control: a spring-driven knob and thumb
- reduced motion: every movement is replaced by an instant change (`useReducedMotion`)

## Accessibility
Targets are at least 56 px (the demo-only role strip is 40 and is not part of the product). Contrast follows the tokens above; meaning is never carried by colour alone (every bar and chart prints its number). Every control has an accessibility label, switches expose `checked`, segmented options expose `selected`, decorative avatars are hidden from screen readers. Screens are laid out to survive 1.35x text.

## Screens and what each is for
| Screen | Hero | Rest |
|---|---|---|
| Today (elder) | dye ring and "I'm OK" | routine as an animated check list |
| Today (teen) | handover track on indigo | privacy dial summary, routine |
| Today (adult) | last sugar reading and chart | refill, strips and spend, routine |
| Today (family) | status ring "All is well" | routine, read only |
| Circle | safety note | member rows with avatar, consent-aware contact, dial, Time off; invite; help; who viewed what |
| Safety | status panel | what Saath learned from you; sensor trial tools |
| Care | low-sugar prompt when it applies | sugar chart, stock bars, budget bar |
| Plan | tile grid | handover, visit prep, passport, check-in, food, body, school |
| Alert | full-screen brick takeover | countdown ring, contact card with call and message, "I'm OK" |

## Not done yet
Dark mode; a native-speaker pass over every Hindi screen; TalkBack walk-through on a device; checking contrast with a tool rather than by token; a splash screen and app icon in the final identity; tablet layouts.
