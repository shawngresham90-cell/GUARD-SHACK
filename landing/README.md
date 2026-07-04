# Trucking Life with Shawn — landing page (clean, deployable)

This is a **de-bundled, editable, deploy-ready** version of the main
`Trucking Life with Shawn` homepage. It was rebuilt from the Base44 single-file
export so that:

- **The email capture actually works on Netlify** (see below).
- Images are real files you can swap in seconds (in `assets/`).
- The page loads ~15× faster (images went from ~20 MB to ~1.4 MB).

## Files

| File | What it is |
|------|-----------|
| `index.html` | The homepage |
| `thanks.html` | Post-signup thank-you page (with the $49 bundle upsell) |
| `assets/styles.css` | All styling |
| `assets/app.js` | Mobile nav + Netlify AJAX form submit |
| `assets/*.jpg` | Optimized photos / book covers |
| `netlify.toml` | Deploy + headers config |

## ⚠️ Why the old email form was NOT capturing emails

The exported homepage stored the whole page (including the signup `<form>`)
**inside a JavaScript string**. Netlify only registers a form for capture if it
finds a real static `<form data-netlify>` in the HTML **at deploy time** — it
never sees a form that only exists inside a script. So on the old build,
submitted emails were silently dropped.

**The fix** (already in `index.html`): a hidden static detection form near the
top of the page —

```html
<form name="free-dot-guide" data-netlify="true" data-netlify-honeypot="bot-field" hidden>
  <input type="hidden" name="form-name" value="free-dot-guide">
  <input type="text" name="bot-field">
  <input type="email" name="email">
  <input type="text" name="source">
</form>
```

Every field used by the visible forms must exist in this hidden form, or Netlify
ignores it. **Do not delete this block.**

## How the email flow works (Stan Store first)

When a driver submits the free-guide form:

1. Netlify silently logs the email (your **backup list** —
   Netlify → Forms → `free-dot-guide`).
2. The driver is immediately redirected to the **Stan Store free-guide page**
   (`stan.store/TRUCKINGLIFEWITHSHAWN/p/free-7-dot-inspection-mistakes...`),
   where Stan delivers the guide and captures the email into your **Stan
   audience** — one list, same place as your sales.

The redirect target is the `data-redirect` attribute on each `<form>` in
`index.html` — change the URL there if the Stan product link ever changes.
If JavaScript fails, the form falls back to a native POST → `/thanks.html`,
which also links to the Stan page.

## How to deploy (so emails get captured)

1. Deploy this `landing/` folder to **Netlify** (drag-and-drop the folder, or
   connect the repo and set the base directory to `landing`).
2. Netlify auto-detects the `free-dot-guide` form on deploy.
3. Test: submit an email on the live site — you should land on the Stan Store
   guide page, and the entry should appear under
   **Netlify → your site → Forms → free-dot-guide**.
4. Optional: turn on **Netlify → Forms → Form notifications** to email every
   new lead to `shawngresham90@gmail.com`.

Forms only work on Netlify's hosted platform — opening `index.html` from your
desktop or another host will show the thank-you page but will **not** store the
email.

## Swapping images

Drop a replacement into `assets/` with the same filename (keep them web-sized —
under ~300 KB, longest edge ~1200 px). `book-carnivore-cookbook.jpg` is the only
low-resolution cover (297 px wide from the source export) — re-export it larger
when you can.
