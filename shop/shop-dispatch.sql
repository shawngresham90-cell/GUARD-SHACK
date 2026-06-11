-- ============================================================================
-- Rosedale Shop Scheduler — ADD-ON: DISPATCH role + priority flag + notes
--
-- Run this AFTER shop-scheduler-schema.sql and shop-mechanic-logins.sql.
--
-- WHAT DISPATCH IS
--   A watcher role. Dispatch sees the whole queue (every truck, every status,
--   with driver, truck/trailer, status and ETA) and can do exactly two things:
--     * flag/unflag a truck as PRIORITY
--     * add coordination NOTES
--   Dispatch can NOT change repair status, assign mechanics, or touch parts/
--   cost, and can NOT see the private shop calendar. All of that is enforced by
--   the DATABASE (RLS), not just hidden in the UI.
--
-- HOW A DISPATCHER IS IDENTIFIED
--   Same pattern as mechanics: match the logged-in user's email to a row in
--   `dispatchers`. Create the auth user (e.g. disp@rosedale.local) under
--   Authentication → Users, then make sure a dispatchers row has that email.
--   An ADMIN is now any logged-in user who is neither a mechanic nor a dispatcher.
-- ============================================================================

-- 1) Who is a dispatcher -----------------------------------------------------
create table if not exists dispatchers (
  id          uuid primary key default gen_random_uuid(),
  login_email text not null unique,
  name        text,
  created_at  timestamptz not null default now()
);
alter table dispatchers enable row level security;

-- role helper (security definer => bypasses RLS, so no policy recursion)
create or replace function is_dispatch()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from dispatchers
    where lower(login_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- redefine "admin" to exclude dispatchers (and mechanics, as before)
create or replace function is_shop_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
     and current_mechanic_id() is null
     and not is_dispatch();
$$;

drop policy if exists dispatchers_self_select on dispatchers;
create policy dispatchers_self_select on dispatchers for select to authenticated
  using (lower(login_email) = lower(coalesce(auth.jwt() ->> 'email', '')));
drop policy if exists dispatchers_admin_all on dispatchers;
create policy dispatchers_admin_all on dispatchers for all to authenticated
  using (is_shop_admin()) with check (is_shop_admin());

-- 2) Priority flag on tickets ------------------------------------------------
alter table tickets add column if not exists priority boolean not null default false;

-- 3) Dispatch can READ the whole queue, but has NO direct write on tickets
--    (so it can never change status). Priority is changed only via the RPC below.
drop policy if exists tickets_dispatch_select on tickets;
create policy tickets_dispatch_select on tickets for select to authenticated
  using (is_dispatch());

-- 4) Controlled priority setter — flips ONLY the priority column -------------
create or replace function set_ticket_priority(p_ticket uuid, p_on boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not (is_dispatch() or is_shop_admin()) then
    raise exception 'not authorized';
  end if;
  update tickets set priority = p_on where id = p_ticket;
end;
$$;
grant execute on function set_ticket_priority(uuid, boolean) to authenticated;

-- 5) Dispatch notes (shop sees them too) -------------------------------------
create table if not exists dispatch_notes (
  id           uuid primary key default gen_random_uuid(),
  ticket_id    uuid not null references tickets(id) on delete cascade,
  author_email text,
  note         text not null,
  created_at   timestamptz not null default now()
);
create index if not exists dispatch_notes_ticket_idx on dispatch_notes (ticket_id, created_at desc);
alter table dispatch_notes enable row level security;

drop policy if exists dispatch_notes_select on dispatch_notes;
create policy dispatch_notes_select on dispatch_notes for select to authenticated
  using (is_dispatch() or is_shop_admin());
drop policy if exists dispatch_notes_insert on dispatch_notes;
create policy dispatch_notes_insert on dispatch_notes for insert to authenticated
  with check (is_dispatch() or is_shop_admin());

-- 6) Realtime for the notes log (tickets is already published) ---------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dispatch_notes'
  ) then
    alter publication supabase_realtime add table dispatch_notes;
  end if;
end$$;

-- 7) Seed the dispatcher entry (create the auth user separately) -------------
insert into dispatchers (login_email, name)
values ('disp@rosedale.local', 'Dispatch')
on conflict (login_email) do nothing;

-- ============================================================================
-- Net effect:
--   * Dispatch login -> reads the whole queue + live timers; flags priority and
--     adds notes only. No status changes, no parts/cost, no shop calendar.
--   * Admin / mechanic / driver -> unchanged.
-- ============================================================================
