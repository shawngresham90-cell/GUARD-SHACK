// src/core/auth/claims.ts
//
// Pure helper: read the `is_admin` custom claim from a Supabase access token.
//
// WHY DECODE CLIENT-SIDE: this value drives a *routing* decision (show/hide the
// admin shell) — it is NOT a security boundary. The authoritative enforcement
// is Postgres RLS + the `is_admin` JWT claim at the data layer (Story 1.3,
// architecture.md:388). A user who forges this claim client-side gains nothing:
// every admin query still fails RLS. So an unverified payload decode is correct
// and intentionally avoids the network/JWKS round-trip (and the well-known
// onAuthStateChange re-entrancy deadlock from calling supabase.auth.* inside it).
//
// FAIL CLOSED: any malformed token, missing payload, or non-`true` value yields
// false. The claim is only honored when it is the boolean `true` that the
// server hook stamps — note the prod hook is implemented but not yet enabled
// (Story 1.3 Dev Agent Record), so this returns false for everyone until then.

function decodeBase64Url(segment: string): string {
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function readIsAdminClaim(accessToken: string | null | undefined): boolean {
  if (!accessToken) return false;
  try {
    const payload = accessToken.split('.')[1];
    if (!payload) return false;
    const claims = JSON.parse(decodeBase64Url(payload)) as { is_admin?: unknown };
    return claims.is_admin === true;
  } catch {
    return false;
  }
}
