/* =========================================================================
   ROAD DOG SUPPLY CO. — store configuration + product catalog
   =========================================================================
   Everything a non-coder needs to touch lives in THIS file.

   ── 15-MINUTE PATH TO REVENUE ──────────────────────────────────────────
   1. PAYPAL (direct sales): create a free PayPal Business account at
      https://www.paypal.com/business → developer.paypal.com → Apps &
      Credentials → LIVE → Create App → copy the Client ID and paste it
      into CONFIG.paypalClientId below. Cart checkout goes live instantly.
   2. AMAZON (affiliate commissions): join Amazon Associates at
      https://affiliate-program.amazon.com (free) and paste your tracking
      tag (looks like "yourname-20") into CONFIG.amazonTag below. Every
      "View on Amazon" click is credited to you — 24-hour cookie, you earn
      on whatever they buy.
   3. Until you do either of those, the store STILL takes orders: checkout
      falls back to a pre-filled email order sent to CONFIG.orderEmail,
      and you invoice the customer from PayPal/Cash App manually.

   Merch fulfillment: connect a free Printful (printful.com) or Printify
   account to fulfill hats/tees/hoodies per-order — no inventory, they
   print and ship when you get paid. Digital products: email the file to
   the buyer, or paste a hosted download link into the product's
   `download` field for instant delivery.
   ======================================================================= */

const CONFIG = {
  storeName: "Road Dog Supply Co.",
  tagline: "Gear that earns its keep. Picked by a driver, not a marketer.",
  brand: "Trucking Life With Shawn",

  // PayPal LIVE Client ID. Empty string = checkout falls back to email orders.
  paypalClientId: "",

  // Amazon Associates tracking tag, e.g. "truckinshawn-20".
  // Empty string = affiliate buttons still work, just uncredited.
  amazonTag: "",

  // Where email-fallback orders and customer questions go.
  orderEmail: "shawngresham90@gmail.com",

  currency: "USD",

  // Free-shipping motivator shown as a progress bar in the cart.
  freeShippingThreshold: 50,
  flatShipping: 5.99,

  // Discount codes: CODE → fraction off the merchandise subtotal.
  discountCodes: {
    SHAWN10: 0.10,   // shout it out in videos
    ROADDOG15: 0.15, // email-list signup reward
  },
};

/* =========================================================================
   PRODUCTS
   -------------------------------------------------------------------------
   type: "direct"    → added to cart, paid via PayPal / email order.
                       (merch = fulfill via Printful; digital = send file)
   type: "affiliate" → "View on Amazon" button, earns commission via
                       CONFIG.amazonTag. `search` is the Amazon search
                       query — search links never go dead like ASINs do.
   Fields: id (unique!), name, price, category, emoji (used as the product
   art), desc, badge (optional ribbon), digital:true for downloads,
   download (optional URL for instant delivery), compareAt (optional
   "was" price).
   ======================================================================= */

