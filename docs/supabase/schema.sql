-- Saath cloud schema (Supabase / Postgres), Phase 4 design.
--
-- STATUS: written, NOT run. It has not been applied to a Supabase project, and the policies have
-- not been tested against a real database. The app does not call it yet; it is fully offline today.
-- The rules mirror `canReceive` in src/logic.js, which is unit-tested. When this is applied,
-- add policy tests (pgTAP or the Supabase CLI) that repeat the cases in __tests__/logic.test.js.
--
-- Privacy rules built in (see .claude/skills/saath-privacy-rules):
--  * Event types: 0 safety, 1 routine, 2 summary. Same numbers as EVENT_TYPE in src/logic.js.
--  * A member sees an event if it is a safety event (always, even on Time Off), or its type is at
--    or below the person's dial for that member and the member is not on Time Off.
--  * The person always sees their own events. Raw sensor data has no column and never leaves the phone.
--  * There is no dose, amount or units column anywhere. Insulin is logged as a time only.
--  * A member's phone number is visible to the circle only if that member set share_contact.
--  * A minor's dial cannot go below their guardian's minimum.
--  * Every read of a non-person's view is written to the audit table.
--  * Consent for under-18s is stored with who agreed and when. NEEDS LEGAL REVIEW (DPDP Act 2023);
--    this table is a record of the step, not proof of verified consent.

create extension if not exists pgcrypto;

create table households (
  id uuid primary key default gen_random_uuid(),
  person_user_id uuid not null references auth.users (id) on delete cascade,
  person_name text not null default '' check (char_length(person_name) <= 60), -- what the circle sees ("Amma")
  created_at timestamptz not null default now(),
  unique (person_user_id) -- one household per account, so a free account cannot make thousands
);

create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null, -- null until the invite is accepted
  name text not null check (char_length(name) <= 60),
  role text not null check (role in ('person', 'family', 'neighbour', 'asha', 'clinician')),
  dial smallint not null default 0 check (dial between 0 and 2),
  time_off boolean not null default false,
  share_contact boolean not null default false,
  phone text check (char_length(phone) <= 20), -- shown to others only when share_contact is true (see members_public)
  guardian boolean not null default false,
  min_dial smallint not null default 0 check (min_dial between 0 and 2),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  event_type smallint not null check (event_type between 0 and 2),
  kind text not null check (char_length(kind) <= 30), -- 'fall', 'quiet', 'im_ok', 'task_done', 'weekly_summary' ...
  detail text check (char_length(detail) <= 120), -- short, human-readable, no doses
  created_at timestamptz not null default now()
);
create index events_household_time on events (household_id, created_at desc);

create table consents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  guardian_name text not null check (char_length(guardian_name) <= 60),
  guardian_phone text not null check (char_length(guardian_phone) <= 20),
  agreed_at timestamptz not null default now()
);

-- An invite is made by the person and accepted by the invited member's phone with accept_invite().
create table invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  name text not null check (char_length(name) <= 60),
  role text not null check (role in ('family', 'neighbour', 'asha', 'clinician')),
  code text not null unique check (code ~ '^[A-Z0-9]{6,12}$'),
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now()
);

-- Wrong invite codes tried by each account. Only accept_invite() touches this; no policy, so no client can.
create table invite_attempts (
  user_id uuid not null,
  at timestamptz not null default now()
);
create index invite_attempts_user on invite_attempts (user_id, at desc);

create table audit (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  viewer_member_id uuid not null references members (id) on delete cascade,
  what text not null check (char_length(what) <= 120),
  viewed_at timestamptz not null default now()
);

-- ---------- helper functions ----------

create or replace function is_person(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from households where id = h and person_user_id = auth.uid());
$$;

create or replace function my_member(h uuid) returns members
language sql stable security definer set search_path = public as $$
  select m from members m where m.household_id = h and m.user_id = auth.uid() limit 1;
$$;

-- Used by the members policy. It must be security definer: a policy on members that queried members
-- directly would recurse forever.
create or replace function is_member(h uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where household_id = h and user_id = auth.uid());
$$;

-- The one place the Privacy Dial is decided. Keep it identical to canReceive() in src/logic.js.
create or replace function can_see_event(h uuid, etype smallint) returns boolean
language sql stable security definer set search_path = public as $$
  select
    is_person(h)
    or exists (
      select 1 from members m
      where m.household_id = h
        and m.user_id = auth.uid()
        and (etype = 0 or (etype <= m.dial and not m.time_off))
    );
$$;

-- ---------- row level security ----------

alter table households enable row level security;
alter table members enable row level security;
alter table events enable row level security;
alter table consents enable row level security;
alter table audit enable row level security;
alter table invites enable row level security;
alter table invite_attempts enable row level security;

create policy households_read on households for select to authenticated
  using (person_user_id = auth.uid() or exists (
    select 1 from members m where m.household_id = households.id and m.user_id = auth.uid()));
create policy households_insert on households for insert to authenticated with check (person_user_id = auth.uid());
create policy households_person_update on households for update to authenticated
  using (person_user_id = auth.uid()) with check (person_user_id = auth.uid());

-- Only the person manages invites. A new member joins through accept_invite(), not by inserting.
create policy invites_person on invites for all to authenticated
  using (is_person(household_id)) with check (is_person(household_id));

