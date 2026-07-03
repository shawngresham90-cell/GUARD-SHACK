import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@supabase/supabase-js';
import AuthCallback from './AuthCallback';
import { useAuthStore } from '@/core/store/auth';
import { PENDING_UTM_KEY } from '@/modules/auth/hooks/useUtmCapture';

// Mock the Supabase client. `upsert` records its args so we can assert the
// derived cohort tag + write-once flag; `single` is configurable per test to
// drive the onboarding-aware redirect.
const upsert = vi.fn();
const maybeSingle = vi.fn();
vi.mock('@/core/supabase', () => ({
  supabase: {
    from: () => ({
      upsert: (...args: unknown[]) => upsert(...args),
      select: () => ({ eq: () => ({ maybeSingle: () => maybeSingle() }) }),
    }),
  },
}));

const USER = { id: 'user-123' } as unknown as User;

function renderCallback() {
  // retry:false so a thrown mutation surfaces the error state immediately.
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/auth/callback']}>
        <Routes>
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/login" element={<div>LOGIN PAGE</div>} />
          <Route path="/onboarding" element={<div>ONBOARDING PAGE</div>} />
          <Route path="/" element={<div>DRIVER HOME</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('<AuthCallback>', () => {
  beforeEach(() => {
    upsert.mockReset().mockResolvedValue({ error: null });
    maybeSingle.mockReset().mockResolvedValue({ data: { otr_or_local: null }, error: null });
    localStorage.clear();
    window.history.replaceState({}, '', '/auth/callback');
    useAuthStore.setState({ session: null, user: null, isAdmin: false, status: 'loading' });
  });

  it('shows a neutral signing-in state while the session is loading', () => {
    useAuthStore.setState({ status: 'loading' });
    renderCallback();
    expect(screen.getByRole('heading', { name: /signing you in/i })).toBeInTheDocument();
  });

  it('shows an expired-link error + back link when unauthenticated', () => {
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    renderCallback();
    expect(screen.getByRole('heading', { name: /expired/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument();
    expect(upsert).not.toHaveBeenCalled();
  });

  it('upserts cohort (write-once) and routes to /onboarding when otr_or_local is null', async () => {
    localStorage.setItem(PENDING_UTM_KEY, JSON.stringify({ utm_source: 'stan_store' }));
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();

    expect(await screen.findByText('ONBOARDING PAGE')).toBeInTheDocument();
    expect(upsert).toHaveBeenCalledTimes(1);
    const [row, opts] = upsert.mock.calls[0] as [
      { user_id: string; cohort_tag: string },
      { onConflict: string; ignoreDuplicates: boolean },
    ];
    expect(row).toEqual({ user_id: 'user-123', cohort_tag: 'day1_stan' });
    expect(opts).toEqual({ onConflict: 'user_id', ignoreDuplicates: true });
    // pending_utm cleared after the cohort is committed.
    expect(localStorage.getItem(PENDING_UTM_KEY)).toBeNull();
  });

  it('routes to / (driver home) when onboarding is already complete', async () => {
    maybeSingle.mockResolvedValue({ data: { otr_or_local: 'otr' }, error: null });
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();
    expect(await screen.findByText('DRIVER HOME')).toBeInTheDocument();
  });

  it('routes to /onboarding (not an error screen) when the profile read returns no row', async () => {
    // maybeSingle returns null for zero rows instead of throwing PGRST116, so a
    // valid sign-in is never hard-blocked by a transient read miss.
    maybeSingle.mockResolvedValue({ data: null, error: null });
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();
    expect(await screen.findByText('ONBOARDING PAGE')).toBeInTheDocument();
  });

  it('surfaces an error state when the profile read errors', async () => {
    maybeSingle.mockResolvedValue({ data: null, error: { message: 'read failed' } });
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();
    expect(
      await screen.findByRole('heading', { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });

  it('derives cold_youtube when no UTM survived (stash empty, no URL query)', async () => {
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();
    await screen.findByText('ONBOARDING PAGE');
    expect((upsert.mock.calls[0][0] as { cohort_tag: string }).cohort_tag).toBe('cold_youtube');
  });

  it('falls back to the callback URL query when the stash was cleared', async () => {
    window.history.replaceState({}, '', '/auth/callback?utm_source=stan_store');
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();
    await screen.findByText('ONBOARDING PAGE');
    expect((upsert.mock.calls[0][0] as { cohort_tag: string }).cohort_tag).toBe('day1_stan');
  });

  it('surfaces an error state when the upsert fails', async () => {
    upsert.mockResolvedValue({ error: { message: 'rls denied' } });
    useAuthStore.setState({ status: 'authenticated', user: USER });
    renderCallback();
    expect(
      await screen.findByRole('heading', { name: /something went wrong/i }),
    ).toBeInTheDocument();
  });
});
