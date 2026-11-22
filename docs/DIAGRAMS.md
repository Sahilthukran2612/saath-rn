# Saath: processes, user flows and backend data

Every diagram below is Mermaid. They render on GitHub and in VS Code (with a Mermaid preview). Each one is also saved on its own in `docs/diagrams/` as a `.mmd` file, for mermaid.live or a Figma plugin.

Contents

1. System overview
2. First launch and sign-up (all three doors)
3. Account sign-in
4. Patient: a day on the Today screen
5. The safety alert process
6. Adding someone to the circle (invite)
7. A doctor adds a patient with a card
8. Who sees an event: the privacy dial
9. Push notification to the circle
10. Doctor publishes a care plan
11. Sugar readings shared with a doctor
12. AI suggestion cards
13. AI helper chat
14. ASHA household visit
15. Backend data: tables and links
16. Who can read and write each table

Status, stated plainly: the rules, the alert logic and the screens are tested; the invite, doctor, readings and push flows (6, 7, 9, 10, 11) are built and tested against a fake server but have not been run with two real phones. See `docs/USER_MANUAL.md` and the README table.

---

## 1. System overview

```mermaid
flowchart LR
  subgraph Phone["Phone app (Expo SDK 58, React Native 0.88)"]
    UI["Screens: Today, Circle, Safety, Care, Plan, Me"]
    STATE["Saved on the phone: works with no signal"]
    RULES["Plain rules: privacy dial, alert logic, care rules, AI guard"]
    NATIVE["Kotlin modules: fall sensing, calls, SMS, siren, Bluetooth band"]
    UI --> STATE
    UI --> RULES
    UI --> NATIVE
  end
  subgraph Supabase["Supabase (free tier)"]
    AUTH["Auth: phone number and password"]
    DB[("Postgres with row-level security")]
    PUSHFN["Edge Function: push"]
    AIFN["Edge Function: ai"]
  end
  FCM["Firebase Cloud Messaging"]
  GROQ["Groq models"]
  Phone <-->|"only what the privacy dial allows"| AUTH
  Phone <--> DB
  Phone -->|"anonymous summary, chat turns"| AIFN
  DB -->|"new safety event"| PUSHFN
  PUSHFN --> FCM
  FCM -->|"alert notification"| Phone
  AIFN -->|"key stays on the server"| GROQ
```

---

## 2. First launch and sign-up (all three doors)

```mermaid
flowchart TD
  A["Install and open Saath"] --> B["How will you use Saath? Choose a language"]
  B --> C1["I need care"]
  B --> C2["I look after someone"]
  B --> C3["I am a doctor"]

  C1 --> P1["Step 1: language, and who uses the phone: Teen, Elder or Adult"]
  P1 --> P2["Step 2: name, and condition if they wish"]
  P2 --> P3["Step 3: who should we reach? Name, phone number and role for each person. The patient picks the role"]
  P3 --> P4["Step 4: alert choices, all off at first: auto call, auto SMS, loud alarm, reminders, background watching"]
  P4 --> PT["Today screen"]

  C2 --> M1["About you: name only. No role to choose"]
  M1 --> M2["Create an account with the number the patient gave"]
  M2 --> M3["Join: enter the code or scan the QR. Can be skipped"]
  M3 --> MT["People I look after"]

  C3 --> D1["About you, doctor: name as patients see it"]
  D1 --> D2["Create an account with your phone number"]
  D2 --> D3["Join with a patient code or QR, or show your own card"]
  D3 --> DT["My patients"]
```

---

## 3. Account sign-in

```mermaid
flowchart TD
  A["Me: Sign in or create account"] --> B["Drawer: phone number and password, then Continue"]
  B --> C{"Number and password valid? Password long enough?"}
  C -->|"No"| X1["Say what is wrong. Nothing is created"]
  C -->|"Yes"| D{"Does an account with this number exist?"}
  D -->|"Yes"| E["Sign in"]
  D -->|"No"| F["Create the account, then sign in"]
  E --> G["Household found or made. Sync turns on"]
  F --> G
  A --> H["Skip for now: everything stays on this phone, lost if data is cleared"]
  G --> I["No password reset. A forgotten password cannot be recovered"]
```

