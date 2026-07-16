#!/usr/bin/env python3
"""Generate crawlable SEO landing pages for the truck stop directory (Milestone 25).

Reads the same per-state JSON that build-data.py uses (truckstops/data/*.json)
and emits static, self-contained HTML under truckstops/:

  top/<ABBR>.html         Top Truck Stops in [State]          (all states)
  corridors/<slug>.html   Best Truck Parking on [Interstate]  (multi-state routes)
  newest.html             Newest driver-added listings        (hydrated from Supabase)
  recent.html             Recently updated listings           (hydrated from Supabase)
  popular.html            Most viewed (device-local foundation, no fabricated data)
  explore.html            Internal-link hub (all states + corridors)
  sitemap.xml, robots.txt

Every page carries breadcrumb + ItemList JSON-LD, internal links, an affiliate
CTA, and deep links back into the single-page directory. Purely additive: no
existing file is changed and no existing URL is broken.

Run:  python3 truckstops/build-landing.py
"""
import json, glob, os, sys, html, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(HERE, "data")
SITE = "https://truckinglifewithshawn.com"   # production origin (for sitemap)
BASE = "/truckstops"                          # same-origin path of this app
PROMO = "SHAWN20"
TPC = "https://truckparkingclub.com/"
TODAY = datetime.date.today().isoformat()

STOP_TYPES = {"truck_stop", "service_plaza"}
TYPE_ICON = {"truck_stop": "🚛", "service_plaza": "🚛", "rest_area": "🅿️", "paid_parking": "💲",
             "weigh_station": "⚖️", "truck_wash": "🧼", "hotel": "🏨", "repair": "🔧"}


def e(s):
    return html.escape(str("" if s is None else s), quote=True)


def hw_sort_key(name):
    import re
    m = re.match(r"[A-Za-z-]*?(\d+)([A-Z]*)", str(name))
    return (int(m.group(1)), m.group(2)) if m else (9999, "")


def slug(hw):
    import re
    return re.sub(r"^-|-$", "", re.sub(r"[^a-z0-9]+", "-", str(hw).lower()))


# ---------------------------------------------------------------- load data
def load():
    states = {}
    for path in sorted(glob.glob(os.path.join(DATA_DIR, "*.json"))):
        st = json.load(open(path))
        if "state" in st and "interstates" in st:
            states[st["abbr"]] = st
    if not states:
        sys.exit("No state JSON in truckstops/data/")
    return states


