# Connecting Saath to Supabase

Status: the app code (`src/services/cloud.js`, the sign-in card on Me, the outbox) is written and tested against a fake server. **It has not been run against a real Supabase project**, and `schema.sql` has not been applied. Follow these steps, then check each one off in `docs/TEST_REPORT.md` only after you have actually seen it work.

## 1. Create the project
- Create a Supabase project. Pick the region closest to your users (an Indian region if offered). Note that health-related data of Indian residents may raise data-location and DPDP Act questions: **needs legal review**.
- Keep the database password and the `service_role` key out of the app and out of git. The app only needs the project URL and the public `anon` key.

## 2. Apply the schema
- Run `docs/supabase/schema.sql` in the SQL editor.
- Write policy tests before trusting it. At minimum: a Family member at dial 0 sees a safety event and no routine event; at dial 1 sees routine; on Time Off sees safety only; a stranger sees nothing; a member cannot change their own dial; `members_public` hides a number unless `share_contact` is true. Repeat the cases in `__tests__/logic.test.js`.

## 3. Phone sign-in
- Turn on the Phone provider in Authentication and connect an SMS provider that sends to Indian numbers. Indian SMS rules (sender and template registration) may apply: check with the provider.
- The app asks for a 10-digit number, adds `+91`, and sends a one-time code.

## 4. Point the app at it
- Copy `.env.example` to `.env` and fill in the two values, then restart with `npx expo start --clear`. Variables starting with `EXPO_PUBLIC_` are baked into the app bundle, so they are visible to anyone with the app: only the anon key belongs there.

## 5. If supabase.co is blocked
Access to `*.supabase.co` was blocked by Indian ISPs from February 2026 and was reported restored in October 2026. If it happens again, the app keeps working offline and queues events. To reach the server anyway, put a custom domain or a small proxy (for example a Cloudflare Worker) in front of the project and set `EXPO_PUBLIC_SAATH_API_URL` to it. No code change is needed.

## What syncs today, and what does not
- Syncs (only when signed in): a fall or quiet alert (safety), "I'm OK" answered on an alert (safety), "I'm OK" tapped on Today (routine), a task finished (routine, with its title), a false alarm (safety). Sent in batches, retried every minute, up to 200 waiting.
- Does not sync: sugar readings, insulin times, meals, budget, check-ins, passport, photos. Raw sensor data never leaves the phone.
- Not built: the circle's phones reading events (they would need to sign in, be members, and have a receiving screen), push notifications (FCM), accepting an invite from another phone, per-member views. Only the person's phone writes. Until those exist, sync stores the person's events; other phones do not yet show them.
- Tokens are kept in AsyncStorage, which is not encrypted. Moving them to secure storage is a later task.
