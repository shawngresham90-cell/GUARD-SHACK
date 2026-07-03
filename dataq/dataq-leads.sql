-- ============================================================================
-- GoDataQ — DataQ Tracker lead capture
-- Owner: Shawn Gresham (GoDataQ)
--
-- Run this in the Supabase SQL editor (Dashboard -> SQL -> New query). It is
-- ADDITIVE — it only creates the `dataq_leads` table and its policies and does
-- not touch any existing table (tickets, mechanics, etc.). Safe to re-run.
--
-- WHAT THIS IS FOR
--   The DataQ Tracker app keeps every dispute in the driver's own browser
--   (localStorage) so it works offline. This table ALSO captures each dispute as
--   a lead so GoDataQ sees the driver, the violation, and whether they want the
--   paid "done-for-you" filing service.
--
-- ACCESS MODEL (read this — it's the privacy part)
--   * Drivers use the app WITHOUT logging in, so they hit Supabase as the anon
--     role. Anon may INSERT a lead and UPDATE its own row (so editing a dispute
--     or tapping "file it for me" updates the same row instead of duplicating).
--   * Anon may NOT SELECT. Leads are never readable from the public app — only
--     GoDataQ, using the dashboard or the service_role key, can read them. So a
--     driver cannot list other drivers' contact info.
--   * See the HARDENING NOTE at the bottom before this carries real volume.
-- ============================================================================

create table if not exists dataq_leads (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),

  -- Lead / contact
  full_name            text,
  email                text,
  phone                text,
  dot_or_mc            text,

  -- The violation being disputed
  inspection_number    text,
  violation_code       text,
  violation_description text,
  state                text,
  event_date           date,
  grounds              text,            -- the "why it's wrong" reasons, comma-joined
  dispute_status       text,            -- draft / submitted / review / approved / partial / denied
  rdr_text             text,            -- the generated Request for Data Review narrative

  -- Upsell
  wants_paid_filing    boolean not null default false,

  -- Plumbing
  source               text default 'dataq_app',
  local_id             text unique      -- the device's dispute id; lets us upsert instead of duplicate
);

create index if not exists dataq_leads_created_idx        on dataq_leads (created_at desc);
create index if not exists dataq_leads_wants_paid_idx     on dataq_leads (wants_paid_filing) where wants_paid_filing;
create index if not exists dataq_leads_email_idx          on dataq_leads (lower(email));

-- keep updated_at fresh on every change
create or replace function dataq_leads_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists dataq_leads_updated_at on dataq_leads;
create trigger dataq_leads_updated_at
  before update on dataq_leads
  for each row execute function dataq_leads_touch_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table dataq_leads enable row level security;

-- Anon may create a lead (every saved dispute pushes one).
drop policy if exists dataq_leads_anon_insert on dataq_leads;
create policy dataq_leads_anon_insert on dataq_leads
  for insert to anon with check (true);

-- Anon may update (so re-saving an edited dispute, a status change, or tapping
-- "file it for me" updates the same row via upsert on local_id). Anon has no
-- SELECT, so this is a blind write — acceptable for MVP capture; see hardening.
drop policy if exists dataq_leads_anon_update on dataq_leads;
create policy dataq_leads_anon_update on dataq_leads
  for update to anon using (true) with check (true);

-- Anon may NOT select. No select policy = denied. Only GoDataQ (dashboard /
-- service_role) reads leads. Authenticated staff get full access.
drop policy if exists dataq_leads_auth_all on dataq_leads;
create policy dataq_leads_auth_all on dataq_leads
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- HARDENING NOTE (before this carries real volume)
-- ----------------------------------------------------------------------------
-- The anon INSERT/UPDATE policies are permissive (anyone with the anon key can
-- write, and could blind-update a row if they guess its random local_id). For an
-- MVP lead funnel that's fine — the table is write-only to the public and holds
-- no secrets readable by anon. To lock it down later, replace the direct table
-- writes with a security-definer RPC (or an Edge Function) that validates input
-- and inserts on the server, then `revoke insert, update on dataq_leads from
-- anon;`. The app's capture call would become `rpc('capture_lead', {...})`.
-- ============================================================================
