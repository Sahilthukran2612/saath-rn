-- Daily cap for the AI relay (docs/supabase/functions/ai). One row per day, counted by the Edge Function with the
-- service role. Nobody else can read or write it: RLS is on and there are no policies.
create table if not exists public.ai_usage (
  day date primary key,
  n integer not null default 0
);
alter table public.ai_usage enable row level security;

-- Counts one call and says whether it is still under the cap.
create or replace function public.ai_bump(cap integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare used integer;
begin
  insert into public.ai_usage as u (day, n) values (current_date, 1)
  on conflict (day) do update set n = u.n + 1
  returning u.n into used;
  return used <= cap;
end;
$$;

revoke all on function public.ai_bump(integer) from public, anon, authenticated;
grant execute on function public.ai_bump(integer) to service_role;
