import { KNOWN_CACHE_NAMES } from './cacheNames';

/**
 * NFR-S7 cache-partition tripwire (Story 1.9, AC3).
 *
 * The Service Worker may own ONLY the three `KNOWN_CACHE_NAMES` plus Workbox's
 * own internal precache namespace (`workbox-precache-*`). Any other Cache API
 * namespace means a leak across the SW ↔ Dexie `hosdb` trust boundary and must
 * be treated as a violation.
 *
 * Pure function — lives outside `sw.ts` (which has WebWorker globals + Workbox
 * side effects) so it is unit-testable in jsdom/node. Called from the SW's
 * `activate` handler. Keep the signature stable: Story 2.10 depends on it.
 */
export function assertCachePartition(cacheKeys: string[]): {
  ok: boolean;
  offenders: string[];
} {
  const allowed = new Set<string>(KNOWN_CACHE_NAMES);
  const offenders = cacheKeys.filter((name) => !allowed.has(name) && !isWorkboxInternalCache(name));
  return { ok: offenders.length === 0, offenders };
}

/**
 * Workbox owns several internal caches: `workbox-precache-v2-<scope>`, a
 * precache temp cache during updates, and (for some strategies) a
 * `workbox-runtime-<scope>` cache. All are legitimately ours — match the whole
 * `workbox-` family, not just precache, so the guard never deletes a cache the
 * library itself manages.
 */
function isWorkboxInternalCache(name: string): boolean {
  return name.startsWith('workbox-');
}
