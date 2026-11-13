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
  created_at timestamptz not null default now()
);

create table members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null, -- null until the invite is accepted
  name text not null,
  role text not null check (role in ('person', 'family', 'neighbour', 'asha', 'clinician')),
  dial smallint not null default 0 check (dial between 0 and 2),
  time_off boolean not null default false,
  share_contact boolean not null default false,
  phone text, -- shown to others only when share_contact is true (see members_public)
  guardian boolean not null default false,
  min_dial smallint not null default 0 check (min_dial between 0 and 2),
  created_at timestamptz not null default now(),
  unique (household_id, user_id)
);

create table events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  event_type smallint not null check (event_type between 0 and 2),
  kind text not null, -- 'fall', 'quiet', 'im_ok', 'task_done', 'weekly_summary' ...
  detail text, -- short, human-readable, no doses
  created_at timestamptz not null default now()
);
create index events_household_time on events (household_id, created_at desc);

create table consents (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  guardian_name text not null,
  guardian_phone text not null,
  agreed_at timestamptz not null default now()
);

create table audit (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households (id) on delete cascade,
  viewer_member_id uuid not null references members (id) on delete cascade,
  what text not null,
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

create policy households_read on households for select
  using (person_user_id = auth.uid() or exists (
    select 1 from members m where m.household_id = households.id and m.user_id = auth.uid()));
create policy households_insert on households for insert with check (person_user_id = auth.uid());

-- Members: the person manages their circle; each member can read the circle and edit only Time Off.
create policy members_read on members for select
  using (is_person(household_id) or exists (
    select 1 from members me where me.household_id = members.household_id and me.user_id = auth.uid()));
create policy members_person_write on members for all
  using (is_person(household_id)) with check (is_person(household_id));
create policy members_self_time_off on members for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Events: read follows the dial. Any member can write a safety event (a neighbour can raise one);
-- only the person writes routine and summary events.
create policy events_read on events for select using (can_see_event(household_id, event_type));
create policy events_write_person on events for insert
  with check (is_person(household_id));
create policy events_write_safety on events for insert
  with check (event_type = 0 and (my_member(household_id)).id is not null);

create policy consents_person on consents for all
  using (is_person(household_id)) with check (is_person(household_id));

-- The audit log is readable by the person, and writable by whoever viewed.
create policy audit_read on audit for select using (is_person(household_id));
create policy audit_insert on audit for insert
  with check ((my_member(household_id)).id = viewer_member_id);

-- ---------- columns and rules that policies cannot express ----------

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
