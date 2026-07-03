/**
 * Service-Worker cache namespace contract (Story 1.9, AC2).
 *
 * These three names are the ONLY Cache API namespaces the app is permitted to
 * create. They are kept disjoint from the Dexie `hosdb` IndexedDB database
 * (Story 3.1) — two cache partitions, two trust domains (NFR-S7). The runtime
 * partition assertion in `sw.ts` enforces this against `KNOWN_CACHE_NAMES`.
 *
 * @see _bmad-output/planning-artifacts/architecture.md#Caching-strategy
 */
export const PARKING_RESULTS = 'parking-results-v1';
export const AFFILIATE_CONFIG = 'affiliate-config-v1';
export const STATIC_ASSETS = 'static-assets-v1';

/** Every namespace the SW is allowed to own. Single source for the assertion + tests. */
export const KNOWN_CACHE_NAMES = [PARKING_RESULTS, AFFILIATE_CONFIG, STATIC_ASSETS] as const;
