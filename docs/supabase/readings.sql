-- ---- Sugar readings shared with a doctor ----
-- A doctor in the circle sees all of the person's logged sugar readings, so they can read the statistics and plan care.
-- Consent is the Privacy Dial: the person's phone uploads readings only once a joined doctor is at Full (2), and the
-- database lets only the person and a clinician member at Full read them. A doctor who joins starts at Full, because
-- the person named them as a doctor in the invite, and the Add a person form says so. The person can lower it any
-- time in Circle; the doctor then stops seeing them (rows already uploaded stay hidden, not deleted).
-- This changes the earlier rule that readings never leave the phone: it applies to manually entered sugar readings
-- only, only for a doctor at Full. Needs legal review (DPDP Act).
create table if not exists readings (
  household_id uuid not null references households (id) on delete cascade,
  client_id text not null check (char_length(client_id) <= 40),
  mgdl smallint not null check (mgdl between 20 and 600),
  at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (household_id, client_id)
);
create index if not exists readings_latest on readings (household_id, at desc);
alter table readings enable row level security;
revoke all on readings from anon;

drop policy if exists readings_read on readings;
create policy readings_read on readings for select to authenticated using (
  is_person(household_id)
  or exists (
    select 1 from members m
    where m.household_id = readings.household_id and m.user_id = auth.uid()
      and m.role = 'clinician' and m.dial = 2
  )
);
drop policy if exists readings_person_insert on readings;
create policy readings_person_insert on readings for insert to authenticated with check (is_person(household_id));
drop policy if exists readings_person_update on readings;
create policy readings_person_update on readings for update to authenticated
  using (is_person(household_id)) with check (is_person(household_id));
drop policy if exists readings_person_delete on readings;
create policy readings_person_delete on readings for delete to authenticated using (is_person(household_id));

-- Keep the 2000 newest readings per household.
create or replace function readings_cap() returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from readings where household_id = new.household_id and (household_id, client_id) in (
    select household_id, client_id from readings where household_id = new.household_id order by at desc offset 2000
  );
  return new;
end $$;
drop trigger if exists readings_cap_t on readings;
create trigger readings_cap_t after insert on readings for each row execute function readings_cap();
revoke all on function readings_cap() from public, anon;

-- A person who is invited as a doctor joins at Full (2); everyone else still starts at safety only (0).
create or replace function accept_invite(invite_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  inv invites;
  clean text := upper(trim(invite_code));
  caller_phone text := right(regexp_replace(coalesce(auth.jwt() ->> 'phone', ''), '[^0-9]', '', 'g'), 10);
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
  if not found or (inv.phone is not null and inv.phone <> caller_phone) then
    insert into invite_attempts (user_id) values (auth.uid());
    return null;
  end if;
  if is_person(inv.household_id) then raise exception 'you cannot join your own circle'; end if;
  insert into members (household_id, user_id, name, role, dial)
    values (inv.household_id, auth.uid(), inv.name, inv.role, case when inv.role = 'clinician' then 2 else 0 end)
    on conflict (household_id, user_id) do nothing;
  update invites set status = 'accepted' where id = inv.id;
  return inv.household_id;
end $$;
