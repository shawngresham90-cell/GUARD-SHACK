# 📊 Spreadsheet Hub

A system for keeping up with your different Google Sheets so **Claude can read and auto-update them through chat**.

The spreadsheets themselves live in your Google Drive (they stay normal Google
Sheets you can open and edit by hand any time). This folder is the *control
panel* — it tells Claude which sheets to track, what each one is for, and the
rules for updating them so edits stay consistent from one chat to the next.

---

## How it works

1. **`registry.json`** lists every sheet Claude tracks — its Google ID, link,
   purpose, column headers, and update rules.
2. In any chat, you say what changed in plain English, e.g.
   - *"In the founders tracker, mark Sean as responded — he said good."*
   - *"Add a new vendor to Rosedale-Vendors: ACME Tires, contact Joe, tires, verified."*
   - *"Add this week's row to the weekly briefing: idle 30.5%, MPG 7.09."*
3. Claude looks up the sheet in `registry.json`, reads the relevant rows,
   makes the change, and tells you what it did (with a link).

You never have to remember sheet IDs or column order — that's what the registry
is for.

---

## One-time setup (required for editing)

**Reading** sheets already works. To let Claude **write/update** sheets, the
Google Sheets connection has to be authorized once:

- Open Claude's connector / Zapier settings and authorize **Google Sheets**.
- After that, Claude can add rows, update rows, look up rows, create new sheets,
  format cells, etc. — all from chat.

Until that's connected, Claude can still read every sheet and draft the exact
changes; it just can't push the edit.

> **Native Google Sheets only.** The write actions work on real Google Sheets.
> A spreadsheet uploaded as `.xlsx` (like the Weekly Briefing) must first be
> converted: open it in Sheets → **File → Save as Google Sheets**, then update
> its `id` / `format` / `url` in `registry.json`.

---

## Currently tracked

| Sheet | What it tracks | Editable |
|-------|----------------|----------|
| **CDL School Founder Text Tracker** | Founder outreach — who was texted/called and their reply | ✅ |
| **Rosedale-Vendors** | Vendor / sponsor contacts + sponsorship angle + status | ✅ |
| **Rosedale Weekly Briefing** | Weekly fleet idle %, MPG, shop activity | ⚠️ convert from .xlsx first |

(See `registry.json` for full details, IDs, and column lists.)

---

## Adding a new sheet to track

Just tell Claude in chat: *"Start tracking my &lt;sheet name&gt; sheet."*
Claude will find it in your Drive and add it to `registry.json`. Or add it by
hand — each entry needs:

```json
{
  "key": "short-id",
  "title": "Exact sheet name",
  "id": "google-spreadsheet-id-from-the-url",
  "format": "google-sheet",
  "worksheet": "Sheet1",
  "purpose": "What this sheet is for.",
  "key_column": "Column used to match a row",
  "columns": ["Col A", "Col B", "..."],
  "update_rules": "How Claude should decide what to add/change.",
  "editable": true
}
```

The `id` is the long string in the sheet's URL:
`https://docs.google.com/spreadsheets/d/`**`THIS_PART`**`/edit`

---

## How Claude operates this (notes for future chats)

When asked to update a tracked sheet:

1. Read `spreadsheets/registry.json` to resolve the sheet `id`, `worksheet`,
   `columns`, `key_column`, and `update_rules`.
2. **Read before write** — look up the target row(s) by `key_column` to confirm
   you're editing the right thing and to avoid duplicates.
3. Use the Google Sheets tools (via the connected integration):
   - look up / get rows to find the match,
   - `add_row` for new entries, `update_row` to change an existing one.
4. Match the existing column order and value style (e.g. `y` vs `Yes`).
5. Report back what changed and include the sheet link.
6. If a sheet's columns drift from `registry.json`, update the registry too.
