# Connecting Saath to Supabase

Status (2026-11-13): `schema.sql` is applied to the project `saath-rn` and 24 policy checks pass against it (`policy_tests.sql`; run with `npx supabase db query --remote --yes -f docs/supabase/policy_tests.sql` and read the "RESULT:" error). `.env` on the developer's PC holds the project URL and anon key. **Phone sign-in is not switched on and no SMS provider is set**, so the app has not yet signed in to it; the app code is tested against a fake server only. Steps 3 and 4 below are what is left. Follow these steps, then check each one off in `docs/TEST_REPORT.md` only after you have actually seen it work.

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

## How a circle works end to end
1. The person signs in (Me tab). Their name (from the profile) is shared with their circle.
2. On Circle, they invite someone. The invite is kept on the phone and published to the server when online.
3. They share the code (WhatsApp, SMS). The invited person installs Saath, signs in with their own number, and enters the code under "Join someone's circle". The server function `accept_invite` adds them at **Safety only**; the person can raise their dial.
4. From then on the member's phone reads the person's events (checked by row-level security against the dial) every 30 seconds while the app is open, and the Circle tab lists them. A fall or long quiet shows a banner on every tab until the member taps "Got it". If the person answered "I'm OK" or "False alarm" afterwards, no banner appears.

## What syncs
- Sent by the person's phone, only when signed in: a fall or quiet alert (safety), answering it or marking it a false alarm (safety), "I'm OK" on Today (routine), a task finished (routine, with its title). Batches, retried, up to 200 waiting.
- Not synced: sugar readings, insulin times, meals, budget, check-ins, passport, photos. Raw sensor data never leaves the phone.

## What is still missing
- **Push notifications.** Nothing wakes a member's phone. They see an alert only while Saath is open (it polls every 30 seconds). For a safety app this is the biggest gap. It needs an FCM project and key and a server-side trigger on new safety events (a database webhook or edge function). Until then, the person's own phone still falls back to tap-to-call and SMS to the first contact, which does not need the server.
- **Phone numbers for calling.** The member banner says "please call them" but has no Call button, because numbers are only shown when their owner agreed (`members_public`) and the app does not fetch them yet.
- **Rate limit on invite codes** (6 characters). Add one before real use.
- **Per-member dial from the member's side.** The person sets each member's dial on their phone; that change is not yet written to the server, so every joined member stays at Safety only. Wiring `SET_DIAL`, Time Off and `share_contact` to the `members` table is the next job.
- Removing a member, leaving a circle, and the audit log on the server.
- Everything has only been run against a fake server (see `docs/TEST_REPORT.md`).