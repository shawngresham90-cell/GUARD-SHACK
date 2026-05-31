# BMAD Planning — Chair Cash Automatic Reminders Backend

These are **BMAD-METHOD planning artifacts** for turning Chair Cash's one-tap
reminders into fully-automatic SMS reminders (the backend described in
[`../barbershop-auto-reminders-spec.md`](../barbershop-auto-reminders-spec.md)).

They follow the BMAD document flow so the work can be picked up by the BMAD dev
workflow (or any developer) story-by-story:

| File | BMAD role | Purpose |
| --- | --- | --- |
| [`prd.md`](prd.md) | PM (Product Manager) | Goals, requirements, epics and the story breakdown |
| [`architecture.md`](architecture.md) | Architect | Tech stack, data models, APIs, workflows, deployment |
| [`stories/`](stories/) | Scrum Master shard | One self-contained, implementable story per file |

## How to use these

1. Read `prd.md` for the *what* and `architecture.md` for the *how*.
2. Implement stories in order (`1.1` → `1.2` → … ). Each story file is meant to
   be runnable on its own with its acceptance criteria as the definition of done.
3. Update each story's **Status** (`Draft → Approved → InProgress → Done`) as it
   moves.

> These are documentation only — no application code is added by this set.
