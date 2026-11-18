---
name: Saath
description: A calm, large, bilingual care companion drawn in Indian textile dyes, with one memorable element (the dye ring) and red reserved for real danger.
colors:
  indigo: "#26306B"
  indigo-deep: "#171D4A"
  indigo-tint: "#E8EAF5"
  indigo-soft: "#C9CEEA"
  haldi: "#F2B134"
  haldi-tint: "#FDF1D6"
  haldi-deep: "#8A5B00"
  leaf: "#2F8F6B"
  leaf-deep: "#1D6B4E"
  leaf-tint: "#E3F2EC"
  madder: "#9B3D2E"
  brick: "#B3261E"
  brick-tint: "#FBE9E7"
  mist: "#F6F7FB"
  white: "#FFFFFF"
  ink: "#1B1E2B"
  ink-soft: "#4A4F66"
  ink-faint: "#626780"
  line: "#E1E3EE"
  line-strong: "#C9CDDF"
  control: "#7F86A0"
typography:
  hero:
    fontFamily: "Mukta_700Bold"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.6px"
  title:
    fontFamily: "Mukta_700Bold"
    fontSize: "26px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.4px"
  body:
    fontFamily: "Mukta_400Regular"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0px"
  small:
    fontFamily: "Mukta_400Regular"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0.1px"
  button:
    fontFamily: "Mukta_700Bold"
    fontSize: "18px"
    fontWeight: 700
    letterSpacing: "0.1px"
  chip:
    fontFamily: "Mukta_600SemiBold"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "0.1px"
  tab-label:
    fontFamily: "Mukta_600SemiBold"
    fontSize: "13.5px"
    fontWeight: 600
rounded:
  sm: "12px"
  md: "16px"
  lg: "20px"
  hero: "28px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
  gutter: "20px"
  target: "56px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "14px 20px"
    height: "56px"
  button-ok:
    backgroundColor: "{colors.leaf}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "14px 20px"
    height: "56px"
  button-alert:
    backgroundColor: "{colors.brick}"
    textColor: "{colors.white}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "14px 20px"
    height: "56px"
  button-quiet:
    backgroundColor: "{colors.indigo-tint}"
    textColor: "{colors.indigo}"
    typography: "{typography.button}"
    rounded: "{rounded.lg}"
    padding: "14px 20px"
    height: "56px"
  chip:
    backgroundColor: "{colors.indigo-tint}"
    textColor: "{colors.indigo}"
    typography: "{typography.chip}"
    rounded: "{rounded.pill}"
    padding: "8px 18px"
    height: "48px"
  chip-active:
    backgroundColor: "{colors.indigo}"
    textColor: "{colors.white}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-tint:
    backgroundColor: "{colors.indigo-tint}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "20px"
  card-haldi:
    backgroundColor: "{colors.haldi-tint}"
    textColor: "{colors.haldi-deep}"
    rounded: "{rounded.lg}"
    padding: "20px"
  tab-bar:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.tab-label}"
    height: "60px"
  tab-bar-selected:
    backgroundColor: "{colors.indigo-tint}"
    textColor: "{colors.indigo}"
    rounded: "{rounded.lg}"
---

# Design System: Saath

## Overview

**Creative North Star: "The Dyed Cloth"**

Saath is drawn the way a household textile is dyed: a few fast, honest colours (neel indigo, haldi turmeric, leaf green, madder) laid on plain cloth, with one hand-made pattern that people remember. The pattern is the dye ring on the elder's Today screen, one bandhani-style dot per routine task around an "I'm OK" seal. Everything else stays quiet so that single thing can be memorable, and so that a person in a hurry or under stress can read the screen in a second.

The density is low and the type is big. Body text is 18, supporting text never goes below 16, every target is at least 56, and every layout must survive a 1.35x large-text mode. Screens are a greeting, one hero, and divided lists. They are not walls of cards. Depth is rare. Radii vary on purpose by role instead of one number everywhere.

Red is a promise. Brick appears only when the phone really needs a person's attention, so when a person sees it, it means something. Warm emphasis, low stock and form errors use madder, never brick.

This system does not use Material You dynamic colour, ALL CAPS labels, middle-dot meta strings, numbered markers for non-sequences, emoji as icons, or the full icon package.

**Key Characteristics:**
- Textile-dye palette on cool mist and white surfaces.
- One memorable element per product (the dye ring), everything else restrained.
- Brick red is reserved for a real safety alert.
- One family (Mukta) carries Devanagari and Latin as one voice.
- Large type, 56 px targets, plain words, 1.35x large-text tolerant.
- Lists divided by rule instead of a card per item.
- Critically damped springs that start on touch-down and yield to reduced motion.

