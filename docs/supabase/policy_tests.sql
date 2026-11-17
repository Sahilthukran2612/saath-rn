-- Policy tests for docs/supabase/schema.sql. They act as real signed-in users (anonymous accounts, like
-- the app's free sign-in) and as a signed-out client, inside one
-- transaction and always finish by raising an exception, so nothing is kept (the test users, household
-- and events are rolled back). Read the result from the exception text: "RESULT: N passed, 0 failed".
--
-- Run:  npx supabase db query --remote --yes -f docs/supabase/policy_tests.sql
-- The expected outcome is an error whose message starts with "RESULT:".

do $test$
declare
  p uuid := gen_random_uuid();  -- the person
  f uuid := gen_random_uuid();  -- a family member
  n uuid := gen_random_uuid();  -- a neighbour
  s uuid := gen_random_uuid();  -- a stranger
  x uuid := gen_random_uuid();  -- an account with a phone number
  y uuid := gen_random_uuid();  -- an anonymous account
  h uuid;
  c int;
  i int;
  v text;
  passed int := 0;
  failed text := '';

begin
  insert into auth.users (id, email) values
    (p, p || '@test.invalid'), (f, f || '@test.invalid'), (n, n || '@test.invalid'), (s, s || '@test.invalid'),
    (x, x || '@test.invalid'), (y, y || '@test.invalid');

  -- Each block below acts as one user: role 'authenticated' plus a JWT claim with that user's id, so
  -- row-level security applies exactly as it does for the app.

  -- the person creates a household and two invites
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  insert into households (person_user_id, person_name) values (p, 'Amma') returning id into h;
  insert into invites (household_id, name, role, code) values
    (h, 'Asha', 'family', 'TESTAAA1'), (h, 'Raju', 'neighbour', 'TESTBBB2');
  insert into events (household_id, event_type, kind, detail) values
    (h, 0, 'fall', null), (h, 1, 'task_done', 'Lunch'), (h, 2, 'weekly_summary', null);

  -- the family member joins with a code; lower case and spaces are tolerated
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  perform accept_invite(' testaaa1 ');
  -- the same code cannot be used twice
  if accept_invite('TESTAAA1') is null then passed := passed + 1; else failed := failed || ' [code reusable]'; end if;

  -- a new member starts at safety only: sees the fall, not the routine event or the summary
  select count(*) into c from events where household_id = h;
  if c = 1 then passed := passed + 1; else failed := failed || ' [dial0 sees ' || c || ']'; end if;
  select count(*) into c from events where household_id = h and event_type = 0;
  if c = 1 then passed := passed + 1; else failed := failed || ' [dial0 safety]'; end if;

  -- my_circles shows whose circle I am in
  select person_name into v from my_circles where household_id = h;
  if v = 'Amma' then passed := passed + 1; else failed := failed || ' [my_circles]'; end if;

  -- a member cannot raise their own dial, change their role, or insert themselves
  begin
    update members set dial = 2 where user_id = f;
    failed := failed || ' [member raised own dial]';
  exception when others then passed := passed + 1; end;
  begin
    insert into members (household_id, user_id, name, role, dial) values (h, f, 'x', 'clinician', 2);
    failed := failed || ' [member inserted self]';
  exception when others then passed := passed + 1; end;

  -- a member can raise a safety event but not a routine one
  begin
    insert into events (household_id, event_type, kind) values (h, 0, 'fall');
    passed := passed + 1;
  exception when others then failed := failed || ' [member cannot raise safety]'; end;
  begin
    insert into events (household_id, event_type, kind) values (h, 1, 'task_done');
    failed := failed || ' [member wrote routine]';
  exception when others then passed := passed + 1; end;

  -- the person raises the dial to routine, then full
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  update members set dial = 1 where user_id = f;
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  select count(*) into c from events where household_id = h and event_type <= 1;
  if c = 3 then passed := passed + 1; else failed := failed || ' [dial1 sees ' || c || ']'; end if;
  select count(*) into c from events where household_id = h and event_type = 2;
  if c = 0 then passed := passed + 1; else failed := failed || ' [dial1 saw summary]'; end if;

  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  update members set dial = 2 where user_id = f;
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  select count(*) into c from events where household_id = h and event_type = 2;
  if c = 1 then passed := passed + 1; else failed := failed || ' [dial2 summary]'; end if;

  -- Time Off (set by the member) mutes routine and summary but never safety
  update members set time_off = true where user_id = f;
  select count(*) into c from events where household_id = h;
  if c = 2 then passed := passed + 1; else failed := failed || ' [time off sees ' || c || ']'; end if;
  select count(*) into c from events where household_id = h and event_type = 0;
  if c = 2 then passed := passed + 1; else failed := failed || ' [time off hid safety]'; end if;
  update members set time_off = false where user_id = f;

  -- phone numbers: hidden from others unless the owner shares
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  update members set phone = '9876543210' where user_id = f;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  perform accept_invite('TESTBBB2');
  select phone into v from members_public where household_id = h and role = 'family';
  if v is null then passed := passed + 1; else failed := failed || ' [number leaked]'; end if;
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  update members set share_contact = true where user_id = f;
  perform set_config('request.jwt.claims', json_build_object('sub', n, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  select phone into v from members_public where household_id = h and role = 'family';
  if v = '9876543210' then passed := passed + 1; else failed := failed || ' [shared number hidden]'; end if;

  -- the neighbour at dial 0 sees safety only, and does not see the family member's dial change
  select count(*) into c from events where household_id = h and event_type > 0;
  if c = 0 then passed := passed + 1; else failed := failed || ' [neighbour saw routine]'; end if;

  -- a stranger sees nothing at all
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  select count(*) into c from events;
  if c = 0 then passed := passed + 1; else failed := failed || ' [stranger sees events ' || c || ']'; end if;
  select count(*) into c from households;
  if c = 0 then passed := passed + 1; else failed := failed || ' [stranger sees households]'; end if;
  select count(*) into c from members;
  if c = 0 then passed := passed + 1; else failed := failed || ' [stranger sees members]'; end if;
  select count(*) into c from invites;
  if c = 0 then passed := passed + 1; else failed := failed || ' [stranger sees invites]'; end if;
  begin
    insert into events (household_id, event_type, kind) values (h, 0, 'fall');
    failed := failed || ' [stranger wrote event]';
  exception when others then passed := passed + 1; end;
  if accept_invite('NOSUCHCODE') is null then passed := passed + 1; else failed := failed || ' [bad code accepted]'; end if;

  -- the person cannot join their own circle, and members cannot read invites
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  insert into invites (household_id, name, role, code) values (h, 'Me', 'family', 'TESTCCC3');
  begin
    perform accept_invite('TESTCCC3');
    failed := failed || ' [person joined own circle]';
  exception when others then passed := passed + 1; end;
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  select count(*) into c from invites;
  if c = 0 then passed := passed + 1; else failed := failed || ' [member sees invites]'; end if;


  -- ---- invites made for a phone number ----
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', false)::text, true);
  insert into invites (household_id, name, role, code, phone) values (h, 'Meena', 'neighbour', 'TESTPH01', '9876543210');
  -- an account with a different number cannot use it (the answer is null, like a wrong code)
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated', 'phone', '919000000001')::text, true);
  if accept_invite('TESTPH01') is null then passed := passed + 1; else failed := failed || ' [wrong number joined]'; end if;
  -- an anonymous account, which has no number, cannot either
  perform set_config('request.jwt.claims', json_build_object('sub', y, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  if accept_invite('TESTPH01') is null then passed := passed + 1; else failed := failed || ' [anonymous joined a numbered invite]'; end if;
  -- the right number can, whether the claim carries 91 in front or not
  perform set_config('request.jwt.claims', json_build_object('sub', x, 'role', 'authenticated', 'phone', '919876543210')::text, true);
  if accept_invite('TESTPH01') = h then passed := passed + 1; else failed := failed || ' [right number could not join]'; end if;
  select count(*) into c from members where household_id = h and user_id = x and role = 'neighbour' and dial = 0;
  if c = 1 then passed := passed + 1; else failed := failed || ' [joined with the wrong role or dial]'; end if;
  -- and the code is used up
  if accept_invite('TESTPH01') is null then passed := passed + 1; else failed := failed || ' [numbered code reusable]'; end if;
  -- ---- hardening for free anonymous accounts ----
  -- one household per account
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  begin
    insert into households (person_user_id, person_name) values (p, 'Second');
    failed := failed || ' [two households]';
  exception when others then passed := passed + 1; end;
  -- over-long text and malformed codes are refused
  begin
    insert into events (household_id, event_type, kind, detail) values (h, 1, 'task_done', repeat('x', 121));
    failed := failed || ' [long detail accepted]';
  exception when others then passed := passed + 1; end;
  begin
    insert into invites (household_id, name, role, code) values (h, 'Bad', 'family', 'ab');
    failed := failed || ' [bad code format accepted]';
  exception when others then passed := passed + 1; end;
  -- an account guessing codes is locked out after ten wrong tries
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  c := 0; v := 'no lockout';
  for i in 1..15 loop
    begin
      if accept_invite('GUESS' || i) is null then c := c + 1; end if;
    exception when others then v := 'locked'; exit; end;
  end loop;
  if v = 'locked' and c between 8 and 10 then passed := passed + 1; else failed := failed || ' [no guess lockout: ' || v || ' after ' || c || ']'; end if;
  -- a signed-out client (role anon) can read nothing and call nothing
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
  begin
    perform count(*) from events;
    failed := failed || ' [anon read events]';
  exception when others then passed := passed + 1; end;
  begin
    perform count(*) from members_public;
    failed := failed || ' [anon read members_public]';
  exception when others then passed := passed + 1; end;
  begin
    perform accept_invite('TESTAAA1');
    failed := failed || ' [anon called accept_invite]';
  exception when others then passed := passed + 1; end;
  perform set_config('role', 'authenticated', true);
  -- a circle is capped at 30 members, and safety events at 60 an hour
  perform set_config('request.jwt.claims', json_build_object('sub', p, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  v := 'no cap';
  for i in 1..40 loop
    begin
      insert into members (household_id, name, role) values (h, 'x' || i, 'family');
    exception when others then v := 'capped'; exit; end;
  end loop;
  if v = 'capped' then passed := passed + 1; else failed := failed || ' [members not capped]'; end if;
  v := 'no cap';
  for i in 1..70 loop
    begin
      insert into events (household_id, event_type, kind) values (h, 0, 'fall');
    exception when others then v := 'capped'; exit; end;
  end loop;
  if v = 'capped' then passed := passed + 1; else failed := failed || ' [safety events not capped]'; end if;
  -- ---- push addresses (device_tokens) ----
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', false)::text, true);
  insert into device_tokens (token, lang) values ('TESTTOKEN-F1', 'hi');
  select count(*) into c from device_tokens;
  if c = 1 then passed := passed + 1; else failed := failed || ' [own token not visible]'; end if;
  begin
    insert into device_tokens (token, user_id) values ('TESTTOKEN-FAKE', p);
    failed := failed || ' [token for another user]';
  exception when others then passed := passed + 1; end;
  perform set_config('request.jwt.claims', json_build_object('sub', s, 'role', 'authenticated', 'is_anonymous', true)::text, true);
  select count(*) into c from device_tokens;
  if c = 0 then passed := passed + 1; else failed := failed || ' [stranger sees tokens]'; end if;
  begin
    update device_tokens set lang = 'en' where token = 'TESTTOKEN-F1';
    get diagnostics c = row_count;
    if c = 0 then passed := passed + 1; else failed := failed || ' [stranger changed a token]'; end if;
  exception when others then passed := passed + 1; end;
  begin
    delete from device_tokens where token = 'TESTTOKEN-F1';
    get diagnostics c = row_count;
    if c = 0 then passed := passed + 1; else failed := failed || ' [stranger deleted a token]'; end if;
  exception when others then passed := passed + 1; end;
  perform set_config('request.jwt.claims', json_build_object('sub', f, 'role', 'authenticated', 'is_anonymous', false)::text, true);
  v := 'no cap';
  for i in 1..12 loop
    begin
      insert into device_tokens (token) values ('TESTTOKEN-CAP-' || i);
    exception when others then v := 'capped'; exit; end;
  end loop;
  if v = 'capped' then passed := passed + 1; else failed := failed || ' [tokens not capped]'; end if;
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '', true);
  begin
    perform count(*) from device_tokens;
    failed := failed || ' [anon read tokens]';
  exception when others then passed := passed + 1; end;
  perform set_config('role', 'authenticated', true);
  -- nothing was kept
  perform set_config('role', 'postgres', true);
  raise exception 'RESULT: % passed, failures:%', passed, case when failed = '' then ' none' else failed end;
end
$test$;