---

## 4. Patient: a day on the Today screen

```mermaid
flowchart TD
  T["Today screen, patient only"] --> OK["I'm OK card: one button inside one progress ring"]
  T --> TK["Today's tasks"]
  T --> SP["Today's slips: suggestion cards"]
  T --> MN["Medicines now and care plan notice"]
  T --> HL["Floating helper button"]
  T --> NAV["Floating bar: Circle, Safety, Care, Plan. Me behind the avatar"]

  OK --> OK1["Tap: last confirmed time saved, the circle is told, spoken aloud"]
  TK --> TK1["Tick a task: the ring fills by tasks done today"]
  SP --> SP1["Care cards from rules first, then up to seven AI ideas"]
  SP1 --> SP2{"Choose"}
  SP2 -->|"Stamp it"| SP3["Counts as done, learns what you do"]
  SP2 -->|"Open"| SP4["Jumps to the screen it is about"]
  SP2 -->|"Not today"| SP5["Put aside, shown less often"]
  HL --> H1["Chat about health, food, routine or the app (see diagram 13)"]
  NAV --> N1["Circle: privacy dial and invites (6)"]
  NAV --> N2["Safety: watching and alerts (5)"]
  NAV --> N3["Care: medicines, sugar log, charts, stock"]
  NAV --> N4["Plan: handover, visit prep, passport, check-in, food, body, school"]
```

---

## 5. The safety alert process

```mermaid
flowchart TD
  S["Phone sensors watching: foreground service when switched on"] --> D1{"Hard impact then stillness?"}
  S --> D2{"No movement for hours? Default 6 h, outside 10 pm to 7 am"}
  D1 -->|"Yes"| A["Alert opens: Are you OK? 30 second countdown and a loud tone"]
  D2 -->|"Yes"| A
  A --> Q{"Answered?"}
  Q -->|"I'm OK"| OK["Closed. Counted as answered. Circle told the person is fine"]
  Q -->|"False alarm"| FA["Closed. Thresholds are adjusted so it learns"]
  Q -->|"No answer in 30 s"| E["Escalate: contacts one by one, about 20 seconds each"]
  E --> E1["Each step offers Call, SMS and WhatsApp buttons"]
  E --> E2{"Auto call or auto SMS switched on?"}
  E2 -->|"Yes"| E3["Call or text by itself, only to numbers the person typed"]
  E3 --> E4{"Call lasted about 50 seconds?"}
  E4 -->|"Yes"| DONE["Taken as someone answered. Chain stops"]
  E4 -->|"No"| NEXT["Next contact"]
  E1 --> NEXT
  NEXT --> L{"More contacts?"}
  L -->|"Yes"| E
  L -->|"No"| NR["Nobody reached. Loud siren here if switched on"]
  A --> EV["Safety event sent to the circle (see diagram 9)"]
```

---

## 6. Adding someone to the circle (invite)

```mermaid
sequenceDiagram
  autonumber
  actor Pat as Patient
  participant App as Patient app
  participant SB as Supabase
  participant Inv as Invited phone
  actor Per as Invited person

  Pat->>App: Circle, Add a person: name, phone number, role
  App->>App: Add as emergency contact and make an invite code, together
  App-->>Pat: Share sheet and a QR with the code
  App->>SB: Upload the invite when signed in and online
  Pat-->>Per: Sends the code or lets them scan the QR
  Per->>Inv: Install, choose I look after someone or I am a doctor
  Inv->>SB: Sign up with the same phone number
  Per->>Inv: Enter the code or scan the QR
  Inv->>SB: accept_invite(code)
  SB->>SB: Checks: code pending, under 14 days, number matches, under 10 wrong tries
  alt Checks pass
    SB->>SB: Add member with the role the patient chose. Dial 0, or 2 for a doctor
    SB-->>Inv: Joined. The patient appears in People I look after
    SB-->>App: Member shows in Circle, one row, one privacy switch
  else A check fails
    SB->>SB: Count a wrong try
    SB-->>Inv: Code not accepted
  end
```

