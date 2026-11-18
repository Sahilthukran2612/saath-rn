---
name: Saath
description: A care companion drawn like a kirana bill book. Care is receipted: tasks and suggestions are slips, done is a violet rubber stamp, and red is kept for real danger.
colors:
  ballpoint-blue: "#1B3FAE"
  ballpoint-deep: "#102A7A"
  blue-wash: "#E7EDFC"
  blue-soft: "#BFCDF3"
  slip-yellow: "#FFE066"
  slip-yellow-tint: "#FFF4BF"
  yellow-ink: "#5E4800"
  carbon-pink: "#FFD9E4"
  carbon-ink: "#7A1F45"
  ledger-green: "#1F6F4A"
  ledger-deep: "#14523A"
  green-tint: "#E0F1E8"
  stamp-violet: "#5B2A86"
  stamp-tint: "#EEE5F7"
  madder: "#9B3D2E"
  brick: "#B3261E"
  brick-tint: "#FBE9E7"
  paper: "#FFFFFF"
  ink: "#10163A"
  ink-soft: "#39426B"
  ink-faint: "#525C86"
  line: "#DCE3F5"
  perforation: "#BCC7E8"
  control: "#717AA3"
typography:
  hero:
    fontFamily: "Mukta_700Bold"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.6px"
  title:
    fontFamily: "Mukta_700Bold"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.22
  body:
    fontFamily: "Mukta_400Regular"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
  small:
    fontFamily: "Mukta_400Regular"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.35
  button:
    fontFamily: "Mukta_700Bold"
    fontSize: "18px"
    fontWeight: 700
rounded:
  slip: "12px"
  pill: "999px"
spacing:
  gutter: "20px"
  target: "56px"
components:
  slip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.slip}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.ballpoint-blue}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "56px"
  button-ok:
    backgroundColor: "{colors.ledger-green}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "96px"
  button-alert:
    backgroundColor: "{colors.brick}"
    textColor: "{colors.paper}"
    rounded: "{rounded.pill}"
    height: "56px"
  stamp:
    textColor: "{colors.stamp-violet}"
    typography: "{typography.title}"
---

# Design System: Saath

## Overview

**Creative North Star: "The Counter Stamp"**

A kirana or ration shop keeps its books on bill paper: a white slip, a ballpoint, carbon copies in pink and yellow, and a violet rubber stamp pressed down with a thump. Saath is drawn the same way. Care is receipted. Every task, check-in and suggestion is a slip, doing it is stamped with the day's date, and nobody reads a chart to know the day went well.

The world lends four things and nothing else: its **palette** (ballpoint blue, stamp violet, carbon pink, slip yellow, ledger green), its **type voice** (Mukta, kept for Devanagari and Latin as one voice), its **density** (low, big, one thing at a time), and one **signature move**: the stamp thump and the tear-off. Navigation and controls stay standard Android Material.

Red is a promise. Brick appears only for a real safety alert. Warnings and form errors use madder.

**Key characteristics**
- White bill paper, ballpoint-blue ink and edges, violet only for the stamp.
- Slips: white surface, 1.5 px ballpoint edge, 12 px corners, dashed tear-off dividers.
- Carbon copies: pink and yellow slips peek out under the top slip of a pad.
- Hand-drawn ballpoint doodles (drawn twice, the second pass fainter) instead of icon tiles.
- Tally marks (four strokes and a fifth across) show the day's progress, with the count printed.
- Large type, 56 px targets, plain words, 1.35x large-text tolerant, Hindi and English as one voice.

## Colors

- **Ballpoint blue** (#1B3FAE): primary actions, titles, edges, doodles and tally strokes. **Deep** (#102A7A) for slip titles and pressed states. **Wash** (#E7EDFC) for selected states and the quiet button.
- **Stamp violet** (#5B2A86): the rubber stamp and its date, nothing else.
- **Carbon pink** (#FFD9E4) with **carbon ink** (#7A1F45) text: the second copy of a slip and the Care chip.
- **Slip yellow** (#FFE066) with **yellow ink** (#5E4800) text: the third copy of a slip and the Habit chip.
- **Ledger green** (#1F6F4A): done and "I'm OK".
- **Brick** (#B3261E): a real safety alert and nothing else.
- **Madder** (#9B3D2E): mild warnings, low stock, form errors.
- Neutrals: paper white, ink (#10163A), soft and faint ink, a pale blue line, a perforation tone for decorative dashes only, and a control grey (#717AA3, 3:1) for field borders and switch off-states.

### Named rules
**The Brick Rule.** Brick red means a real safety alert and nothing else.
**The Stamp Rule.** Violet is the stamp. It is never used for a link, a button or a decoration.
**The Never Colour Alone Rule.** Meaning is never carried by colour. Chips carry a word (Care, Habit), the stamp carries "Done", tally marks print their count.
**The Contrast Rule.** Every colour pair is in `__tests__/contrast.test.js` with its computed ratio (text 4.5:1, shapes 3:1).

## Typography

Mukta Regular, SemiBold and Bold, imported by path in `App.js`. Body 18, supporting text never below 16, the navigation label 14 beside a 24 px icon. Pick the family, never `fontWeight`. Every size scales 1.35x in large-text mode.

## Components

### Slip (Card, ListGroup, hero panels)
White, ballpoint edge 1.5 px, 12 px corners. Variants: wash (pale blue), yellow copy, pink copy. Lists are one slip with dashed perforations (`Perf`) between rows, not a card per row.

### Suggestion pad (`SuggestionPad`)
The top slip is today's most useful small thing, with a Care or Habit chip, a doodle, a title, one sentence, and three buttons: **Stamp it** (primary, 56), **Open** (when a screen helps), **Not today**. Pink and yellow copies sit beneath, rotated a degree or two. Stamping lands the violet stamp, then the slip tears away to the right and the next appears. Reduced motion skips the movement. See `docs/SUGGESTIONS.md`.

### The Stamp (`Stamp`)
A double-ringed violet box with a word and the date or time, rotated about 6 degrees. It lands on a critically damped spring from 1.7x and faint to 1x, with one firm tap of haptics. It never loops.

### I'm OK slip
A full-width ledger-green pill (96 high), then the stamp with the time when pressed, then tally marks and "x of y done".

### Navigation
Five bottom destinations on Android's standard navigation bar with a sliding pill. Care-givers see two. "Me" is the avatar in the top app bar.

### Alert takeover
Full-screen brick surface with the countdown ring and Call, WhatsApp, SMS. The only place brick is a surface.

## Do's and Don'ts

**Do** take every colour from `src/theme.js`; keep targets at 56 or more; draw doodles and tally marks in SVG; make motion tap-triggered; label every control; keep Hindi and English in step.
**Don't** use brick for anything but a real alert; use violet for anything but the stamp; put every item in its own card; use emoji as icons; loop animations while idle; call `Date.now()` in render.

## Status (honest)

Built and tested (586 Jest tests, computed contrast for every pair). **Not seen on a phone**: the whole look was verified only through tests and code, never as a rendered screenshot, because the emulator is not to be run. The Hindi text for the slips has had no native-speaker review. The `.impeccable/design.json` sidecar was written for the earlier palette and has not been regenerated.