## Colors

A dyer's palette: a deep indigo anchor, a warm turmeric, a living green and a clay red, over a faintly blue white.

### Primary
- **Neel Indigo** (#26306B): Primary actions, titles, selected icons, hero panels. The trust colour.
- **Deep Indigo** (#171D4A): Pressed and hero-panel depth on indigo surfaces.
- **Indigo Mist** (#E8EAF5): Selected states, the quiet button, chips at rest, the tab pill.
- **Indigo Soft** (#C9CEEA): Unfilled dots and tracks on the dye ring and progress arcs.

### Secondary
- **Leaf** (#2F8F6B): Done and "I'm OK". The ok button, completed dots, the check mark.
- **Deep Leaf** (#1D6B4E): Text and strokes on leaf tint where contrast needs it.
- **Leaf Tint** (#E3F2EC): Done-state backgrounds.

### Tertiary
- **Haldi** (#F2B134): Warmth. Notes, "demo data" markers, the current ladder stage.
- **Haldi Tint** (#FDF1D6): Note panels and the haldi card.
- **Deep Haldi** (#8A5B00): Readable text on haldi tint.
- **Madder** (#9B3D2E): Warm emphasis and mild warnings: low stock, missed counts, form errors.

### Alert
- **Brick** (#B3261E): A real safety alert only. The alert takeover and the alert button.
- **Brick Tint** (#FBE9E7): The background behind a real alert message.

### Neutral
- **Mist** (#F6F7FB): App background.
- **White** (#FFFFFF): Cards, tab bar, field fill.
- **Ink** (#1B1E2B): Body text.
- **Soft Ink** (#4A4F66): Supporting text and captions.
- **Faint Ink** (#626780): Unselected tab labels and tertiary text.
- **Line** (#E1E3EE): Hairline dividers and card borders.
- **Strong Line** (#C9CDDF): Decorative lines and ring tracks only. It is too faint to identify a control.
- **Control** (#7F86A0): Borders and off-states of controls (field border, switch off, empty check). 3.4:1 or better.

### Named Rules
**The Brick Rule.** Brick red means a real safety alert and nothing else. Warnings, errors, low stock and "missed" use madder. If red ever appears without someone needing to act, the colour has been spent.

**The One Memorable Thing Rule.** Colour, motion and ornament budget is spent on the dye ring. Other surfaces are mist, white and indigo with a single accent.

**The Never Colour Alone Rule.** Meaning is never carried by colour. Bars, charts and rings print their number or state.

## Typography

**Display Font:** Mukta Bold (Mukta_700Bold)
**Body Font:** Mukta Regular (Mukta_400Regular), with SemiBold (Mukta_600SemiBold) for chips and tab labels
**Label/Mono Font:** none distinct

**Character:** One family that carries Devanagari and Latin together, so Hindi and English read as the same voice. Warm, open and sturdy at large sizes. Only three weights are packaged and they are imported by path in `App.js`.

### Hierarchy
- **Hero** (Bold 700, 34px, 1.12, -0.6 tracking): The one big statement on a screen.
- **Title** (Bold 700, 26px, 1.2, -0.4 tracking, indigo): Screen and section titles. Carries header semantics.
- **Body** (Regular 400, 18px, 1.4): Reading text. Never smaller.
- **Small** (Regular 400, 16px, 1.35, 0.1 tracking, soft ink): Supporting text. The floor for readability.
- **Button** (Bold 700, 18px, 0.1 tracking): Button labels.
- **Chip** (SemiBold 600, 16px): Chips and segmented options.
- **Tab label** (SemiBold, 13.5px, Bold when selected): The one place text is below 16, paired with a 24 px icon and a 60 px target.

### Named Rules
**The Pick The Family Rule.** With a custom family, choose the family (regular, semi, bold) instead of setting `fontWeight`.

**The Scale Together Rule.** Every size multiplies by 1.35 in large-text mode and line height follows the size actually used, including caller overrides.

## Layout

A single column of one-handed scrolling on a phone. Page gutter is 20. The rhythm is a 4-based scale (4, 8, 12, 16, 24, 32). A screen is a greeting header, one hero, then divided lists (`ListGroup`, `ListRow`) rather than a card around every item. Controls stack vertically with generous space between them. Primary actions are 56 high.

Navigation is a six-destination bar at the bottom (Today, Circle, Safety, Care, Plan, Me). Care-givers see only three (Today, Circle, Me). Tablet layouts are not designed yet, so a rail or drawer on expanded widths is open work.

## Elevation & Depth

Mostly flat. Surfaces separate by a hairline and tint, not by shadow. Depth is reserved for the hero and for raised controls. Shadows use low offsets and platform elevation instead of blur because the target is a low-end Android phone.

### Shadow Vocabulary
- **Card** (`shadowColor #1B1E2B, opacity 0.07, radius 12, offset 0/4, elevation 2`): The hero panel and any surface that needs a faint lift.
- **Raised** (`shadowColor #1B1E2B, opacity 0.16, radius 10, offset 0/4, elevation 4`): Filled buttons (primary, ok, alert). The quiet button has none.

### Named Rules
**The Flat Unless Pressed Rule.** Most things are flat. Raised is a signal that something is a control or the hero.

## Shapes

Corners are varied by role instead of one radius: 28 for heroes, 20 for buttons and panels, 16 for fields and segmented controls, 12 for small elements, and a full pill for chips. Avatars are round. The signature geometry is the circle: the dye ring, the "I'm OK" seal and the countdown ring. Borders are hairlines in Line.

## Components

### Buttons
- **Shape:** Rounded 20, at least 56 high, 20 horizontal padding.
- **Primary:** Indigo with white label and the raised shadow. One per screen.
- **OK:** Leaf with white label. Used for "I'm OK" and confirming done.
- **Alert:** Brick with white label. Only on the safety takeover.
- **Quiet:** Indigo Mist with indigo label, no shadow. The tonal secondary.
- **Press:** Scale to 0.97 on touch-down with a critically damped spring, light haptic, then back. Opacity 0.94 while pressed.

### Chips
- **Style:** Pill, Indigo Mist at rest with indigo SemiBold text, 48 high.
- **State:** Active is filled indigo with white text. Selection is exposed in the accessibility state.

### Cards / Containers
- **Corner Style:** 20.
- **Background:** White with a Line hairline. Tint variants: indigo mist, haldi tint.
- **Shadow Strategy:** None by default; see Elevation.
- **Internal Padding:** 20 with a 10 gap.

### Navigation
- **Style:** White bar with a hairline above, six icon-over-label items, 60 high.
- **States:** Selected is indigo with a thicker stroke (2.3 against 1.8) and a bold label, and sits on an indigo-mist pill that slides between tabs on a spring. Unselected is faint ink.
- **Accessibility:** `tab` role with selected state. Icon and label scale to at most 1.15x so six tabs still fit.

### Toggles and Segmented controls
Controls with state use a switch or a segmented control with a sliding thumb (privacy dial, mode, language). Off-state uses the Control grey. State is in the accessibility label.

### The Dye Ring (signature component)
On the elder Today screen, "I'm OK" is a round leaf seal inside a ring. The ring carries one bandhani-style dot per routine task around a faint ring of tiny dots. As tasks are done the dots turn leaf and grow while a leaf arc sweeps round. It shows progress without a chart and is the first thing seen. It is drawn in SVG and its arc springs to its new value.

### Alert takeover
A full-screen brick surface with a countdown ring, the contact card (Call, WhatsApp, SMS) and a large "I'm OK". It is the only place brick is a surface and not an accent.

## Do's and Don'ts

### Do:
- **Do** take every colour, size and radius from `src/theme.js`.
- **Do** keep targets at 56 or more, body at 18 or more, supporting text at 16 or more, and test at 1.35x.
- **Do** use `BigButton`, with one primary action per screen.
- **Do** draw faces, the plate, the mark, rings and charts in SVG, and import line icons one per file through `src/components/icons.js`.
- **Do** make motion tap-triggered or tied to a real alert, with critically damped springs, and replace it with an instant change when reduced motion is on.
- **Do** print the number or state wherever colour carries meaning.
- **Do** label every control and keep the Hindi and English strings in step.

### Don't:
- **Don't** use brick red for anything but a real safety alert.
- **Don't** put every item in its own card. Use divided lists.
- **Don't** use ALL CAPS labels, middle-dot meta strings, or numbered markers unless the content is a real sequence.
- **Don't** use emoji as icons or import `lucide-react-native` from the package root.
- **Don't** set `fontWeight` with a custom font family.
- **Don't** loop animations while idle. The one exception is the soft pulse behind the siren on an open alert.
- **Don't** call `Date.now()` in render or read refs during render.
- **Don't** treat a `Pressable`-based iOS look as the goal. On Android the platform is Material 3, and where this system departs from it (a custom bottom pill, 56 px targets, a fixed palette instead of Dynamic Color) the departure is a deliberate brand choice.
