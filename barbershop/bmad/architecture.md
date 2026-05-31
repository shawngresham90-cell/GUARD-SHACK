# Chair Cash — Automatic Reminders Backend Architecture

## Introduction
This document defines the backend architecture for Chair Cash automatic SMS
reminders. It builds on the existing single-file PWA (`../index.html`) and the
solution outline in `../barbershop-auto-reminders-spec.md`. The frontend app is
kept largely as-is; we add a cloud data layer, a scheduled worker, and an SMS
provider.

## High Level Architecture

### Technical Summary
A serverless, event-light design: the existing PWA syncs its local data to a
Postgres database (Supabase). A scheduled worker runs every ~15 minutes, applies
the reminder rules, and sends SMS via Twilio. Twilio handles delivery and
opt-out; an inbound webhook records replies and `STOP`/`START`. All sends are
idempotent via per-appointment "sent at" timestamps.

### Platform and Infrastructure
- **Platform:** Supabase (Postgres + Edge Functions + cron) as the primary
  backend; Twilio for SMS. Cloudflare Worker is an acceptable alternative host
  for the scheduler.
- **Cost target:** $0 hosting at this volume; Twilio + A2P fees only.
- **Regions:** single region nearest the shop; all reminder timing computed in
  the shop's local timezone.

### Repository Structure
Monorepo within this repo:

```
barbershop/
  index.html                     # existing PWA (frontend)
  barbershop-sw.js
  barbershop.webmanifest
  barbershop-auto-reminders-spec.md
  bmad/                          # these planning docs
  backend/                       # (to be created during implementation)
    supabase/
      migrations/                # SQL schema
      functions/
        scheduler/               # cron worker (rule engine)
        sms-webhook/             # Twilio inbound (STOP/START)
    src/
      rules.ts                   # pure reminder-rule logic (unit-tested)
      templates.ts               # {name}{time}{service}{shop} rendering
```

### Architecture Diagram
```
┌─────────────────┐   sync appts/customers   ┌──────────────────────┐
│  Chair Cash PWA │ ───────────────────────► │  Supabase (Postgres)  │
│   (her phone)   │ ◄─────────────────────── │  customers/appts/log  │
└─────────────────┘     send-log reflect      └──────────┬───────────┘
                                                          │ "who's due?"
                                              ┌───────────▼──────────┐
                                              │ Scheduler (cron 15m)  │
                                              │  rules.ts + quiet hrs │
                                              └───────────┬──────────┘
                                                          │ send SMS
                                              ┌───────────▼──────────┐
                                              │  Twilio (A2P 10DLC)   │
                                              └───────────┬──────────┘
                                       STOP/START ◄───────┴──────► text
                                              ┌──────────────────────┐
                                              │ sms-webhook (inbound) │
                                              └──────────────────────┘
```

## Tech Stack

| Category | Technology | Rationale |
| --- | --- | --- |
| Database | Supabase Postgres (free tier) | Managed, free at volume, row-level security |
| Scheduler | Supabase Edge Function + cron (or Cloudflare Worker) | Free, runs while app is closed |
| Language | TypeScript | Type safety for rule engine, runs on Deno/Workers |
| SMS provider | Twilio | Mature, handles delivery + STOP/START |
| Compliance | A2P 10DLC (sole proprietor) | Legally required for US business texting |
| Secrets | Supabase secrets / env vars | Never in git |
| Testing | Vitest/Deno test | Unit-test the pure rule engine |

## Data Models

### customer
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid (pk) | |
| name | text | |
| phone | text | E.164 |
| ok_to_text | boolean | consent (FR8) |
| opted_out | boolean | set by STOP webhook (FR7) |
| created_at | timestamptz | |

### appointment
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid (pk) | |
| customer_id | uuid (fk) | |
| start_at | timestamptz | appointment time |
| service | text | for `{service}` token |
| status | text | `booked` / `done` / `cancelled` |
| day_before_sent_at | timestamptz null | idempotency guard (FR5) |
| late_sent_at | timestamptz null | idempotency guard (FR5) |

### message_log
| Field | Type | Notes |
| --- | --- | --- |
| id | uuid (pk) | |
| appointment_id | uuid (fk) | |
| type | text | `day_before` / `late` |
| status | text | `queued` / `sent` / `failed` / `skipped_optout` / `dry_run` |
| provider_sid | text null | Twilio message SID |
| sent_at | timestamptz | |

### settings
Single row: `shop_name`, `timezone`, `quiet_start` (08:00), `quiet_end`
(21:00), `day_before_hour` (18), `late_threshold_min` (10), `dry_run` (bool),
message templates.

## External APIs

### Twilio
- **Send:** `POST /Messages` with `From` (shop number), `To`, `Body`.
- **Inbound webhook:** Twilio → `sms-webhook` on each reply; parse `STOP`/`STOP
  ALL`/`UNSUBSCRIBE` → set `customer.opted_out = true`; `START` → clear it.
- **Auth:** Account SID + Auth Token in secrets; validate the
  `X-Twilio-Signature` on inbound requests.

## Core Workflows

### Scheduled run (every 15 min)
1. Load `settings`; compute "now" in shop timezone.
2. If outside quiet hours → exit (FR9).
3. **Day-before:** select `booked` appointments for tomorrow where
   `day_before_sent_at IS NULL` and current local time ≥ `day_before_hour`.
4. **Late:** select `booked` appointments where `now > start_at +
   late_threshold_min` and `late_sent_at IS NULL`.
5. For each candidate: skip if customer `opted_out` or not `ok_to_text`; render
   template; if `dry_run` log `dry_run` else send via Twilio.
6. On success, set the matching `*_sent_at` and write `message_log` —
   **in the same transaction** to keep sends idempotent (NFR2).

## Database Schema (sketch)
```sql
create table customer (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  ok_to_text boolean not null default false,
  opted_out boolean not null default false,
  created_at timestamptz not null default now()
);
create table appointment (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customer(id),
  start_at timestamptz not null,
  service text,
  status text not null default 'booked',
  day_before_sent_at timestamptz,
  late_sent_at timestamptz
);
create table message_log (
  id uuid primary key default gen_random_uuid(),
  appointment_id uuid references appointment(id),
  type text not null,
  status text not null,
  provider_sid text,
  sent_at timestamptz not null default now()
);
```

## Infrastructure and Deployment
- Schema via Supabase migrations.
- Two Edge Functions: `scheduler` (cron) and `sms-webhook` (HTTP, Twilio).
- Secrets set via `supabase secrets set`.
- Promote dry-run → live only after A2P approval and a clean preview window.

## Error Handling & Security
- Validate `X-Twilio-Signature` on inbound webhook; reject unsigned requests.
- Row-level security so only the shop owner's data is accessible.
- Send failures recorded as `failed` in `message_log`; the guard timestamp is
  **not** set on failure so the next run retries.
- Rate-aware: process candidates in small batches.

## Coding Standards & Testing
- Keep `rules.ts` **pure** (inputs → decisions) so it is fully unit-testable
  without Twilio or DB.
- Templates rendered through one `renderTemplate()` used by both preview and live
  paths.
- Required tests: day-before boundary, late threshold boundary, idempotency
  (no double send), opt-out skip, quiet-hours skip, dry-run produces no Twilio
  call.
