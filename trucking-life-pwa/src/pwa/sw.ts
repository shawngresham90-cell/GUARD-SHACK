/// <reference lib="webworker" />
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { AFFILIATE_CONFIG, PARKING_RESULTS, STATIC_ASSETS } from './cacheNames';
import { assertCachePartition } from './partition';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
};

// Precache the app shell. This is the injectManifest injection point — the
// build fails if `self.__WB_MANIFEST` is missing from the source SW. The `?? []`
// keeps the worker from throwing at registration if the token is ever served
// un-injected (e.g. a stale dev SW).
precacheAndRoute(self.__WB_MANIFEST ?? []);

// Runtime cache routes keyed to the three namespaces (NFR-S7 contract).
// v1 establishes cacheName + strategy; feature epics fill in the real URL
// matchers (Story 2.10 → parking, Epic 4 → affiliate config).
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/parking'),
  new StaleWhileRevalidate({ cacheName: PARKING_RESULTS }),
);
registerRoute(
  ({ url }) => url.pathname.endsWith('/affiliate-config.json'),
  new StaleWhileRevalidate({ cacheName: AFFILIATE_CONFIG }),
);
registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({ cacheName: STATIC_ASSETS }),
);

// autoUpdate: take over as soon as the new SW is ready.
self.addEventListener('install', () => {
  void self.skipWaiting();
});

// NFR-S7 enforcement: on every activation, prove no foreign cache namespace
// (e.g. the Dexie `hosdb` trust domain) has leaked into the SW Cache API.
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        const { ok, offenders } = assertCachePartition(keys);
        if (!ok) {
          console.error(
            '[sw] NFR-S7 cache-partition violation — unexpected cache namespace(s):',
            offenders,
          );
          // Tolerate individual delete failures so cleanup of one bad cache
          // never blocks claiming clients.
          await Promise.all(offenders.map((name) => caches.delete(name).catch(() => false)));
        }
      } catch (err) {
        console.error('[sw] cache-partition check failed:', err);
      }
      // Always claim, even if the partition check/cleanup above failed —
      // otherwise an autoUpdate activation could leave clients uncontrolled.
      await self.clients.claim().catch(() => undefined);
    })(),
  );
});
