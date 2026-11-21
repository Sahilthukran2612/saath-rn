# Generated suggestion cards and the Saath helper

Two features use a language model (Grok, from xAI): five to seven generated **suggestion cards** on Today, and a
floating **helper** chat. Both are on by default and can be switched off in Me ("Smart cards and helper").
Both work without it: with no internet, no server or the switch off, Today shows the rule-based cards
(`src/suggestions.js`) and the helper button is hidden or says it needs internet.

## What is real

| Part | Status |
|---|---|
| Safety guard on every reply, emergency detection, anonymous summary, card handling, pad merge, chat window | Built, 30 tests (`__tests__/ai.test.js`), English and Hindi |
| Relay function (`docs/supabase/functions/ai/index.ts`) and cap (`docs/supabase/ai.sql`) | Written. **Not deployed, never run against xAI.** |
| Real replies from Grok, and how well the model follows the rules | **Not seen.** Needs the deploy below |

## How it is wired

```
phone  -- anonymous summary / chat turns -->  Supabase Edge Function "ai"  -->  api.x.ai (key lives here only)
phone  <-- cards / reply  --                  (limits per address and per day)
phone: checks every card and reply again (src/ai/guard.js) before showing it
```

The API key is never in the app. The phone sends only what `src/ai/context.js` builds: language, time of day, mode,
phase, yes/no flags, task counts, region and diet, and a few card ids the person tends to do or skip. **Never** a
name, phone number, medicine name or dose, sugar number, contact, location or sensor data. A test checks this.

## The rules it follows

- No doses, no amounts of medicine, no "skip or stop", no diagnosis, no meaning of a reading. Enforced twice: in the
  system prompt, and on the phone by `violates()`. A reply that breaks them is replaced by a fixed safe line.
- Anything the person types that sounds like an emergency (fall, chest pain, very low sugar, self-harm, in English or
  Hindi) is **not sent anywhere**. The phone answers locally and offers "Open Safety".
- In a hard phase or a hard week, generated cards are left out; only the calm rule-based ones show.
- Rule-based care reminders (medicine, refill, strips, visit) always come first. They never depend on a server.

## To switch it on (needs you)

1. Get an xAI API key. **This is paid, so it is outside Saath's free-only rule.** Set a spending limit in the xAI console.
2. Run `docs/supabase/ai.sql` in the Supabase SQL editor (or `npx supabase db query --remote --yes -f docs/supabase/ai.sql`).
3. `npx supabase secrets set XAI_API_KEY=...` (optionally `XAI_MODEL`, `AI_DAILY_CAP`, `AI_HOURLY_PER_IP`).
4. `npx supabase functions deploy ai --no-verify-jwt` (the app calls it with the project's public key, like the rest of the API).
5. Open the app, Today, and check the cards and the helper. Then have a clinician and a Hindi speaker read a few dozen
   generated cards and replies. Model output is not covered by `docs/REVIEW_SHEET.md`.

## Known limits

- The public key lets anyone call the function, so abuse is limited only by the per-address and daily caps. A leaked
  key cannot be spent; the caps bound what a flood can cost.
- A model can still write something unhelpful that passes the pattern checks. The checks are a safety net, not a proof.
- Hindi replies depend on the model's Hindi, and need a native-speaker review.
