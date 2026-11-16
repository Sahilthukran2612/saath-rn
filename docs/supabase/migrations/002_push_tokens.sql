-- Push notifications: where to send an alert for each signed-in phone.
-- A phone registers its Firebase Cloud Messaging address here after sign-in. A server function (see
-- supabase/functions/push) reads these addresses, for the members who may see a safety event, and sends
-- the notification. Nothing here holds health data: only an address, a language and a date.

create table if not exists device_tokens (
  token text primary key check (char_length(token) <= 4096),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  lang text not null default 'en' check (lang in ('en', 'hi')),
  platform text not null default 'android' check (platform in ('android')),
  updated_at timestamptz not null default now()
);
create index if not exists device_tokens_user on device_tokens (user_id);

alter table device_tokens enable row level security;

-- A person manages only their own phones' addresses. The server function reads them as the service role.
drop policy if exists device_tokens_own on device_tokens;
create policy device_tokens_own on device_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Nobody can park thousands of addresses on one account.
create or replace function device_tokens_cap() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from device_tokens where user_id = new.user_id) >= 8 then
    raise exception 'too many devices on this account';
  end if;
  return new;
end $$;
drop trigger if exists device_tokens_cap on device_tokens;
create trigger device_tokens_cap before insert on device_tokens for each row execute function device_tokens_cap();

revoke all on device_tokens from anon;
revoke all on function device_tokens_cap() from public, anon;