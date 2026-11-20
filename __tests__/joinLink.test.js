import { joinUrl, parseJoinUrl } from '../src/joinLink';

describe('join link', () => {
  test('a code makes a link and the link gives the same code back', () => {
    expect(joinUrl('ab12cd34')).toBe('saath://join/AB12CD34');
    expect(parseJoinUrl(joinUrl('AB12CD34'))).toBe('AB12CD34');
  });
  test('only Saath join links are accepted', () => {
    expect(parseJoinUrl('https://evil.example/join/AB12CD34')).toBeNull();
    expect(parseJoinUrl('saath://join/')).toBeNull();
    expect(parseJoinUrl('saath://join/ab')).toBeNull();
    expect(parseJoinUrl('saath://join/AB12CD34/../../x')).toBeNull();
    expect(parseJoinUrl('saath://other/AB12CD34')).toBeNull();
    expect(parseJoinUrl(null)).toBeNull();
    expect(parseJoinUrl('saath://join/ab12cd34?x=1')).toBe('AB12CD34');
  });
});
