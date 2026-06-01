-- Seed a default settings row for the signed-in owner (Story 1.1).
-- Safe to run repeatedly: does nothing if a row already exists.
-- dry_run defaults to true so nothing can text until explicitly enabled.
insert into public.settings (owner_id)
values (auth.uid())
on conflict (owner_id) do nothing;
