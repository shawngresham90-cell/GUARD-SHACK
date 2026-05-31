# Chair Cash — Automatic Reminders Backend PRD

## Goals and Background Context

### Goals
- Send appointment reminders **automatically**, with no tap required, even when
  the phone is locked and the app is closed.
- Cover two reminder types: **day-before** and **running-late**.
- **Never double-text** a customer for the same reminder.
- Stay **legally compliant** (A2P 10DLC, opt-out, consent, quiet hours).
- Keep the existing single-file offline app working as a **fallback**.
- Keep running cost low (target **$5–$15/month** for a single chair).

### Background Context
Chair Cash is today a single offline HTML app that can only do *one-tap*
reminders — the barber taps and her Messages app opens pre-filled. Hands-off
sending is impossible from a static web page because it can't run on a schedule
while closed, and can't send SMS to arbitrary numbers. This PRD covers the
minimal backend (cloud DB + scheduler + SMS provider) that adds true automatic
sending while preserving the current app. Source analysis lives in
`../barbershop-auto-reminders-spec.md`.

## Requirements

### Functional
- **FR1:** The app syncs customers and appointments to a cloud database.
- **FR2:** A scheduler runs on a recurring timer (every ~15 min) independent of
  the app being open.
- **FR3:** For each appointment booked for *tomorrow*, the system sends one
  day-before reminder in the early evening (default 6 PM local).
- **FR4:** For each appointment still `booked` whose time passed by more than X
  minutes (default 10), the system sends one running-late reminder.
- **FR5:** Each appointment is texted **at most once per reminder type**;
  `dayBeforeSentAt` / `lateSentAt` are persisted so restarts can't re-spam.
- **FR6:** Messages render the existing `{name} {time} {service} {shop}` tokens
  the barber can edit in Settings.
- **FR7:** The system honors `STOP`/`START` opt-out and never texts an opted-out
  number.
- **FR8:** Only customers explicitly marked **OK to text** receive messages.
- **FR9:** No messages are sent outside quiet-hours bounds (default before 8 AM
  / after 9 PM local).
- **FR10:** A **dry-run / preview** mode logs what *would* be sent without
  sending, so the barber can watch it for a few days before going live.
- **FR11:** The app shows per-appointment send status (sent / failed /
  opted-out).

### Non-Functional
- **NFR1:** Hosting cost $0 at this volume (Supabase free tier + Cloudflare/Edge
  free tier); only Twilio/registration cost money.
- **NFR2:** Idempotent sends — a worker crash or double-trigger must not produce
  duplicate texts.
- **NFR3:** Secrets (Twilio auth, DB service keys) never committed to git; stored
  in environment/secret store.
- **NFR4:** Offline single-file mode keeps working if the cloud is unreachable.
- **NFR5:** All times computed in the shop's local timezone.
- **NFR6:** Customer PII (names, numbers) stored only in the cloud DB with
  row-level access restricted to the shop owner.

## Technical Assumptions
- **Repository:** keep within this repo under `barbershop/` (monorepo-style).
- **Cloud DB:** Supabase (Postgres) free tier.
- **Scheduler/worker:** Supabase Edge Function on cron, or a Cloudflare Worker.
- **SMS:** Twilio with A2P 10DLC registration (US, sole proprietor).
- **Testing:** unit tests for the rule engine; a dry-run mode as the integration
  safety net before live sending.

## Epic List
1. **Epic 1 — Cloud Sync:** Stand up the cloud DB and sync app data to it
   (no texting yet; low risk).
2. **Epic 2 — SMS Provider & Compliance:** Twilio account, A2P 10DLC
   registration, outbound send + opt-out webhook.
3. **Epic 3 — Scheduler & Rules:** Cron worker that applies the reminder rules
   with quiet hours and a dry-run mode.
4. **Epic 4 — Send-Status Dashboard:** Surface what went out inside the app.

---

## Epic 1 — Cloud Sync
Establish a cloud database and one-way/two-way sync so a server can see who needs
texting, while the offline app keeps working.

- **Story 1.1 — Supabase project & schema:** create project, tables, and access
  rules for customers, appointments, and a send log.
- **Story 1.2 — App → cloud sync:** the app pushes customers/appointments to the
  cloud and reflects the send log back.
- **Story 1.3 — Offline fallback:** confirm the app fully works when the cloud is
  unreachable and reconciles on reconnect.

## Epic 2 — SMS Provider & Compliance
Enable real sending from a real number, legally.

- **Story 2.1 — Twilio account & number:** provision an account (owned by the
  barber) and a sending phone number.
- **Story 2.2 — A2P 10DLC registration:** register brand + campaign for
  sole-proprietor business texting.
- **Story 2.3 — Send function & opt-out webhook:** outbound send endpoint plus a
  Twilio inbound webhook honoring `STOP`/`START`.

## Epic 3 — Scheduler & Rules
The brain that decides who to text and when.

- **Story 3.1 — Cron worker skeleton:** worker that wakes every 15 min and loads
  due candidates.
- **Story 3.2 — Day-before rule:** send-once day-before logic with
  `dayBeforeSentAt` guard.
- **Story 3.3 — Running-late rule:** send-once late logic with `lateSentAt`
  guard.
- **Story 3.4 — Quiet hours & dry-run:** enforce quiet hours and add a
  preview/dry-run switch.

## Epic 4 — Send-Status Dashboard
- **Story 4.1 — Status in app:** show sent / failed / opted-out per appointment.

## Next Steps
Hand `architecture.md` + the `stories/` files to the dev workflow and implement
Epic 1 → 4 in order. Do not enable live sending until Story 3.4's dry-run has run
clean for several days and A2P 10DLC (Story 2.2) is approved.
