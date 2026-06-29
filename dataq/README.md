# DataQ Tracker

A one-file app that helps a carrier or driver **challenge DOT violations** through the
FMCSA [DataQs](https://dataqs.fmcsa.dot.gov/) system. When a roadside inspection
violation or crash is wrong, it still hits your CSA safety score, your insurance, and
your reputation until it's corrected. This app keeps every disputable event in one
place, helps you decide *why* it's wrong, and writes the **Request for Data Review
(RDR)** narrative you paste into the federal portal.

| File | What it is |
|---|---|
| `dataq.html` | The whole app. Open it in any browser (double-click, or host it). |
| `dataq.webmanifest` | Lets you "Add to Home Screen" so it opens like a native app. |

## What it does

- **Dashboard** — open disputes, how many are submitted, how many you've won, and the
  severity points at stake on records still in play.
- **Log a dispute** — inspection/report #, date, state, driver, tractor/trailer, the
  cited violation code, severity weight, and a description.
- **Why it's wrong** — pick from the common, legitimate DataQ grounds (wrong driver,
  wrong carrier, citation dismissed, corrected on the spot, data-entry error,
  non-preventable crash, duplicate, etc.).
- **Build RDR** — turns your entry into a clean, factual Request for Data Review you can
  copy straight into the DataQs "reason for request" box. Edit it first if you like.
- **Track status** — Draft → Submitted → Under review → Approved / Partial / Denied,
  with notes and follow-up reminders per dispute.
- **Backup** — export everything to a JSON file.

## How it works

Everything lives in the browser's `localStorage` on the device — no server, no account,
works fully offline. Use the **Backup** button before clearing browser data or switching
phones.

## Filing the actual dispute

This app *prepares* the request; the FMCSA portal is where you *file* it. Register a free
account at <https://dataqs.fmcsa.dot.gov/>, start a Request for Data Review for the
inspection, paste in the narrative this app built, and attach your evidence (repair
invoices, dismissed citations, dash-cam clips, BOLs, photos) as PDFs. File promptly —
inspection data posts to your record within days.

> Not legal advice. You're responsible for the accuracy of anything you submit to FMCSA.