---

## 7. A doctor adds a patient with a card

```mermaid
sequenceDiagram
  autonumber
  actor Doc as Doctor
  participant DA as Doctor app
  actor Pat as Patient
  participant PA as Patient app
  participant SB as Supabase

  Doc->>DA: My patients, Add a patient
  DA-->>Doc: QR card with name and number (needs sign-in first)
  Doc-->>Pat: Shows the card on the screen
  Pat->>PA: Scans with the phone camera
  PA->>PA: Opens Add a person, already filled in as Doctor
  Pat->>PA: Confirms once
  PA->>SB: Upload the invite
  PA-->>Pat: Shows a code and QR
  Pat-->>Doc: Shows the code back
  Doc->>DA: Scans or types the code
  DA->>SB: accept_invite(code)
  SB-->>DA: Joined as a doctor at Full access
  DA-->>Doc: The patient appears in My patients
```

---

## 8. Who sees an event: the privacy dial

```mermaid
flowchart TD
  EV["New event in a household"] --> T{"Event type"}
  T -->|"0 Safety: fall, quiet, I'm OK"| ALL["Every member receives it. Cannot be switched off"]
  T -->|"1 Routine: task done"| R{"Member dial 1 or higher, and not on Time off?"}
  T -->|"2 Summary"| S{"Member dial 2, and not on Time off?"}
  R -->|"Yes"| SEE["Member sees it"]
  R -->|"No"| HID["Hidden from that member"]
  S -->|"Yes"| SEE
  S -->|"No"| HID

  RD["Sugar readings"] --> RC{"Reader is the patient, or a doctor at dial 2?"}
  RC -->|"Yes"| RSEE["Readable"]
  RC -->|"No"| RHID["Not readable, enforced by the database"]
```

---

## 9. Push notification to the circle

```mermaid
sequenceDiagram
  autonumber
  participant P as Patient phone
  participant DB as Postgres
  participant PF as Edge Function push
  participant F as Firebase Cloud Messaging
  participant M as Member phones

  P->>DB: Insert a safety event (fall or quiet)
  DB->>DB: Row-level security allows the person or a member
  DB->>PF: Trigger events_push calls the function
  PF->>PF: Only safety events (type 0) are pushed
  PF->>DB: Read members who may see it, then their device tokens
  PF->>F: Send the message in each phone's language
  F-->>M: Notification arrives, even with Saath closed
  M->>M: Banner on any tab until the member says they saw it
```

---

## 10. Doctor publishes a care plan

```mermaid
sequenceDiagram
  autonumber
  actor Doc as Doctor
  participant DA as Doctor app
  participant SB as Supabase
  participant PA as Patient app
  actor Pat as Patient

  Doc->>DA: Patient panel, Edit care plan
  DA->>SB: Load the latest plan to edit
  Doc->>DA: Medicines as written, tasks, tests per day, a note
  Doc->>DA: Publish plan
  DA->>SB: Insert into care_plans, only allowed for a clinician member
  PA->>SB: Next sync: fetch the latest plan
  PA->>PA: Clean the plan, drop anything unsafe or oversized
  PA->>PA: Apply: medicines, tasks, tests per day
  PA-->>Pat: Notice: the doctor updated your plan. Got it
```

---

## 11. Sugar readings shared with a doctor

