import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseUtm,
  stashPendingUtm,
  readPendingUtm,
  clearPendingUtm,
  PENDING_UTM_KEY,
} from './useUtmCapture';
import { deriveCohort } from '../cohort';

/** Minimal in-memory Storage stub (mirrors installPrompt.test.ts convention). */
function fakeStorage(): { storage: Storage; store: Record<string, string> } {
  const store: Record<string, string> = {};
  const storage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
  } as unknown as Storage;
  return { storage, store };
}

describe('parseUtm', () => {
  it('extracts all recognised utm_* params from a query string', () => {
    const utm = parseUtm(
      '?utm_source=stan_store&utm_medium=email&utm_campaign=carnivore&utm_term=t&utm_content=c',
    );
    expect(utm).toEqual({
      utm_source: 'stan_store',
      utm_medium: 'email',
      utm_campaign: 'carnivore',
      utm_term: 't',
      utm_content: 'c',
    });
  });

  it('ignores non-utm params and omits absent keys', () => {
    expect(parseUtm('?utm_source=youtube&ref=abc&foo=bar')).toEqual({ utm_source: 'youtube' });
  });

  it('returns an empty object derivable to cold_youtube when no UTM present', () => {
    const utm = parseUtm('');
    expect(utm).toEqual({});
    expect(deriveCohort(utm.utm_source)).toBe('cold_youtube');
  });
});

describe('stashPendingUtm / readPendingUtm / clearPendingUtm', () => {
  let storage: Storage;
  let store: Record<string, string>;
  beforeEach(() => {
    ({ storage, store } = fakeStorage());
  });

  it('writes the UTM object to pending_utm and reads it back', () => {
    stashPendingUtm(storage, { utm_source: 'stan_store', utm_campaign: 'carnivore' });
    expect(store[PENDING_UTM_KEY]).toBe(
      JSON.stringify({ utm_source: 'stan_store', utm_campaign: 'carnivore' }),
    );
    expect(readPendingUtm(storage)).toEqual({
      utm_source: 'stan_store',
      utm_campaign: 'carnivore',
    });
  });

  it('reads {} for an absent or corrupt stash (so cohort still derives)', () => {
    expect(readPendingUtm(storage)).toEqual({});
    store[PENDING_UTM_KEY] = '{not json';
    expect(readPendingUtm(storage)).toEqual({});
    expect(deriveCohort(readPendingUtm(storage).utm_source)).toBe('cold_youtube');
  });

  it('rejects non-object JSON (array, string, number) and returns {}', () => {
    for (const bad of ['[]', '["stan_store"]', '"stan_store"', '42', 'true', 'null']) {
      store[PENDING_UTM_KEY] = bad;
      expect(readPendingUtm(storage)).toEqual({});
    }
  });

  it('clears the stash', () => {
    stashPendingUtm(storage, { utm_source: 'youtube' });
    clearPendingUtm(storage);
    expect(store[PENDING_UTM_KEY]).toBeUndefined();
  });

  it('never throws when storage access throws (private mode / quota)', () => {
    const throwing = {
      getItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
      setItem: () => {
        throw new DOMException('quota', 'QuotaExceededError');
      },
      removeItem: () => {
        throw new DOMException('denied', 'SecurityError');
      },
    } as unknown as Storage;
    expect(() => stashPendingUtm(throwing, { utm_source: 'stan_store' })).not.toThrow();
    expect(readPendingUtm(throwing)).toEqual({});
    expect(() => clearPendingUtm(throwing)).not.toThrow();
  });
});
