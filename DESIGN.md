---
name: Saath
description: A calm care companion in the manner of a modern Apple app. A grouped grey page, flat white panels, one blue accent, large titles that hand over to a slim bar, soft filled illustrations, and red kept for real danger.
colors:
  blue: "#1A5CFF"
  blue-deep: "#0E3FC4"
  blue-wash: "#E8F0FF"
  turmeric: "#FFE066"
  turmeric-wash: "#FFF4BF"
  turmeric-ink: "#5E4800"
  green: "#1E7F4F"
  green-deep: "#14523A"
  green-wash: "#E0F1E8"
  brick: "#B3261E"
  brick-wash: "#FBE9E7"
  madder: "#9B3D2E"
  page: "#F2F2F7"
  panel: "#FFFFFF"
  fill: "#E9E9EF"
  ink: "#000000"
  ink-soft: "#50535F"
  ink-faint: "#6A6D7A"
  separator: "#D5D7DE"
  control: "#858894"
typography:
  largeTitle: { fontFamily: "Mukta_700Bold", fontSize: "34px", lineHeight: "42px", letterSpacing: "-0.6px" }
  title2: { fontFamily: "Mukta_700Bold", fontSize: "22px", lineHeight: 1.3, letterSpacing: "-0.2px" }
  section: { fontFamily: "Mukta_700Bold", fontSize: "20px", lineHeight: "26px" }
  headline: { fontFamily: "Mukta_600SemiBold", fontSize: "18px", lineHeight: "24px" }
  body: { fontFamily: "Mukta_400Regular", fontSize: "18px", lineHeight: 1.42 }
  subhead: { fontFamily: "Mukta_400Regular", fontSize: "16px", lineHeight: 1.38 }
  tab: { fontFamily: "Mukta_600SemiBold", fontSize: "13px", lineHeight: "16px" }
rounded:
  tile: "10px"
  control: "14px"
  panel: "20px"
  sheet: "28px"
  capsule: "999px"
spacing:
  gutter: "20px"
  target: "56px"
---

# Design System: Saath

## Overview

**North star: "Calm care, Apple-grade."** Saath should feel like a well-made app from the phone's own maker: quiet, predictable, and finished. Type carries the hierarchy, white panels sit flat on a grey grouped page, one blue accent marks what can be tapped or is selected, and motion answers the finger. The audience is older adults and people with low literacy on low-end Android phones, so every rule bends toward large type, 56 px targets and plain words.

**Red is a promise.** Brick appears only for a real safety alert. Mild warnings and form errors use madder; done and OK use green.

## Colors

All colours come from `src/theme.js`, with a dark set that has a true black page and raised grey panels.
- **Blue** (#1A5CFF): actions, selection, links, the progress ring. **Deep** for text on the **wash**.
- **Green** (#1E7F4F): done, "I'm OK", switches that are on.
- **Turmeric** (#FFE066): one warm accent in the illustrations, and readings outside the range.
- **Brick** (#B3261E): a real safety alert and nothing else.
- Neutrals: grouped grey page, white panels, a grey fill for tracks and inputs, black ink with soft and faint greys that keep 4.5:1, and a control grey (3:1) for switch off-tracks.

Every pair is checked in `__tests__/contrast.test.js` and `contrast.dark.test.js`.

## Typography

Mukta (Regular, SemiBold, Bold) carries Devanagari and Latin as one voice. Apple's text styles, raised to Saath's floors: large title 34, section 20, panel title 22, body 18, supporting text 16. Only the tab label is smaller. Tracking tightens as size grows; leading is generous for Devanagari. Every size follows large-text mode (1.35x, titles capped at 1.2x so they still fit).

## Layout

- **Screen** (`components/ui.js`): every page is a large title with the account button at its end. On scroll the title hands over to a slim bar that fades in at the top. Pages pushed inside a tab (a Plan section, Study data, Me) get a Back button in that bar and slide in from the right.
- **Safe areas**: the shell pads the top edges; the floating tab bar and every screen add the phone's bottom inset.
- **Grouping**: related rows sit in one flat panel with hairlines inset to the text (`ListGroup`, `ListRow`), never a card per row. Section headings sit above groups.
- One filled button per screen. Capsule buttons: primary (blue), ok (green), alert (brick, takeover only), quiet (blue wash), outlined (grey fill), text.

## Components

- **Tab bar**: a floating capsule above the gesture area; one soft highlight slides between tabs on a spring.
- **Switch**: a capsule with a sliding white knob, green when on. **Segmented control**: a grey track with a raised thumb that slides to the choice. Both 56 px tall targets.
- **Fields**: a label above a soft grey well, a blue ring while focused.
- **I'm OK card**: one round green button inside the day's progress ring. Tapping it gives a firm haptic and one green pulse that rings out: the app's single signature motion.
- **Done capsule** (`Stamp`): a green capsule with a check that pops in on a spring.
- **Sheets**: rise on a spring with a little give, a grabber to pull down, a round close button, and the keyboard or bottom inset below.
- **Alert takeover**: full-screen brick with the countdown ring and call, WhatsApp and SMS. The only place brick is a surface.

## Illustrations

Soft filled spot art (`components/doodles.js`) on a 64 grid: one colour, a lighter tint of it, white highlights and one turmeric accent, on a pale halo. Figures are thick round strokes like pictograms so they read at 40 px. Used on setup steps, empty states, the Safety status, and the Plan tiles. Colour follows meaning: blue for papers and the doctor, violet for feelings, green for food, movement and safety.

## Motion

Springs expressed as damping ratio and response (`motion` in the theme): settle (1.0, 0.35 s) for most changes, snappy (1.0, 0.25 s) for switches, thumbs and the tab highlight, sheet (0.8, 0.3 s). Feedback starts on touch-down: a control gives a little and dims. Motion is tap-triggered or tied to a real alert; nothing loops while idle. With reduced motion everything changes instantly.

## Do's and Don'ts

**Do** take every value from `src/theme.js`; keep targets at 56 or more; draw art in SVG; label every control; keep Hindi and English in step; keep notes to one short sentence.
**Don't** use brick for anything but a real alert; put every item in its own card; add eyebrows over headings, middle-dot meta strings, or a big-number hero; use emoji as icons; animate every card on entry; call `Date.now()` in render.

## Status (honest)

Built and covered by the Jest suite and the computed contrast tests. Seen on an Android emulator only in part (see TEST_REPORT); not walked through with TalkBack, not reviewed by a native Hindi speaker, not tried on a low-end phone. The `.impeccable/design.json` sidecar still describes the earlier look.
