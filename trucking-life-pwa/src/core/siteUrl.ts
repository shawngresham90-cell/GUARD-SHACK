/**
 * Canonical base-URL resolver — the single source of truth for building absolute
 * URLs (auth `emailRedirectTo`, magic-link redirects, share links, etc.).
 *
 * Story 1.4: no production origin and no preview origin is ever hardcoded, and a
 * localhost URL is only ever reachable off-browser (dev/SSR/tests).
 *
 * Resolution order (first defined wins):
 *   1. `VITE_SITE_URL`          — explicit production origin (the custom domain),
 *                                 set ONLY in Netlify's `production` context. Wins
 *                                 everywhere so prod links are always the canonical
 *                                 domain even if rendered off-browser.
 *   2. `window.location.origin` — the true runtime origin. Covers deploy-preview
 *                                 and branch-deploy contexts (each preview
 *                                 self-references — this is the client-SPA
 *                                 equivalent of Netlify's `$DEPLOY_PRIME_URL`, and
 *                                 strictly more correct since it is also right on a
 *                                 preview *permalink*), local `vite dev`, and prod
 *                                 when `VITE_SITE_URL` is unset.
 *   3. `http://localhost:3000`  — non-browser fallback ONLY (SSR builds, unit
 *                                 tests). Matches the Supabase dev redirect entry.
 *
 * NOTE (Story 1.4 deviation, intentional): the spec lists `$DEPLOY_PRIME_URL` as a
 * distinct layer above `window.location.origin`. In a pure client SPA that build-time
 * value is not present in the browser, and the runtime origin already *is* the
 * preview's URL — so layer 2 fulfils the "previews self-reference" intent without
 * baking a possibly-stale URL into the bundle. No preview URL is hardcoded.
 */
export function getSiteUrl(): string {
  const explicit = import.meta.env.VITE_SITE_URL?.trim();
  if (explicit) return stripTrailingSlash(explicit);

  if (typeof window !== 'undefined' && window.location?.origin) {
    return stripTrailingSlash(window.location.origin);
  }

  return 'http://localhost:3000';
}

/** Build an absolute URL on the resolved site origin. `path` may omit the leading slash. */
export function siteUrl(path = ''): string {
  const base = getSiteUrl();
  if (!path) return base;
  return `${base}/${path.replace(/^\/+/, '')}`;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}
