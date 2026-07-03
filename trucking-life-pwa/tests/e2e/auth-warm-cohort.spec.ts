import { test, expect } from '@playwright/test';
import { interceptOtp } from './helpers/supabaseAuth';

// Story 1.11 AC6 — the UTM-preservation happy path with the Supabase auth
// network call mocked (no real email roundtrip in CI). Proves the load-bearing
// AC2 ordering end-to-end: UTM is stashed to localStorage AND carried on the
// magic-link redirect_to before the OTP request leaves the browser.
test('warm (stan_store) sign-in stashes UTM and carries it on the magic-link redirect', async ({
  page,
}) => {
  const { waitForOtpRequest } = await interceptOtp(page);

  // Arrive from a Stan-store campaign link.
  await page.goto('/auth/login?utm_source=stan_store&utm_campaign=carnivore');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

  // No password field exists anywhere in the flow (FR4).
  await expect(page.locator('input[type="password"]')).toHaveCount(0);

  await page.getByLabel(/email/i).fill('driver@example.com');

  const otpRequest = waitForOtpRequest();
  await page.getByRole('button', { name: /send magic link/i }).click();
  const request = await otpRequest;

  // The captured UTM survives in localStorage (primary survival channel, AC2).
  const pendingUtm = await page.evaluate(() => localStorage.getItem('pending_utm'));
  expect(pendingUtm).not.toBeNull();
  const utm = JSON.parse(pendingUtm as string) as Record<string, string>;
  expect(utm.utm_source).toBe('stan_store');
  expect(utm.utm_campaign).toBe('carnivore');

  // The OTP request carries the callback URL with the UTM appended (backup
  // survival channel, AC2) so attribution lands even if localStorage is cleared.
  const redirectTo = new URL(request.url()).searchParams.get('redirect_to');
  expect(redirectTo).not.toBeNull();
  const callback = new URL(redirectTo as string);
  expect(callback.pathname).toBe('/auth/callback');
  expect(callback.searchParams.get('utm_source')).toBe('stan_store');
  expect(callback.searchParams.get('utm_campaign')).toBe('carnivore');

  // The driver sees the confirmation state, not an error.
  await expect(page.getByRole('status')).toHaveText(/check your email/i);
});

// Cold path: a visitor with no UTM still signs in; nothing is stashed under a
// campaign source, so AuthCallback will later derive `cold_youtube`.
test('cold sign-in (no UTM) sends a magic link with a bare callback redirect', async ({ page }) => {
  const { waitForOtpRequest } = await interceptOtp(page);

  await page.goto('/auth/login');
  await page.getByLabel(/email/i).fill('driver@example.com');

  const otpRequest = waitForOtpRequest();
  await page.getByRole('button', { name: /send magic link/i }).click();
  const request = await otpRequest;

  const redirectTo = new URL(request.url()).searchParams.get('redirect_to');
  const callback = new URL(redirectTo as string);
  expect(callback.pathname).toBe('/auth/callback');
  expect(callback.searchParams.get('utm_source')).toBeNull();
});
