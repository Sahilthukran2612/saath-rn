# Who can do what: roles and access control

Saath has five roles. They are not a setting in the app: the database enforces them (row-level security), so a
modified app cannot read or write more than the rules below allow. This table is read from `docs/supabase/schema.sql`
and checked by `docs/supabase/policy_tests.sql` (40 checks, run against the live project).

**How roles are assigned.** The person (the account that owns a household) invites someone with a code and picks their
role: family, neighbour, ASHA or clinician. The invited person signs in on their own phone and joins with the code
(`accept_invite`). A joined member starts at **safety only** and the person raises it. Nobody can add themselves to a
circle, change their own role, or change their own dial.

| | Person | Family | Neighbour | ASHA | Clinician | Not in the circle |
|---|---|---|---|---|---|---|
| Sees the person's safety events (fall, quiet, answered, false alarm) | yes | **always** | **always** | **always** | **always** | no |
| Sees routine events (tasks done, "I'm OK" on Today) | yes | if dial is Routine or Full | same | same | same | no |
| Sees summaries | yes | if dial is Full | same | same | same | no |
| Time Off hides routine and summary events from that member | n/a | set by the member; safety is never hidden | same | same | same | n/a |
| Writes events | all kinds | safety events only | safety only | safety only | safety only | no |
| Sets a member's dial | yes (not below a guardian's minimum) | no | no | no | no | no |
| Reads other members' phone numbers | yes | only numbers their owner shared | same | same | same | no |
| Creates and sees invites | yes | no | no | no | no | no |
| Reads the audit log ("who viewed what") | yes | no | no | no | no | no |
| Sees which households they belong to | yes (own) | each circle they joined | same | same | same | no |
| Registers their own phone for push alerts | yes | yes | yes | yes | yes | yes (own phone only) |

**What the roles mean in practice.** An ASHA worker or a clinician can belong to many households (one invite per
household) and sees each according to the dial the person gave them. There is no single "see everyone" role: access
is always granted by the person, household by household.

**Limits that are enforced, not just displayed:** one household per account; a circle holds at most 30 people;
60 safety events and 300 other events an hour per household; ten wrong invite codes in fifteen minutes lock an account
out of guessing; text length limits; the signed-out role has no table or function access at all.

**What is not enforced by the server.** Whether a *real* clinician or ASHA is who they say they are: anyone the person
invites with the "clinician" role has that role. There is no verification of professional identity. Legal review is
needed before this is described as access for health professionals. Also, the audit log records views the app reports;
it is not a tamper-proof server log.

**Signing in.** An account is a phone number and a password. No text message is sent, so it costs nothing. The same
number and password work on a second phone. A forgotten password cannot be reset, because there is no SMS or email to
send a reset to. "Use without an account" makes an anonymous account that exists only on one phone.