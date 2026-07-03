// ============================================================================
// Interstate Truck Stop Directory — Truck Parking Club listing sync.
//
// Supabase Edge Function. Pulls every listing from the Truck Parking Club
// partner Public Listings API (v2) and upserts them into `tpc_locations`,
// which the directory's state pages (truckstops/index.html) lazy-load into
// the "Reservable paid parking" section with affiliate Reserve links.
//
// Invoked by .github/workflows/sync-tpc.yml on a daily schedule (or by hand:
// POST with the x-tpc-sync-secret header). Safe to run as often as you like —
// it upserts by tpc_id. Rows with tpc_id IS NULL (hand-entered locations)
// are never modified or deactivated by the sync.
//
// Deploy:  supabase functions deploy tpc-sync --no-verify-jwt
// Secrets (set with `supabase secrets set ...`):
//   TPC_API_KEY      — Truck Parking Club partner API key (Bearer token)
//   TPC_PARTNER_ID   — your partner ID (makes partner_url carry your tracking)
//   TPC_SYNC_SECRET  — shared secret; must match the GitHub repo secret used
//                      by the sync-tpc workflow
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//
// Deployed with --no-verify-jwt; it checks the shared secret itself.
// ============================================================================

const TPC_API = "https://api-prod.truckparkingclub.com/partner/public-listings/v2";
const PAGE_SIZE = 100;
const MAX_PAGES = 100; // safety cap

const STATE_ABBR: Record<string, string> = {
  alabama: "AL", alaska: "AK", arizona: "AZ", arkansas: "AR", california: "CA",
  colorado: "CO", connecticut: "CT", delaware: "DE", "district of columbia": "DC",
  florida: "FL", georgia: "GA", hawaii: "HI", idaho: "ID", illinois: "IL",
  indiana: "IN", iowa: "IA", kansas: "KS", kentucky: "KY", louisiana: "LA",
  maine: "ME", maryland: "MD", massachusetts: "MA", michigan: "MI",
  minnesota: "MN", mississippi: "MS", missouri: "MO", montana: "MT",
  nebraska: "NE", nevada: "NV", "new hampshire": "NH", "new jersey": "NJ",
  "new mexico": "NM", "new york": "NY", "north carolina": "NC",
  "north dakota": "ND", ohio: "OH", oklahoma: "OK", oregon: "OR",
  pennsylvania: "PA", "rhode island": "RI", "south carolina": "SC",
  "south dakota": "SD", tennessee: "TN", texas: "TX", utah: "UT",
  vermont: "VT", virginia: "VA", washington: "WA", "west virginia": "WV",
  wisconsin: "WI", wyoming: "WY",
};

function stateAbbr(s: unknown): string | null {
  if (typeof s !== "string" || !s.trim()) return null;
  const t = s.trim();
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  return STATE_ABBR[t.toLowerCase()] ?? null;
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function int(v: unknown): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n);
}

// Build a short display string like "from $15/day" out of the API's price
// object. The `lowest` summary may be an object keyed by duration or an
// array of {price, duration} rules, so handle both — and fall back to
// scanning the truck rules if `lowest` is missing.
function priceSummary(price: unknown): string | null {
  const p = price as Record<string, unknown> | null | undefined;
  if (!p || typeof p !== "object") return null;

  const byDuration: Record<string, number> = {};
  const take = (duration: unknown, amount: unknown) => {
    const d = typeof duration === "string" ? duration.toLowerCase() : "";
    const a = num(amount);
    if (!d || a == null) return;
    if (byDuration[d] == null || a < byDuration[d]) byDuration[d] = a;
  };

  const lowest = p.lowest;
  if (Array.isArray(lowest)) {
    for (const r of lowest) take((r as any)?.duration, (r as any)?.price);
  } else if (lowest && typeof lowest === "object") {
    for (const [d, v] of Object.entries(lowest as Record<string, unknown>)) {
      take(d, typeof v === "object" && v !== null ? (v as any).price : v);
    }
  }
  if (!Object.keys(byDuration).length && Array.isArray(p.truck)) {
    for (const r of p.truck) take((r as any)?.duration, (r as any)?.price);
  }

  for (const d of ["day", "hour", "week", "month"]) {
    if (byDuration[d] != null) {
      const amt = byDuration[d];
      const s = Number.isInteger(amt) ? String(amt) : amt.toFixed(2);
      return `from $${s}/${d}`;
    }
  }
  return null;
}

