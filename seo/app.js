/* SEO Generator — Trucking Life With Shawn
 * 100% client-side. Builds YouTube titles, description, tags, hashtags
 * and a pinned comment from a topic + a few options. No API needed.
 */

const CHANNEL = "Trucking Life With Shawn";
const HANDLE = "@truckinglifewithshawn";

const $ = (id) => document.getElementById(id);

// ---- Keyword banks (the SEO fuel) ----------------------------------------
const CORE_TAGS = [
  "trucking", "trucking life", "truck driver", "truck driver life",
  "life on the road", "over the road", "OTR trucking", "semi truck",
  "big rig", "18 wheeler", "owner operator", "CDL", "CDL driver",
  "trucker vlog", "trucking vlog", "day in the life of a truck driver",
  "trucking life with shawn", "american trucking", "truck driving",
];

const TYPE_TAGS = {
  "day in the life": ["day in the life", "trucker daily routine", "life of a trucker", "a day with a trucker", "trucking routine"],
  "dashcam": ["dashcam", "dash cam", "truck dashcam", "dashcam footage", "road rage", "bad drivers", "trucking dashcam", "highway footage"],
  "how-to": ["trucking tips", "how to drive a truck", "truck driver tips", "trucking advice", "new truck driver", "rookie trucker tips"],
  "truck tour": ["truck tour", "semi truck tour", "sleeper truck tour", "big rig tour", "truck walkaround", "inside a semi truck"],
  "review": ["truck review", "trucker gear", "trucking gadgets", "best trucking gear", "truck accessories", "gear review"],
  "story time": ["trucker story", "trucking stories", "trucker q&a", "ask a trucker", "trucking storytime", "life on the road stories"],
  "loading": ["loading dock", "backing up a semi", "docking a truck", "loading and unloading", "freight", "shipping and receiving"],
  "repair": ["truck breakdown", "semi truck repair", "truck maintenance", "roadside breakdown", "diesel repair", "truck problems"],
};

const TYPE_LABEL = {
  "day in the life": "Day In The Life",
  "dashcam": "Dashcam",
  "how-to": "Truck Driver Tips",
  "truck tour": "Truck Tour",
  "review": "Review",
  "story time": "Story Time",
  "loading": "On The Dock",
  "repair": "Breakdown",
};

// Title hook patterns. {t}=topic (title case), {type}=type label.
// Honest and descriptive — no all-caps, no bait. Just what the video is.
const TITLE_PATTERNS = {
  real: [
    "{t} | Trucking Life With Shawn",
    "{t} — Day In The Life Of A Truck Driver",
    "{t} | A Real Day On The Road",
    "{t}: How It Actually Goes Out Here",
    "Riding Along For {t} 🚛",
  ],
  hype: [
    "{t} | Trucking Life With Shawn",
    "{t} — One Of Those Days On The Road",
    "{t}: The Part Of Trucking Nobody Talks About",
    "Out Here Dealing With {t} 🚛",
    "{t} — Real Footage From The Cab",
  ],
  chill: [
    "{t} | A Relaxed Day On The Road 🚛",
    "{t} — Just Me And The Truck",
    "Cruising Through {t}",
    "{t} | Trucking Life With Shawn",
    "An Easy Day Of {t} 🎧",
  ],
  educational: [
    "How To Handle {t} | Truck Driver Tips",
    "{t} — What New Truck Drivers Should Know",
    "{t}, Explained From The Driver's Seat",
    "{t}: What I've Learned Out Here 🚛",
    "A Straight Guide To {t} For Truckers",
  ],
};

// ---- Helpers --------------------------------------------------------------
function titleCase(s) {
  const small = new Set(["a","an","and","the","of","on","in","to","for","with","at","by"]);
  return s.trim().split(/\s+/).map((w, i) => {
    const lw = w.toLowerCase();
    if (i !== 0 && small.has(lw)) return lw;
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");
}

function cleanList(arr) {
  const seen = new Set();
  const out = [];
  for (let t of arr) {
    t = t.trim().toLowerCase();
    if (t && !seen.has(t)) { seen.add(t); out.push(t); }
  }
  return out;
}

function toHashtag(s) {
  return "#" + s.replace(/[^a-z0-9 ]/gi, "").split(/\s+/).map((w, i) =>
    i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
  ).join("");
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = "Copied ✓";
    btn.classList.add("copied");
    setTimeout(() => { btn.textContent = original; btn.classList.remove("copied"); }, 1400);
  });
}

