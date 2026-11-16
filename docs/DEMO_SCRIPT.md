# Saath: presentation script (what to tap, what to say)

About 12 minutes. Works in **Expo Go** (no build needed) or in the installed APK. Everything below is in the app. Where a feature needs hardware or a server we do not have on stage, the app has a **demo simulation** that goes through the same screens and the same logic, and says on screen that it is a demo.

## Before you start
1. On the PC: `npx expo start` in `Z:\Projects\saath-rn`, open the app in Expo Go (same Wi-Fi). Or install `dist\saath-debug.apk`.
2. **Me** tab: make sure **Demo mode** is on (it is by default). Scroll down and tap **Reset app data** for a clean start. Set **Who is this for** to **Elder**.
3. Turn on Do Not Disturb. Turn the volume up (the app speaks).
4. Optional, for the live sensor part: keep the phone in your hand.

## What to say about "real" and "simulated" (say this early)
"Saath's logic is real and tested: the fall detector, the privacy rules, the alert and escalation, the care rules. Three things need hardware or a server we do not have on this stage, so the app has a clearly labelled demo for each: a Bluetooth heart-rate band, a family member's phone, and sending the SMS. The screens and logic you will see are the real ones."

---

## 1. Today (1 min)
1. Show the big **I'm OK** seal with the dots around it.
2. Tap two tasks (for example **Lunch**). Watch the ring fill.
3. Tap **I'm OK**: "Your circle knows you are fine."
- Say: elders do not want a dashboard. One big button, plain words, spoken prompts.

## 2. Language and large text (45 s)
1. **Me** → **Large text** on, then off.
2. **Language** → **हिन्दी**. Visit **आज** (Today), then switch back to English.

## 3. The sensor: a real fall check (2 min)
1. **Safety** tab. Say: "The only sensor is the phone's accelerometer. It looks for a hard impact followed by stillness, and for long inactivity. The readings stay on the phone."
2. Show **How Saath learned from you** (the person's own thresholds).
3. **Live check (optional):** shake the phone hard once, then lay it flat and still. After a moment the alert opens ("impact then still"). Do not test falls with real older adults.
4. **Simulated:** tap **Simulate a fall**, or **Simulate long quiet** to fast-forward a long inactive period.

## 4. The alert and how it reaches people (3 min)
1. The full-screen **Are you OK?** opens, speaks, vibrates, and counts down 30 s. Point out the confidence and the reason.
2. Before the demo (once): **Me** → turn on **Send the alert SMS by itself**. In Expo Go this is a demo: it shows the message instead of sending it.
3. Let the countdown finish. Saath moves to the first contact (Asha). Show the three buttons: **Call**, **WhatsApp**, **SMS** (call and SMS work with mobile signal only, no internet; WhatsApp opens the chat with the message ready). Show the line **"Demo: would send to Asha: Saath: ... may have had a fall..."**: that is the automatic SMS, with no tap.
4. Wait for the next contact (15 s) to show it moves down the circle: family, neighbour, ASHA, clinician.
5. Tap **I'm OK** to stop. Run it again and tap **False alarm**; open **Safety** and show the app became a little less sensitive for this person.
- Say: no signal at all means nothing can leave the phone, so it also speaks and vibrates for people nearby.

## 5. A Bluetooth heart-rate band (1 min)
1. **Safety** → **Heart-rate band**. Say: "A real band connects over Bluetooth. For the stage there is a simulated band."
2. Tap **Try a simulated band**. Tap **Resting**: a steady rate.
3. Tap **High while resting**: a calm note appears at the top ("Your heart rate has stayed high while you were still") with the clinician's plan. Say: "It is a prompt, never a diagnosis, and it only speaks when the person has been still, because a fast heart while walking is normal."
4. Tap **Low while resting**, then **Resting** to clear it, then **Disconnect**.

## 6. Circle, privacy, and the other person's phone (3 min)
1. **Circle** tab. Move the **privacy dial** for one member (Safety only, Routine, Full). Say: "The person decides who sees what. Safety alerts always reach everyone; Time Off never mutes them."
2. Toggle **Time off**. Point at "Number hidden until they agree".
3. Invite form: enter `123` (error), then a 10-digit number.
4. Scroll to **People I look after**. In the yellow demo box tap **Demo: add a person I look after**. Say: "This stands in for another phone."
5. Tap **Demo: they may have fallen**. A red banner appears at the top of the screen on every tab: "Amma (demo) may have fallen. Please call them." Switch to another tab to show it stays.
6. Tap **Got it**. Open **Amma (demo)** to show the feed worded in plain language and "You see: Routine". Tap **Demo: they say they are OK**.
- Say: with the real server, the database itself enforces the dial (we tested 33 policy checks against it). The demo buttons only replace the second phone.

## 7. Care, diabetes layer (1 min)
1. **Care** → **Add sugar reading** `65`: the low-sugar steps appear ("follow your clinician's plan, or call family, a clinic or an ASHA").
2. Show **Medicine stock** (days left) and **Care budget** (add a cost).
- Say: insulin is logged as a time only. There is no dose field anywhere.

## 8. Plan (1 min)
1. **Plan** → open **Health passport** → **Show QR code**.
2. Open **Weekly check-in** and tap a face; open **Food guide**.
3. Mention the others: handover ladder, visit prep, body check with foot photo, school card.

## 9. Other roles and teen mode (1 min)
1. Role strip at the top: **Family** ("All is well"), **Neighbour** (safety only), **ASHA** or **Clinician** (households ranked by need), back to **Person**.
2. **Me** → **Who is this for** → **Teen**: the guardian-consent screen. Say it is marked "needs legal review". Fill a name and number, **My guardian agrees**, then set back to **Elder**.

## 10. Shared phone (30 s, optional)
**Me** → **Shared phone** on, choose a 4-digit PIN, **Lock now**. Say: several people can use one phone; a safety alert still shows over the lock screen.

## Close (30 s)
"No microphone, no location, no contacts. Free to run. Works offline. It never diagnoses and never gives a dose. What we did not do: tune the thresholds across many people, test with a clinician, or build push notifications; and the Bluetooth band, the SMS and the second phone were simulated for this demo."

---

## If something goes wrong
- **No sound:** the phone is on silent. The alert still shows and vibrates.
- **Expo Go cannot connect:** use `npx expo start --tunnel`, or `exp://<PC address>:8081`.
- **A demo button is missing:** **Me** → **Demo mode** must be on.
- **To restart the story:** **Me** → **Reset app data**.
