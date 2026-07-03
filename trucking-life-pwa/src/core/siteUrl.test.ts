import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSiteUrl, siteUrl } from './siteUrl';

// jsdom gives us a window.location.origin of http://localhost:3000 by default.
// We override import.meta.env.VITE_SITE_URL per-test via vi.stubEnv.

describe('getSiteUrl — base-URL resolution ladder', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('prefers explicit VITE_SITE_URL (production custom domain) above all', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://app.truckinglifewithshawn.com');
    expect(getSiteUrl()).toBe('https://app.truckinglifewithshawn.com');
  });

  it('strips a trailing slash from the explicit origin', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://app.truckinglifewithshawn.com/');
    expect(getSiteUrl()).toBe('https://app.truckinglifewithshawn.com');
  });

  it('falls back to the runtime origin (preview self-reference) when VITE_SITE_URL is empty', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    vi.stubGlobal('window', {
      location: { origin: 'https://deploy-preview-42--trucking-life-pwa.netlify.app' },
    });
    expect(getSiteUrl()).toBe('https://deploy-preview-42--trucking-life-pwa.netlify.app');
  });

  it('uses the localhost:3000 fallback only when off-browser (no window)', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    vi.stubGlobal('window', undefined);
    expect(getSiteUrl()).toBe('http://localhost:3000');
  });

  it('never hardcodes a production origin in the dev/off-browser path', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    vi.stubGlobal('window', undefined);
    expect(getSiteUrl()).not.toContain('truckinglifewithshawn');
    expect(getSiteUrl()).not.toContain('netlify.app');
  });
});

describe('siteUrl — absolute URL builder', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SITE_URL', 'https://app.truckinglifewithshawn.com');
  });
  afterEach(() => vi.unstubAllEnvs());

  it('returns the bare origin for an empty path', () => {
    expect(siteUrl()).toBe('https://app.truckinglifewithshawn.com');
  });

  it('joins a path without doubling the slash', () => {
    expect(siteUrl('/auth/callback')).toBe('https://app.truckinglifewithshawn.com/auth/callback');
    expect(siteUrl('auth/callback')).toBe('https://app.truckinglifewithshawn.com/auth/callback');
  });
});
