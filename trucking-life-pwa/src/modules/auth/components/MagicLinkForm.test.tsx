import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MagicLinkForm } from './MagicLinkForm';
import { PENDING_UTM_KEY, buildEmailRedirectTo } from '@/modules/auth/hooks/useUtmCapture';

// Mock the Supabase client — no real network in unit tests. We record the
// localStorage state at the moment signInWithOtp is invoked so we can assert
// the load-bearing "stash BEFORE OTP" ordering (AC2).
const signInWithOtp = vi.fn();
vi.mock('@/core/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: (...args: unknown[]) => signInWithOtp(...args),
    },
  },
}));

describe('buildEmailRedirectTo', () => {
  it('targets /auth/callback and appends the captured utm_* params', () => {
    const url = new URL(
      buildEmailRedirectTo({ utm_source: 'stan_store', utm_campaign: 'carnivore' }),
    );
    expect(url.pathname).toBe('/auth/callback');
    expect(url.searchParams.get('utm_source')).toBe('stan_store');
    expect(url.searchParams.get('utm_campaign')).toBe('carnivore');
  });

  it('targets /auth/callback with no query when UTM is empty', () => {
    const url = new URL(buildEmailRedirectTo({}));
    expect(url.pathname).toBe('/auth/callback');
    expect(url.search).toBe('');
  });
});

describe('<MagicLinkForm>', () => {
  let utmAtOtpCall: string | null;

  beforeEach(() => {
    localStorage.clear();
    utmAtOtpCall = undefined as unknown as string | null;
    signInWithOtp.mockReset();
    signInWithOtp.mockImplementation(async () => {
      // Snapshot the stash at OTP-call time to prove ordering (AC2).
      utmAtOtpCall = localStorage.getItem(PENDING_UTM_KEY);
      return { data: {}, error: null };
    });
    // Arrive with UTM on the URL so useUtmCapture has something to stash.
    window.history.replaceState({}, '', '/auth/login?utm_source=stan_store&utm_campaign=carnivore');
  });

  it('renders no password field anywhere (FR4)', () => {
    const { container } = render(<MagicLinkForm />);
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it('writes pending_utm to localStorage BEFORE calling signInWithOtp (AC2)', async () => {
    render(<MagicLinkForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'driver@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));
    // The stash was already present when the OTP call fired.
    expect(utmAtOtpCall).toBe(
      JSON.stringify({ utm_source: 'stan_store', utm_campaign: 'carnivore' }),
    );
  });

  it('calls signInWithOtp with an emailRedirectTo carrying /auth/callback + utm_*', async () => {
    render(<MagicLinkForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'driver@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));

    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));
    const arg = signInWithOtp.mock.calls[0][0] as {
      email: string;
      options: { emailRedirectTo: string };
    };
    expect(arg.email).toBe('driver@example.com');
    const redirect = new URL(arg.options.emailRedirectTo);
    expect(redirect.pathname).toBe('/auth/callback');
    expect(redirect.searchParams.get('utm_source')).toBe('stan_store');
    expect(redirect.searchParams.get('utm_campaign')).toBe('carnivore');
  });

  it('shows a confirmation state on success', async () => {
    render(<MagicLinkForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'driver@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/check your email/i);
  });

  it('shows an inline error when the OTP request fails', async () => {
    signInWithOtp.mockResolvedValueOnce({ data: {}, error: { message: 'rate limited' } });
    render(<MagicLinkForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'driver@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/rate limited/i);
  });

  it('trims the email before calling signInWithOtp', async () => {
    render(<MagicLinkForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: '  driver@example.com  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }));
    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));
    expect((signInWithOtp.mock.calls[0][0] as { email: string }).email).toBe('driver@example.com');
  });

  it('does not call signInWithOtp for a whitespace-only email (no native validation)', async () => {
    render(<MagicLinkForm />);
    // Bypass the native `required`/`type=email` gate by submitting the form
    // directly with a whitespace value — the handler must still reject it.
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: '   ' } });
    fireEvent.submit(screen.getByRole('button', { name: /send magic link/i }).closest('form')!);
    expect(await screen.findByRole('alert')).toHaveTextContent(/enter your email/i);
    expect(signInWithOtp).not.toHaveBeenCalled();
  });

  it('ignores a second submit while the first is in flight (no double OTP)', async () => {
    let resolveOtp: (v: unknown) => void = () => {};
    signInWithOtp.mockReset().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveOtp = resolve;
        }),
    );
    render(<MagicLinkForm />);
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'driver@example.com' },
    });
    const form = screen.getByRole('button', { name: /send magic link/i }).closest('form')!;
    fireEvent.submit(form);
    fireEvent.submit(form); // second submit while the first OTP promise is pending
    resolveOtp({ data: {}, error: null });
    await waitFor(() => expect(signInWithOtp).toHaveBeenCalledTimes(1));
  });
});
