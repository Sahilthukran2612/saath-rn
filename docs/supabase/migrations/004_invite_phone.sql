-- Invites are made for a phone number. Run once on a project that already has the schema (additive).
alter table invites add column if not exists phone text check (phone is null or phone ~ '^[0-9]{10}$');

-- Join a circle with the code the person shared. Runs as the function owner so it can add the member
-- row, but it only ever adds auth.uid(). Codes expire after 14 days and work once. A new member starts
-- at dial 0 (safety only) until the person raises it.
-- An invite made for a phone number can only be accepted by an account that signed up with that same
-- number, so a code that is forwarded or overheard is useless to anyone else. An invite with no number
-- (older ones) can be accepted by any signed-in account. A wrong code, or one made for another number,
-- returns null (not an error, so the attempt is kept), and ten of those in 15 minutes lock that account
-- out for a while. Anonymous accounts are free to make, so this limit is per account and Supabase's own
-- sign-up rate limit per IP is what stops someone making accounts to get more guesses.
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
    values (inv.household_id, auth.uid(), inv.name, inv.role, 0)
    on conflict (household_id, user_id) do nothing;
  update invites set status = 'accepted' where id = inv.id;
  return inv.household_id;
end $$;