-- Members: the person manages their circle; each member can read the circle and edit only Time Off.
create policy members_read on members for select to authenticated
  using (is_person(household_id) or is_member(household_id));
create policy members_person_write on members for all to authenticated
  using (is_person(household_id)) with check (is_person(household_id));
create policy members_self_time_off on members for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Events: read follows the dial. Any member can write a safety event (a neighbour can raise one);
-- only the person writes routine and summary events.
create policy events_read on events for select to authenticated using (can_see_event(household_id, event_type));
create policy events_write_person on events for insert to authenticated
  with check (is_person(household_id));
create policy events_write_safety on events for insert to authenticated
  with check (event_type = 0 and (my_member(household_id)).id is not null);

create policy consents_person on consents for all to authenticated
  using (is_person(household_id)) with check (is_person(household_id));

-- The audit log is readable by the person, and writable by whoever viewed.
create policy audit_read on audit for select to authenticated using (is_person(household_id));
create policy audit_insert on audit for insert to authenticated
  with check ((my_member(household_id)).id = viewer_member_id);

-- ---------- columns and rules that policies cannot express ----------

-- Join a circle with the code the person shared. Runs as the function owner so it can add the member
-- row, but it only ever adds auth.uid(). Codes expire after 14 days and work once. A new member starts
-- at dial 0 (safety only) until the person raises it. A wrong code returns null (not an error, so the
-- attempt is kept) and ten wrong codes in 15 minutes lock that account out for a while. Anonymous
-- accounts are free to make, so this limit is per account and Supabase's own sign-up rate limit
-- per IP is what stops someone making accounts to get more guesses.
create or replace function accept_invite(invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  inv invites;
  clean text := upper(trim(invite_code));
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  delete from invite_attempts where at < now() - interval '1 day';
  if (select count(*) from invite_attempts where user_id = auth.uid() and at > now() - interval '15 minutes') >= 10 then
    raise exception 'too many attempts, wait a few minutes';
  end if;
  select * into inv from invites
    where code = clean and status = 'pending'
      and created_at > now() - interval '14 days'
    for update;
  if not found then
    insert into invite_attempts (user_id) values (auth.uid());
    return null;
  end if;
  if is_person(inv.household_id) then raise exception 'you cannot join your own circle'; end if;
  insert into members (household_id, user_id, name, role, dial)
    values (inv.household_id, auth.uid(), inv.name, inv.role, 0)
    on conflict (household_id, user_id) do nothing;
  update invites set status = 'accepted' where id = inv.id;
  return inv.household_id;
end $$;
-- The circles I belong to: whose circle, my role, my dial. The person's name comes from households.
create view my_circles with (security_invoker = true) as
  select m.household_id, m.role, m.dial, m.time_off, h.person_name
  from members m join households h on h.id = m.household_id
  where m.user_id = auth.uid();

-- Phone numbers: other members see a number only if its owner shares it.
create view members_public with (security_invoker = true) as
  select id, household_id, name, role, dial, time_off, share_contact,
         case when share_contact then phone else null end as phone
  from members;

-- Time Off may be changed by the member themself, but nothing else about their own row.
create or replace function members_self_guard() returns trigger language plpgsql as $$
begin
  if not is_person(old.household_id) then
    if new.dial is distinct from old.dial or new.role is distinct from old.role
       or new.guardian is distinct from old.guardian or new.min_dial is distinct from old.min_dial
       or new.household_id is distinct from old.household_id then
      raise exception 'only the person can change these';
    end if;
  end if;
  return new;
end $$;
create trigger members_self_guard before update on members
  for each row execute function members_self_guard();

-- A guardian keeps at least their minimum dial (src/logic.js: clampDial / minDialFor).
create or replace function members_clamp_dial() returns trigger language plpgsql as $$
begin
  if new.guardian then new.dial := greatest(new.dial, new.min_dial, 1); end if;
  return new;
end $$;
create trigger members_clamp_dial before insert or update on members
  for each row execute function members_clamp_dial();

-- ---------- limits, because a free anonymous account can be made by anyone ----------
-- Each cap is checked as the function owner so it sees every row, not just the caller's.

create or replace function events_cap() returns trigger language plpgsql security definer set search_path = public as $$
declare
  recent int;
  max_per_hour int := case when new.event_type = 0 then 60 else 300 end;
begin
  select count(*) into recent from events
    where household_id = new.household_id and (event_type = 0) = (new.event_type = 0)
      and created_at > now() - interval '1 hour';
  if recent >= max_per_hour then
    raise exception 'too many events, try again later';
  end if;
  return new;
end $$;
create trigger events_cap before insert on events for each row execute function events_cap();

create or replace function members_cap() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from members where household_id = new.household_id) >= 30 then
    raise exception 'circle is full';
  end if;
  return new;
end $$;
create trigger members_cap before insert on members for each row execute function members_cap();

create or replace function invites_cap() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from invites where household_id = new.household_id and status = 'pending') >= 30 then
    raise exception 'too many open invites';
  end if;
  return new;
end $$;
create trigger invites_cap before insert on invites for each row execute function invites_cap();

-- ---------- who may touch what ----------
-- Anonymous sign-ins use the 'authenticated' role, so row-level security is what protects the data.
-- These grants add a second wall: a client with no sign-in at all (the 'anon' role) gets nothing.
revoke all on all tables in schema public from anon;
revoke all on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;