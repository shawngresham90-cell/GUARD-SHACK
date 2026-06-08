-- ============================================================================
-- Rosedale Shop Scheduler — Supabase schema
-- Owner: Shawn Gresham (Trucking Life / Rosedale Transport)
--
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query) on a fresh
-- project. It creates the tables, the status enum, row-level-security (RLS)
-- policies, and turns on Realtime for the live queue.
--
-- HOW THE ACCESS MODEL WORKS (read this — it's the "non-negotiable" privacy part)
--   * Drivers use the app WITHOUT logging in. They hit Supabase as the built-in
--     "anon" role. Anon can create a ticket and read ticket status, and nothing
--     else — parts, costs, and time logs are completely invisible to anon at the
--     database level (no policy = denied).
--   * Admins (shop / cab / baf) and mechanics log in with Supabase Auth. Once
--     logged in they are the "authenticated" role and can see everything.
--   * So prices / parts / cost estimates are protected by the DATABASE, not just
--     by hiding buttons in the UI. A driver literally cannot read them.
--
-- ABOUT THE ADMIN LOGINS
--   The build spec listed a `users` table with plaintext-ish passwords
--   (shop/cab/baf). We do NOT store passwords ourselves — that's a foot-gun.
--   Instead create the three admins as Supabase Auth users (passwords are hashed
--   by Supabase, satisfying "store hashed, not plaintext"). Use these emails so
--   the app's username box maps to them:
--       shop  ->  shop@rosedale.local   (Shawn  — Owner)
--       cab   ->  cab@rosedale.local    (Chris  — Admin)
--       baf   ->  baf@rosedale.local    (Bridgett — Admin)
--   Create them in Dashboard → Authentication → Users → Add user, and set the
--   password to the simple MVP value for now. (Heads-up Shawn: these are weak for
--   anything internet-facing — bump them before this leaves the shop network.)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Status enum for the running queue
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'ticket_status') then
    create type ticket_status as enum ('intake', 'in_progress', 'waiting_parts', 'completed');
  end if;
end$$;

