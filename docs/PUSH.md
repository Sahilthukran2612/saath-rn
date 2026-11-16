# Push notifications (Firebase): setup

Push is what makes an alert reach a circle member's phone when Saath is closed. Status: the app code, the database
table, the trigger and the server function are written and tested without Firebase (21 tests; 40 live policy checks).
**Nothing has been sent through Firebase yet**: it needs the steps below. Firebase's Cloud Messaging is free.

## 1. Create the Firebase project (about five minutes)
1. Go to https://console.firebase.google.com and click **Add project**. Name it `saath`. Turn Google Analytics off.
   The free Spark plan needs no card.
2. In the project, click the Android icon (**Add app**). The Android package name must be exactly
   `com.anonymous.saathrn`. Skip the other steps.
3. Download **google-services.json** and put it in `Z:\Projects\saath-rn\` (next to `package.json`).
   It is in `.gitignore`. The next build picks it up automatically (`app.config.js`).
4. Project settings (gear icon) → **Service accounts** → **Generate new private key**. A JSON file downloads.
   **This file is a secret: anyone with it can send notifications as your project.** Do not paste it into a chat or
   commit it. Save it somewhere private, for example `Z:\secrets\fcm-service-account.json`.

## 2. Put the secrets on the server (the file's contents never go through a chat)
Run these in the project folder (in Claude Code, with the `!` prefix). Choose any long random string for the secret.
```
npx supabase secrets set PUSH_SECRET=<a long random string> --project-ref hothcnoyrfelsagiagwi
npx supabase secrets set FCM_SERVICE_ACCOUNT="$(Get-Content Z:\secrets\fcm-service-account.json -Raw)" --project-ref hothcnoyrfelsagiagwi
npx supabase functions deploy push --no-verify-jwt --project-ref hothcnoyrfelsagiagwi
```

## 3. Switch on the trigger
Copy `docs/supabase/migrations/003_push_trigger.sql.template` to `003_push_trigger.sql` (that name is git-ignored),
replace `<PROJECT_REF>` and `<PUSH_SECRET>` (the same string as above), then:
```
npx supabase db query --remote --yes -f docs/supabase/migrations/003_push_trigger.sql
```

## 4. Rebuild the app
`.\scripts\build-apk.ps1 -Prebuild -Release`, install it on two phones, sign in on both (the person on one, a member
who joined with an invite code on the other), allow notifications, then trigger a fall alert on the person's phone and
let it run to the end. The member's phone should show "Amma may have fallen. Please call them." even with Saath closed.

## What push does and does not do
- Only **safety** events are pushed (fall, quiet, answered, false alarm), never routine ones.
- A safety event reaches every joined member's registered phones, whatever their dial or Time Off (the same rule as the
  database). The wording is English or Hindi, per phone.
- Phones that Google reports as gone are removed from the list automatically.
- **Not tested end to end** until the steps above are done on real phones. Battery-saver modes on some phone brands
  delay or drop notifications for closed apps; that varies by brand and has not been measured.
- If the server is paused (free-plan inactivity) or has no internet, no push is sent; the person's own phone still
  runs the countdown, the calls, the SMS and the siren by itself.