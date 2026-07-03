// tests/e2e/helpers/supabaseAuth.ts
//
// Reusable Playwright interception for the Supabase auth network calls (first
// introduced in Story 1.11; reused by Story 1.12 Google sign-in). CI has no
// real email roundtrip, so we fulfil the gotrue OTP endpoint locally and let
// the test assert what the client *sent* (email + redirect_to) without a live
// Supabase request escaping the browser.
//
// supabase-js sends `signInWithOtp({ email, options: { emailRedirectTo } })` as
// POST `${VITE_SUPABASE_URL}/auth/v1/otp?redirect_to=<emailRedirectTo>`, so the
// UTM-bearing callback URL rides on the request's `redirect_to` query param.

import type { Page, Request } from '@playwright/test';

/** glob matching the gotrue magic-link OTP endpoint regardless of project ref. */
export const OTP_ROUTE_GLOB = '**/auth/v1/otp**';

/**
 * Intercept the OTP endpoint and fulfil it with a success response (no email is
 * actually sent). Call BEFORE the action that triggers sign-in. Returns a
 * `waitForOtpRequest()` that resolves with the captured request so the caller
 * can assert the email and `redirect_to` it carried.
 */
export async function interceptOtp(page: Page): Promise<{
  waitForOtpRequest: () => Promise<Request>;
}> {
  await page.route(OTP_ROUTE_GLOB, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: {}, error: null }),
    });
  });

  return {
    waitForOtpRequest: () => page.waitForRequest(OTP_ROUTE_GLOB),
  };
}
