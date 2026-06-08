-- ============================================================================
-- Rosedale Shop Scheduler — ADD-ON: per-mechanic logins
--
-- Run this AFTER shop-scheduler-schema.sql, in the Supabase SQL editor.
-- It gives each mechanic their own login that sees ONLY their assigned tickets
-- and can update status + log time — no parts, no cost, no assigning work.
-- Admins (shop / cab / baf) are unaffected and still see everything.
--
-- HOW A MECHANIC IS IDENTIFIED
--   We match the logged-in user's email to mechanics.login_email. So:
--     1) Create the mechanic's login under Authentication → Users (any email,
--        e.g. mike@rosedale.local) with a password.
--     2) In the app's Mechanics tab (as an admin), put that same email in the
--        mechanic's "login email" field. That links the account to the row.
--   A mechanic row with a NULL login_email simply has no login and is worked
--   off the shared shop tablet, exactly as before.
--
--   An ADMIN is any logged-in user whose email is NOT a mechanic login.
-- ============================================================================

-- 1) Link column ------------------------------------------------------------
alter table mechanics add column if not exists login_email text;
create unique index if not exists mechanics_login_email_idx
  on mechanics (lower(login_email)) where login_email is not null;

-- 2) Role helpers (SECURITY DEFINER so they bypass RLS and can't recurse) ----
create or replace function current_mechanic_id()
returns uuid language sql stable security definer set search_path = public as $$
  select id from mechanics
  where login_email is not null
    and lower(login_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function is_shop_admin()
returns boolean language sql stable security definer set search_path = public as $$
  -- logged in, and not linked to a mechanic row
  select auth.uid() is not null and current_mechanic_id() is null;
$$;

-- 3) Re-do the "authenticated" policies as admin vs mechanic -----------------
--    (anon/driver policies from the base schema are untouched.)

-- ---- TICKETS --------------------------------------------------------------
drop policy if exists tickets_auth_all on tickets;
-- admins: full control over every ticket
create policy tickets_admin_all on tickets for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());
-- mechanics: read only their own assigned tickets
create policy tickets_mech_select on tickets for select to authenticated
  using (assigned_mechanic_id = current_mechanic_id());
-- mechanics: update only their own tickets, and may NOT reassign away
create policy tickets_mech_update on tickets for update to authenticated
  using (assigned_mechanic_id = current_mechanic_id())
  with check (assigned_mechanic_id = current_mechanic_id());

-- ---- TIME LOGS ------------------------------------------------------------
drop policy if exists time_logs_auth_all on time_logs;
create policy time_logs_admin_all on time_logs for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());
-- mechanics: only their own time entries
create policy time_logs_mech on time_logs for all to authenticated
  using (mechanic_id = current_mechanic_id())
  with check (mechanic_id = current_mechanic_id());

-- ---- MECHANICS ------------------------------------------------------------
drop policy if exists mechanics_auth_all on mechanics;
create policy mechanics_admin_all on mechanics for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());
-- a mechanic may read their own row (so the app can identify them)
create policy mechanics_self_select on mechanics for select to authenticated
  using (id = current_mechanic_id());

-- ---- PARTS + TICKET_PARTS (admin only — mechanics get NO policy = denied) --
drop policy if exists parts_auth_all on parts;
create policy parts_admin_all on parts for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());

drop policy if exists ticket_parts_auth_all on ticket_parts;
create policy ticket_parts_admin_all on ticket_parts for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());

-- ============================================================================
-- Net effect:
--   * Admin login  -> sees/does everything (unchanged).
--   * Mechanic login -> sees only tickets assigned to them, can change status
--                       and log their own time; parts, cost, the mechanic list,
--                       and other drivers' tickets are blocked at the DB level.
--   * Driver (anon) -> create + read status only (unchanged from base schema).
-- ============================================================================