```mermaid
sequenceDiagram
  autonumber
  actor Pat as Patient
  participant PA as Patient app
  participant SB as Supabase
  participant DA as Doctor app
  actor Doc as Doctor

  Pat->>PA: Add sugar reading, saved on the phone
  PA->>PA: Sync pass: is a joined doctor at Full?
  alt A doctor is at Full
    PA->>SB: Upsert readings not yet sent, only the person may insert
    SB-->>PA: Stored, keyed by household and reading
  else No doctor at Full
    PA->>PA: Nothing leaves the phone
  end
  Doc->>DA: Open the patient
  DA->>SB: Fetch readings
  SB->>SB: Allow only the patient, or a doctor at dial 2
  SB-->>DA: Readings, newest first
  DA-->>Doc: Average, lowest, highest, line and daily charts. Read-only, no meaning given
```

---

## 12. AI suggestion cards

```mermaid
sequenceDiagram
  autonumber
  participant Pad as Today pad (patient phone)
  participant G as Phone guard
  participant FN as Edge Function ai
  participant LLM as Groq model

  Pad->>Pad: Cards missing or stale (new day, language, or 3 hours)?
  Pad->>Pad: Build an anonymous summary: language, time of day, task counts, flags
  Pad->>FN: POST kind cards with the summary
  FN->>FN: Keep only allowed fields, per-address and daily limits
  FN->>LLM: Write 5 to 7 ideas as JSON
  LLM-->>FN: Cards
  FN-->>Pad: Cards
  Pad->>G: Check every card: no doses, no diagnosis, no meaning of a reading
  G-->>Pad: Safe cards only, duplicates of rule cards dropped
  Pad->>Pad: Care cards from rules first, then up to seven AI ideas
  Note over Pad,FN: Offline, failed, or a hard week: the rule-based cards are shown instead
```

---

## 13. AI helper chat

```mermaid
flowchart TD
  U["Patient types a message in the helper window"] --> E{"Sounds like an emergency? Fall, chest pain, very low sugar, self-harm"}
  E -->|"Yes"| L["Answered on the phone only. Nothing is sent anywhere. Open Safety button, call 112"]
  E -->|"No"| N{"Online?"}
  N -->|"No"| O["Says the helper needs internet"]
  N -->|"Yes"| S["Send the recent turns and the anonymous summary to the ai function"]
  S --> C{"Topic filter: health, food, routine or using Saath?"}
  C -->|"No, or unsure"| R["One fixed refusal. No answer is written"]
  C -->|"Yes"| A["Groq writes a short reply"]
  A --> G{"Phone guard: any dose, diagnosis or reading meaning?"}
  G -->|"Yes"| F["Replaced by a fixed safe line"]
  G -->|"No"| SH["Reply shown. Chat kept on the phone only"]
```

---

## 14. ASHA household visit

```mermaid
flowchart TD
  H["People I look after, ASHA worker"] --> B{"14 days since the last visit, or never visited?"}
  B -->|"Yes"| V["Visit due badge on that household"]
  B -->|"No"| OKB["No reminder"]
  V --> O["Open the household panel"]
  OKB --> O
  O --> S["Safety alerts and whatever the dial allows"]
  O --> VC["Household visit card: how long ago the last visit was"]
  VC --> M["Tap: I visited today"]
  M --> R["Saved on the ASHA's own phone, never sent. Reminder resets for 14 days"]
```

---

## 15. Backend data: tables and links

