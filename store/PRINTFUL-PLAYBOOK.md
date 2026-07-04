# 🖨️ Printful Playbook — tear down & rebuild for best sellers

This is the exact rebuild plan for the Printful account so the merch lineup
matches the store and every product is a proven seller. Total time: ~45 min.
Every product below maps 1:1 to an item in [`products.js`](products.js).

## Step 0 — Tear down (5 min)

In Printful → your store → **Product templates**: archive/delete anything
that doesn't match the 6 products below. Old one-off designs split your
sales data and clutter fulfillment. Keep the design files (download them
first if you want them), delete the templates.

## Step 1 — Rebuild: the 6-product lineup

These are the blanks the top-grossing POD trucker stores run. Prices below
match the store; margin = store price − typical Printful cost (before
shipping you charge the customer).

| # | Store product | Printful blank to pick | Their cost | You charge | Margin |
|---|---|---|---|---|---|
| 1 | Road Dog Trucker Cap | **Richardson 112 Trucker Cap** (black/orange colorway), embroidered front patch | ~$17 | $29.99 | ~$13 |
| 2 | "Hammer Down" Tee | **Comfort Colors 1717** garment-dyed heavyweight tee, DTG front + back | ~$15 | $28.99 | ~$14 |
| 3 | Midnight Run Hoodie | **Gildan 18500** heavy-blend hoodie, DTG back print + small chest | ~$23 | $46.99 | ~$24 |
| 4 | Coffee. Diesel. Repeat. Tumbler | **20oz stainless tumbler** (straight, cup-holder size) | ~$18 | $32.99 | ~$15 |
| 5 | Not Lost, Just Rerouted Mug | **15oz ceramic mug** | ~$9 | $18.99 | ~$10 |
| 6 | Road Dog Decal 2-Pack | **Kiss-cut sticker sheet** (or 2× die-cut stickers) | ~$4 | $8.99 | ~$5 |

Why these six: hats, heavyweight tees, and hoodies are Printful's top three
apparel categories by revenue; drinkware is the top gift/impulse category;
stickers are the low-friction "support the channel" buy that pads order size.
The Richardson 112 is *literally the trucker cap* — it converts in this niche
better than any snapback.

## Step 2 — Design briefs (what actually sells in this niche)

Bold, readable-from-30-feet text designs beat detailed art in trucking merch.
Two colors max on dark garments (white + orange `#ff5b1f` matches the store).

1. **Trucker cap patch** — "ROAD DOG SUPPLY CO." arched over a simple dog
   silhouette, "EST. 2026" under it. Embroidery, 3 thread colors max.
2. **Hammer Down tee** — back: big "HAMMER DOWN" in a condensed block font
   over a highway horizon line; front: small "Road Dog" chest hit.
3. **Midnight Run hoodie** — back: "MIDNIGHT RUN" + "11 HOURS. NO EXCUSES."
   underneath; front: paw logo on chest.
4. **Tumbler** — "COFFEE. DIESEL. REPEAT." stacked, wrap print.
5. **Mug** — "NOT LOST, JUST REROUTED" with a small route-line squiggle.
6. **Decals** — the dog silhouette + "ROAD DOG" wordmark, white so it reads
   on truck glass.

Make each design once in Canva (free), export PNG at 300 DPI, transparent
background, and reuse the wordmark across all six so the brand compounds.

## Step 3 — Fulfillment loop (until checkout is automated)

The store emails you each order. For merch:
1. Printful → **Orders → Create order → Basic order**.
2. Pick the product template, paste the customer's ship-to from the order
   email, pay Printful their cost. They print and ship — customer pays you
   the store price, you keep the spread.
3. Digital items on the same order: just email the file.

Turn on **Printful → Settings → Packing slip** with the Road Dog logo and
"Thanks for supporting the channel — Trucking Life With Shawn" so every box
markets the brand.

## Step 4 — Make it convert (already wired into the store)

- Anchor pricing: cap and hoodie show a crossed-out "was" price.
- Badges: Best Seller / New / Driver Pick ribbons rotate attention across
  the lineup — update them monthly to whatever actually sells.
- `SHAWN10` code: say it out loud in videos; it's the tracking pixel for
  "did YouTube send this buyer."
- Free shipping at $50 pushes cap+tee or hoodie-alone orders to add the
  decal pack or a download.

## When you want me driving Printful directly

Printful has an API. Create a token at **Printful → Settings → Stores →
Add API token**, paste it in chat, and (network policy permitting) I can
create/update/archive products and templates in the account for you instead
of you clicking through the dashboard.
