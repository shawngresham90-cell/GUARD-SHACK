// ============================================================================
// Rosedale Shop Scheduler — "your truck is ready" email, via Gmail SMTP.
//
// Supabase Edge Function. Invoked by the tickets_notify_ready database trigger
// (via pg_net) the moment a ticket's status flips to "completed". It emails the
// driver that their truck is ready for pickup. Email only — no SMS.
//
// Deploy:  supabase functions deploy notify-driver-ready --no-verify-jwt
// Secrets (set with `supabase secrets set ...`):
//   GMAIL_USER          — the sending Gmail address (e.g. you@gmail.com)
//   GMAIL_APP_PASSWORD  — a Google "app password" for that account (NOT the
//                         normal password). Create one at
//                         https://myaccount.google.com/apppasswords
//   SHOP_NOTIFY_SECRET  — shared secret; must match notify_secret in the SQL trigger
//   SHOP_FROM_NAME      — optional display name (defaults to "Rosedale Shop")
//
// Deployed with --no-verify-jwt, so it checks the shared secret itself:
// requests without a matching x-shop-secret header are rejected.
// ============================================================================
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

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

  let body: { truck_number?: string; driver_name?: string; driver_email?: string };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { truck_number, driver_name, driver_email } = body;
  if (!driver_email) return new Response("No driver email on ticket", { status: 200 });

  const user = Deno.env.get("GMAIL_USER");
  // App passwords are displayed with spaces; SMTP wants them stripped.
  const pass = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");
  const fromName = Deno.env.get("SHOP_FROM_NAME") || "Rosedale Shop";
  if (!user || !pass) {
    console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
    return new Response("Email not configured", { status: 500 });
  }

  const truck = truck_number ? `Truck ${truck_number}` : "Your truck";
  const hello = driver_name ? `Hi ${driver_name},` : "Hi,";
  const subject = `${truck} is ready for pickup`;
  const text =
    `${hello}\n\n${truck} is finished and ready for pickup at the Rosedale shop.\n\nThanks,\nRosedale Shop`;
  const html =
    `<p>${escapeHtml(hello)}</p>` +
    `<p><strong>${escapeHtml(truck)}</strong> is finished and ready for pickup at the Rosedale shop.</p>` +
    `<p>Thanks,<br>Rosedale Shop</p>`;

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({ from: `${fromName} <${user}>`, to: driver_email, subject, content: text, html });
    await client.close();
  } catch (e) {
    console.error("SMTP send failed:", e);
    return new Response("Email send failed", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