```mermaid
erDiagram
  AUTH_USERS ||--o| HOUSEHOLDS : "one household per patient account"
  AUTH_USERS |o--o{ MEMBERS : "joins as a member"
  AUTH_USERS ||--o{ DEVICE_TOKENS : "phones"
  AUTH_USERS ||--o{ INVITE_ATTEMPTS : "wrong code tries"
  HOUSEHOLDS ||--o{ MEMBERS : "the circle"
  HOUSEHOLDS ||--o{ EVENTS : "feed"
  HOUSEHOLDS ||--o{ INVITES : "codes"
  HOUSEHOLDS ||--o{ CONSENTS : "guardian step"
  HOUSEHOLDS ||--o{ AUDIT : "who viewed"
  HOUSEHOLDS ||--o{ CARE_PLANS : "doctor plans"
  HOUSEHOLDS ||--o{ READINGS : "shared sugar readings"
  MEMBERS ||--o{ AUDIT : "viewer"

  AUTH_USERS {
    uuid id PK
  }
  HOUSEHOLDS {
    uuid id PK
    uuid person_user_id FK "unique"
    text person_name "what the circle sees"
    timestamptz created_at
  }
  MEMBERS {
    uuid id PK
    uuid household_id FK
    uuid user_id FK "null until the invite is accepted"
    text name
    text role "person family neighbour asha clinician"
    smallint dial "0 safety, 1 routine, 2 full"
    boolean time_off
    boolean share_contact
    text phone "shown only if share_contact"
    boolean guardian
    smallint min_dial
    timestamptz created_at
  }
  EVENTS {
    uuid id PK
    uuid household_id FK
    smallint event_type "0 safety, 1 routine, 2 summary"
    text kind "fall quiet im_ok task_done weekly_summary"
    text detail "short, no doses"
    timestamptz created_at
  }
  INVITES {
    uuid id PK
    uuid household_id FK
    text name
    text role "family neighbour asha clinician"
    text code "unique, 6 to 12 characters"
    text phone "10 digits, the number it is for"
    text status "pending or accepted"
    timestamptz created_at
  }
  INVITE_ATTEMPTS {
    uuid user_id
    timestamptz at
  }
  CONSENTS {
    uuid id PK
    uuid household_id FK
    text guardian_name
    text guardian_phone
    timestamptz agreed_at
  }
  AUDIT {
    uuid id PK
    uuid household_id FK
    uuid viewer_member_id FK
    text what
    timestamptz viewed_at
  }
  DEVICE_TOKENS {
    text token PK
    uuid user_id FK
    text lang "en or hi"
    text platform "android"
    timestamptz updated_at
  }
  CARE_PLANS {
    uuid id PK
    uuid household_id FK
    uuid author_user
    text author_name
    jsonb plan "medicines, tasks, tests per day, note"
    timestamptz created_at
  }
  READINGS {
    uuid household_id PK
    text client_id PK
    smallint mgdl "20 to 600"
    timestamptz at
    timestamptz created_at
  }
  AI_USAGE {
    date day PK
    integer n "calls today"
  }
```

Views the app reads: `my_circles` (the circles a person belongs to, with their role and dial) and `members_public` (the circle, with a phone number only where its owner chose to share it). Functions: `accept_invite(code)` joins a circle, `can_see_event(household, type)` is the single place the privacy dial is decided, `ai_bump(cap)` counts a day's AI calls and says whether the cap is still open.

---

## 16. Who can read and write each table

| Table | Who reads | Who writes |
|---|---|---|
| households | the patient, and any member of it | the patient |
| members | the patient and any member | the patient; each member can change only their own Time off; a new member only through `accept_invite` |
| events | by the privacy dial (`can_see_event`): safety to everyone, routine and summary by dial | the patient writes any type; any member may write a safety event |
| invites | the patient | the patient |
| consents | the patient | the patient |
| audit | the patient | whoever viewed, as themselves |
| device_tokens | the owner of the phone (the push function reads them as the service role) | the owner of the phone, at most 8 phones |
| care_plans | the patient, any clinician member, any member at dial 2 | a clinician member of that household; newest 40 kept |
| readings | the patient, and a clinician member at dial 2 | the patient; newest 2000 kept |
| ai_usage | nobody except the service role | the AI function, through `ai_bump` |
| invite_attempts | nobody (no policy) | `accept_invite` only |

The same privacy dial is also enforced on the phone (`src/logic.js`, `canReceive`), and the two are kept identical on purpose.