CSS = """
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#111418;--panel:#1b2129;--panel2:#232b36;--line:#2e3947;--text:#e8edf2;--muted:#93a1b3;--accent:#ff5b1f;--accent2:#ffb347;--paid:#b197fc}
body{background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;line-height:1.5}
a{color:var(--accent2);text-decoration:none}
.wrap{max-width:880px;margin:0 auto;padding:16px 16px 64px}
.crumbs{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin:10px 0 14px;font-size:.85rem}
.crumbs .sep{color:var(--muted)}.crumbs b{color:var(--text)}
h1{font-size:1.7rem;line-height:1.2;margin:6px 0 8px}h1 .hl{color:var(--accent)}
.lead{color:var(--muted);font-size:.95rem;max-width:640px;margin-bottom:10px}
h2{font-size:1.15rem;margin:26px 0 10px;color:var(--accent2)}
h3{font-size:1rem;margin:18px 0 8px}
.rank{list-style:none;padding:0;margin:0;display:grid;gap:8px}
.rank a{display:flex;justify-content:space-between;gap:10px;align-items:center;background:var(--panel);border:1px solid var(--line);border-radius:11px;padding:11px 13px;color:var(--text)}
.rank a:hover{border-color:var(--accent)}
.rank .nm{font-weight:700;font-size:.95rem}.rank .mt{color:var(--muted);font-size:.78rem;margin-top:3px}
.rank .pk{color:var(--accent2);font-size:.82rem;white-space:nowrap}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:8px 0}
.chip{display:inline-block;background:var(--panel);border:1px solid var(--line);border-radius:20px;padding:7px 13px;font-size:.83rem;color:var(--accent2)}
.chip:hover{border-color:var(--accent)}
.cta{display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between;background:linear-gradient(90deg,rgba(177,151,252,.16),rgba(255,91,31,.12));border:1px solid var(--paid);border-radius:14px;padding:16px;margin:20px 0}
.cta .txt{font-size:.92rem}.cta .txt b{color:var(--paid)}
.cta .code{display:inline-block;background:var(--panel2);border:1px dashed var(--accent2);color:var(--accent2);font-weight:800;letter-spacing:2px;border-radius:8px;padding:3px 11px;margin-left:4px}
.cta a.go{background:var(--paid);color:#1b1230;font-weight:800;border-radius:9px;padding:11px 17px;font-size:.86rem;white-space:nowrap}
.grp{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:10px}
.grp .st{font-weight:800;color:var(--accent2);margin-bottom:6px}
.row{padding:6px 0;border-top:1px solid var(--line);font-size:.9rem}
.row:first-of-type{border-top:none}
.row .mt{color:var(--muted);font-size:.78rem}
.hub{columns:2;column-gap:22px}.hub a{display:block;padding:5px 0;font-size:.9rem}
@media(max-width:560px){.hub{columns:1}h1{font-size:1.4rem}}
.empty{color:var(--muted);text-align:center;padding:26px;font-size:.92rem}
footer{border-top:1px solid var(--line);margin-top:34px;padding-top:20px;color:var(--muted);font-size:.76rem;text-align:center;line-height:1.6}
.open{display:inline-block;background:var(--accent);color:#fff;font-weight:700;border-radius:9px;padding:9px 16px;font-size:.85rem;margin:4px 0}
"""


def cta(where=""):
    w = (" " + where) if where else ""
    return ('<div class="cta"><div class="txt"><b>💜 Guaranteed parking%s?</b> Reserve ahead on '
            'Truck Parking Club and use promo <span class="code">%s</span> at checkout.</div>'
            '<a class="go" href="%s" target="_blank" rel="sponsored noopener">💲 Reserve parking →</a></div>'
            % (e(w), PROMO, e(TPC)))


