// Saath on Material 3. The brand arrives through theming: neel indigo is the seed, haldi the warm
// tertiary, leaf means done, and brick is for real safety alerts only. Existing token names are kept
// so every screen inherits the new system; the M3 role names below are the vocabulary for new work.
export const colors = {
  indigo: '#26306B',
  indigoDeep: '#171D4A',
  indigoTint: '#E3E6F6',
  indigoSoft: '#C9CEEA',
  haldi: '#F2B134',
  haldiTint: '#FDF1D6',
  haldiDeep: '#8A5B00',
  leaf: '#2F8F6B',
  leafDeep: '#1D6B4E',
  leafTint: '#E3F2EC',
  brick: '#B3261E',
  brickTint: '#FBE9E7',
  madder: '#9B3D2E',
  mist: '#FBFBFF',
  ink: '#1B1E2B',
  inkSoft: '#4A4F66',
  inkFaint: '#626780',
  white: '#FFFFFF',
  line: '#E1E3EE',
  lineStrong: '#C9CDDF', // decorative lines and ring tracks only: too faint to identify a control
  control: '#7F86A0', // borders and off-states of controls (field border, switch off, empty check): 3.4:1 or more

  // Material 3 surface roles (tonal, tinted from the indigo seed). Depth is tone, not shadow.
  surface: '#FBFBFF',
  surfaceLow: '#F2F3FA', // cards and grouped lists
  surfaceContainer: '#ECEEF7', // navigation bar, app bar on scroll
  surfaceHigh: '#E6E8F3', // inputs, unselected tracks
  outline: '#7F86A0',
  outlineVariant: '#C9CDDF',
};

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
