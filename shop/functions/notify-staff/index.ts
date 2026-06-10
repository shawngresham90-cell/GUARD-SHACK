// ============================================================================
// Rosedale Shop Scheduler — staff notifications, via Gmail SMTP.
//
// Supabase Edge Function. Invoked by DB triggers (pg_net):
//   * driver submits a repair request (ticket INSERT)  → type "new_ticket"
//   * any ticket status change (UPDATE)                → type "status_change"
// Emails dispatch + management. Separate from the driver "truck ready" email
// (notify-driver-ready).
//
// Deploy:  supabase functions deploy notify-staff --no-verify-jwt
// Secrets (set with `supabase secrets set ...`):
//   GMAIL_USER          — the sending Gmail address
//   GMAIL_APP_PASSWORD  — a Google "app password" (myaccount.google.com/apppasswords)
//   SHOP_NOTIFY_SECRET  — shared secret; must match the SQL trigger
//   SHOP_STAFF_EMAILS   — comma-separated recipients,
//                         e.g. "DISP_RTI@rosedale.ca,cdean@rosedaletransport.com"
//   SHOP_FROM_NAME      — optional display name (defaults to "Rosedale Shop")
//
// Deployed with --no-verify-jwt; it checks the shared secret itself.
// ============================================================================
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const STATUS_LABEL: Record<string, string> = {
  intake: "Intake",
  in_progress: "Work Started",
  waiting_parts: "Waiting on Parts",
  completed: "Finished",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = Deno.env.get("SHOP_NOTIFY_SECRET");
  if (!secret || req.headers.get("x-shop-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    type?: string;
    driver_name?: string;
    truck_number?: string;
    trailer_number?: string | null;
    status?: string;
    test_recipient?: string; // secret-gated test hook: redirects the email
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { type, driver_name, truck_number, trailer_number, status } = body;
  if (type !== "new_ticket" && type !== "status_change") {
    return new Response("Unknown notification type", { status: 400 });
  }

  const user = Deno.env.get("GMAIL_USER");
  const pass = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");
  const fromName = Deno.env.get("SHOP_FROM_NAME") || "Rosedale Shop";
  const staff = (Deno.env.get("SHOP_STAFF_EMAILS") || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!user || !pass || !staff.length) {
    console.error("Missing GMAIL_USER, GMAIL_APP_PASSWORD, or SHOP_STAFF_EMAILS");
    return new Response("Email not configured", { status: 500 });
  }

  const driver = driver_name || "Unknown driver";
  const unit = `truck #${truck_number || "?"}${trailer_number ? ` / trailer #${trailer_number}` : ""}`;

  let subject: string;
  let line: string;
  if (type === "new_ticket") {
    subject = `New repair request — Truck ${truck_number || "?"}`;
    line = `Driver ${driver} with ${unit} has submitted a repair request.`;
  } else {
    const label = STATUS_LABEL[status || ""] || status || "Updated";
    subject = `Truck ${truck_number || "?"} — ${label}`;
    line = `Driver ${driver} — ${unit} — status changed to: ${label}.`;
  }

  const to = body.test_recipient ? [body.test_recipient] : staff;
  const text = `${line}\n\n— Rosedale Shop Scheduler`;
  const html = `<p>${escapeHtml(line)}</p><p>— Rosedale Shop Scheduler</p>`;

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({ from: `${fromName} <${user}>`, to, subject, content: text, html });
    await client.close();
  } catch (e) {
    console.error("SMTP send failed:", e);
    return new Response("Email send failed", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true, sent_to: to }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
