/* Truckin' Life Directory — growth & monetization enhancer (Milestone 25)
 * -------------------------------------------------------------------------
 * ADDITIVE ONLY. This file never modifies the directory app's own render
 * logic. It observes #app and, after each render, appends growth modules:
 * Related Locations, Top Truck Stops in [State], internal-link modules,
 * affiliate CTA blocks, admin-managed sponsor blocks, a Most-Viewed
 * foundation (device-local, never fabricated), and JSON-LD + breadcrumb
 * schema. Safe to remove: delete the one <script src="enhance.js"> tag and
 * the app behaves exactly as before.
 *
 * Loaded by both /truckstops/ and /truckinlife/directory/ (same origin).
 * ========================================================================= */
(function () {
  'use strict';

  var DATA = window.TRUCKSTOP_DATA || {};
  if (!DATA || !Object.keys(DATA).length) return; // no data → do nothing

  /* ----- Affiliate config (ONE place) ------------------------------------
   * Set TPC_PARTNER_ID to Shawn's Truck Parking Club partner/affiliate ID to
   * activate referral tracking on every "Reserve" call-to-action this file
   * renders. Left blank on purpose — links stay valid (they point at Truck
   * Parking Club) and simply carry no referral code until an ID is added.
   * The promo code is shown at checkout regardless. */
  var TPC_PARTNER_ID = window.TPC_PARTNER_ID || '';
  var TPC_PROMO_CODE = 'SHAWN20';
  var TPC_HOME = 'https://truckparkingclub.com';
  var BASE = '/truckstops'; // canonical, same-origin home of landing pages
  var ORIGIN = (location.origin && location.origin.indexOf('http') === 0) ? location.origin : '';

  function tpcUrl() {
    var u = TPC_HOME + '/';
    if (TPC_PARTNER_ID) u += '?ref=' + encodeURIComponent(TPC_PARTNER_ID);
    return u;
  }

  /* ----- small helpers (mirrors of the app's, kept independent) ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }
  function stopCount(st) {
    var n = 0;
    Object.keys(st.interstates).forEach(function (h) { n += (st.interstates[h].stops || []).length; });
    return n;
  }
  function hwNum(name) { var m = String(name).match(/(\d+)([A-Z]*)/); return m ? [parseInt(m[1], 10), m[2] || ''] : [9999, '']; }
  function sortHw(a, b) { var A = hwNum(a), B = hwNum(b); return A[0] - B[0] || (A[1] < B[1] ? -1 : A[1] > B[1] ? 1 : 0); }
  var STOP_TYPES = { truck_stop: 1, service_plaza: 1 };

  /* ----- one-time style + Most-Viewed store ------------------------------ */
  function injectStyle() {
    if (el('enh-style')) return;
    var s = document.createElement('style');
    s.id = 'enh-style';
    s.textContent =
      '.enh{margin:22px 0 4px}' +
      '.enh h2{font-size:1.02rem;color:var(--accent2,#ffb347);margin:0 0 10px;display:flex;align-items:center;gap:7px}' +
      '.enh .lead{color:var(--muted,#93a1b3);font-size:.83rem;margin:-4px 0 10px}' +
      '.enh-links{display:flex;flex-wrap:wrap;gap:8px}' +
      '.enh-chip{display:inline-block;background:var(--panel,#1b2129);border:1px solid var(--line,#2e3947);border-radius:20px;padding:7px 13px;font-size:.82rem;color:var(--accent2,#ffb347);text-decoration:none}' +
      '.enh-chip:hover{border-color:var(--accent,#ff5b1f)}' +
      '.enh-rank{list-style:none;padding:0;margin:0;display:grid;gap:7px}' +
      '.enh-rank a{display:flex;justify-content:space-between;gap:10px;align-items:center;background:var(--panel,#1b2129);border:1px solid var(--line,#2e3947);border-radius:10px;padding:9px 12px;text-decoration:none;color:var(--text,#e8edf2)}' +
      '.enh-rank a:hover{border-color:var(--accent,#ff5b1f)}' +
      '.enh-rank .nm{font-weight:600;font-size:.9rem}' +
      '.enh-rank .mt{color:var(--muted,#93a1b3);font-size:.76rem;margin-top:2px}' +
      '.enh-rank .pk{color:var(--accent2,#ffb347);font-size:.8rem;white-space:nowrap}' +
      '.enh-cta{display:flex;flex-wrap:wrap;align-items:center;gap:12px;justify-content:space-between;background:linear-gradient(90deg,rgba(177,151,252,.14),rgba(255,91,31,.12));border:1px solid var(--paid,#b197fc);border-radius:14px;padding:14px 16px;margin:18px 0}' +
      '.enh-cta .txt{font-size:.9rem}.enh-cta .txt b{color:var(--paid,#b197fc)}' +
      '.enh-cta .code{display:inline-block;background:var(--panel2,#232b36);border:1px dashed var(--accent2,#ffb347);color:var(--accent2,#ffb347);font-weight:800;letter-spacing:2px;border-radius:8px;padding:3px 10px;margin-left:4px}' +
      '.enh-cta a.go{background:var(--paid,#b197fc);color:#1b1230;font-weight:800;border-radius:9px;padding:10px 16px;font-size:.85rem;text-decoration:none;white-space:nowrap}' +
      '.enh-sponsor{background:var(--panel,#1b2129);border:1px solid var(--accent,#ff5b1f);border-radius:14px;padding:14px 16px;margin:14px 0;display:flex;gap:14px;align-items:center;text-decoration:none;color:var(--text,#e8edf2)}' +
      '.enh-sponsor:hover{box-shadow:0 0 0 1px var(--accent,#ff5b1f)}' +
      '.enh-sponsor .logo{font-size:1.8rem;line-height:1}' +
      '.enh-sponsor .sp-nm{font-weight:800}.enh-sponsor .sp-tag{color:var(--muted,#93a1b3);font-size:.82rem;margin-top:2px}' +
      '.enh-sponsor .sp-badge{margin-left:auto;font-size:.62rem;font-weight:800;letter-spacing:1px;color:var(--accent,#ff5b1f);border:1px solid var(--accent,#ff5b1f);border-radius:6px;padding:2px 7px;align-self:flex-start}';
    document.head.appendChild(s);
  }

  var VIEW_KEY = 'ts_views_v1';
  function readViews() { try { return JSON.parse(localStorage.getItem(VIEW_KEY) || '{}'); } catch (e) { return {}; } }
  function recordView(sig, label, href) {
    try {
      var v = readViews();
      var r = v[sig] || { n: 0, label: label, href: href };
      r.n++; r.label = label; r.href = href; r.t = Date.now();
      v[sig] = r;
      localStorage.setItem(VIEW_KEY, JSON.stringify(v));
    } catch (e) { /* private mode / disabled storage — Most-Viewed simply stays empty */ }
  }

  /* ----- sponsors (admin-managed, committed as sponsors.json) ------------- */
  var SPONSORS = null; // null = not loaded yet, [] = loaded/empty
  function loadSponsors() {
    if (SPONSORS !== null) return Promise.resolve(SPONSORS);
    return fetch(BASE + '/sponsors.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : { sponsors: [] }; })
      .then(function (j) { SPONSORS = (j && Array.isArray(j.sponsors)) ? j.sponsors.filter(function (s) { return s && s.active !== false; }) : []; return SPONSORS; })
      .catch(function () { SPONSORS = []; return SPONSORS; });
  }
  function sponsorHtml(scope) {
    if (!SPONSORS || !SPONSORS.length) return '';
    // scope: 'home' shows all; a state abbr shows sponsors targeted there or global
    var list = SPONSORS.filter(function (s) {
      if (!s.states || !s.states.length) return true;
      return scope === 'home' || s.states.indexOf(scope) !== -1;
    }).slice(0, 3);
    if (!list.length) return '';
    return list.map(function (s) {
      return '<a class="enh-sponsor" href="' + esc(s.url || '#') + '"' + (s.url ? ' target="_blank" rel="sponsored noopener"' : '') + '>' +
        '<span class="logo">' + esc(s.logo || '⭐') + '</span>' +
        '<span><span class="sp-nm">' + esc(s.name || 'Sponsor') + '</span>' +
        (s.tagline ? '<span class="sp-tag">' + esc(s.tagline) + '</span>' : '') + '</span>' +
        '<span class="sp-badge">SPONSOR</span></a>';
    }).join('');
  }

  /* ----- affiliate CTA block (Objective 8) ------------------------------- */
  function ctaHtml(where) {
    return '<div class="enh-cta"><div class="txt"><b>💜 Guaranteed parking' + (where ? ' ' + esc(where) : '') + '?</b> ' +
      'Reserve a spot ahead on Truck Parking Club and use promo <span class="code">' + esc(TPC_PROMO_CODE) + '</span> at checkout.</div>' +
      '<a class="go" href="' + esc(tpcUrl()) + '" target="_blank" rel="sponsored noopener">💲 Reserve parking →</a></div>';
  }

  /* ----- module renderers ------------------------------------------------- */
  function topInState(ab) {
    var st = DATA[ab];
    var rows = [];
    Object.keys(st.interstates).forEach(function (h) {
      (st.interstates[h].stops || []).forEach(function (s) {
        if (STOP_TYPES[s.type]) rows.push({ s: s, hw: h });
      });
    });
    rows.sort(function (a, b) { return (b.s.parking || 0) - (a.s.parking || 0) || String(a.s.name).localeCompare(String(b.s.name)); });
    rows = rows.slice(0, 10);
    if (!rows.length) return '';
    var items = rows.map(function (r) {
      var meta = [r.hw]; if (r.s.city) meta.push(esc(r.s.city)); if (r.s.brand && r.s.brand !== 'Independent' && r.s.brand !== 'State') meta.push(esc(r.s.brand));
      return '<li><a href="#' + esc(ab) + '/' + encodeURIComponent(r.hw) + '">' +
        '<span><span class="nm">' + esc(r.s.name) + '</span><span class="mt">' + meta.join(' &bull; ') + '</span></span>' +
        (r.s.parking != null ? '<span class="pk">🅿️ ~' + esc(r.s.parking) + '</span>' : '') + '</a></li>';
    }).join('');
    return '<div class="enh"><h2>🏆 Top truck stops in ' + esc(st.state) + '</h2>' +
      '<p class="lead">Biggest verified truck parking in ' + esc(st.state) + ', by estimated spots.</p>' +
      '<ul class="enh-rank">' + items + '</ul>' +
      '<div class="enh-links" style="margin-top:10px"><a class="enh-chip" href="' + BASE + '/top/' + esc(ab) + '.html">Full guide: Top truck stops in ' + esc(st.state) + ' →</a></div></div>';
  }

  function relatedLocations(ab, hw) {
    var st = DATA[ab];
    var here = st.interstates[hw] || { stops: [] };
    // (a) complementary services on this same route (rest areas, washes, scales, repair, hotels)
    var comp = (here.stops || []).filter(function (s) { return !STOP_TYPES[s.type]; })
      .sort(function (a, b) { return (a.mm || 0) - (b.mm || 0); }).slice(0, 6);
    var compHtml = comp.length ? '<div class="enh-links">' + comp.map(function (s) {
      var icon = s.type === 'truck_wash' ? '🧼' : s.type === 'weigh_station' ? '⚖️' : s.type === 'hotel' ? '🏨' : s.type === 'repair' ? '🔧' : '🅿️';
      return '<span class="enh-chip" style="cursor:default;color:var(--muted,#93a1b3)">' + icon + ' MM ' + esc(s.mm) + ' ' + esc(s.name) + '</span>';
    }).join('') + '</div>' : '';
    // (b) same interstate through neighboring states — cross-state corridor links
    var others = Object.keys(DATA).filter(function (x) { return x !== ab && DATA[x].interstates[hw]; })
      .sort(function (a, b) { return DATA[a].state < DATA[b].state ? -1 : 1; });
    var othersHtml = others.length ? '<div class="enh-links" style="margin-top:8px">' + others.map(function (x) {
      var n = (DATA[x].interstates[hw].stops || []).length;
      return '<a class="enh-chip" href="#' + esc(x) + '/' + encodeURIComponent(hw) + '">' + esc(hw) + ' in ' + esc(DATA[x].state) + ' (' + n + ')</a>';
    }).join('') + '</div>' : '';
    // (c) other interstates in this state
    var sib = Object.keys(st.interstates).filter(function (h) { return h !== hw; }).sort(sortHw);
    var sibHtml = sib.length ? '<div class="enh-links" style="margin-top:8px">' + sib.map(function (h) {
      return '<a class="enh-chip" href="#' + esc(ab) + '/' + encodeURIComponent(h) + '">' + esc(h) + ' in ' + esc(st.state) + '</a>';
    }).join('') + '</div>' : '';
    if (!compHtml && !othersHtml && !sibHtml) return '';
    return '<div class="enh"><h2>🔗 Related locations</h2>' +
      (compHtml ? '<p class="lead">Services along ' + esc(hw) + ' in ' + esc(st.state) + ':</p>' + compHtml : '') +
      (othersHtml ? '<p class="lead" style="margin-top:12px">Follow ' + esc(hw) + ' into neighboring states:</p>' + othersHtml : '') +
      (sibHtml ? '<p class="lead" style="margin-top:12px">Other interstates in ' + esc(st.state) + ':</p>' + sibHtml : '') +
      '<div class="enh-links" style="margin-top:10px"><a class="enh-chip" href="' + BASE + '/corridors/' + corridorSlug(hw) + '.html">Best parking guide for ' + esc(hw) + ' →</a></div></div>';
  }

  function corridorSlug(hw) { return String(hw).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

  // Internal-link module + Most-Viewed (device-local) — shown on home
  function homeModules() {
    var abbrs = Object.keys(DATA).sort(function (a, b) { return DATA[a].state < DATA[b].state ? -1 : 1; });
    // Popular corridors = interstates appearing in the most states
    var span = {};
    abbrs.forEach(function (ab) { Object.keys(DATA[ab].interstates).forEach(function (h) { span[h] = (span[h] || 0) + 1; }); });
    var corridors = Object.keys(span).filter(function (h) { return span[h] >= 3; }).sort(function (a, b) { return span[b] - span[a] || sortHw(a, b); }).slice(0, 12);
    var corrHtml = '<div class="enh"><h2>🛣️ Popular corridors</h2>' +
      '<p class="lead">Long-haul routes with the most stops mapped end to end.</p>' +
      '<div class="enh-links">' + corridors.map(function (h) {
        return '<a class="enh-chip" href="' + BASE + '/corridors/' + corridorSlug(h) + '.html">Best parking on ' + esc(h) + '</a>';
      }).join('') + '</div></div>';
    var exploreHtml = '<div class="enh"><h2>🧭 Explore the directory</h2><div class="enh-links">' +
      '<a class="enh-chip" href="' + BASE + '/explore.html">All states &amp; corridors</a>' +
      '<a class="enh-chip" href="' + BASE + '/newest.html">🆕 Newest listings</a>' +
      '<a class="enh-chip" href="' + BASE + '/recent.html">🔄 Recently updated</a>' +
      '<a class="enh-chip" href="' + BASE + '/popular.html">👁 Most viewed</a>' +
      '</div></div>';
    // Most-viewed (this device only, never fabricated)
    var views = readViews();
    var keys = Object.keys(views).sort(function (a, b) { return views[b].n - views[a].n; }).slice(0, 6);
    var viewsHtml = keys.length ? '<div class="enh"><h2>👁 Your recently viewed</h2>' +
      '<p class="lead">Based only on routes you\'ve opened on this device.</p>' +
      '<div class="enh-links">' + keys.map(function (k) {
        return '<a class="enh-chip" href="' + esc(views[k].href) + '">' + esc(views[k].label) + ' (' + views[k].n + ')</a>';
      }).join('') + '</div></div>' : '';
    return sponsorHtml('home') + corrHtml + exploreHtml + viewsHtml;
  }

  /* ----- JSON-LD (Objectives 10 & 12) ------------------------------------ */
  function setJsonLd(objs) {
    var node = el('enh-jsonld');
    if (!node) { node = document.createElement('script'); node.type = 'application/ld+json'; node.id = 'enh-jsonld'; document.head.appendChild(node); }
    node.textContent = JSON.stringify(objs.length === 1 ? objs[0] : objs);
  }
  function breadcrumb(items) {
    return {
      '@type': 'BreadcrumbList',
      itemListElement: items.map(function (it, i) {
        var e = { '@type': 'ListItem', position: i + 1, name: it.name };
        if (it.url) e.item = it.url;
        return e;
      })
    };
  }
  function pageUrl(hash) { return ORIGIN ? ORIGIN + location.pathname + (hash ? '#' + hash : '') : undefined; }

  /* ----- main enhance pass (runs after every app render) ------------------ */
  var app;
  var mo;
  var pending = false;
  var lastSig = '';

  function routeInfo() {
    var h = decodeURIComponent(location.hash.replace(/^#\/?/, ''));
    var parts = h ? h.split('/') : [];
    if (parts.length >= 2 && DATA[parts[0]] && DATA[parts[0]].interstates[parts[1]]) return { kind: 'hw', ab: parts[0], hw: parts[1] };
    if (parts.length >= 1 && DATA[parts[0]]) return { kind: 'state', ab: parts[0] };
    return { kind: 'home' };
  }

  function enhance() {
    if (!app) return;
    var ri = routeInfo();
    var sig = ri.kind + ':' + (ri.ab || '') + ':' + (ri.hw || '');
    // schema + view tracking track the route even if DOM unchanged
    if (sig !== lastSig) applyRouteMeta(ri);
    lastSig = sig;

    if (el('enh-modules')) return; // already appended for this render
    var box = document.createElement('div');
    box.id = 'enh-modules';
    if (ri.kind === 'home') box.innerHTML = homeModules();
    else if (ri.kind === 'state') box.innerHTML = sponsorHtml(ri.ab) + ctaHtml('in ' + DATA[ri.ab].state) + topInState(ri.ab) + homeExploreTail();
    else if (ri.kind === 'hw') box.innerHTML = ctaHtml('on ' + ri.hw) + relatedLocations(ri.ab, ri.hw) + homeExploreTail();
    if (box.innerHTML) app.appendChild(box);
  }

  function homeExploreTail() {
    return '<div class="enh"><div class="enh-links">' +
      '<a class="enh-chip" href="' + BASE + '/explore.html">🧭 All states &amp; corridors</a>' +
      '<a class="enh-chip" href="' + BASE + '/newest.html">🆕 Newest</a>' +
      '<a class="enh-chip" href="' + BASE + '/popular.html">👁 Most viewed</a>' +
      '</div></div>';
  }

  function applyRouteMeta(ri) {
    var org = { '@context': 'https://schema.org', '@type': 'Organization', name: 'Truckin\' Life Directory', url: ORIGIN ? ORIGIN + '/truckinlife/' : undefined, sameAs: ['https://www.youtube.com/@TruckingLifewithShawn'] };
    if (ri.kind === 'home') {
      setJsonLd([{ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Truckin\' Life Directory', url: pageUrl('') },
        Object.assign({ '@context': 'https://schema.org' }, breadcrumb([{ name: 'All States', url: pageUrl('') }]))]);
      recordView('home', 'All States', '#');
    } else if (ri.kind === 'state') {
      var st = DATA[ri.ab];
      setJsonLd([Object.assign({ '@context': 'https://schema.org' }, breadcrumb([
        { name: 'All States', url: pageUrl('') }, { name: st.state, url: pageUrl(ri.ab) }])), org]);
      recordView('state:' + ri.ab, st.state, '#' + ri.ab);
    } else if (ri.kind === 'hw') {
      var st2 = DATA[ri.ab];
      var stops = (st2.interstates[ri.hw].stops || []).filter(function (s) { return STOP_TYPES[s.type]; });
      var itemList = {
        '@context': 'https://schema.org', '@type': 'ItemList',
        name: ri.hw + ' truck stops in ' + st2.state,
        numberOfItems: stops.length,
        itemListElement: stops.slice(0, 25).map(function (s, i) {
          return { '@type': 'ListItem', position: i + 1, name: s.name + (s.city ? ' — ' + s.city + ', ' + ri.ab : '') };
        })
      };
      setJsonLd([Object.assign({ '@context': 'https://schema.org' }, breadcrumb([
        { name: 'All States', url: pageUrl('') }, { name: st2.state, url: pageUrl(ri.ab) }, { name: ri.hw, url: pageUrl(ri.ab + '/' + ri.hw) }])),
        itemList]);
      recordView('hw:' + ri.ab + '/' + ri.hw, st2.state + ' ' + ri.hw, '#' + ri.ab + '/' + ri.hw);
    }
  }

  function schedule() {
    if (pending) return; pending = true;
    (window.requestAnimationFrame || function (f) { setTimeout(f, 16); })(function () { pending = false; run(); });
  }
  function run() {
    if (!mo) return;
    mo.disconnect();
    try { enhance(); } catch (e) { if (window.console) console.warn('enhance:', e); }
    mo.observe(app, { childList: true });
  }

  function boot() {
    app = el('app');
    if (!app) return;
    injectStyle();
    loadSponsors().then(function () {
      mo = new MutationObserver(schedule);
      mo.observe(app, { childList: true });
      run(); // handle whatever is already rendered
    });
    window.addEventListener('hashchange', function () { lastSig = ' '; schedule(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
