# How each person gets in: accounts, roles and the invite

Everyone has **their own account on their own phone**. An account is a phone number and a password (no text message,
so no cost). The account says *who* you are. Your **role** is not something you pick: the person you look after gives
it to you in an invite, and it applies to that person's circle only.

## The two kinds of phone

| | The person who needs care | Someone who looks after a person |
|---|---|---|
| Who | An elder, a teenager, an adult with diabetes | Family, a neighbour, an ASHA worker, a clinician |
| First screen | "How will you use Saath?" → **I need care** | "How will you use Saath?" → **I look after someone** |
| Setup | Name, the people to reach (real phone numbers), how alerts work | Name, **their own account**, the **invite code** |
| Tabs | Today, Circle, Safety, Care, Plan, Me | Today (their people), Circle (join, list), Me |
| Sensors and background watching | Yes (motion, optional heart-rate band) | **No**: nothing is watched on their phone |
| What they receive | Reminders, their own alerts | Alerts about the people they look after (a banner in the app, and a push notification) |

One person can be both: a daughter who also has diabetes uses **Me → How I use Saath → Both**.

## Getting a role, step by step

1. **The person** opens **Circle → Invite someone** and enters the helper's **name**, **phone number** and **role**
   (family, neighbour, ASHA, clinician). Saath makes a code and opens the phone's share sheet (WhatsApp or SMS).
2. **The helper** installs Saath and chooses **I look after someone**. They enter a name and **create their own account
   using the same phone number the person typed for them**.
3. The helper enters the **code**. If the number on their account matches the number in the invite, they join the
   person's circle **with the role the person chose** and start at **safety only**.
4. The person can raise what that helper sees (Circle → "Joined on their own phones": safety only, routine, full).
5. From then on the helper signs in with their own number and password on any phone, and sees the people they look
   after (Today and Circle), with a line such as "You are their neighbour."

**Why the number must match.** An invite is made for one phone number and only an account with that number can accept
it. A code that is forwarded, screenshotted or overheard is useless to anyone else, and an anonymous account (which has
no number) cannot accept it. (Verified on the live project; see `docs/TEST_REPORT.md`.) Ten wrong or mismatched tries in
15 minutes lock an account out for a while, and an invite expires after 14 days.

## What each role can do once joined

See `docs/RBAC.md` for the full table. In short: a helper **always** receives safety alerts about the person; routine
news and summaries only if the person raised their level; they can pause routine updates themselves (Time Off) but never
safety alerts; they can read nothing about anyone they have not been invited to.

## Limits, stated plainly

- **A helper needs a smartphone with Saath and their own phone number.** A relative with only a basic phone is still
  reached as an *emergency contact* (the person's phone calls or texts them), but cannot have an account.
- **Nobody checks that a "clinician" or "ASHA" really is one.** The role is whatever the person chose in the invite.
  Treat it as the person's choice, not as a verified professional identity.
- **A forgotten password cannot be reset** (there is no SMS or email to send a reset to). The person or helper would
  create a new account and be invited again.
- A circle holds at most 30 people. A person gets one household per account.