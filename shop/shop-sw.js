/* Rosedale Shop Scheduler service worker — makes the app installable.

   Strategy:
     * HTML (the app shell / navigations) → NETWORK-FIRST, falling back to cache
       offline. This guarantees a fresh deploy shows up on the next load instead
       of being pinned to a stale cached page. (A previous cache-first shell meant
       returning users kept seeing an old shop.html after deploys.)
     * Other same-origin static files → cache-first for speed.
     * Supabase API + the supabase-js CDN → always network (never cached). */
const CACHE = 'rosedale-shop-v3';
const SHELL = ['shop.html', 'shop.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Never cache Supabase calls — the queue must always be live.
  if (url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.in')) return;

  const isHTML =
    req.mode === 'navigate' ||
    req.destination === 'document' ||
    url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first: always try to load the latest page; cache it as a fallback.
    e.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200 && url.origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req).then((hit) => hit || caches.match('shop.html')))
    );
    return;
  }

  // Other static assets: cache-first for speed.
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res && res.status === 200 && url.origin === self.location.origin) {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
      }
      return res;
    }).catch(() => hit))
  );
});
