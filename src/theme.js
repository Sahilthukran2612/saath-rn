// Indian textile dyes. Neel (indigo) for trust, haldi for warmth, leaf for done.
// Brick is for real safety alerts only. Everything else stays quiet so one thing can be memorable:
// the dye ring on Today.
export const colors = {
  indigo: '#26306B',
  indigoDeep: '#171D4A',
  indigoTint: '#E8EAF5',
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
  mist: '#F6F7FB',
  ink: '#1B1E2B',
  inkSoft: '#4A4F66',
  inkFaint: '#626780',
  white: '#FFFFFF',
  line: '#E1E3EE',
  lineStrong: '#C9CDDF', // decorative lines and ring tracks only: too faint to identify a control
  control: '#7F86A0', // borders and off-states of controls (field border, switch off, empty check): 3.4:1 or more
};

// Mukta carries Devanagari and Latin in one voice, so Hindi and English sit together.
export const fonts = { regular: 'Mukta_400Regular', semi: 'Mukta_600SemiBold', bold: 'Mukta_700Bold' };

export const type = { body: 18, small: 16, title: 26, hero: 34 };
export const sizes = { target: 56, gutter: 20, radius: 20 };
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };
export const radii = { sm: 12, md: 16, lg: 20, hero: 28, pill: 999 };

// Tracking and leading change with size: tight on large text, near zero on body.
export const text = {
  hero: { letterSpacing: -0.6, lineHeight: 1.12 },
  title: { letterSpacing: -0.4, lineHeight: 1.2 },
  body: { letterSpacing: 0, lineHeight: 1.4 },
  small: { letterSpacing: 0.1, lineHeight: 1.35 },
};

// Soft, low-offset depth. Cheap on low-end Android (plain elevation, no blur).
export const shadow = {
  card: {
    shadowColor: '#1B1E2B',
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#1B1E2B',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
};

// Press feedback: critically damped (no bounce), responds on press-in.
export const press = { scale: 0.97, spring: { damping: 20, stiffness: 400, mass: 1 } };

// Layout and entrance springs. Critically damped by default; bounce only where a gesture had momentum.
export const motion = {
  settle: { damping: 22, stiffness: 260, mass: 1 },
  pill: { damping: 20, stiffness: 300, mass: 1 },
  enterMs: 260,
  staggerMs: 45,
};
