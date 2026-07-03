import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router';
import { RequireAuth } from './RequireAuth';
import { useAuthStore } from '@/core/store/auth';

// Drive the guard by setting Zustand state directly — no network, fully
// deterministic (architecture.md:692 testing convention).
function renderGuarded() {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/auth/login" element={<div>LOGIN PAGE</div>} />
        <Route
          path="/protected"
          element={
            <RequireAuth>
              <div>PROTECTED CONTENT</div>
            </RequireAuth>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('<RequireAuth>', () => {
  beforeEach(() => {
    useAuthStore.setState({ session: null, user: null, isAdmin: false, status: 'loading' });
  });

  it('renders neither children nor a redirect while loading', () => {
    useAuthStore.setState({ status: 'loading' });
    renderGuarded();
    expect(screen.queryByText('PROTECTED CONTENT')).not.toBeInTheDocument();
    expect(screen.queryByText('LOGIN PAGE')).not.toBeInTheDocument();
  });

  it('renders children when authenticated (happy path)', () => {
    useAuthStore.setState({ status: 'authenticated' });
    renderGuarded();
    expect(screen.getByText('PROTECTED CONTENT')).toBeInTheDocument();
  });

  it('redirects to /auth/login when unauthenticated', () => {
    useAuthStore.setState({ status: 'unauthenticated' });
    renderGuarded();
    expect(screen.getByText('LOGIN PAGE')).toBeInTheDocument();
    expect(screen.queryByText('PROTECTED CONTENT')).not.toBeInTheDocument();
  });
});
