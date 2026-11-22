-- Removes everything demo_patients.sql made: the four made-up accounts, and through them their households, the doctor's
-- membership in them, readings, events and care plans. Real accounts are never touched: only rows whose account is
-- marked raw_user_meta_data.demo = 'saath-presentation'.
delete from auth.users where raw_user_meta_data ->> 'demo' = 'saath-presentation';
