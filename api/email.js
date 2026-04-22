// Vercel serverless function: sends the yard check report via Resend.
// Env vars required:
//   RESEND_API_KEY   - from https://resend.com/api-keys
//   RECIPIENT_EMAIL  - where reports are sent
//   FROM_EMAIL       - (optional) defaults to onboarding@resend.dev

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).json({ error: 'POST only' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.RECIPIENT_EMAIL;
    const from = process.env.FROM_EMAIL || 'Yard Check <onboarding@resend.dev>';

    if (!apiKey || !to) {
        return res.status(500).json({
            error: 'Missing RESEND_API_KEY or RECIPIENT_EMAIL env vars'
        });
    }

    let body = req.body;
    if (typeof body === 'string') {
        try { body = JSON.parse(body); } catch { body = {}; }
    }
    const report = (body && body.report) || '';
    if (!report) return res.status(400).json({ error: 'Missing report body' });

    const dateStr = new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    const subject = `Yard Check - ${dateStr}`;

    // Render plain text as a simple HTML report too
    const html = `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:14px;white-space:pre-wrap">${escapeHtml(report)}</pre>`;

    try {
        const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from,
                to: [to],
                subject,
                text: report,
                html
            })
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) {
            return res.status(r.status).json({ error: data.message || 'Resend error', details: data });
        }
        return res.status(200).json({ ok: true, id: data.id });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
