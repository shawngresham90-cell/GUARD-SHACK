// src/modules/auth/components/MagicLinkForm.tsx
//
// Passwordless sign-in form (AC1, AC2 — FR1/FR3/FR4). A native <form> with a
// single labelled email input and a submit button — NO form library, NO
// password field anywhere (FR4). Lives in the EAGER auth bundle, so it stays
// lean to respect the ≤200 KB gz bundle-size gate.
//
// Submit flow (ordering is load-bearing — AC2):
//   1. stashUtm()  — persist pending_utm to localStorage BEFORE the network call
//   2. signInWithOtp({ email, options: { emailRedirectTo } }) where
//      emailRedirectTo = siteUrl('/auth/callback') + the captured utm_* params
//      (belt-and-suspenders UTM survival — read back in <AuthCallback>).
//
// On success we show a "check your email" confirmation; on failure an inline
// error. The label/`htmlFor` pairing is required for the Lighthouse a11y ≥95
// gate (NFR-A7).

import { useState, type FormEvent } from 'react';
import { supabase } from '@/core/supabase';
import { useUtmCapture, buildEmailRedirectTo } from '@/modules/auth/hooks/useUtmCapture';

type Status = 'idle' | 'submitting' | 'sent' | 'error';

export function MagicLinkForm() {
  const { stashUtm } = useUtmCapture();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Synchronous in-flight guard: `disabled` reflects async state and does not
    // commit within a click-burst, so a double-click / held-Enter could fire a
    // second signInWithOtp (→ a spurious "rate limited" error on the resend).
    // `status` is read from the latest render, which is sufficient here.
    if (status === 'submitting') return;

    // Trim + validate locally — the form is `noValidate`-free but we still guard
    // against an empty/whitespace value reaching Supabase (mis-attributed or
    // wasted OTP calls).
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email address.');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setError(null);

    // AC2: stash UTM BEFORE the OTP call so attribution survives even if the
    // request never resolves.
    const utm = stashUtm();
    const emailRedirectTo = buildEmailRedirectTo(utm);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo },
    });

    if (otpError) {
      setError(otpError.message);
      setStatus('error');
      return;
    }
    setStatus('sent');
  }

  if (status === 'sent') {
    return (
      <p role="status" className="text-sm text-neutral-300">
        Check your email for a sign-in link. It expires shortly — open it on this device.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <label htmlFor="email" className="text-left text-sm font-medium text-neutral-200">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-2 text-neutral-50 outline-none focus:border-neutral-400"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="rounded-md bg-neutral-50 px-3 py-2 font-semibold text-neutral-950 disabled:opacity-60"
      >
        {status === 'submitting' ? 'Sending…' : 'Send magic link'}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}
