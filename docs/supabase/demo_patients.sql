-- PRESENTATION DATA. Made-up patients for one doctor account, so a doctor has patients to show in a demo.
-- Nothing here is real: the names, readings, tasks and care plans are invented. It writes to the LIVE database, so it is
-- opt-in, attached to one named doctor account only, and removable with demo_patients_cleanup.sql.
--
-- Before running: the doctor must already have signed up in the app as "I am a doctor" with the phone number below.
-- Replace the two placeholders (do not commit the real number):
--   __DOCTOR_PHONE10__   the doctor's 10-digit mobile number
--   __DOCTOR_NAME__      the name patients see for this doctor, for example Dr Rao
--
-- What it makes: four patients. Each is an account row that nobody can sign in to (no password, no phone, an .invalid
-- email), a household, the doctor as a clinician at Full access, 30 days of sugar readings (twice a day), 14 days of
-- routine "task done" events, and a published care plan. Only routine events are written, never safety events, and the
-- push trigger on events is switched off inside this transaction, so nobody's phone is notified.
-- Running it again first removes its own earlier data, so it can be repeated.

begin;

-- remove anything an earlier run made
delete from auth.users where raw_user_meta_data ->> 'demo' = 'saath-presentation';

alter table events disable trigger events_push;

do $$
declare
  doc uuid;
  doc_name text := '__DOCTOR_NAME__';
  p record;
  uid uuid;
  hid uuid;
  d int;
  slot int;
  v numeric;
  base numeric;
  swing numeric;
  drift numeric;
  n int := 0;
  today timestamptz := (date_trunc('day', now() at time zone 'Asia/Kolkata')) at time zone 'Asia/Kolkata'; -- midnight today in India
  ts timestamptz;
  patients jsonb := '[
    {"slug":"sunita","name":"Sunita Devi","base":128,"swing":22,"drift":0,"adherence":0.9,
     "plan":{"meds":[{"name":"Metformin","dose":"500 mg after food","when":"afterBreakfast"},{"name":"Metformin","dose":"500 mg after food","when":"afterDinner"}],"tasks":[{"title":"Evening walk","hour":18}],"testPerDay":2,"notes":"Steady. Keep the walk going. Review in six weeks."}},
    {"slug":"ramesh","name":"Ramesh Kumar","base":176,"swing":48,"drift":0,"adherence":0.55,
     "plan":{"meds":[{"name":"Metformin","dose":"1000 mg after food","when":"afterBreakfast"},{"name":"Glimepiride","dose":"1 mg before breakfast","when":"beforeBreakfast"}],"tasks":[{"title":"Sugar check","hour":20},{"title":"Short walk","hour":19}],"testPerDay":3,"notes":"Missing evening tablets. Please come to the clinic this month with your meter."}},
    {"slug":"meena","name":"Meena Bai","base":158,"swing":30,"drift":-1.1,"adherence":0.8,
     "plan":{"meds":[{"name":"Metformin","dose":"500 mg after food","when":"afterLunch"}],"tasks":[{"title":"Foot check","hour":21}],"testPerDay":2,"notes":"Readings are coming down since the change. Keep it up."}},
    {"slug":"aarav","name":"Aarav Singh","base":150,"swing":75,"drift":0,"adherence":0.75,
     "plan":{"meds":[],"tasks":[{"title":"Sugar check before school","hour":7},{"title":"Snack in bag","hour":8}],"testPerDay":4,"notes":"Carry a sweet for lows. Parents have the school card."}}
  ]'::jsonb;
begin
  select id into doc from auth.users
    where right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10) = '__DOCTOR_PHONE10__'
    order by created_at desc limit 1;
  if doc is null then
    raise exception 'No account has the number __DOCTOR_PHONE10__. Sign up in the app as "I am a doctor" with that number first.';
  end if;

  for p in select * from jsonb_to_recordset(patients)
    as x(slug text, name text, base numeric, swing numeric, drift numeric, adherence numeric, plan jsonb)
  loop
    n := n + 1;
    uid := gen_random_uuid();
    insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
      values (uid, 'authenticated', 'authenticated', 'demo-' || p.slug || '@demo.invalid',
              '{"demo":"saath-presentation"}'::jsonb, now(), now());

    insert into households (person_user_id, person_name) values (uid, p.name) returning id into hid;

    insert into members (household_id, user_id, name, role, dial)
      values (hid, doc, doc_name, 'clinician', 2);

    -- 30 days of readings, a morning one and an evening one, with a gentle wobble that is the same on every run
    for d in 0..29 loop
      for slot in 0..1 loop
        v := p.base
             + (p.drift * (29 - d))                                        -- a trend, if the patient has one (negative: coming down)
             + p.swing * sin((d * 2 + slot * 3 + n * 5) * 0.9)
             + (case when slot = 0 then -14 else 12 end);                    -- mornings lower, evenings higher
        ts := today - make_interval(days => d)
              + make_interval(hours => case when slot = 0 then 7 else 19 end, mins => 10 + ((d * 7 + n * 3) % 40));
        if ts <= now() then                                                  -- never a reading from later today
          insert into readings (household_id, client_id, mgdl, at)
            values (hid, 'demo-' || p.slug || '-' || d || '-' || slot, greatest(62, least(330, round(v)))::int, ts);
        end if;
      end loop;
    end loop;

    -- 14 days of routine events: the day's tasks, some days missed according to how well the patient keeps to them
    for d in 0..13 loop
      for slot in 0..3 loop
        ts := today - make_interval(days => d)
              + make_interval(hours => (array[8, 13, 18, 20])[slot + 1], mins => (d * 11 + slot * 17 + n) % 50);
        if ts <= now() and ((sin((d * 3 + slot * 5 + n * 7) * 1.3) + 1) / 2) <= p.adherence then
          insert into events (household_id, event_type, kind, detail, created_at)
            values (hid, 1, 'task_done', (array['Morning medicine', 'Lunch', 'Evening walk', 'Sugar check'])[slot + 1], ts);
        end if;
      end loop;
    end loop;

    -- the doctor's published care plan (what Edit care plan opens), from ten days ago
    insert into care_plans (household_id, author_user, author_name, plan, created_at)
      values (hid, doc, doc_name, jsonb_build_object('v', 1) || p.plan, now() - interval '10 days');
  end loop;

  raise notice 'Made % demo patients for the doctor account ending %.', n, '__DOCTOR_PHONE10__';
end $$;

alter table events enable trigger events_push;

commit;
