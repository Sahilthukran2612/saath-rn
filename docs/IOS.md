# Saath on iOS

Status: **configured, JavaScript bundle verified, never run on an iPhone.**

## What was checked
- `npx expo export --platform ios` builds the Hermes bundle with no errors (Windows, no Mac needed).
- `app.json` has an iOS bundle id (`com.anonymous.saathrn`), the Bluetooth, camera strings, and the encryption flag.
- `eas.json` has `preview`, `ios-simulator` and `production` profiles.

## What cannot be built from Windows
An iOS app can only be compiled with Xcode, so it needs a Mac or Expo's cloud build (EAS). Putting it on a real iPhone
needs an Apple Developer account (US$99 a year). There is no free route to an installed iPhone app. The free routes are:
1. **Expo Go** on an iPhone (App Store): scan the QR from `npx expo start`. Our own native pieces are not in Expo Go.
2. **A friend's Mac**: `npx expo run:ios` (free Apple ID, 7-day install).

## Android-only parts (guarded in code, they report "not available" on iOS)
Foreground service and lock-screen alert, automatic SMS, automatic calls, FCM push, Bluetooth heart band.
On iOS the app watches only while it is open. Alerts still escalate by tapping Call, WhatsApp or Message.
**Do not describe the iOS app as a background safety net.**

## Commands once an Apple account exists
```
npm i -g eas-cli
eas login
eas build -p ios --profile preview     # internal install on registered devices
```
