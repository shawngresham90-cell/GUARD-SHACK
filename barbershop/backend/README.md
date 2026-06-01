# Chair Cash — Backend

Backend for fully-automatic SMS reminders. See the plan in
[`../bmad/`](../bmad/) (PRD, architecture, and per-story breakdown).

## Status
- ✅ **Story 1.1 — Supabase project & schema** (this commit): migration + seed.
- ⬜ 1.2 app→cloud sync · ⬜ 2.x Twilio · ⬜ 3.x scheduler · ⬜ 4.1 dashboard.

## Layout
```
backend/
  supabase/
    migrations/
      0001_init.sql        # tables, indexes, RLS
      0002_seed_settings.sql  # single settings row with safe defaults (dry_run = true)
  .env.example             # names of the secrets you'll set (no real values)
```

## What you need to do (Story 1.1)
1. Create a free project at https://supabase.com
2. Install the CLI: `npm i -g supabase` (or `npx supabase`)
3. From this folder:
   ```bash
   supabase link --project-ref <your-project-ref>
   supabase db push          # applies migrations/0001 + 0002
   ```
4. Confirm the four tables exist in the Supabase dashboard.

No secrets are committed. `dry_run` defaults to **true**, so even once later
stories add sending, nothing can text until you explicitly flip it.

## Next
Story 1.2 (`../bmad/stories/1.2.app-to-cloud-sync.md`) wires the app to push
customers/appointments here using the **anon** key + row-level security.