// ---- Builders -------------------------------------------------------------
function buildTitles(topic, type, tone) {
  const t = titleCase(topic);
  const label = TYPE_LABEL[type];
  const patterns = TITLE_PATTERNS[tone] || TITLE_PATTERNS.real;
  const titles = patterns.map((p) => p.replace(/\{t\}/g, t).replace(/\{type\}/g, label));
  // Dedupe while preserving original casing (cleanList lowercases — that's for tags).
  const seen = new Set();
  return titles.filter((x) => { const k = x.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

function buildTags(topic, type, extra) {
  const topicWords = topic.toLowerCase().trim();
  const tags = [
    topicWords,
    `${topicWords} truck`,
    `trucker ${topicWords}`,
    ...(TYPE_TAGS[type] || []),
    ...CORE_TAGS,
    ...extra,
  ];
  // YouTube allows 500 chars total in the tags field — trim to fit.
  const cleaned = cleanList(tags);
  const out = [];
  let len = 0;
  for (const tag of cleaned) {
    const add = (out.length ? 2 : 0) + tag.length; // ", " separator + tag
    if (len + add > 500) break; // YouTube tag field hard limit
    out.push(tag);
    len += add;
  }
  return out;
}

function buildHashtags(topic, type, extra) {
  const base = [topic, ...(extra.slice(0, 2)), "trucking", "truckinglife", "truckdriver"];
  const tags = cleanList(base).slice(0, 5).map(toHashtag);
  return tags;
}

function buildDescription(topic, type, tone, hashtags) {
  const t = titleCase(topic);
  const intro = {
    real: `In this one I'm taking you along for ${t.toLowerCase()} — no filters, just real trucking life out here on the road.`,
    hype: `🔥 ${t} like you've never seen it! Buckle up, because this one gets wild.`,
    chill: `Pull up a seat and ride shotgun for ${t.toLowerCase()}. Sit back, relax, and enjoy the miles.`,
    educational: `Everything you need to know about ${t.toLowerCase()} — straight from the driver's seat. If you're new to trucking, this one's for you.`,
  }[tone];

  return [
    intro,
    "",
    `If you enjoy real ${TYPE_LABEL[type].toLowerCase()} content from behind the wheel, hit that 👍 LIKE and SUBSCRIBE so you never miss a haul.`,
    "",
    "⏱️ CHAPTERS",
    "0:00 Intro",
    "0:30 Heading out",
    "5:00 On the road",
    "10:00 Wrapping up",
    "",
    "🔔 SUBSCRIBE for new trucking videos every week:",
    `   youtube.com/${HANDLE}`,
    "",
    "💬 Drop a comment and let me know where you're watching from — drivers and four-wheelers all welcome.",
    "",
    "📲 FOLLOW THE JOURNEY",
    `   ${HANDLE}`,
    "",
    `Thanks for rolling with me. Stay safe out there and keep it between the lines. 🚛💨`,
    "",
    "— Shawn",
    "",
    hashtags.join(" "),
  ].join("\n");
}

function buildPinned(topic) {
  const t = titleCase(topic);
  return `Thanks for watching ${t}! 🚛 Drop a comment — where are you watching from? New trucking videos every week, so hit SUBSCRIBE and ride along. Stay safe out there! 👇`;
}

// ---- Render ---------------------------------------------------------------
function renderTitles(titles) {
  const wrap = $("titles");
  wrap.innerHTML = "";
  titles.forEach((title) => {
    const row = document.createElement("div");
    row.className = "title-opt";

    const span = document.createElement("span");
    span.textContent = title;

    const len = document.createElement("span");
    len.className = "len" + (title.length > 60 ? " over" : "");
    len.textContent = `${title.length}/60`;

    const btn = document.createElement("button");
    btn.className = "copy";
    btn.textContent = "Copy";
    btn.addEventListener("click", () => copyText(title, btn));

    row.append(span, len, btn);
    wrap.appendChild(row);
  });
}

function generate() {
  const topic = $("topic").value.trim();
  if (!topic) {
    $("status").textContent = "⚠️ Enter a video topic first.";
    return;
  }
  const type = $("vtype").value;
  const tone = $("tone").value;
  const extra = cleanList(($("extra").value || "").split(","));

  const titles = buildTitles(topic, type, tone);
  const tags = buildTags(topic, type, extra);
  const hashtags = buildHashtags(topic, type, extra);
  const description = buildDescription(topic, type, tone, hashtags);
  const pinned = buildPinned(topic);

  renderTitles(titles);
  $("description").value = description;
  $("tags").value = tags.join(", ");
  $("hashtags").value = hashtags.join(" ");
  $("pinned").value = pinned;
  $("tagCount").textContent = `${tags.length} tags · ${tags.join(", ").length}/500 chars`;

  $("results").hidden = false;
  $("status").textContent = "✅ SEO pack ready — tweak anything below before you post.";
  $("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearAll() {
  $("topic").value = "";
  $("extra").value = "";
  $("results").hidden = true;
  $("status").textContent = "";
  $("topic").focus();
}

// ---- Wire up --------------------------------------------------------------
$("generateBtn").addEventListener("click", generate);
$("clearBtn").addEventListener("click", clearAll);
$("topic").addEventListener("keydown", (e) => { if (e.key === "Enter") generate(); });

document.querySelectorAll(".copy[data-copy]").forEach((btn) => {
  btn.addEventListener("click", () => copyText($(btn.dataset.copy).value, btn));
});
