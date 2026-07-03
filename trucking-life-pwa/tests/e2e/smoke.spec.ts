import { test, expect } from '@playwright/test';

// Story 1.10 turned "/" into an auth-gated driver route. With no session, the
// RequireAuth guard redirects to /auth/login. This smoke-tests that the whole
// provider tree boots (QueryClient → Router → AuthProvider → Suspense) and the
// routing skeleton + guard work end-to-end against a real browser.
test('unauthenticated visit to / redirects to the sign-in route', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/auth\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
});

// A public (un-guarded) route renders without any auth — proves the eager
// route branch of the tree mounts independently of the guards.
test('public affiliate-disclosure route renders without auth', async ({ page }) => {
  await page.goto('/affiliate-disclosure');
  await expect(page.getByRole('heading', { name: 'Affiliate Disclosure' })).toBeVisible();
});