async function fetchAllListings(apiKey: string, partnerId: string) {
  const listings: any[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const url = `${TPC_API}?page=${page}&page_size=${PAGE_SIZE}&partner_id=${encodeURIComponent(partnerId)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!res.ok) {
      throw new Error(`TPC API page ${page} failed: ${res.status} ${await res.text()}`);
    }
    const body = await res.json();
    const data = Array.isArray(body?.data) ? body.data : [];
    listings.push(...data);
    if (!body?.has_more || !data.length) break;
  }
  return listings;
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("TPC_SYNC_SECRET");
  if (!secret || req.headers.get("x-tpc-sync-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  const apiKey = Deno.env.get("TPC_API_KEY");
  const partnerId = Deno.env.get("TPC_PARTNER_ID");
  const sbUrl = Deno.env.get("SUPABASE_URL");
  const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!apiKey || !partnerId || !sbUrl || !sbKey) {
    console.error("Missing TPC_API_KEY, TPC_PARTNER_ID, or Supabase env");
    return new Response("Sync not configured", { status: 500 });
  }

  const runStamp = new Date().toISOString();

  let listings: any[];
  try {
    listings = await fetchAllListings(apiKey, partnerId);
  } catch (e) {
    console.error(String(e));
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Dedupe by id — hitting the same conflict target twice in one upsert
  // statement is a Postgres error. Column names match what the directory's
  // state pages select: spaces / available / rating / book_url / partner_url.
  const seen = new Set<number>();
  const rows = listings
    .filter((l) => {
      const id = int(l?.id);
      if (id == null || !l?.name || seen.has(id)) return false;
      seen.add(id);
      return true;
    })
    .map((l) => ({
      tpc_id: int(l.id),
      name: String(l.name),
      address: l.full_address ?? null,
      city: l.city ?? null,
      state: stateAbbr(l.state),
      zip_code: l.zip_code != null ? String(l.zip_code) : null,
      lat: num(l.lat),
      lng: num(l.lng),
      spaces: int(l.seats),
      available: int(l.available_seats),
      rating: num(l.avg_rating),
      amenities: l.amenities ? String(l.amenities) : null,
      avatar: l.avatar ?? null,
      price: priceSummary(l.price),
      book_url: l.partner_url || l.url || null,
      partner_url: l.partner_url ?? null,
      tpc_url: l.url ?? null,
      active: true,
      last_synced_at: runStamp,
    }));

  const sb = (path: string, opts: RequestInit = {}) =>
    fetch(sbUrl + path, {
      ...opts,
      headers: {
        apikey: sbKey,
        Authorization: `Bearer ${sbKey}`,
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
    });

  if (rows.length) {
    const up = await sb("/rest/v1/tpc_locations?on_conflict=tpc_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify(rows),
    });
    if (!up.ok) {
      const t = await up.text();
      console.error("Upsert failed:", up.status, t);
      return new Response(JSON.stringify({ error: `upsert failed: ${up.status} ${t}` }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Anything API-sourced that this run didn't touch has dropped off the API —
  // hide it. Hand-entered rows (tpc_id IS NULL) are never affected. Skipped
  // entirely when the API returned nothing, so an empty-but-200 response
  // can't wipe the whole directory.
  let deactivated = 0;
  if (!rows.length) {
    const summary = { fetched: listings.length, upserted: 0, deactivated: 0, note: "API returned no listings; deactivation skipped" };
    console.log("tpc-sync:", JSON.stringify(summary));
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } });
  }
  const deact = await sb(
    `/rest/v1/tpc_locations?tpc_id=not.is.null&active=eq.true` +
      `&or=(last_synced_at.is.null,last_synced_at.lt.${encodeURIComponent(runStamp)})`,
    {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ active: false }),
    },
  );
  if (deact.ok) deactivated = ((await deact.json()) as unknown[]).length;
  else console.error("Deactivation step failed:", deact.status, await deact.text());

  const summary = { fetched: listings.length, upserted: rows.length, deactivated };
  console.log("tpc-sync:", JSON.stringify(summary));
  return new Response(JSON.stringify(summary), {
    headers: { "Content-Type": "application/json" },
  });
});
