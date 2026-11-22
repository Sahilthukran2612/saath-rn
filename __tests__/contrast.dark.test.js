import { colors, darkColors } from '../src/theme';

// The night palette, checked the same way as the day one: WCAG ratios computed, not judged by eye.
const lin = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const d = { ...colors, ...darkColors };
// The yellow and pink slips stay light in dark mode, so their dark text keeps the day contrast.
const PAIRS = [
  [d.ink, d.paper, 'body text on a card', 4.5],
  [d.ink, d.mist, 'body text on the page', 4.5],
  [d.inkSoft, d.paper, 'supporting text on a card', 4.5],
  [d.inkSoft, d.mist, 'supporting text on the page', 4.5],
  [d.inkFaint, d.paper, 'captions on a card', 4.5],
  [d.inkFaint, d.mist, 'captions on the page', 4.5],
  [d.madder, d.paper, 'error text on a card', 4.5],
  [d.madder, d.mist, 'error text on the page', 4.5],
  [d.leafDeep, d.leafTint, 'done badge', 4.5],
  [d.stamp, d.paper, 'the stamp on a card', 4.5],
  [d.ink, d.indigoTint, 'text on a selected row', 4.5],
  [d.indigoDeep, d.indigoTint, 'title and quiet-button label on a wash', 4.5],
  [d.indigoDeep, d.paper, 'slip title on a card', 4.5],
  ['#5E4800', d.haldi, 'text on the yellow slip', 4.5],
  [d.haldiDeep, d.haldiTint, 'warning badge and icons on the dark wash', 4.5],
  [d.carbonDeep, d.carbon, 'text on the pink slip', 4.5],
  // large or bold text and shapes: 3:1
  [d.white, d.indigo, 'primary button label (bold, large)', 4.0],
  [d.indigo, d.paper, 'indigo title on a card (large)', 3.0],
  [d.indigo, d.mist, 'indigo title on the page (large)', 3.0],
  [d.white, d.leaf, 'ok button label (bold, large)', 3.5],
  [d.white, d.brick, 'alert screen text (large)', 4.0],
  [d.brick, d.paper, 'alert text on a card (large)', 3.0],
  [d.control, d.paper, 'control borders', 3.0],
  [d.indigo, d.indigoTint, 'task icon on its blue wash', 3.0],
  [d.control, d.mist, 'control borders on the page', 3.0],
];

describe('dark palette contrast', () => {
  test.each(PAIRS)('%s on %s: %s', (fg, bg, _what, min) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  test('every dark token also exists in the day palette', () => {
    for (const k of Object.keys(darkColors)) expect(Object.keys(colors)).toContain(k);
  });
});
