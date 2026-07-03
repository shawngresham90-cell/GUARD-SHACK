-- ============================================================================
-- Interstate Truck Stop Directory — Truck Parking Club paid-parking table
--
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query). It is
-- additive and safe to re-run: it creates the table if missing and adds any
-- new columns to an existing one without touching your data.
--
-- The directory's state pages lazy-load rows from this table (active = true,
-- filtered by state) and render them in the "Reservable paid parking" section
-- with a Reserve button. Columns match what index.html selects:
--   name, address, city, spaces, available, rating, price, book_url, partner_url
--
-- How rows get here: the `tpc-sync` edge function
-- (truckstops/functions/tpc-sync/) pulls every listing from the Truck
-- Parking Club partner API and upserts them by `tpc_id`. It is triggered
-- daily by .github/workflows/sync-tpc.yml. `active` is managed by the sync:
-- present in the API → true, dropped from the API → false. Rows you add by
-- hand (tpc_id left null) are never touched by the sync.
-- ============================================================================

create table if not exists public.tpc_locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  address     text,
  city        text,
  state       text,      -- 2-letter abbreviation, matches the directory's state keys
  spaces      integer,   -- total truck spots (API: seats)
  available   integer,   -- spots open now (API: available_seats)
  rating      numeric,   -- average user rating out of 5 (API: avg_rating)
  price       text,      -- display string, e.g. 'from $15/day'
  book_url    text,      -- booking link with affiliate tracking baked in
  partner_url text,      -- affiliate link as returned by the partner API
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Extra columns used by the partner-API sync (safe on an existing table).
alter table public.tpc_locations add column if not exists tpc_id          bigint;
alter table public.tpc_locations add column if not exists zip_code        text;
alter table public.tpc_locations add column if not exists lat             double precision;
alter table public.tpc_locations add column if not exists lng             double precision;
alter table public.tpc_locations add column if not exists amenities       text;
alter table public.tpc_locations add column if not exists avatar          text;
alter table public.tpc_locations add column if not exists tpc_url         text;  -- canonical (non-affiliate) listing URL
alter table public.tpc_locations add column if not exists last_synced_at  timestamptz;

-- The sync upserts on tpc_id (ON CONFLICT needs a full — not partial —
-- unique index; Postgres allows any number of NULLs, so manual rows are fine).
create unique index if not exists tpc_locations_tpc_id_key
  on public.tpc_locations (tpc_id);

-- Speeds up the per-state lazy load the app does on every state page.
create index if not exists tpc_locations_state_active_idx
  on public.tpc_locations (state) where active;

-- RLS: the browser (anon key) may only READ active rows. All writes come
-- from the tpc-sync edge function using the service-role key, which
-- bypasses RLS — so no insert/update policy exists for anon at all.
alter table public.tpc_locations enable row level security;

drop policy if exists "anon read active tpc locations" on public.tpc_locations;
create policy "anon read active tpc locations"
  on public.tpc_locations for select
  using (active);
