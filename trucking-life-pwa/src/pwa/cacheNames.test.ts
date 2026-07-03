import { describe, expect, it } from 'vitest';
import { AFFILIATE_CONFIG, KNOWN_CACHE_NAMES, PARKING_RESULTS, STATIC_ASSETS } from './cacheNames';

describe('cacheNames (SW namespace contract — AC2)', () => {
  it('exports the three exact versioned literals', () => {
    expect(PARKING_RESULTS).toBe('parking-results-v1');
    expect(AFFILIATE_CONFIG).toBe('affiliate-config-v1');
    expect(STATIC_ASSETS).toBe('static-assets-v1');
  });

  it('KNOWN_CACHE_NAMES contains exactly the three namespaces', () => {
    expect(KNOWN_CACHE_NAMES).toHaveLength(3);
    expect([...KNOWN_CACHE_NAMES]).toEqual([PARKING_RESULTS, AFFILIATE_CONFIG, STATIC_ASSETS]);
  });

  it('has no duplicate namespaces', () => {
    expect(new Set(KNOWN_CACHE_NAMES).size).toBe(KNOWN_CACHE_NAMES.length);
  });
});
