import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { RequireAdmin } from './RequireAdmin';
import { useAuthStore } from '@/core/store/auth';

// Renders /admin behind the guard, plus the two redirect targets so we can
// assert which one wins per auth state. Covers AC6 at the unit level.
function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/" element={<div>DRIVER HOME</div>} />
        <Route path="/auth/login" element={<div>LOGIN PAGE</div>} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <div>ADMIN CONTENT</div>
            </RequireAdmin>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<RequireAdmin>', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, user: null, isAdmin: false, status: 'loading' });
  });

  it('renders nothing while loading', () => {
    useAuthStore.setState({ status: 'loading' });
    renderGuarded();
    expect(screen.queryByText('ADMIN CONTENT')).not.toBeInTheDocument();
    expect(screen.queryByText('DRIVER HOME')).not.toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument();
  });

  it('renders children when authenticated AND admin (happy path)', () => {
    useAuthStore.setState({ status: 'authenticated', isAdmin: true });
    renderGuarded();
    expect(screen.getByText('ADMIN CONTENT')).toBeInTheDocument();
  });

  it('redirects an authenticated non-admin to / (driver home)', () => {
    useAuthStore.setState({ status: 'authenticated', isAdmin: false });
    renderGuarded();
    expect(screen.getByText('DRIVER HOME')).toBeInTheDocument();
    expect(screen.queryByText('ADMIN CONTENT')).not.toBeInTheDocument();
  });

  it('redirects an unauthenticated visitor to /auth/login', () => {
    useAuthStore.setState({ status: 'unauthenticated', isAdmin: false });
    renderGuarded();
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('ADMIN CONTENT')).not.toBeInTheDocument();
  });
});
