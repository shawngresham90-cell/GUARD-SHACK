-- ============================================================================
-- Rosedale Shop Scheduler — workflow fixes (mechanic repair, equipment type)
--
-- Applied to the live Supabase project as migration
-- `mechanic_repair_equipment_type`. Kept here for version control.
--
-- Feature 1 — Mechanic repair entry: a repair record kept distinct from the
--   driver's reported complaint (tickets.issue). Edited by mechanic + shop;
--   drivers can't (no anon UPDATE policy on tickets).
-- Feature 2 — Equipment type: truck vs trailer, chosen on intake, shown as a
--   badge in the queue.
-- Feature 3 — Completed History is purely client-side (completed tickets are
--   filtered out of the live queue and listed in their own tab); no schema change.
-- ============================================================================

alter table public.tickets
  add column if not exists equipment_type     text not null default 'truck',
  add column if not exists repair_description text,
  add column if not exists repair_parts       text,
  add column if not exists repair_notes       text;

alter table public.tickets drop constraint if exists tickets_equipment_type_chk;
alter table public.tickets add constraint tickets_equipment_type_chk
  check (equipment_type in ('truck','trailer'));

-- The off-site rows created earlier were trailers; everything else is a truck.
update public.tickets set equipment_type = 'trailer' where offsite = true;
