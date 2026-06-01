/* Chair Cash service worker — makes the app installable and usable offline.
   Cache-first for the app shell so it opens with no connection. */
const CACHE = 'chaircash-v3';
const ASSETS = ['index.html', 'barbershop.webmanifest'];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
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
    e.respondWith(
        caches.match(req).then((hit) => hit || fetch(req).then((res) => {
            // cache same-origin successful responses for next time
            if (res && res.status === 200 && req.url.startsWith(self.location.origin)) {
                const copy = res.clone();
                caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
        }).catch(() => hit))
    );
});

/* Focus/open the app when a reminder notification is tapped. */
self.addEventListener('notificationclick', (e) => {
    e.notification.close();
    e.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
            for (const c of list) { if ('focus' in c) return c.focus(); }
            if (self.clients.openWindow) return self.clients.openWindow('index.html');
        })
    );
});
