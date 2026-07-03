import { describe, expect, it } from 'vitest';
import { assertCachePartition } from './partition';
import { AFFILIATE_CONFIG, PARKING_RESULTS, STATIC_ASSETS } from './cacheNames';

describe('assertCachePartition (NFR-S7 tripwire — AC3)', () => {
  it('passes for the three known namespaces + Workbox precache', () => {
    const result = assertCachePartition([
      PARKING_RESULTS,
      AFFILIATE_CONFIG,
      STATIC_ASSETS,
      'workbox-precache-v2-https://app.truckinglifewithshawn.com/',
    ]);
    expect(result.ok).toBe(true);
    expect(result.offenders).toEqual([]);
  });

  it('passes for an empty cache list', () => {
    expect(assertCachePartition([])).toEqual({ ok: true, offenders: [] });
  });

  it('allows all Workbox-managed caches, not just precache', () => {
    const result = assertCachePartition([
      'workbox-precache-v2-https://app/',
      'workbox-runtime-https://app/',
    ]);
    expect(result.ok).toBe(true);
    expect(result.offenders).toEqual([]);
  });

  it('flags the Dexie hosdb database as an offender (the partition it guards)', () => {
    const result = assertCachePartition([PARKING_RESULTS, 'hosdb']);
    expect(result.ok).toBe(false);
    expect(result.offenders).toEqual(['hosdb']);
  });

  it('flags any unexpected namespace and lists every offender', () => {
    const result = assertCachePartition([STATIC_ASSETS, 'rogue-cache', 'another-leak-v1']);
    expect(result.ok).toBe(false);
    expect(result.offenders).toEqual(['rogue-cache', 'another-leak-v1']);
  });
});
