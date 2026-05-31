# 🤝 Outreach Agent — Trucking Life with Shawn

An AI-powered affiliate-recruiting tool. It finds truck-niche creators on YouTube, pulls their published business email when there is one, and drafts personalized outreach (email, DM, or comment) in your voice. **You review and send** — nothing is auto-sent, so your accounts stay safe and within platform rules.

> One file, no install. Open it in any browser and go.

---

## 🚀 Quick start

1. **Open the app** — double-click `index.html` (or visit your hosted link).
2. **Open ⚙️ Setup** and fill in:
   - **Anthropic API key** — writes the messages. Get one at [console.anthropic.com](https://console.anthropic.com/settings/keys).
   - **YouTube Data API key** — finds creators. Create one in [Google Cloud Console](https://console.cloud.google.com/apis/library/youtube.googleapis.com): enable **YouTube Data API v3**, then make an API key.
   - **Your name / signature** — e.g. `Shawn — Trucking Life with Shawn`.
   - Product, products list, offer, store link, tone come **pre-loaded** with your offer — edit if needed.
3. Click **Save setup**. The badge should read **✓ ready**.

> 🔒 Both keys are stored **only in your browser** (localStorage). They never leave your device except to call those two APIs directly.

---

## 📋 Daily workflow

1. **🔎 Find creators** — type a niche (`trucker vlog`, `CDL`, `OTR life`, `dot inspection`) and set the range (defaults **10k–80k**; your sweet spot is **10k–50k**). Hit **Search channels**.
2. **+ Add to pipeline** the ones that fit.
3. **🔍 Auto-find email** on each card — pulls a published business email from their channel/video descriptions. If none, use the **About page** link and paste it in.
4. **Pick "Draft as"** — Email (YouTube) / DM opener / DM follow-up / Comment.
5. **✨ Draft all (N)** — drafts that type for everyone without a draft yet, personalized one-by-one. Or **✨ Draft pitch** per card.
6. **Review & edit** each draft, then send it your way:
   - **📋 Copy** — for DMs/comments (paste into the DM yourself)
   - **✉ Open in Gmail** — opens a pre-filled Gmail compose window; review, then Send or Save as draft. *No setup.*
   - **📥 Create Gmail drafts** — pushes every drafted email (with an address) straight into your Gmail **Drafts** folder at once. *Optional one-time Google sign-in (see below).*
7. **Advance status** — click the status pill: To contact → Contacted → Replied → Joined.
8. **⬇ Export CSV** anytime to back up your pipeline.

---

## 🧠 What the AI follows (from your playbook)

- Leads with the brand for authority (17 yrs zero violations, CDL instructor, 84K YT).
- Pitches **their 50% commission** — never mentions recruiter overrides.
- **Never promises income figures** ("you'll make $5K/month") — not allowed.
- Personalizes every message so it's never a verbatim blast.

---

## ⚠️ What it does NOT do (on purpose)

- **No auto-DMing / auto-emailing.** YouTube/TikTok/IG have no compliant send API; automating sends gets accounts banned. You send manually.
- **No scraping CAPTCHA-hidden emails.** The About-page email is gated to block bots — the app only reads emails creators *publicly published*.
- **YouTube only** for finding creators — it's the one platform with a real search API. Instagram/TikTok have none.

---

## 📥 Optional: bulk Gmail drafts

The **Create Gmail drafts** button drops your whole day's email pitches into your Gmail Drafts folder in one click. It still **does not send** — you open Gmail, review, and hit send. One-time setup:

1. In [Google Cloud Console](https://console.cloud.google.com/), **enable the Gmail API**.
2. Create an **OAuth 2.0 Client ID → Web application**.
3. Add your hosted page's address (e.g. `https://you.github.io`) as an **Authorized JavaScript origin**.
4. Paste the Client ID into **Setup → Google OAuth Client ID → Save**.
5. Click **🔗 Connect Gmail** and approve the Google sign-in.

> ⚠️ This only works when the app is **hosted over https** (like GitHub Pages) — Google sign-in is blocked from a local `file://` page. If you skip this, just use **✉ Open in Gmail** per email instead.

---

## 🔧 API cost & limits

- **Anthropic** — pay-per-use; each draft is one short request. Sonnet/Haiku are cheap; Opus is priciest. Pick the model in Setup.
- **YouTube Data API** — free tier ≈ 10,000 units/day. A search is ~100 units, so ~100 searches/day plus plenty of channel/email lookups. Fine for daily outreach.

---

## 💾 Notes

- All data (settings, pipeline, drafts) lives in this browser only. Clearing site data wipes it — use **Export CSV** to keep backups.
- Works offline for everything except the two API calls (finding creators / drafting messages).
