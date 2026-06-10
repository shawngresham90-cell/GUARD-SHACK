-- ============================================================================
-- Rosedale Shop Scheduler — ADD-ON: driver email, auto timestamps, ETA,
--                                   and "your truck is ready" email.
--
-- Run this AFTER shop-scheduler-schema.sql, in the Supabase SQL editor. It is
-- safe to re-run (everything is "if not exists" / "create or replace").
--
-- WHAT IT ADDS
--   * tickets.driver_email   — captured at drop-off (required in the app).
--   * tickets.estimated_fix  — the mechanic's ETA the driver can see.
--   * tickets.started_at     — auto-stamped when status first hits in_progress.
--   * tickets.finished_at    — auto-stamped when status first hits completed.
--   * an email to the driver the moment a ticket is marked completed, sent by a
--     Supabase Edge Function (see shop/functions/notify-driver-ready). Email
--     only — there is no SMS path.
-- ============================================================================

-- 1) New columns (existing rows keep NULLs; the app enforces email at intake) --
alter table tickets add column if not exists driver_email  text;
alter table tickets add column if not exists estimated_fix text;
alter table tickets add column if not exists started_at    timestamptz;
alter table tickets add column if not exists finished_at   timestamptz;

-- 2) Auto-stamp work-started / finished on the status transition --------------
create or replace function set_status_timestamps()
returns trigger language plpgsql as $$
begin
  if new.status = 'in_progress'
     and old.status is distinct from 'in_progress'
     and new.started_at is null then
    new.started_at = now();
  end if;
  if new.status = 'completed'
     and old.status is distinct from 'completed'
     and new.finished_at is null then
    new.finished_at = now();
  end if;
  return new;
end$$;

drop trigger if exists tickets_status_timestamps on tickets;
create trigger tickets_status_timestamps
  before update on tickets
  for each row execute function set_status_timestamps();

-- 3) Email the driver when a ticket is marked completed -----------------------
--    Uses pg_net to POST to the notify-driver-ready Edge Function. The function
--    does the actual sending (via your email provider) and checks a shared
--    secret so randoms can't trigger it.
--
--    >>> EDIT THESE TWO LINES, then re-run this file: <<<
--      NOTIFY_URL    = https://<your-project-ref>.functions.supabase.co/notify-driver-ready
--      NOTIFY_SECRET = a long random string; set the SAME value as the
--                      SHOP_NOTIFY_SECRET env var on the Edge Function.
create extension if not exists pg_net with schema extensions;

create or replace function notify_driver_ready()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  notify_url    text := 'https://YOUR_PROJECT_REF.functions.supabase.co/notify-driver-ready';
  notify_secret text := 'YOUR_SHARED_SECRET';
begin
  if new.status = 'completed'
     and old.status is distinct from 'completed'
     and coalesce(new.driver_email, '') <> '' then
    perform net.http_post(
      url     := notify_url,
      headers := jsonb_build_object(
                   'Content-Type',  'application/json',
                   'x-shop-secret', notify_secret
                 ),
      body    := jsonb_build_object(
                   'ticket_id',     new.id,
                   'truck_number',  new.truck_number,
                   'driver_name',   new.driver_name,
                   'driver_email',  new.driver_email,
                   'estimated_fix', new.estimated_fix
                 )
    );
  end if;
  return new;
end$$;

drop trigger if exists tickets_notify_ready on tickets;
create trigger tickets_notify_ready
  after update on tickets
  for each row execute function notify_driver_ready();

-- 4) Staff notifications --------------------------------------------------
--    Email dispatch + management when a driver submits a repair request, and
--    on every status change after that. Calls the notify-staff Edge Function
--    (see shop/functions/notify-staff). Separate from the driver email above.
--
--    >>> EDIT notify_url + notify_secret here too, then re-run. <<<
create or replace function notify_staff()
returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  notify_url    text := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/notify-staff';
  notify_secret text := 'YOUR_SHARED_SECRET';
  evt text;
begin
  if tg_op = 'INSERT' then
    evt := 'new_ticket';
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    evt := 'status_change';
  else
    return new;  -- non-status edits (ETA, assignment, etc.) don't email staff
  end if;
  perform net.http_post(
    url     := notify_url,
    headers := jsonb_build_object(
                 'Content-Type',  'application/json',
                 'x-shop-secret', notify_secret
               ),
    body    := jsonb_build_object(
                 'type',           evt,
                 'driver_name',    new.driver_name,
                 'truck_number',   new.truck_number,
                 'trailer_number', new.trailer_number,
                 'status',         new.status::text
               )
  );
  return new;
end$$;

drop trigger if exists tickets_notify_staff_insert on tickets;
create trigger tickets_notify_staff_insert
  after insert on tickets
  for each row execute function notify_staff();

drop trigger if exists tickets_notify_staff_update on tickets;
create trigger tickets_notify_staff_update
  after update on tickets
  for each row execute function notify_staff();

-- ============================================================================
-- SETUP CHECKLIST
--   1. Deploy the Edge Functions:
--        supabase functions deploy notify-driver-ready --no-verify-jwt
--        supabase functions deploy notify-staff --no-verify-jwt
--      (--no-verify-jwt because pg_net calls them with the shared secret, not a
--       user JWT. Each function rejects anyone without the right x-shop-secret.)
--   2. Set their secrets (this build sends through Gmail SMTP):
--        supabase secrets set GMAIL_USER="you@gmail.com"
--        supabase secrets set GMAIL_APP_PASSWORD="<google app password>"   # myaccount.google.com/apppasswords
--        supabase secrets set SHOP_NOTIFY_SECRET=<same long random string as above>
--        supabase secrets set SHOP_STAFF_EMAILS="disp@example.com,boss@example.com"
--        supabase secrets set SHOP_FROM_NAME="Rosedale Shop"               # optional
--   3. Edit notify_url + notify_secret above (both functions) and re-run this file.
-- ============================================================================
