-- PRESENTATION DATA for two named accounts: a patient and his doctor. The readings, routine and care plan are
-- invented for a demo; nothing here is medical advice, and the medicines in the plan are sample text for the doctor to
-- edit. Both accounts must already exist (made in the app, or by phone + password sign-up). Phone numbers are passed in
-- as placeholders so they are not committed:
--   __PATIENT_PHONE10__  the patient's 10-digit number      __PATIENT_NAME__  the name the circle sees
--   __DOCTOR_PHONE10__   the doctor's 10-digit number       __DOCTOR_NAME__   the name the patient sees
--
-- What it writes: the doctor as a clinician at Full in the patient's circle (so he sees readings and can publish the
-- care plan), 14 days of sugar readings (fasting, after lunch, after dinner), 14 days of routine "task done" and
-- "I'm OK" events, and one published care plan from the doctor. Only routine events, never safety ones, and the push
-- trigger is switched off for the transaction, so no phone is notified. Running it again replaces its own rows.

begin;
alter table events disable trigger events_push;

do $$
declare
  pat uuid;
  doc uuid;
  hid uuid;
  d int;
  slot int;
  v numeric;
  ts timestamptz;
  today timestamptz := (date_trunc('day', now() at time zone 'Asia/Kolkata')) at time zone 'Asia/Kolkata';
begin
  select id into pat from auth.users where right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10) = '__PATIENT_PHONE10__';
  select id into doc from auth.users where right(regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g'), 10) = '__DOCTOR_PHONE10__';
  if pat is null or doc is null then
    raise exception 'Both accounts must exist first (patient %, doctor %).', pat, doc;
  end if;

  insert into households (person_user_id, person_name) values (pat, '__PATIENT_NAME__')
    on conflict (person_user_id) do update set person_name = excluded.person_name
    returning id into hid;

  -- start clean for this household, so a re-run does not double anything
  delete from readings where household_id = hid and client_id like 'seed-%';
  delete from events where household_id = hid;
  delete from care_plans where household_id = hid;
  delete from members where household_id = hid and user_id = doc;

  insert into members (household_id, user_id, name, role, dial, share_contact, phone)
    values (hid, doc, '__DOCTOR_NAME__', 'clinician', 2, true, '__DOCTOR_PHONE10__');

  -- 14 full days of readings (plus any slot already past today): fasting near 7:30, after lunch near 14:30, after dinner near 21:30. A slow improvement
  -- over the fortnight, a daily wobble that is the same on every run, one low morning and two high evenings.
  for d in 0..14 loop
    for slot in 0..2 loop
      v := (array[132, 168, 156])[slot + 1]
           + d * (array[1.1, 1.3, 1.0])[slot + 1]   -- older days a little higher
           + 12 * sin((d * 3 + slot * 5) * 0.8);
      if d = 9 and slot = 0 then v := 71; end if;
      if (d = 4 or d = 11) and slot = 2 then v := 212 + d; end if;
      ts := today - make_interval(days => d)
            + make_interval(hours => (array[7, 14, 21])[slot + 1], mins => 20 + ((d * 7 + slot * 11) % 25));
      if ts <= now() then
        insert into readings (household_id, client_id, mgdl, at)
          values (hid, 'seed-' || d || '-' || slot, greatest(60, least(320, round(v)))::int, ts);
      end if;
    end loop;
  end loop;

  -- 14 days of routine: an "I'm OK" each morning and the day's tasks, a few missed
  for d in 0..14 loop
    ts := today - make_interval(days => d) + make_interval(hours => 8, mins => (d * 13) % 40);
    if ts <= now() and d <> 6 then
      insert into events (household_id, event_type, kind, detail, created_at) values (hid, 1, 'im_ok', null, ts);
    end if;
    for slot in 0..3 loop
      ts := today - make_interval(days => d)
            + make_interval(hours => (array[7, 9, 18, 21])[slot + 1], mins => (d * 11 + slot * 17) % 45);
      if ts <= now() and not (slot = 2 and d in (3, 8, 12)) and not (slot = 3 and d = 6) then
        insert into events (household_id, event_type, kind, detail, created_at)
          values (hid, 1, 'task_done', (array['Fasting sugar check', 'Morning medicine', 'Evening walk', 'Night medicine'])[slot + 1], ts);
      end if;
    end loop;
  end loop;

  -- the doctor's care plan, published five days ago: what the patient's phone applies on sign-in
  insert into care_plans (household_id, author_user, author_name, plan, created_at)
    values (hid, doc, '__DOCTOR_NAME__', jsonb_build_object(
      'v', 1,
      'meds', jsonb_build_array(
        jsonb_build_object('name', 'Glimepiride', 'dose', '1 mg tablet', 'when', 'beforeBreakfast'),
        jsonb_build_object('name', 'Metformin', 'dose', '500 mg tablet', 'when', 'afterBreakfast'),
        jsonb_build_object('name', 'Metformin', 'dose', '500 mg tablet', 'when', 'afterDinner')
      ),
      'tasks', jsonb_build_array(
        jsonb_build_object('title', 'Fasting sugar check', 'hour', 7),
        jsonb_build_object('title', '30 minute walk', 'hour', 18),
        jsonb_build_object('title', 'Sugar check after dinner', 'hour', 21),
        jsonb_build_object('title', 'Foot check', 'hour', 21)
      ),
      'testPerDay', 2,
      'notes', 'Fasting readings are coming down. Keep the evening walk. Bring your meter to the clinic in four weeks.'
    ), now() - interval '5 days');

  raise notice 'Seeded household % for the patient, with the doctor at Full.', hid;
end $$;

alter table events enable trigger events_push;
commit;

select
  (select count(*) from readings r join households h on h.id = r.household_id
     where right(regexp_replace(coalesce((select phone from auth.users u where u.id = h.person_user_id), ''), '[^0-9]', '', 'g'), 10) = '__PATIENT_PHONE10__')::int as readings,
  (select count(*) from events)::int as events,
  (select count(*) from care_plans)::int as care_plans,
  (select count(*) from members where role = 'clinician' and dial = 2)::int as doctors_at_full;
