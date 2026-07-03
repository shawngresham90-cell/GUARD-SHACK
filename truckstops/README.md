# Interstate Truck Stop Directory

The "book" of the interstates: pick a state → pick an interstate → read down
from mile marker 0. Truck stops, rest areas, service plazas, weigh stations
and truck washes at every marker (filter tabs on each highway page), plus
driver reviews, driver-submitted additions, and reservable **paid parking
from Truck Parking Club**.

| File | What it is |
|---|---|
| `index.html` | The whole app. |
| `admin.html` | PIN-gated moderation page (approve submissions, delete reviews). |
| `data/*.json` | One file per state — the hand-maintained source of truth. Entries carry a `type`: `truck_stop`, `rest_area`, `service_plaza`, `weigh_station`, or `truck_wash`. |
| `build-data.py` | Merges `data/*.json` into `data.js`. **Never edit `data.js` by hand.** |
| `data.js` | Generated. Loaded by `index.html`. |
| `tpc-locations.sql` | Supabase schema for the `tpc_locations` paid-parking table. |
| `functions/tpc-sync/index.ts` | Edge function that pulls the Truck Parking Club partner API into `tpc_locations`. |

## Editing the static directory

Edit the state file in `data/`, then regenerate:

```bash
python3 truckstops/build-data.py
```

## Truck Parking Club paid parking (affiliate)

Each state page lazy-loads the `tpc_locations` table and shows a
**"Reservable paid parking"** section with a "💲 Reserve a spot" button per
location. Listings come from the [Truck Parking Club partner Public Listings
API (v2)](https://api-prod.truckparkingclub.com/partner/public-listings/v2).
The partner API key never touches the browser: the `tpc-sync` edge function
holds it, pulls every listing (paginated), and upserts them into the table —
including `spaces`, live `available` counts, `rating`, a "from $X/day" price,
and your affiliate `partner_url` (stored in `book_url` too, so the Reserve
button is tracked out of the box). The app reads the table with the public
anon key (read-only by RLS).

### One-time setup

1. **Table** — run `tpc-locations.sql` in the Supabase SQL editor (additive,
   safe to re-run).
2. **Function** — from the repo root:
   ```bash
   supabase functions deploy tpc-sync --no-verify-jwt
   supabase secrets set \
     TPC_API_KEY=your-partner-api-key \
     TPC_PARTNER_ID=your-partner-id \
     TPC_SYNC_SECRET=pick-a-long-random-password
   ```
3. **Schedule** — add `TPC_SYNC_SECRET` (same value) as a GitHub repo secret;
   `.github/workflows/sync-tpc.yml` then calls the function every morning.
   Kick the first sync manually from the Actions tab ("Run workflow"), or:
   ```bash
   curl -X POST https://mmnvcbejjdweetnxncfi.supabase.co/functions/v1/tpc-sync \
     -H "x-tpc-sync-secret: $TPC_SYNC_SECRET"
   ```

### Sync behavior

- Upserts by `tpc_id`; safe to run any time.
- `active` is the sync's: listed in the API → `true`, dropped → `false`.
- Rows you add by hand in the Supabase table editor (leave `tpc_id` null)
  are never modified or deactivated by the sync.
- If the API ever returns zero listings, the sync skips the deactivation
  pass, so a bad response can't blank the paid-parking section.
