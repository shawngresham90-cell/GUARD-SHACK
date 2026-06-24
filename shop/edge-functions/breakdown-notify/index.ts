// ============================================================================
// breakdown-notify — Supabase Edge Function (Deno)
//
// Fires automatically when a driver files a roadside breakdown, and emails the
// breakdown team, the shop, the driver manager, and (if we have it) a
// confirmation to the driver. Priority "unsafe location" reports get an URGENT
// subject and go out the same way.
//
// WIRING (see shop/SETUP.md):
//   1. Deploy:  supabase functions deploy breakdown-notify
//   2. Set secrets (Dashboard → Edge Functions → breakdown-notify → Secrets,
//      or `supabase secrets set KEY=value`):
//        RESEND_API_KEY        re_xxx           (from resend.com)
//        FROM_EMAIL            breakdowns@yourdomain.com   (a verified sender)
//        BREAKDOWN_TEAM_EMAIL  team@...
//        SHOP_EMAIL            shop@...
//        DRIVER_MANAGER_EMAIL  manager@...
//        WEBHOOK_SECRET        any-long-random-string
//   3. Database → Webhooks → new webhook on table `breakdowns`, event INSERT,
//      pointing at this function, with header `x-webhook-secret: <WEBHOOK_SECRET>`.
//
// Until RESEND_API_KEY is set the function logs and returns 200, so the app
// works end-to-end before email is turned on.
// ============================================================================

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "breakdowns@example.com";
const BREAKDOWN_TEAM_EMAIL = Deno.env.get("BREAKDOWN_TEAM_EMAIL") ?? "";
const SHOP_EMAIL = Deno.env.get("SHOP_EMAIL") ?? "";
const DRIVER_MANAGER_EMAIL = Deno.env.get("DRIVER_MANAGER_EMAIL") ?? "";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

const ISSUE_LABELS: Record<string, string> = {
  tire: "Tire", engine: "Engine", coolant_leak: "Coolant Leak", air_leak: "Air Leak",
  electrical: "Electrical", def_issue: "DEF Issue", dpf_regen: "DPF Regen",
  trailer_repair: "Trailer Repair", accident: "Accident", tow: "Need Tow", other: "Other",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]!));
}

// deno-lint-ignore no-explicit-any
function buildBody(b: any): string {
  const maps = (b.gps_lat != null && b.gps_lng != null)
    ? `https://www.google.com/maps?q=${b.gps_lat},${b.gps_lng}`
    : null;
  const rows: [string, string | null][] = [
    ["Truck", b.truck_number],
    ["Trailer", b.trailer_number],
    ["Driver", b.driver_name],
    ["Phone", b.driver_phone],
    ["Issue", ISSUE_LABELS[b.issue_type] ?? b.issue_type],
    ["Details", b.issue_notes],
    ["Loaded?", b.loaded === true ? "Loaded" : b.loaded === false ? "Empty" : null],
    ["Location", b.location_text],
    ["Highway / Exit", b.highway_exit],
    ["City / State", b.city_state],
    ["Direction", b.direction],
    ["GPS", maps ? `<a href="${maps}">${b.gps_lat}, ${b.gps_lng}</a>` : null],
  ];
  const list = rows
    .filter(([, v]) => v != null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666"><b>${esc(k)}</b></td><td style="padding:4px 0">${k === "GPS" ? v : esc(v)}</td></tr>`)
    .join("");
  const banner = b.priority
    ? `<p style="background:#e5484d;color:#fff;padding:10px 14px;border-radius:8px;font-weight:bold">🚨 UNSAFE LOCATION — PRIORITY ROAD CALL</p>`
    : "";
  return `<div style="font-family:system-ui,sans-serif;max-width:560px">
    ${banner}
    <h2 style="margin:0 0 8px">Roadside Breakdown Reported</h2>
    <table style="border-collapse:collapse">${list}</table>
    ${maps ? `<p style="margin-top:14px"><a href="${maps}" style="background:#f5872b;color:#1a1208;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:bold">📍 Open location in Maps</a></p>` : ""}
  </div>`;
}

async function sendEmail(to: string[], subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) console.error("Resend error", res.status, await res.text());
}

Deno.serve(async (req) => {
  // Verify the webhook secret (skip the check only if none is configured yet).
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("forbidden", { status: 403 });
  }

  let payload: { record?: Record<string, unknown>; type?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response("bad request", { status: 400 });
  }
  const b = payload.record;
  if (!b) return new Response("no record", { status: 200 });

  if (!RESEND_API_KEY) {
    console.log("breakdown-notify: RESEND_API_KEY unset — skipping email for", b.truck_number);
    return new Response(JSON.stringify({ ok: true, skipped: "no RESEND_API_KEY" }), { status: 200 });
  }

  const html = buildBody(b);
  const issue = ISSUE_LABELS[b.issue_type as string] ?? b.issue_type;
  const prefix = b.priority ? "🚨 URGENT — UNSAFE LOCATION — " : "";
  const subject = `${prefix}Breakdown: Truck ${b.truck_number} — ${issue}`;

  const staff = [BREAKDOWN_TEAM_EMAIL, SHOP_EMAIL, DRIVER_MANAGER_EMAIL].filter(Boolean) as string[];
  try {
    if (staff.length) await sendEmail(staff, subject, html);
    if (b.driver_email) {
      await sendEmail([b.driver_email as string],
        `We got your breakdown report — Truck ${b.truck_number}`,
        `<div style="font-family:system-ui,sans-serif"><p>Thanks ${esc(b.driver_name)} — your breakdown was received and the team has been alerted. We'll be in touch shortly. You can also check status from the app.</p></div>`);
    }
  } catch (e) {
    console.error("breakdown-notify send failed", e);
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
