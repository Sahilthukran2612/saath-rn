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

describe('add link (a care-giver shows their card)', () => {
  const { addUrl, parseAddUrl } = require('../src/joinLink');
  test('name, role and number round-trip, including Hindi and spaces', () => {
    const link = addUrl({ name: 'Dr. Rao', phone: '+91 98765 43210', role: 'clinician' });
    expect(parseAddUrl(link)).toEqual({ role: 'clinician', phone: '9876543210', name: 'Dr. Rao' });
    expect(parseAddUrl(addUrl({ name: 'डॉ. राव', phone: '9876543210', role: 'clinician' })).name).toBe('डॉ. राव');
  });
  test('an unknown role falls back to family when making a link', () => {
    expect(parseAddUrl(addUrl({ name: 'Meena', phone: '9876543210', role: 'admin' })).role).toBe('family');
  });
  test('anything else is rejected', () => {
    expect(parseAddUrl('saath://add/admin/9876543210/Meena')).toBeNull();
    expect(parseAddUrl('saath://add/family/12345/Meena')).toBeNull();
    expect(parseAddUrl('saath://add/family/9876543210/M')).toBeNull();
    expect(parseAddUrl('saath://add/family/9876543210/%E0%A4%A')).toBeNull();
    expect(parseAddUrl('https://x.test/add/family/9876543210/Meena')).toBeNull();
    expect(parseAddUrl(null)).toBeNull();
  });
  test('markup in a name is stripped', () => {
    expect(parseAddUrl('saath://add/family/9876543210/%3Cb%3EMeena').name).toBe('bMeena');
  });
});
