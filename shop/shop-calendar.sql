-- ============================================================================
-- Rosedale Shop Scheduler — ADD-ON: private shop calendar
--
-- Run AFTER shop-scheduler-schema.sql and shop-mechanic-logins.sql, in the
-- Supabase SQL editor. Safe to re-run.
--
-- ACCESS MODEL (the important part)
--   The calendar is for ADMIN logins only (shop / cab / baf). It is locked at
--   the DATABASE level two ways — hiding the tab in the UI is cosmetic, not
--   the security:
--     1. RLS: the only policy requires is_shop_admin() (logged in AND not a
--        mechanic — defined in shop-mechanic-logins.sql). Drivers are anon →
--        no policy → denied. Mechanic logins → is_shop_admin() false → denied.
--     2. GRANT: all table privileges are revoked from anon outright, so the
--        API returns "permission denied" to drivers instead of empty results.
--   No emails, no notifications — internal scheduling only.
--
--   ticket_id lets an appointment link to an existing repair ticket (the
--   driver/truck that already checked in). Deleting the ticket keeps the
--   appointment and just clears the link.
-- ============================================================================
create table if not exists appointments (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  notes      text,
  starts_at  timestamptz not null,
  ticket_id  uuid references tickets(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists appointments_starts_idx on appointments (starts_at);
create index if not exists appointments_ticket_idx on appointments (ticket_id);

drop trigger if exists appointments_updated_at on appointments;
create trigger appointments_updated_at
  before update on appointments
  for each row execute function set_updated_at();

alter table appointments enable row level security;

revoke all on appointments from anon;

drop policy if exists appointments_admin_all on appointments;
create policy appointments_admin_all on appointments
  for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());
