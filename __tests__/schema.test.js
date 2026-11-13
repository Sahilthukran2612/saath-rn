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
  test('members_read does not query members directly (that would recurse forever)', () => {
    const policy = code.match(/create policy members_read on members[\s\S]*?;/)[0];
    expect(policy).toContain('is_member(household_id)');
    expect(policy).not.toMatch(/from members/);
    expect(code).toMatch(/function is_member[\s\S]*security definer/);
  });
  test('joining goes through accept_invite, which only adds the caller and uses a code once', () => {
    const fn = code.match(/function accept_invite[\s\S]*?end \$\$;/)[0];
    expect(fn).toContain('security definer');
    expect(fn).toContain('auth.uid()');
    expect(fn).toContain("status = 'pending'");
    expect(fn).toContain("interval '14 days'");
    expect(fn).toContain("set status = 'accepted'");
    expect(fn).toMatch(/values \(inv\.household_id, auth\.uid\(\)/);
    // no policy lets a user insert themselves into members
    expect(code).not.toMatch(/create policy \w+ on members for insert/);
  });
  test('a new member starts at safety only', () => {
    expect(code).toMatch(/values \(inv\.household_id, auth\.uid\(\), inv\.name, inv\.role, 0\)/);
  });  test('anonymous sign-ins use the authenticated role, so every policy names it and anon gets no grants', () => {
    const policies = code.match(/create policy [\s\S]*?;/g);
    expect(policies.length).toBeGreaterThan(10);
    policies.forEach((p) => expect(p).toMatch(/\bto authenticated\b/));
    expect(code).toContain('revoke all on all tables in schema public from anon');
    expect(code).toMatch(/revoke all on all functions in schema public from public, anon/);
  });
  test('a free account is limited: one household, short text, caps, and a guess lockout', () => {
    expect(code).toMatch(/unique \(person_user_id\)/);
    expect(code).toMatch(/char_length\(detail\) <= 120/);
    expect(code).toMatch(/code ~ '\^\[A-Z0-9\]\{6,12\}\$'/);
    ['events_cap', 'members_cap', 'invites_cap'].forEach((f) =>
      expect(code).toMatch(new RegExp(`create trigger ${f} before insert`))
    );
    const fn = code.match(/function accept_invite[\s\S]*?end \$\$;/)[0];
    expect(fn).toMatch(/insert into invite_attempts/);
    expect(fn).toMatch(/>= 10/);
  });
  test('the IF in a trigger never contains a CASE (plpgsql would stop at its THEN)', () => {
    expect(code).not.toMatch(/\bif\b[^;]*\bcase\b[^;]*\bthen\b[^;]*\bend\b[^;]*\bthen\b/i);
  });});
