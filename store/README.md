# 🐕 Road Dog Supply Co. — the trucker store

A complete, zero-backend online store: product catalog, search/filter/sort,
cart with discount codes and a free-shipping bar, PayPal checkout, Amazon
affiliate gear, and instant-margin digital products. It's plain HTML/JS like
the rest of this repo — no build step, deploys anywhere that serves static
files (it's live at `/store/` on the main site).

## 💵 How this store makes money (3 streams)

| Stream | What it is | Margin | Setup |
|---|---|---|---|
| **Digital downloads** | Expense tracker, trip planner, pre-trip checklist pack | ~100% | None — orders arrive by email from day one |
| **Merch** | Hats, tees, hoodies, mugs, decals — printed per-order | ~40–60% | Free Printful/Printify account |
| **Amazon affiliate** | CB radios, dash cams, comfort & safety gear | 3–4% of whatever they buy | Free Amazon Associates account |

Orders work **immediately with zero setup**: checkout falls back to a
pre-filled email order sent to the address in `products.js`, and you invoice
the buyer from PayPal/Cash App. The two 5-minute signups below upgrade that
to fully automatic.

## ⚡ 15-minute setup checklist

1. **PayPal (real checkout, ~10 min)** — free Business account at
   [paypal.com/business](https://www.paypal.com/business), then
   [developer.paypal.com](https://developer.paypal.com) → Apps & Credentials →
   **Live** → Create App → copy the **Client ID** into
   `CONFIG.paypalClientId` in [`products.js`](products.js).
   PayPal buttons replace the email fallback instantly.
2. **Amazon Associates (~5 min)** — sign up at
   [affiliate-program.amazon.com](https://affiliate-program.amazon.com), copy
   your tag (`something-20`) into `CONFIG.amazonTag`. Every "View on Amazon"
   click now earns commission on the shopper's whole session.
3. **Printful (when the first merch order lands)** — free account at
   [printful.com](https://www.printful.com); order the item shipped straight
   to the customer. You keep the difference between your price and theirs.
4. **Digital delivery** — email the file to the buyer after payment, or host
   the file and put its URL in the product's `download` field.

## 🛠 Everyday edits (all in `products.js`)

- **Add/change a product** — copy any object in `PRODUCTS`, give it a unique
  `id`. `type: "direct"` = sold by you (cart/PayPal); `type: "affiliate"` =
  Amazon link built from the `search` field.
- **Prices, sale ribbons** — `price`, optional `compareAt` (strikethrough)
  and `badge` (corner ribbon).
- **Discount codes** — `CONFIG.discountCodes` (`SHAWN10` = 10% off; shout it
  out in videos to track what converts).
- **Shipping** — `CONFIG.freeShippingThreshold` and `CONFIG.flatShipping`.
  Digital-only carts never charge shipping.

## 📣 Day-one traffic plan

You already own the audience — point it here:

- Link `/store/` in every YouTube description and pinned comment, with the
  `SHAWN10` code as the call-to-action.
- The other sites in this repo (truck stop directory, Truckin' Life) link to
  the store from their footers — drivers using the free tools see the store.
- Mention one specific product per video ("the exact dash cam I run is on the
  store page") — affiliate clicks convert far better with a reason.
