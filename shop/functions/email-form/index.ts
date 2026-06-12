// ============================================================================
// Rosedale Shop Scheduler — email a filled PM form as a PDF attachment.
//
// Supabase Edge Function. Invoked from the browser (Forms tab → "Email") via
// supabase-js `functions.invoke("email-form", ...)`. The shop tech fills a PM
// form in the app, the client flattens it to a PDF with pdf-lib, then POSTs the
// bytes here to be emailed as an attachment.
//
// Reuses the SAME Gmail sender as notify-staff — same SMTP creds, same secrets,
// same denomailer client — so there is no second email setup to maintain. The
// only new capability here is carrying a PDF attachment.
//
// Deploy:  supabase functions deploy email-form
//   (verify_jwt stays ON — the call carries the app's anon key, so the gateway
//    rejects anonymous internet callers before this code runs. Unlike
//    notify-staff, this isn't called by a DB trigger, so it needs no shared
//    secret of its own.)
//
// Secrets (already set for notify-staff — reused as-is):
//   GMAIL_USER          — the sending Gmail address (truckinglifewithshawn@…)
//   GMAIL_APP_PASSWORD  — Google "app password"
//   SHOP_FROM_NAME      — optional display name (defaults to "Rosedale Shop")
//   SHOP_STAFF_EMAILS   — comma-separated default recipients (used when the
//                         client doesn't specify a "to" address)
// ============================================================================
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: {
    form_name?: string;   // human label, e.g. "Tractor PM-A (15,000 mi)"
    filename?: string;     // attachment filename, e.g. "Tractor_PM-A.pdf"
    pdf_base64?: string;   // the filled PDF, base64 (no data: prefix)
    to?: string;           // optional recipient override; falls back to staff
    note?: string;         // optional free-text note from the tech
    from_tech?: string;    // optional "filled by" label for the body
  };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const pdf = (body.pdf_base64 || "").replace(/^data:[^,]*,/, "").trim();
  if (!pdf) return json({ error: "Missing pdf_base64" }, 400);
  if (pdf.length > 18_000_000) return json({ error: "Attachment too large" }, 413); // ~13 MB raw

  const user = Deno.env.get("GMAIL_USER");
  const pass = (Deno.env.get("GMAIL_APP_PASSWORD") || "").replace(/\s+/g, "");
  const fromName = Deno.env.get("SHOP_FROM_NAME") || "Rosedale Shop";
  const staff = (Deno.env.get("SHOP_STAFF_EMAILS") || "")
    .split(",").map((s) => s.trim()).filter(Boolean);

  if (!user || !pass) {
    console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD");
    return json({ error: "Email not configured" }, 500);
  }

  // Recipient: explicit "to" if a valid address, otherwise the staff list.
  let to: string[];
  const wanted = (body.to || "").trim();
  if (wanted) {
    if (!EMAIL_RE.test(wanted)) return json({ error: "Invalid recipient address" }, 400);
    to = [wanted];
  } else {
    to = staff;
  }
  if (!to.length) return json({ error: "No recipient (set SHOP_STAFF_EMAILS or pass 'to')" }, 500);

  const formName = (body.form_name || "PM form").toString().slice(0, 200);
  const filename = (body.filename || "form.pdf").toString().replace(/[^\w.\- ]+/g, "_").slice(0, 120)
    || "form.pdf";
  const note = (body.note || "").toString().slice(0, 2000);
  const tech = (body.from_tech || "").toString().slice(0, 120);

  const lines = [
    `A completed PM form is attached: ${formName}.`,
    tech ? `Filled by: ${tech}.` : "",
    note ? `\nNote from the shop:\n${note}` : "",
    `\n— Rosedale Shop Scheduler`,
  ].filter(Boolean);
  const text = lines.join("\n");
  const esc = (s: string) =>
    s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
  const html =
    `<p>A completed PM form is attached: <b>${esc(formName)}</b>.</p>` +
    (tech ? `<p>Filled by: ${esc(tech)}.</p>` : "") +
    (note ? `<p><b>Note from the shop:</b><br>${esc(note).replace(/\n/g, "<br>")}</p>` : "") +
    `<p>— Rosedale Shop Scheduler</p>`;

  const client = new SMTPClient({
    connection: {
      hostname: "smtp.gmail.com",
      port: 465,
      tls: true,
      auth: { username: user, password: pass },
    },
  });

  try {
    await client.send({
      from: `${fromName} <${user}>`,
      to,
      subject: `PM form — ${formName}`,
      content: text,
      html,
      attachments: [{
        filename: filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`,
        contentType: "application/pdf",
        encoding: "base64",
        content: pdf,
      }],
    });
    await client.close();
  } catch (e) {
    console.error("SMTP send failed:", e);
    return json({ error: "Email send failed" }, 502);
  }

  return json({ ok: true, sent_to: to });
});