const PRODUCTS = [
  /* ---------- DIGITAL DOWNLOADS — 100% margin, zero shipping ---------- */
  {
    id: "dig-expense-tracker",
    type: "direct",
    digital: true,
    name: "Owner-Operator Expense Tracker (Spreadsheet)",
    price: 14.99,
    compareAt: 24.99,
    category: "Digital",
    emoji: "📊",
    badge: "Best Seller",
    desc: "Track every mile, gallon, and dollar. Cost-per-mile dashboard, IFTA fuel log, maintenance schedule, and quarterly tax estimate tabs. Works in Excel and Google Sheets. Instant delivery to your email.",
  },
  {
    id: "dig-trip-planner",
    type: "direct",
    digital: true,
    name: "Trip Planning Pack — Rate Calculator + Route Sheet",
    price: 9.99,
    category: "Digital",
    emoji: "🗺️",
    desc: "Know if a load pays BEFORE you book it. Rate-per-mile calculator with deadhead math, fuel-stop planner, and a printable route sheet drivers actually use.",
  },
  {
    id: "dig-pretrip",
    type: "direct",
    digital: true,
    name: "Pre-Trip Inspection Checklist Pack (Printable)",
    price: 6.99,
    category: "Digital",
    emoji: "✅",
    desc: "CDL-style full pre-trip, quick daily walkaround, and trailer-swap checklists. Print a stack, keep them on the clipboard, never miss a DOT item again.",
  },
  {
    id: "dig-bundle",
    type: "direct",
    digital: true,
    name: "Driver Business Bundle — All 3 Downloads",
    price: 24.99,
    compareAt: 31.97,
    category: "Digital",
    emoji: "💼",
    badge: "Save 22%",
    desc: "The Expense Tracker, Trip Planning Pack, and Pre-Trip Checklist Pack together. Everything to run your truck like a business, one download.",
  },

  /* ---------- MERCH — fulfill per-order via Printful/Printify ---------- */
  {
    id: "merch-hat-classic",
    type: "direct",
    name: "Road Dog Snapback — Black/Orange",
    price: 27.99,
    category: "Merch",
    emoji: "🧢",
    badge: "New",
    desc: "Structured 6-panel snapback with the Road Dog stitch. Looks right in the truck stop, holds up in the sun. One size fits most.",
  },
  {
    id: "merch-tee-hammer",
    type: "direct",
    name: "\"Hammer Lane\" Heavyweight Tee",
    price: 24.99,
    category: "Merch",
    emoji: "👕",
    desc: "6 oz heavyweight cotton, printed front and sleeve. S–3XL. The shirt other drivers ask about at the fuel island.",
  },
  {
    id: "merch-hoodie",
    type: "direct",
    name: "Midnight Run Hoodie",
    price: 44.99,
    category: "Merch",
    emoji: "🥷",
    desc: "Heavy fleece hoodie for dock waits and cold starts. Kangaroo pocket fits a logbook. S–3XL.",
  },
  {
    id: "merch-mug",
    type: "direct",
    name: "\"Not Lost, Just Rerouted\" 15oz Mug",
    price: 16.99,
    category: "Merch",
    emoji: "☕",
    desc: "Big 15 oz ceramic mug, dishwasher safe. Ships to the house so it's waiting after your reset.",
  },
  {
    id: "merch-decal",
    type: "direct",
    name: "Road Dog Die-Cut Decal 2-Pack",
    price: 8.99,
    category: "Merch",
    emoji: "🐾",
    desc: "Weatherproof vinyl, 5-year outdoor rating. One for the cab, one for the toolbox.",
  },

  /* ---------- CAB COMFORT — affiliate ---------- */
  {
    id: "aff-seat-cushion",
    type: "affiliate",
    name: "Gel Seat Cushion for Long Hauls",
    price: 39.99,
    category: "Comfort",
    emoji: "💺",
    badge: "Driver Pick",
    desc: "Gel + memory foam cushion that keeps your tailbone alive on 11-hour days. Non-slip bottom, machine-washable cover.",
    search: "gel seat cushion truck driver long haul",
  },
  {
    id: "aff-12v-blanket",
    type: "affiliate",
    name: "12V Heated Travel Blanket",
    price: 34.99,
    category: "Comfort",
    emoji: "🔥",
    desc: "Plugs into the cigarette lighter. Saves fuel on cold-weather resets instead of idling all night.",
    search: "12v heated electric blanket truck",
  },
  {
    id: "aff-12v-fridge",
    type: "affiliate",
    name: "12V Portable Fridge/Freezer 26qt",
    price: 219.99,
    category: "Comfort",
    emoji: "🧊",
    desc: "Real compressor fridge, not a thermoelectric cooler. Pays for itself in about a month of not buying truck-stop food.",
    search: "12v portable refrigerator freezer truck 26 quart",
  },
  {
    id: "aff-mattress",
    type: "affiliate",
    name: "Memory Foam Truck Mattress Topper",
    price: 89.99,
    category: "Comfort",
    emoji: "🛏️",
    desc: "3-inch gel memory foam cut for sleeper bunks. The cheapest upgrade to your 10-hour break there is.",
    search: "memory foam mattress topper semi truck sleeper",
  },

  /* ---------- ELECTRONICS — affiliate ---------- */
  {
    id: "aff-cb-radio",
    type: "affiliate",
    name: "Cobra 29 LX CB Radio",
    price: 149.99,
    category: "Electronics",
    emoji: "📻",
    badge: "Classic",
    desc: "The workhorse CB with NOAA weather, 4-color display, and RF gain that actually pulls in chatter. Backup comms when the apps go quiet.",
    search: "Cobra 29 LX CB radio",
  },
  {
    id: "aff-dashcam",
    type: "affiliate",
    name: "Dual Dash Cam (Front + Cabin)",
    price: 129.99,
    category: "Electronics",
    emoji: "📹",
    badge: "Protect Your CDL",
    desc: "Front and cabin recording with parking mode and loop recording. One staged-accident claim denied pays for it 100 times over.",
    search: "dual dash cam front and cabin truck driver",
  },
  {
    id: "aff-gps",
    type: "affiliate",
    name: "Truck GPS with Bridge Heights & Truck Routes",
    price: 299.99,
    category: "Electronics",
    emoji: "🛰️",
    desc: "Truck-legal routing with low-bridge and weight-limit warnings. Cheaper than one 11-foot-8 mistake.",
    search: "truck GPS navigation commercial drivers bridge height",
  },
  {
    id: "aff-inverter",
    type: "affiliate",
    name: "2000W Pure Sine Power Inverter",
    price: 179.99,
    category: "Electronics",
    emoji: "⚡",
    desc: "Runs the microwave, CPAP, and laptop off the batteries. Pure sine so it won't fry sensitive electronics.",
    search: "2000w pure sine wave power inverter truck",
  },
  {
    id: "aff-headset",
    type: "affiliate",
    name: "Noise-Canceling Bluetooth Trucker Headset",
    price: 59.99,
    category: "Electronics",
    emoji: "🎧",
    desc: "Mic noise-canceling that cuts engine roar so dispatch actually hears you. All-day battery, all-day comfort.",
    search: "trucker bluetooth headset noise canceling microphone",
  },

  /* ---------- SAFETY & WORK GEAR — affiliate ---------- */
  {
    id: "aff-gloves",
    type: "affiliate",
    name: "Impact Work Gloves (Touchscreen)",
    price: 19.99,
    category: "Safety",
    emoji: "🧤",
    desc: "Knuckle protection for landing gear and load bars, touchscreen fingertips for the ELD. Buy two pairs, lose one anyway.",
    search: "mechanic impact work gloves touchscreen",
  },
  {
    id: "aff-flashlight",
    type: "affiliate",
    name: "Rechargeable LED Flashlight 2000lm",
    price: 29.99,
    category: "Safety",
    emoji: "🔦",
    desc: "Blinding-bright for night pre-trips and finding the tandem release pin at 4 AM. USB-C rechargeable, magnetic base.",
    search: "rechargeable led flashlight 2000 lumens magnetic",
  },
  {
    id: "aff-straps",
    type: "affiliate",
    name: "Ratchet Straps 4-Pack (10,000 lb)",
    price: 44.99,
    category: "Safety",
    emoji: "🪢",
    desc: "Heavy-duty 2-inch straps with flat hooks, 10k break strength. DOT checks these — cheap straps are a violation waiting to happen.",
    search: "ratchet straps 2 inch 10000 lb flat hook 4 pack",
  },
  {
    id: "aff-tpms",
    type: "affiliate",
    name: "Tire Pressure Monitoring System (TPMS)",
    price: 189.99,
    category: "Safety",
    emoji: "🛞",
    desc: "Live pressure and temp on every position. Catches the slow leak before it becomes a $600 road-service call on the shoulder.",
    search: "tire pressure monitoring system semi truck trailer",
  },
  {
    id: "aff-firstaid",
    type: "affiliate",
    name: "DOT-Ready Truck First Aid + Safety Kit",
    price: 34.99,
    category: "Safety",
    emoji: "🩹",
    desc: "First aid, triangles-compatible storage, gloves, and blanket in one cab-sized kit. Check the box before the inspector does.",
    search: "truck driver first aid emergency kit DOT",
  },
];
