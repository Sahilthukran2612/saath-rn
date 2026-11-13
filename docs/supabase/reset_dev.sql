-- DEVELOPMENT ONLY. Drops every Saath table, view and function so schema.sql can be applied afresh.
-- It refuses to run if any household or event exists, so it cannot wipe real data by accident.
do $guard$
begin
  if to_regclass('public.households') is not null and exists (select 1 from public.households) then
    raise exception 'refusing to reset: households exist';
  end if;
  if to_regclass('public.events') is not null and exists (select 1 from public.events) then
    raise exception 'refusing to reset: events exist';
  end if;
end
$guard$;

drop view if exists members_public, my_circles;
drop table if exists audit, consents, events, invites, invite_attempts, members, households cascade;
drop function if exists accept_invite(text), can_see_event(uuid, smallint), is_member(uuid),
  is_person(uuid), my_member(uuid), members_self_guard(), members_clamp_dial(),
  events_cap(), members_cap(), invites_cap() cascade;