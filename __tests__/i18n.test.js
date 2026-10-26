import { strings, adviceText } from '../src/i18n/strings';

describe('localization', () => {
  test('English and Hindi have exactly the same keys', () => {
    const en = Object.keys(strings.en).sort();
    const hi = Object.keys(strings.hi).sort();
    expect(hi).toEqual(en);
  });
  test('no Hindi string is empty or a copy of the English one (except names and symbols)', () => {
    const same = Object.keys(strings.en).filter((k) => strings.hi[k] === strings.en[k]);
    expect(same).toEqual([]);
    Object.values(strings.hi).forEach((v) => expect(v.trim().length).toBeGreaterThan(0));
  });
  test.each(['en', 'hi'])(
    'sugar advice in %s always ends with the clinician note and has no dose',
    (lang) => {
      ['unknown', 'low', 'ok', 'high'].forEach((level) => {
        const text = adviceText(lang, level);
        expect(text).toContain(strings[lang].clinicianPlan);
        expect(text).not.toMatch(/\b\d+\s*(units?|iu|ml)\b|यूनिट/i);
      });
    }
  );
  test('every budget tip id has English text that matches the resource file', () => {
    const { TIP_TEXT } = require('../src/care');
    Object.keys(TIP_TEXT).forEach((id) => {
      expect(strings.en[`tip.${id}`]).toBe(TIP_TEXT[id]);
      expect(strings.hi[`tip.${id}`]).toBeTruthy();
    });
  });
  test('Hindi text contains no stray mojibake', () => {
    Object.values(strings.hi).forEach((v) => expect(v).not.toMatch(/Ã|Â|â€/));
  });
});
