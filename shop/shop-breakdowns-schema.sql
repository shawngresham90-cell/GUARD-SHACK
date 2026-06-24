-- ============================================================================
-- Rosedale Shop Scheduler — ADD-ON: Roadside Breakdowns
--
-- Run this AFTER shop-scheduler-schema.sql and shop-mechanic-logins.sql.
-- Adds the roadside breakdown workflow: a driver reports a breakdown from the
-- side of the road (GPS + photos), the breakdown team is emailed automatically
-- (see the breakdown-notify edge function), and staff work it to completion
-- with outside vendors while the driver tracks status live.
--
-- PRIVACY (same non-negotiable rule as the rest of the app):
--   A breakdown mixes driver-safe info with sensitive staff info, and RLS is
--   row-level, not column-level. So the data is split:
--     * breakdowns        -> anon (driver) can create + read status. Holds the
--                            report, GPS, status, and driver-helpful vendor
--                            name/contact/ETA.
--     * breakdown_private -> admins only. Holds money + internal notes
--                            (estimated cost, approvals, warranty, chargeback).
--   Photos live in a PRIVATE storage bucket: anon can upload, only staff read.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Status flow the driver sees: Reported -> Vendor Assigned -> En Route ->
-- Repairing -> Completed
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'breakdown_status') then
    create type breakdown_status as enum
      ('reported', 'vendor_assigned', 'en_route', 'repairing', 'completed');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- breakdowns — driver-facing report + live status (anon can create + read)
-- ---------------------------------------------------------------------------
create table if not exists breakdowns (
  id              uuid primary key default gen_random_uuid(),
  -- driver / unit
  driver_name     text not null,
  truck_number    text not null,
  trailer_number  text,
  driver_phone    text not null,
  driver_email    text,                 -- optional, only for the confirmation email
  -- where they are
  gps_lat         double precision,
  gps_lng         double precision,
  location_text   text,                 -- free-text "current location"
  highway_exit    text,
  city_state      text,
  direction       text,                 -- N / S / E / W
  loaded          boolean,              -- true = loaded, false = empty
  -- what's wrong
  issue_type      text not null
                  check (issue_type in ('tire','engine','coolant_leak','air_leak',
                         'electrical','def_issue','dpf_regen','trailer_repair',
                         'accident','tow','other')),
  issue_notes     text,
  priority        boolean not null default false,  -- emergency / unsafe location
  -- vendor info that's OK to show the driver
  vendor_name     text,
  vendor_contact  text,
  vendor_eta      text,
  -- lifecycle
  status          breakdown_status not null default 'reported',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  completed_at    timestamptz
);

create index if not exists breakdowns_status_idx  on breakdowns (status);
create index if not exists breakdowns_truck_idx    on breakdowns (lower(truck_number));
create index if not exists breakdowns_created_idx  on breakdowns (created_at desc);
create index if not exists breakdowns_priority_idx on breakdowns (priority) where priority;

-- reuse set_updated_at() from the base schema; also stamp completed_at on close
create or replace function breakdowns_lifecycle()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    new.completed_at = now();
  end if;
  return new;
end$$;

drop trigger if exists breakdowns_lifecycle on breakdowns;
create trigger breakdowns_lifecycle
  before update on breakdowns
  for each row execute function breakdowns_lifecycle();

-- ---------------------------------------------------------------------------
-- breakdown_private — staff-only money + internal notes (anon NEVER sees this)
-- ---------------------------------------------------------------------------
create table if not exists breakdown_private (
  id                    uuid primary key default gen_random_uuid(),
  breakdown_id          uuid not null unique references breakdowns(id) on delete cascade,
  service_order_number  text,
  estimated_cost        numeric(10,2),
  vendor_notes          text,
  authorized_by         text,
  repair_approval_amount numeric(10,2),
  follow_up_required    boolean not null default false,
  warranty_claim        boolean not null default false,
  chargeback_notes      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists breakdown_private_updated_at on breakdown_private;
create trigger breakdown_private_updated_at
  before update on breakdown_private
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- breakdown_photos — references to objects in the breakdown-photos bucket
-- ---------------------------------------------------------------------------
create table if not exists breakdown_photos (
  id           uuid primary key default gen_random_uuid(),
  breakdown_id uuid not null references breakdowns(id) on delete cascade,
  category     text not null
               check (category in ('truck','trailer','dash','damaged_part','tire')),
  storage_path text not null,
  created_at   timestamptz not null default now()
);
create index if not exists breakdown_photos_breakdown_idx on breakdown_photos (breakdown_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table breakdowns        enable row level security;
alter table breakdown_private enable row level security;
alter table breakdown_photos  enable row level security;

-- ---- breakdowns -----------------------------------------------------------
-- Driver (anon) can file a breakdown and read status (drives the live tracker).
drop policy if exists breakdowns_anon_insert on breakdowns;
create policy breakdowns_anon_insert on breakdowns
  for insert to anon with check (true);

drop policy if exists breakdowns_anon_select on breakdowns;
create policy breakdowns_anon_select on breakdowns
  for select to anon using (true);

-- Admins (authenticated, non-mechanic) manage everything.
drop policy if exists breakdowns_admin_all on breakdowns;
create policy breakdowns_admin_all on breakdowns
  for all to authenticated using (is_shop_admin()) with check (is_shop_admin());

-- ---- breakdown_private (admins only — anon denied, no policy) --------------
drop policy if exists breakdown_private_admin_all on breakdown_private;
create policy breakdown_private_admin_all on breakdown_private
  for all to authenticated using (is_shop_admin()) with check (is_shop_admin());

-- ---- breakdown_photos -----------------------------------------------------
-- Drivers (anon) upload photo references when filing; only staff read them.
drop policy if exists breakdown_photos_anon_insert on breakdown_photos;
create policy breakdown_photos_anon_insert on breakdown_photos
  for insert to anon with check (true);

drop policy if exists breakdown_photos_admin_all on breakdown_photos;
create policy breakdown_photos_admin_all on breakdown_photos
  for all to authenticated using (is_shop_admin()) with check (is_shop_admin());

-- ============================================================================
-- STORAGE — private bucket for breakdown photos
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('breakdown-photos', 'breakdown-photos', false)
on conflict (id) do nothing;

-- Drivers (anon) may upload into this bucket; nobody anonymous can read back.
drop policy if exists breakdown_photos_anon_upload on storage.objects;
create policy breakdown_photos_anon_upload on storage.objects
  for insert to anon with check (bucket_id = 'breakdown-photos');

-- Staff (authenticated) may read the photos (app fetches signed URLs).
drop policy if exists breakdown_photos_auth_read on storage.objects;
create policy breakdown_photos_auth_read on storage.objects
  for select to authenticated using (bucket_id = 'breakdown-photos');

-- ============================================================================
-- REALTIME — live dashboard + live driver tracker
-- ============================================================================
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table breakdowns;
alter publication supabase_realtime add table breakdown_photos;

-- ============================================================================
-- After running this: create the Database Webhook that emails the team.
--   Dashboard → Database → Webhooks → Create:
--     * Table: breakdowns,  Events: INSERT
--     * Type: Supabase Edge Function -> breakdown-notify
--     * HTTP header: x-webhook-secret = <same value as the function's WEBHOOK_SECRET>
-- See shop/SETUP.md for the full walkthrough.
-- ============================================================================