def page(path, title, desc, crumbs, body, jsonld, canonical):
    crumb_html = '<nav class="crumbs">'
    for i, (label, href) in enumerate(crumbs):
        if i:
            crumb_html += '<span class="sep">›</span>'
        crumb_html += ('<a href="%s">%s</a>' % (e(href), e(label))) if href else ('<b>%s</b>' % e(label))
    crumb_html += '</nav>'
    ld = json.dumps(jsonld if len(jsonld) > 1 else jsonld[0], separators=(",", ":"))
    doc = (
        '<!DOCTYPE html>\n<html lang="en">\n<head>\n'
        '<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n'
        '<title>%s</title>\n<meta name="description" content="%s">\n'
        '<link rel="canonical" href="%s">\n'
        '<meta property="og:title" content="%s">\n<meta property="og:description" content="%s">\n'
        '<style>%s</style>\n'
        '<script type="application/ld+json">%s</script>\n'
        '</head>\n<body>\n<div class="wrap">\n%s\n%s\n'
        '<footer>Part of the <a href="%s/">Truckin\' Life Directory</a> · A Trucking Life With Shawn project.<br>'
        'Mile markers are exit-number based and may be approximate; truck-spot counts are estimates. '
        'Always confirm parking and fuel before counting on a stop. Paid reservations fulfilled by Truck Parking Club.</footer>\n'
        '</div>\n</body>\n</html>\n'
        % (e(title), e(desc), e(canonical), e(title), e(desc), CSS, ld, crumb_html, body, BASE)
    )
    full = os.path.join(HERE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w").write(doc)
    return canonical


def breadcrumb_ld(crumbs):
    items = []
    pos = 1
    for label, href in crumbs:
        it = {"@type": "ListItem", "position": pos, "name": label}
        if href:
            it["item"] = href if href.startswith("http") else (SITE + href if href.startswith("/") else href)
        items.append(it)
        pos += 1
    return {"@type": "BreadcrumbList", "itemListElement": items}


# ------------------------------------------------------- Top-in-state pages
def build_top(states, urls):
    for ab, st in states.items():
        rows = []
        for hw, iv in st["interstates"].items():
            for s in iv.get("stops", []):
                if s.get("type") in STOP_TYPES:
                    rows.append((hw, s))
        rows.sort(key=lambda r: (-(r[1].get("parking") or 0), str(r[1].get("name"))))
        top = rows[:25]
        canonical = "%s%s/top/%s.html" % (SITE, "", ab)
        canonical = SITE + BASE + "/top/" + ab + ".html"
        items_ld = []
        li = '<ul class="rank">'
        for i, (hw, s) in enumerate(top):
            meta = [hw]
            if s.get("city"):
                meta.append(s["city"])
            if s.get("brand") and s["brand"] not in ("Independent", "State"):
                meta.append(s["brand"])
            pk = ('<span class="pk">🅿️ ~%s</span>' % e(s["parking"])) if s.get("parking") is not None else ""
            li += ('<li><a href="%s/#%s/%s"><span><span class="nm">%s</span>'
                   '<span class="mt">%s</span></span>%s</a></li>'
                   % (BASE, ab, e(hw), e(s.get("name")), e(" • ".join(meta)), pk))
            items_ld.append({"@type": "ListItem", "position": i + 1,
                             "name": s.get("name") + ((" — " + s["city"] + ", " + ab) if s.get("city") else "")})
        li += "</ul>"
        hws = sorted(st["interstates"].keys(), key=hw_sort_key)
        hw_chips = "".join('<a class="chip" href="%s/#%s/%s">%s in %s</a>' % (BASE, ab, e(h), e(h), e(st["state"]))
                           for h in hws)
        # a few sibling states for internal linking
        sibs = [a for a in sorted(states, key=lambda a: states[a]["state"]) if a != ab][:8]
        sib_chips = "".join('<a class="chip" href="%s/top/%s.html">Top stops in %s</a>' % (BASE, a, e(states[a]["state"]))
                            for a in sibs)
        body = (
            '<h1>Top Truck Stops in <span class="hl">%s</span></h1>'
            '<p class="lead">The biggest verified truck parking in %s, ranked by estimated spots across %d interstate segments. '
            'Tap any stop to open it at its mile marker in the live directory.</p>'
            '<a class="open" href="%s/#%s">📖 Open %s in the directory</a>'
            '%s<h2>🏆 Biggest parking in %s</h2>%s'
            '<h2>🛣️ Interstates through %s</h2><div class="chips">%s</div>'
            '<h2>🧭 Nearby state guides</h2><div class="chips">%s</div>'
            % (e(st["state"]), e(st["state"]), len(st["interstates"]),
               BASE, ab, e(st["state"]), cta("in " + st["state"]), e(st["state"]), li,
               e(st["state"]), hw_chips, sib_chips)
        )
        crumbs = [("Directory", BASE + "/"), ("Top Truck Stops", BASE + "/explore.html"), (st["state"], None)]
        ld = [{"@context": "https://schema.org", **breadcrumb_ld(crumbs)},
              {"@context": "https://schema.org", "@type": "ItemList",
               "name": "Top truck stops in " + st["state"], "numberOfItems": len(items_ld),
               "itemListElement": items_ld}]
        urls.append(page("top/%s.html" % ab, "Top Truck Stops in %s — Truckin' Life Directory" % st["state"],
                         "The biggest truck parking in %s ranked by spots, mile marker by mile marker, plus every interstate through the state." % st["state"],
                         crumbs, body, ld, canonical))


# --------------------------------------------------------- corridor pages
def build_corridors(states, urls):
    span = {}
    for ab, st in states.items():
        for hw in st["interstates"]:
            span.setdefault(hw, []).append(ab)
    for hw, abs_ in span.items():
        if len(abs_) < 3:
            continue
        abs_sorted = sorted(abs_, key=lambda a: states[a]["state"])
        canonical = SITE + BASE + "/corridors/" + slug(hw) + ".html"
        groups = ""
        items_ld = []
        total = 0
        for ab in abs_sorted:
            iv = states[ab]["interstates"][hw]
            stops = [s for s in iv.get("stops", []) if s.get("type") in STOP_TYPES]
            stops.sort(key=lambda s: -(s.get("parking") or 0))
            best = stops[:6]
            if not best:
                continue
            rowhtml = ""
            for s in best:
                total += 1
                meta = []
                if s.get("city"):
                    meta.append(s["city"])
                if s.get("mm") is not None:
                    meta.append("MM " + str(s["mm"]))
                if s.get("parking") is not None:
                    meta.append("🅿️ ~%s spots" % s["parking"])
                rowhtml += ('<div class="row">%s <b>%s</b><div class="mt">%s</div></div>'
                            % (TYPE_ICON.get(s.get("type"), "🚛"), e(s.get("name")), e(" • ".join(meta))))
                if len(items_ld) < 100:
                    items_ld.append({"@type": "ListItem", "position": len(items_ld) + 1,
                                     "name": "%s — %s, %s (%s)" % (s.get("name"), s.get("city") or "", ab, hw)})
            groups += ('<div class="grp"><div class="st"><a href="%s/#%s/%s">%s in %s →</a></div>%s'
                       '<div class="chips" style="margin-top:8px"><a class="chip" href="%s/top/%s.html">Top stops in %s</a></div></div>'
                       % (BASE, ab, e(hw), e(hw), e(states[ab]["state"]), rowhtml,
                          BASE, ab, e(states[ab]["state"])))
        state_chips = "".join('<a class="chip" href="%s/#%s/%s">%s</a>' % (BASE, ab, e(hw), e(states[ab]["state"]))
                              for ab in abs_sorted)
        body = (
            '<h1>Best Truck Parking on <span class="hl">%s</span></h1>'
            '<p class="lead">%s runs through %d states in this directory. Here are the truck stops and service plazas '
            'with the most parking along the route, plus reservable paid spots you can lock in before you roll.</p>'
            '%s'
            '<h2>🗺️ %s state by state</h2><div class="chips">%s</div>'
            '%s'
            % (e(hw), e(hw), len(abs_sorted), cta("on " + hw), e(hw), state_chips, groups)
        )
        crumbs = [("Directory", BASE + "/"), ("Corridors", BASE + "/explore.html"), (hw, None)]
        ld = [{"@context": "https://schema.org", **breadcrumb_ld(crumbs)},
              {"@context": "https://schema.org", "@type": "ItemList",
               "name": "Best truck parking on " + hw, "numberOfItems": total, "itemListElement": items_ld}]
        urls.append(page("corridors/%s.html" % slug(hw),
                         "Best Truck Parking on %s — Truckin' Life Directory" % hw,
                         "Where to park a semi along %s: the biggest truck stops and reservable paid parking, state by state, mile marker by mile marker." % hw,
                         crumbs, body, ld, canonical))
    return span


# ------------------------------------------------- explore hub + dynamic pages
def build_explore(states, span, urls):
    top_links = "".join('<a href="%s/top/%s.html">Top truck stops in %s</a>' % (BASE, ab, e(states[ab]["state"]))
                        for ab in sorted(states, key=lambda a: states[a]["state"]))
    corr = sorted([h for h in span if len(span[h]) >= 3], key=hw_sort_key)
    corr_links = "".join('<a href="%s/corridors/%s.html">Best parking on %s</a>' % (BASE, slug(h), e(h)) for h in corr)
    body = (
        '<h1>Explore the <span class="hl">Directory</span></h1>'
        '<p class="lead">Every state guide and major interstate corridor in one place — the fast way to find truck parking '
        'wherever your route takes you.</p>'
        '%s'
        '<h2>🆕 Fresh &amp; popular</h2><div class="chips">'
        '<a class="chip" href="%s/newest.html">Newest listings</a>'
        '<a class="chip" href="%s/recent.html">Recently updated</a>'
        '<a class="chip" href="%s/popular.html">Most viewed</a></div>'
        '<h2>🏆 Top truck stops by state</h2><div class="hub">%s</div>'
        '<h2>🛣️ Best parking by corridor</h2><div class="hub">%s</div>'
        % (cta(""), BASE, BASE, BASE, top_links, corr_links)
    )
    crumbs = [("Directory", BASE + "/"), ("Explore", None)]
    ld = [{"@context": "https://schema.org", **breadcrumb_ld(crumbs)}]
    urls.append(page("explore.html", "Explore Truck Stops by State & Interstate — Truckin' Life Directory",
                     "Browse every state truck-stop guide and major interstate corridor in the Truckin' Life Directory.",
                     crumbs, body, ld, SITE + BASE + "/explore.html"))


def dynamic_page(slug_name, title, desc, heading, intro, kind, urls):
    """Client-hydrated list pages (newest/recent/popular). No fabricated data —
    they render live from Supabase (community additions) or device-local views."""
    crumbs = [("Directory", BASE + "/"), (heading, None)]
    ld = [{"@context": "https://schema.org", **breadcrumb_ld(crumbs)},
          {"@context": "https://schema.org", "@type": "CollectionPage", "name": title, "description": desc}]
    script = SCRIPTS[kind]
    body = ('<h1>%s</h1><p class="lead">%s</p>%s'
            '<div id="list"><div class="empty">Loading…</div></div>'
            '<div class="chips" style="margin-top:18px"><a class="chip" href="%s/explore.html">🧭 Explore all states &amp; corridors</a>'
            '<a class="chip" href="%s/">📖 Open the directory</a></div>'
            '<script>%s</script>' % (e(heading), e(intro), cta(""), BASE, BASE, script))
    urls.append(page(slug_name + ".html", title, desc, crumbs, body, ld, SITE + BASE + "/" + slug_name + ".html"))


SB = ("var SB_URL='https://mmnvcbejjdweetnxncfi.supabase.co';"
      "var SB_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1tbnZjYmVqamR3ZWV0bnhuY2ZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTM3MzMsImV4cCI6MjA5NjUyOTczM30.PSzPFqTAiv0GHv0DBpAOREUE7BvrbHHgetQSYpeSajA';"
      "function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}")

# newest / recent both read approved community submissions ordered by creation.
SUBS = (SB + "function row(r){var m=[r.state,r.interstate,'MM '+r.mm];if(r.city)m.push(r.city);"
        "return '<div class=\"grp\"><div class=\"st\">'+esc(r.name)+'</div>'"
        "+'<div class=\"mt\">'+m.map(esc).join(' • ')+(r.notes?'<br>“'+esc(r.notes)+'”':'')"
        "+'<br>Added '+esc((r.created_at||'').slice(0,10))+(r.driver_name?' by '+esc(r.driver_name):'')+'</div>'"
        "+'<div class=\"chips\" style=\"margin-top:6px\"><a class=\"chip\" href=\"/truckstops/#'+esc(r.state)+'/'+encodeURIComponent(r.interstate)+'\">Open on '+esc(r.interstate)+' →</a></div></div>';}"
        "fetch(SB_URL+'/rest/v1/ts_submissions?status=eq.approved&select=state,interstate,mm,name,city,notes,driver_name,created_at&order=created_at.desc&limit=60',"
        "{headers:{apikey:SB_KEY,Authorization:'Bearer '+SB_KEY}}).then(function(r){return r.ok?r.json():[];}).then(function(rows){"
        "var L=document.getElementById('list');if(!rows.length){L.innerHTML='<div class=\"empty\">No community-added listings yet — be the first to add a stop from the directory.</div>';return;}"
        "L.innerHTML=rows.map(row).join('');}).catch(function(){document.getElementById('list').innerHTML='<div class=\"empty\">Could not load right now — try again shortly.</div>';});")

POPULAR = ("function esc(s){return String(s==null?'':s).replace(/[&<>\"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#39;'}[c];});}"
           "var v={};try{v=JSON.parse(localStorage.getItem('ts_views_v1')||'{}');}catch(e){}"
           "var ks=Object.keys(v).sort(function(a,b){return v[b].n-v[a].n;}).slice(0,25);"
           "var L=document.getElementById('list');"
           "if(!ks.length){L.innerHTML='<div class=\"empty\">Most-viewed is personal to your device and fills in as you browse — open a few states and interstates, then come back.</div>';}"
           "else{L.innerHTML='<ul class=\"rank\">'+ks.map(function(k){return '<li><a href=\"'+esc(v[k].href)+'\"><span class=\"nm\">'+esc(v[k].label)+'</span><span class=\"pk\">👁 '+v[k].n+'</span></a></li>';}).join('')+'</ul>';}")

SCRIPTS = {"subs": SUBS, "popular": POPULAR}


def build_sitemap(states, span, urls):
    static_extra = [SITE + BASE + "/", SITE + BASE + "/explore.html",
                    SITE + BASE + "/newest.html", SITE + BASE + "/recent.html", SITE + BASE + "/popular.html"]
    seen, all_urls = set(), []
    for u in static_extra + urls:
        if u not in seen:
            seen.add(u); all_urls.append(u)
    body = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in all_urls:
        body += "  <url><loc>%s</loc><lastmod>%s</lastmod></url>\n" % (e(u), TODAY)
    body += "</urlset>\n"
    open(os.path.join(HERE, "sitemap.xml"), "w").write(body)
    open(os.path.join(HERE, "robots.txt"), "w").write(
        "User-agent: *\nAllow: /\nDisallow: /truckstops/admin.html\nSitemap: %s%s/sitemap.xml\n" % (SITE, BASE))
    return all_urls


def main():
    states = load()
    urls = []
    build_top(states, urls)
    span = build_corridors(states, urls)
    build_explore(states, span, urls)
    dynamic_page("newest", "Newest Truck Stop Listings — Truckin' Life Directory",
                 "The latest driver-added truck stops, rest areas and parking, freshly approved in the Truckin' Life Directory.",
                 "🆕 Newest Listings", "Freshly approved additions from drivers on the road — the newest stops in the book.",
                 "subs", urls)
    dynamic_page("recent", "Recently Updated Listings — Truckin' Life Directory",
                 "Recently added and updated truck parking in the Truckin' Life Directory, verified by drivers.",
                 "🔄 Recently Updated", "The freshest changes to the book. Static listings don't carry per-row edit dates, so this shows the newest driver-verified additions and updates.",
                 "subs", urls)
    dynamic_page("popular", "Most Viewed Truck Stops — Truckin' Life Directory",
                 "Your most-viewed truck stops and interstates in the Truckin' Life Directory.",
                 "👁 Most Viewed", "A foundation for popularity ranking — built from real views on your device, never fabricated numbers.",
                 "popular", urls)
    all_urls = build_sitemap(states, span, urls)
    print("Generated %d landing pages + sitemap.xml + robots.txt" % len(urls))
    print("  top/: %d states   corridors/: %d routes" %
          (len(states), sum(1 for h in span if len(span[h]) >= 3)))
    print("  sitemap entries: %d" % len(all_urls))


if __name__ == "__main__":
    main()
