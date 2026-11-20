import { hasDevanagari, withSlack } from '../src/components/AppText';

describe('Hindi text slack', () => {
  test('finds Devanagari in strings and nested children, not in English or numbers', () => {
    expect(hasDevanagari('संपर्क जोड़ें')).toBe(true);
    expect(hasDevanagari(['Add ', 'संपर्क'])).toBe(true);
    expect(hasDevanagari('Add contact')).toBe(false);
    expect(hasDevanagari(42)).toBe(false);
    expect(hasDevanagari(null)).toBe(false);
  });

  test('Hindi text gets two no-break spaces, English is untouched', () => {
    expect(withSlack('संपर्क')).toBe('संपर्क\u00A0\u00A0');
    expect(withSlack(['क', 'ख'])).toEqual(['क', 'ख', '\u00A0\u00A0']);
    expect(withSlack('Add contact')).toBe('Add contact');
  });
});
