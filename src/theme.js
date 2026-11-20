// Saath, the counter stamp. A kirana bill book: white bill paper, ballpoint blue ink, a violet rubber
// stamp for "done", carbon-pink and slip-yellow second copies, ledger green for OK. Brick is for real
// safety alerts only. Token names are kept from the earlier system so every screen inherits the world.
export const colors = {
  indigo: '#1B3FAE', // ballpoint blue: type accents, primary actions, doodles
  indigoDeep: '#102A7A',
  indigoTint: '#E7EDFC', // pale blue wash: selected states, quiet buttons
  indigoSoft: '#BFCDF3',
  haldi: '#FFE066', // the yellow third copy of a slip
  haldiTint: '#FFF4BF',
  haldiDeep: '#5E4800', // text on the yellow slip
  leaf: '#1F6F4A', // ledger green: done and OK
  leafDeep: '#14523A',
  leafTint: '#E0F1E8',
  brick: '#B3261E', // a real safety alert and nothing else
  brickTint: '#FBE9E7',
  madder: '#9B3D2E', // mild warnings: low stock, missed, form errors
  stamp: '#5B2A86', // violet rubber-stamp ink: the stamp only
  stampTint: '#EEE5F7',
  carbon: '#FFD9E4', // the pink second copy of a slip
  carbonDeep: '#7A1F45', // text on the pink slip
  mist: '#F2F4FA', // the page: a soft blue-grey, so white cards lift off it without an outline
  ink: '#10163A',
  inkSoft: '#39426B',
  inkFaint: '#525C86',
  white: '#FFFFFF',
  line: '#DCE3F5',
  lineStrong: '#BCC7E8', // decorative lines and perforations only
  control: '#717AA3', // borders and off-states of controls: 3:1 or more

  // Surface roles (bill paper tones). Depth is a slip lifting off the pad, not blur.
  surface: '#FFFFFF',
  surfaceLow: '#F4F6FD', // slips and grouped lists
  surfaceContainer: '#EDF1FB', // navigation bar
  surfaceHigh: '#E5EBF9', // inputs, unselected tracks
  outline: '#717AA3',
  outlineVariant: '#BCC7E8',
};
colors.paper = '#FFFFFF'; // slip and card background: white bill paper (dark: a deep blue-black slip)

// The night palette: the same tokens, re-inked. `white` stays white (it is the text on coloured buttons);
// backgrounds that were white use `paper`. The yellow and pink slips stay light, like stickers on a dark
// counter, so their dark text keeps its contrast.
export const darkColors = {
  indigo: '#4F6FE0',
  indigoDeep: '#C9D6FF', // used as text and icons on the tinted washes, so it turns light at night
  indigoTint: '#1E2754',
  indigoSoft: '#BFCDF3',
  brick: '#D8453D',
  haldiTint: '#3A3213',
  haldiDeep: '#FFD84D', // text and icons on the dark yellow wash (the yellow slip itself keeps #5E4800 text)
  leaf: '#2A8458',
  leafDeep: '#8FE3B8',
  leafTint: '#16382A',
  brickTint: '#3D1B19',
  madder: '#E8907D',
  stamp: '#BE98EE',
  stampTint: '#2C1D40',
  mist: '#0F1226',
  ink: '#ECEFFC',
  inkSoft: '#C3CAE8',
  inkFaint: '#A3ACD2',
  line: '#2B3355',
  lineStrong: '#3C4672',
  control: '#8993BF',
  surface: '#14183A',
  surfaceLow: '#1A1F45',
  surfaceContainer: '#20264F',
  surfaceHigh: '#2A3162',
  outline: '#8993BF',
  outlineVariant: '#3C4672',
  paper: '#1B2048',
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

// Legacy sizes (still used across screens).
export const type = { body: 18, small: 16, title: 26, hero: 34 };
export const sizes = { target: 56, gutter: 20, radius: 16 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

// Material 3 shape scale: small 8, medium 12, large 16, extra large 28, full.
export const radii = { xs: 4, sm: 8, md: 12, lg: 16, xl: 28, hero: 28, pill: 999 };

// Material 3 type scale on Mukta. Sizes are raised where Saath's floors apply (body 18, support 16);
// only the navigation label goes below 16.
export const roles = {
  displaySmall: { font: fonts.bold, size: 36, line: 44, track: -0.4 },
  headlineMedium: { font: fonts.bold, size: 30, line: 38, track: -0.3 },
  headlineSmall: { font: fonts.bold, size: 24, line: 32, track: -0.2 },
  titleLarge: { font: fonts.bold, size: 22, line: 28, track: 0 },
  titleMedium: { font: fonts.semi, size: 18, line: 24, track: 0.1 },
  bodyLarge: { font: fonts.regular, size: 18, line: 26, track: 0 },
  bodyMedium: { font: fonts.regular, size: 16, line: 22, track: 0.1 },
  labelLarge: { font: fonts.semi, size: 16, line: 22, track: 0.1 },
  labelNav: { font: fonts.semi, size: 14, line: 18, track: 0.2 },
};

// Tracking and leading change with size: tight on large text, near zero on body.
export const text = {
  hero: { letterSpacing: -0.6, lineHeight: 1.12 },
  title: { letterSpacing: -0.2, lineHeight: 1.22 },
  body: { letterSpacing: 0, lineHeight: 1.4 },
  small: { letterSpacing: 0.1, lineHeight: 1.35 },
};

// Tonal elevation does most of the work (see the surface roles). Shadows are small and used only on
// raised controls and the hero seal, with plain Android elevation so they stay cheap on low-end phones.
export const shadow = {
  card: {
    shadowColor: '#1B1E2B',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  raised: {
    shadowColor: '#1B1E2B',
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
};

// State layers: a ripple on Android, never a squish. Opacity values follow Material 3.
export const states = { pressed: 0.12, hovered: 0.08, focused: 0.12 };
export const press = { scale: 1, spring: { damping: 20, stiffness: 400, mass: 1 } };

// Material 3 motion: emphasized decelerate for entrances, standard for state changes.
export const motion = {
  settle: { damping: 22, stiffness: 260, mass: 1 },
  pill: { damping: 20, stiffness: 300, mass: 1 },
  enterMs: 210,
  staggerMs: 30,
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1.0],
};