-- ---------------------------------------------------------------------------
-- Mechanics
-- ---------------------------------------------------------------------------
create table if not exists mechanics (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tickets (the running queue)
-- ---------------------------------------------------------------------------
create table if not exists tickets (
  id                   uuid primary key default gen_random_uuid(),
  truck_number         text not null,
  trailer_number       text,
  unit_number          text,
  driver_name          text not null,
  driver_phone         text not null,
  issue                text not null,
  needed_by            timestamptz,
  status               ticket_status not null default 'intake',
  assigned_mechanic_id uuid references mechanics(id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists tickets_status_idx       on tickets (status);
create index if not exists tickets_truck_idx        on tickets (lower(truck_number));
create index if not exists tickets_created_idx       on tickets (created_at desc);

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists tickets_updated_at on tickets;
create trigger tickets_updated_at
  before update on tickets
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Time logs (admin / mechanic only)
-- ---------------------------------------------------------------------------
create table if not exists time_logs (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  mechanic_id uuid references mechanics(id) on delete set null,
  minutes     integer not null check (minutes >= 0),
  note        text,
  created_at  timestamptz not null default now()
);
create index if not exists time_logs_ticket_idx on time_logs (ticket_id);

-- ---------------------------------------------------------------------------
-- Parts inventory (admin only)
-- ---------------------------------------------------------------------------
create table if not exists parts (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  qty_on_hand  integer not null default 0,
  unit_cost    numeric(10,2) not null default 0,
  created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Parts used on a ticket (drives the cost estimate) — admin only
-- ---------------------------------------------------------------------------
create table if not exists ticket_parts (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references tickets(id) on delete cascade,
  part_id    uuid not null references parts(id) on delete restrict,
  qty        integer not null default 1 check (qty > 0),
  created_at timestamptz not null default now()
);
create index if not exists ticket_parts_ticket_idx on ticket_parts (ticket_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table tickets      enable row level security;
alter table mechanics    enable row level security;
alter table time_logs    enable row level security;
alter table parts        enable row level security;
alter table ticket_parts enable row level security;

-- ---- TICKETS --------------------------------------------------------------
-- Drivers (anon) may create a ticket.
drop policy if exists tickets_anon_insert on tickets;
create policy tickets_anon_insert on tickets
  for insert to anon with check (true);

-- Drivers (anon) may read ticket rows so they can poll/realtime their own
-- status. The app only ever queries filtered by the driver's own truck+phone
-- and never shows the full queue to drivers; the full shop queue lives behind
-- the admin login. (Hardening path: replace this with a security-definer RPC
-- that returns only rows matching a given truck+phone — see note at bottom.)
drop policy if exists tickets_anon_select on tickets;
create policy tickets_anon_select on tickets
  for select to anon using (true);

-- Drivers (anon) may NOT update or delete. Only the shop touches status.
-- Admins / mechanics (authenticated) get full control.
drop policy if exists tickets_auth_all on tickets;
create policy tickets_auth_all on tickets
  for all to authenticated using (true) with check (true);

-- ---- MECHANICS ------------------------------------------------------------
-- Only logged-in staff can see/manage the mechanic list. (Anon: denied.)
drop policy if exists mechanics_auth_all on mechanics;
create policy mechanics_auth_all on mechanics
  for all to authenticated using (true) with check (true);

-- ---- TIME LOGS ------------------------------------------------------------
-- Logged-in staff only. Anon never sees labor. (Anon: denied — no policy.)
drop policy if exists time_logs_auth_all on time_logs;
create policy time_logs_auth_all on time_logs
  for all to authenticated using (true) with check (true);

-- ---- PARTS (admin only) ---------------------------------------------------
-- Logged-in staff only. Anon never sees parts or unit cost. (Anon: denied.)
drop policy if exists parts_auth_all on parts;
create policy parts_auth_all on parts
  for all to authenticated using (true) with check (true);

-- ---- TICKET_PARTS (admin only, drives cost estimate) ----------------------
drop policy if exists ticket_parts_auth_all on ticket_parts;
create policy ticket_parts_auth_all on ticket_parts
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- REALTIME — push live changes to every device
-- ============================================================================
-- Tickets drive the live driver status + shop queue. Parts/time_logs are added
-- too so the admin dashboards refresh live; Realtime still honors RLS, so anon
-- subscribers only ever receive ticket rows.
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end$$;

alter publication supabase_realtime add table tickets;
alter publication supabase_realtime add table time_logs;
alter publication supabase_realtime add table parts;
alter publication supabase_realtime add table ticket_parts;

-- ============================================================================
-- Optional seed data — a couple of mechanics to get started.
-- (Safe to re-run: only inserts if the table is empty.)
-- ============================================================================
insert into mechanics (name)
select * from (values ('Shop Bay 1'), ('Shop Bay 2')) as v(name)
where not exists (select 1 from mechanics);

-- ============================================================================
-- HARDENING NOTE (for when this goes internet-facing)
-- ----------------------------------------------------------------------------
-- Right now anon can SELECT any ticket row at the API level (the UI never shows
-- the full queue to drivers, but the policy is permissive). To lock drivers to
-- ONLY their own tickets at the database level, drop tickets_anon_select and add
-- a security-definer lookup instead:
--
--   revoke select on tickets from anon;  -- or: drop policy tickets_anon_select
--
--   create or replace function get_my_tickets(p_truck text, p_phone text)
--   returns setof tickets
--   language sql security definer set search_path = public as $$
--     select * from tickets
--     where lower(truck_number) = lower(trim(p_truck))
--       and regexp_replace(driver_phone,'\D','','g') = regexp_replace(p_phone,'\D','','g')
--     order by created_at desc;
--   $$;
--   grant execute on function get_my_tickets(text,text) to anon;
--
-- Then have the driver-status screen call rpc('get_my_tickets', ...). Note this
-- trades away anon Realtime for tickets (anon can't subscribe to rows it can't
-- SELECT), so the driver screen would poll on a timer instead of live-pushing.
-- ============================================================================
