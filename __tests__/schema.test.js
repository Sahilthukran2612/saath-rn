import fs from 'fs';
import path from 'path';
import { EVENT_TYPE, canReceive } from '../src/logic';

// The SQL has not been run against a database. These checks only stop the file drifting away from
// the app's rules; they do not prove the policies work. See the header of the file.
const sql = fs.readFileSync(path.join(process.cwd(), 'docs', 'supabase', 'schema.sql'), 'utf8');
const code = sql
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n');

describe('cloud schema (design only, not run)', () => {
  test('has no dose, amount or units column', () => {
    expect(code).not.toMatch(/\b(dose|dosage|units?|amount|mg|ml|insulin_)\b/i);
  });
  test('safety events (type 0) are visible regardless of the dial and Time Off', () => {
    expect(EVENT_TYPE.safety).toBe(0);
    expect(code).toMatch(/etype = 0 or \(etype <= m\.dial and not m\.time_off\)/);
    expect(canReceive(0, EVENT_TYPE.safety)).toBe(true);
  });
  test('the dial comparison matches canReceive for routine and summary events', () => {
    expect(EVENT_TYPE).toEqual({ safety: 0, routine: 1, summary: 2 });
    expect(canReceive(0, EVENT_TYPE.routine)).toBe(false);
    expect(canReceive(1, EVENT_TYPE.routine)).toBe(true);
    expect(canReceive(1, EVENT_TYPE.summary)).toBe(false);
    expect(canReceive(2, EVENT_TYPE.summary)).toBe(true);
  });
  test('every table has row level security turned on', () => {
    const tables = [...code.matchAll(/create table (\w+)/g)].map((m) => m[1]);
    expect(tables.length).toBeGreaterThan(3);
    tables.forEach((t) => expect(code).toContain(`alter table ${t} enable row level security`));
  });
  test('a phone number is only exposed through the view that checks share_contact', () => {
    expect(code).toMatch(/case when share_contact then phone else null end/);
  });
});
