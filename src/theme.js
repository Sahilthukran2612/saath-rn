// Saath's design tokens. The look: a grey grouped page, flat white panels, Saath blue as the one accent for actions
// and selection, and type that carries the hierarchy. Brick red is for a real safety alert and nothing else; green
// means done or OK. Token names are kept stable so every screen picks up a change made here.
export const colors = {
  indigo: '#1A5CFF', // Saath blue: actions, selection, links
  indigoDeep: '#0E3FC4', // text and icons on the blue wash
  indigoTint: '#E8F0FF', // the blue wash: selected states, tinted buttons
  indigoSoft: '#B8CEFF',
  haldi: '#FFE066', // turmeric yellow: one warm accent in the illustrations, readings outside the range
  haldiTint: '#FFF4BF', // notes and gentle warnings
  haldiDeep: '#5E4800', // text on the yellow
  leaf: '#1E7F4F', // done and OK
  leafDeep: '#14523A',
  leafTint: '#E0F1E8',
  brick: '#B3261E', // a real safety alert and nothing else
  brickTint: '#FBE9E7',
  madder: '#9B3D2E', // mild warnings: low stock, a missed task, form errors
  stamp: '#5B2A86', // the "done" mark on a suggestion
  stampTint: '#EEE5F7',
  carbon: '#FFD9E4', // the pink care-reminder slip
  carbonDeep: '#7A1F45',
  mist: '#F2F2F7', // the page: grouped grey, so white panels separate without lines or shadows
  ink: '#000000', // primary text
  inkSoft: '#50535F', // secondary text
  inkFaint: '#6A6D7A', // tertiary text and placeholders, still 4.5:1 on the page
  white: '#FFFFFF',
  line: '#E3E4EA', // separators inside a panel
  lineStrong: '#C7C9D1', // grabbers and decorative strokes only
  control: '#858894', // off-states and borders of controls: 3:1 on the page and on a panel

  surface: '#FFFFFF',
  surfaceLow: '#F7F7FA',
  surfaceContainer: '#FFFFFF', // floating bars
  surfaceHigh: '#E9E9EF', // fills: segmented tracks, inputs, switch off-track
  outline: '#858894',
  outlineVariant: '#D5D7DE',
  paper: '#FFFFFF', // panel background (dark: an elevated grey)
};

// The night palette: true black page, raised grey panels, the same accents lifted for contrast. `white` stays
// white because it is the label on coloured buttons; backgrounds that were white use `paper`. The yellow and pink
// slips stay light, like stickers, so their dark text keeps its contrast.
export const darkColors = {
  indigo: '#3F74F5',
  indigoDeep: '#C2D3FF',
  indigoTint: '#1A2A52',
  indigoSoft: '#AFC4FF',
  brick: '#DE3F35',
  haldiTint: '#3A2F10',
  haldiDeep: '#FFD66B',
  leaf: '#2A8C5A',
  leafDeep: '#8FE3B8',
  leafTint: '#123222',
  brickTint: '#3A1614',
  madder: '#F0907A',
  stamp: '#BE98EE',
  stampTint: '#2C1D40',
  mist: '#000000',
  ink: '#FFFFFF',
  inkSoft: '#C7C7CC',
  inkFaint: '#9A9AA1',
  line: '#38383A',
  lineStrong: '#48484A',
  control: '#8E8E93',
  surface: '#1C1C1E',
  surfaceLow: '#151517',
  surfaceContainer: '#1C1C1E',
  surfaceHigh: '#2C2C2E',
  outline: '#8E8E93',
  outlineVariant: '#3A3A3C',
  paper: '#1C1C1E',
};

export let themeName = 'light';

// Called once, before any screen module loads (see index.js), because styles are built at import time.
// 'auto' follows the phone's own light or dark setting.
export function applyTheme(choice, systemScheme) {
  const name = choice === 'dark' || (choice !== 'light' && systemScheme === 'dark') ? 'dark' : 'light';
  themeName = name;
  if (name === 'dark') Object.assign(colors, darkColors);
  return name;
}

// Mukta carries Devanagari and Latin in one voice, so Hindi and English sit together.
export const fonts = { regular: 'Mukta_400Regular', semi: 'Mukta_600SemiBold', bold: 'Mukta_700Bold' };

// Apple's text styles, set in Mukta with Saath's floors: body 18, supporting text 16. Only the tab label is smaller.
// Tracking tightens as size grows; leading is generous because Devanagari needs room above and below.
export const textStyles = {
  largeTitle: { font: fonts.bold, size: 34, line: 42, track: -0.6 },
  title1: { font: fonts.bold, size: 28, line: 36, track: -0.4 },
  title2: { font: fonts.bold, size: 22, line: 30, track: -0.2 },
  title3: { font: fonts.semi, size: 20, line: 26, track: 0 },
  headline: { font: fonts.semi, size: 18, line: 24, track: 0 },
  body: { font: fonts.regular, size: 18, line: 26, track: 0 },
  subhead: { font: fonts.regular, size: 16, line: 22, track: 0 },
  tab: { font: fonts.semi, size: 13, line: 16, track: 0.1 },
};

export const type = { body: 18, small: 16, title: 22 };
export const sizes = { target: 56, gutter: 20 };
export const text = {
  title: { letterSpacing: -0.2, lineHeight: 1.3 },
  body: { letterSpacing: 0, lineHeight: 1.42 },
  small: { letterSpacing: 0, lineHeight: 1.38 },
};

// Corners grow with the size of the thing: tiles 10, controls 14, panels 20, sheets 28, buttons fully round.
export const radii = { xs: 6, sm: 10, md: 14, lg: 20, xl: 28, pill: 999 };

// Panels are flat on the grey page. Only things that float over content (the tab bar, the helper button, sheets)
// get a shadow, a soft one with a real offset.
export const shadow = {
  card: {},
  raised: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};

// Springs in Apple's terms, converted to stiffness and damping (mass 1): damping ratio 1 settles without overshoot.
//   settle  ratio 1,   response 0.35 s  most state changes
//   snappy  ratio 1,   response 0.25 s  switches, segmented thumbs, the tab highlight
//   sheet   ratio 0.8, response 0.3 s   sheets and drawers, the only place with a little give
export const motion = {
  settle: { damping: 36, stiffness: 322, mass: 1 },
  snappy: { damping: 50, stiffness: 632, mass: 1 },
  sheet: { damping: 33, stiffness: 438, mass: 1 },
  press: { damping: 24, stiffness: 520, mass: 1 },
  enterMs: 220,
  staggerMs: 30,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1.0],
};
