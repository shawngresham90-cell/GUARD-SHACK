-- Chair Cash automatic reminders — initial schema (Story 1.1)
-- Tables: customer, appointment, message_log, settings
-- See ../../bmad/architecture.md → Data Models for field semantics.

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- customer
-- ---------------------------------------------------------------------------
create table if not exists public.customer (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null default auth.uid(),   -- shop owner (RLS scope)
  name        text not null,
  phone       text not null,                      -- E.164, e.g. +15551234567
  ok_to_text  boolean not null default false,     -- explicit consent (FR8)
  opted_out   boolean not null default false,     -- set by STOP webhook (FR7)
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- appointment
-- ---------------------------------------------------------------------------
create table if not exists public.appointment (
  id                  uuid primary key default gen_random_uuid(),
  owner_id            uuid not null default auth.uid(),
  customer_id         uuid not null references public.customer(id) on delete cascade,
  start_at            timestamptz not null,
  service             text,
  status              text not null default 'booked'
                        check (status in ('booked','done','cancelled')),
  -- idempotency guards (FR5): non-null = already sent that reminder type
  day_before_sent_at  timestamptz,
  late_sent_at        timestamptz,
  created_at          timestamptz not null default now()
);

-- Scheduler queries: booked appts by time, and "not yet sent" lookups.
create index if not exists appointment_start_idx
  on public.appointment (start_at) where status = 'booked';
create index if not exists appointment_day_before_pending_idx
  on public.appointment (start_at) where status = 'booked' and day_before_sent_at is null;
create index if not exists appointment_late_pending_idx
  on public.appointment (start_at) where status = 'booked' and late_sent_at is null;

-- ---------------------------------------------------------------------------
-- message_log
-- ---------------------------------------------------------------------------
create table if not exists public.message_log (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null default auth.uid(),
  appointment_id  uuid not null references public.appointment(id) on delete cascade,
  type            text not null check (type in ('day_before','late')),
  status          text not null
                    check (status in ('queued','sent','failed','skipped_optout','dry_run')),
  provider_sid    text,                            -- Twilio message SID
  body            text,                            -- rendered text (useful for dry-run review)
  sent_at         timestamptz not null default now()
);

create index if not exists message_log_appointment_idx
  on public.message_log (appointment_id);

-- ---------------------------------------------------------------------------
-- settings (single row per owner)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  owner_id            uuid primary key default auth.uid(),
  shop_name           text not null default 'My Shop',
  timezone            text not null default 'America/New_York',
  quiet_start         time not null default '08:00',   -- FR9
  quiet_end           time not null default '21:00',
  day_before_hour     int  not null default 18 check (day_before_hour between 0 and 23),
  late_threshold_min  int  not null default 10 check (late_threshold_min >= 0),
  dry_run             boolean not null default true,   -- FR10: never send until flipped
  day_before_template text not null default 'Hi {name}, reminder: {service} tomorrow at {time} at {shop}. Reply STOP to opt out.',
  late_template       text not null default 'Hi {name}, we have you down for {service} at {time}. Still coming? — {shop}. Reply STOP to opt out.'
);

-- ---------------------------------------------------------------------------
-- Row-Level Security (AC4): each owner sees only their own rows.
-- ---------------------------------------------------------------------------
alter table public.customer     enable row level security;
alter table public.appointment  enable row level security;
alter table public.message_log  enable row level security;
alter table public.settings     enable row level security;

create policy customer_owner    on public.customer
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy appointment_owner on public.appointment
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy message_log_owner on public.message_log
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy settings_owner    on public.settings
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
