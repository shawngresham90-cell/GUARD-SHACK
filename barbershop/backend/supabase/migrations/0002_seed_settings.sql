-- Settings rows are created per-owner at runtime by the app (on first sync),
-- because at migration time there is no authenticated user (auth.uid() is null)
-- and owner_id is the primary key. This guarded insert is therefore a no-op
-- during `supabase db push` and only seeds a row if somehow run with a user.
-- dry_run defaults to true so nothing can text until explicitly enabled.
insert into public.settings (owner_id)
select auth.uid()
where auth.uid() is not null
on conflict (owner_id) do nothing;
