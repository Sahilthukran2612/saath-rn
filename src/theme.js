// Indian textile dyes. Brick is for real safety alerts only.
export const colors = {
  indigo: '#26306B',
  haldi: '#F2B134',
  leaf: '#2F8F6B',
  brick: '#B3261E',
  mist: '#F6F7FB',
  ink: '#1B1E2B',
  white: '#FFFFFF',
  line: '#D9DCE8',
  // Quiet tints for selected and resting states (dark text on them stays above 7:1).
  indigoTint: '#E8EAF5',
  leafTint: '#E3F2EC',
  inkSoft: '#4A4F66',
};

export const type = { body: 18, small: 16, title: 24, hero: 32 };
export const sizes = { target: 56, gutter: 16, radius: 20 };

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
