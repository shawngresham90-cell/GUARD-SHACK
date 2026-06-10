// ============================================================================
// Rosedale Shop Scheduler — "your truck is ready" email
//
// Supabase Edge Function. Invoked by the tickets_notify_ready database trigger
// (via pg_net) the moment a ticket's status flips to "completed". It emails the
// driver that their truck is ready for pickup. Email only — no SMS.
//
// Deploy:  supabase functions deploy notify-driver-ready --no-verify-jwt
// Secrets: RESEND_API_KEY      — API key for Resend (https://resend.com)
//          SHOP_FROM_EMAIL     — verified sender, e.g. "Rosedale Shop <shop@yourdomain.com>"
//          SHOP_NOTIFY_SECRET  — shared secret; must match notify_secret in the SQL trigger
//
// The function is deployed with --no-verify-jwt, so it checks the shared secret
// itself: requests without a matching x-shop-secret header are rejected.
// ============================================================================

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const secret = Deno.env.get("SHOP_NOTIFY_SECRET");
  if (!secret || req.headers.get("x-shop-secret") !== secret) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: {
    truck_number?: string;
    driver_name?: string;
    driver_email?: string;
    estimated_fix?: string | null;
  };
  try {
    body = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }

  const { truck_number, driver_name, driver_email } = body;
  if (!driver_email) {
    return new Response("No driver email on ticket", { status: 200 });
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("SHOP_FROM_EMAIL");
  if (!apiKey || !from) {
    console.error("Missing RESEND_API_KEY or SHOP_FROM_EMAIL");
    return new Response("Email not configured", { status: 500 });
  }

  const truck = truck_number ? `Truck ${truck_number}` : "Your truck";
  const hello = driver_name ? `Hi ${driver_name},` : "Hi,";
  const subject = `${truck} is ready for pickup`;
  const text =
    `${hello}\n\n` +
    `${truck} is finished and ready for pickup at the Rosedale shop.\n\n` +
    `Thanks,\nRosedale Shop`;
  const html =
    `<p>${escapeHtml(hello)}</p>` +
    `<p><strong>${escapeHtml(truck)}</strong> is finished and ready for pickup at the Rosedale shop.</p>` +
    `<p>Thanks,<br>Rosedale Shop</p>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: driver_email, subject, text, html }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("Email send failed:", res.status, detail);
    return new Response("Email send failed", { status: 502 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!)
  );
}
