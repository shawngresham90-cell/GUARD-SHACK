-- ============================================================================
-- Rosedale Shop Scheduler — unified repair reporting (photos + off-site)
--
-- Applied to the live Supabase project as migration
-- `repair_reporting_photos_and_offsite`. Kept here for version control.
--
-- Adds:
--   * off-site fields on tickets (GPS + landmark) for equipment left in the field
--   * ticket_photos: a repair photo + note attached to a ticket
--   * the `repair-photos` Storage bucket (public read, controlled write)
--
-- Roles (existing helper functions, SECURITY DEFINER):
--   is_shop_admin(), is_dispatch(), current_mechanic_id()
-- Drivers are anonymous (anon); mechanics + shop admins are authenticated;
-- dispatch is authenticated but is neither a mechanic nor an admin.
-- ============================================================================

-- 1) Off-site fields on tickets
alter table public.tickets
  add column if not exists offsite       boolean not null default false,
  add column if not exists gps_lat       double precision,
  add column if not exists gps_lng       double precision,
  add column if not exists location_text text;

-- 2) Repair photos + notes
create table if not exists public.ticket_photos (
  id               uuid primary key default gen_random_uuid(),
  ticket_id        uuid not null references public.tickets(id) on delete cascade,
  storage_path     text not null,
  note             text,
  uploaded_by_role text,
  uploaded_by_name text,
  created_at       timestamptz not null default now()
);
create index if not exists ticket_photos_ticket_id_idx on public.ticket_photos(ticket_id);

alter table public.ticket_photos enable row level security;

-- Drivers (anon) + mechanics/shop (authenticated) can upload; dispatch is read-only.
drop policy if exists ticket_photos_anon_insert  on public.ticket_photos;
drop policy if exists ticket_photos_staff_insert on public.ticket_photos;
drop policy if exists ticket_photos_anon_select  on public.ticket_photos;
drop policy if exists ticket_photos_auth_select  on public.ticket_photos;
drop policy if exists ticket_photos_staff_delete on public.ticket_photos;

create policy ticket_photos_anon_insert  on public.ticket_photos for insert to anon          with check (true);
create policy ticket_photos_staff_insert on public.ticket_photos for insert to authenticated with check (is_shop_admin() or current_mechanic_id() is not null);
create policy ticket_photos_anon_select  on public.ticket_photos for select to anon          using (true);
create policy ticket_photos_auth_select  on public.ticket_photos for select to authenticated using (true);
create policy ticket_photos_staff_delete on public.ticket_photos for delete to authenticated using (is_shop_admin() or current_mechanic_id() is not null);

-- 3) Storage bucket for the photos (public read, controlled write).
--    The image files themselves live in Storage, NOT in the git repo.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('repair-photos','repair-photos', true, 8388608, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists repair_photos_insert_anon on storage.objects;
drop policy if exists repair_photos_insert_auth on storage.objects;
drop policy if exists repair_photos_read        on storage.objects;

create policy repair_photos_insert_anon on storage.objects for insert to anon
  with check (bucket_id = 'repair-photos');
create policy repair_photos_insert_auth on storage.objects for insert to authenticated
  with check (bucket_id = 'repair-photos' and (is_shop_admin() or current_mechanic_id() is not null));
create policy repair_photos_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'repair-photos');
