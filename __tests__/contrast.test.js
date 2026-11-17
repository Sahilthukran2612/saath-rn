import { colors } from '../src/theme';

// WCAG 2.x contrast, computed rather than judged by eye. Body text and small text need 4.5:1, large or bold
// text (18 pt, or 14 pt bold) and interface shapes need 3:1. These are the pairs the app really uses.
const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
export const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const c = colors;
// [text colour, background, what it is, minimum]
const TEXT = [
  [c.ink, c.white, 'body text on a card', 4.5],
  [c.ink, c.mist, 'body text on the page', 4.5],
  [c.inkSoft, c.white, 'supporting text on a card', 4.5],
  [c.inkSoft, c.mist, 'supporting text on the page', 4.5],
  [c.inkFaint, c.white, 'captions on a card', 4.5],
  [c.inkFaint, c.mist, 'captions on the page', 4.5],
  [c.indigo, c.white, 'indigo text on a card', 4.5],
  [c.indigo, c.mist, 'indigo text on the page', 4.5],
  [c.indigo, c.indigoTint, 'quiet button label', 4.5],
  [c.white, c.indigo, 'primary button label', 4.5],
  [c.white, c.indigoDeep, 'text on the dark hero', 4.5],
  [c.indigoSoft, c.indigoDeep, 'soft text on the dark hero', 4.5],
  [c.white, c.brick, 'alert screen text', 4.5],
  [c.brick, c.brickTint, 'alert banner text', 4.5],
  [c.brick, c.white, 'alert text on a card', 4.5],
  [c.madder, c.white, 'error text on a card', 4.5],
  [c.madder, c.mist, 'error text on the page', 4.5],
  [c.leafDeep, c.leafTint, 'done badge', 4.5],
  [c.haldiDeep, c.haldiTint, 'note badge', 4.5],
  [c.ink, c.haldiTint, 'text on a note card', 4.5],
  [c.leafDeep, c.white, 'ok label on the confirm button', 4.5],
  [c.white, c.leaf, 'ok button label', 3],
];

// Shapes and icons (not text): 3:1 against what they sit on.
const SHAPES = [
  [c.indigo, c.white, 'icon on a card'],
  [c.leaf, c.white, 'check mark and ring'],
  [c.control, c.white, 'field border on a card'],
  [c.control, c.mist, 'field border on the page'],
  [c.white, c.control, 'switch knob on its off track'],
  [c.control, c.white, 'empty check circle'],
  [c.haldi, c.indigoDeep, 'dye ring dots on the dark hero'],
];

describe('text contrast (WCAG)', () => {
  test.each(TEXT)('%s on %s: %s needs %s:1', (fg, bg, _what, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
  test('the formula agrees with known values', () => {
    expect(ratio('#000000', '#FFFFFF')).toBeCloseTo(21, 0);
    expect(ratio('#777777', '#FFFFFF')).toBeCloseTo(4.48, 1);
    expect(ratio('#FFFFFF', '#FFFFFF')).toBe(1);
  });
});

describe('shape contrast', () => {
  test.each(SHAPES)('%s on %s: %s needs 3:1', (fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});
