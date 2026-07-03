import { describe, it, expect } from 'vitest';
import { readIsAdminClaim } from './claims';

// Build a structurally-valid JWT (header.payload.signature) with a base64url
// payload. Signature is irrelevant — the reader decodes, never verifies.
function makeToken(payload: Record<string, unknown>): string {
  const b64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.sig`;
}

// Build a token whose payload segment is an arbitrary base64url-encoded string
// (lets us exercise payloads that aren't JSON objects, or aren't valid base64).
function makeTokenWithRawPayload(rawPayload: string): string {
  const b64url = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `header.${b64url(rawPayload)}.sig`;
}

describe('readIsAdminClaim', () => {
  it('returns true when is_admin === true', () => {
    expect(readIsAdminClaim(makeToken({ sub: 'u1', is_admin: true }))).toBe(true);
  });

  it('returns false when is_admin claim is absent', () => {
    expect(readIsAdminClaim(makeToken({ sub: 'u1' }))).toBe(false);
  });

  it('returns false for the string "true" (must be boolean — fail closed)', () => {
    expect(readIsAdminClaim(makeToken({ is_admin: 'true' }))).toBe(false);
  });

  it('returns false when is_admin === false', () => {
    expect(readIsAdminClaim(makeToken({ is_admin: false }))).toBe(false);
  });

  it('decodes a unicode email in the payload without throwing', () => {
    expect(readIsAdminClaim(makeToken({ email: 'tëst@exämple.com', is_admin: true }))).toBe(true);
  });

  it('returns false when is_admin is a truthy non-boolean (array / object / number)', () => {
    expect(readIsAdminClaim(makeToken({ is_admin: [true] }))).toBe(false);
    expect(readIsAdminClaim(makeToken({ is_admin: { value: true } }))).toBe(false);
    expect(readIsAdminClaim(makeToken({ is_admin: 1 }))).toBe(false);
  });

  it('returns false when the payload is valid JSON but not an object (null / array / number)', () => {
    expect(readIsAdminClaim(makeTokenWithRawPayload('null'))).toBe(false);
    expect(readIsAdminClaim(makeTokenWithRawPayload('[1,2,3]'))).toBe(false);
    expect(readIsAdminClaim(makeTokenWithRawPayload('42'))).toBe(false);
  });

  it('returns false for a malformed token', () => {
    expect(readIsAdminClaim('not-a-jwt')).toBe(false);
  });

  it('returns false for a 3-segment token whose payload is not valid base64/JSON', () => {
    expect(readIsAdminClaim('header.@@@@.sig')).toBe(false);
    expect(readIsAdminClaim(makeTokenWithRawPayload('not json'))).toBe(false);
  });

  it('returns false for null / undefined / empty', () => {
    expect(readIsAdminClaim(null)).toBe(false);
    expect(readIsAdminClaim(undefined)).toBe(false);
    expect(readIsAdminClaim('')).toBe(false);
  });
});
