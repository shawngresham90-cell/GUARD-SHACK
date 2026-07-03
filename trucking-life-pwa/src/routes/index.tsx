// src/routes/index.tsx
//
// Application route table (architecture.md:903-911, :491-505).
//
// Code-splitting contract (NFR-P6, the `bundle-size` CI gate): the Parking,
// HOS, and Admin subtrees are lazy() so they chunk off the initial bundle.
// Auth (login + callback), Onboarding, Settings, and the Disclaimer route are
// eager — they are part of the always-needed shell / first-paint paths.
//
// Guard wiring:
//   - Public (no guard): /auth/login, /auth/callback, /onboarding, /affiliate-disclosure
//   - Driver (RequireAuth): /, /parking, /settings, /hos
//   - HOS additionally wraps RequireHosAck + HosShell (composition contract, FR21)
//   - Admin (RequireAdmin): /admin

import { lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router';

import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { RequireHosAck } from './guards/RequireHosAck';
import { HosShell } from '@/modules/hos';

// Eager screens (shell / auth / first-paint paths).
import Login from '@/modules/auth/Login';
import AuthCallback from '@/modules/auth/AuthCallback';
import Onboarding from '@/modules/onboarding/Onboarding';
import Settings from '@/modules/settings/Settings';
import DisclaimerScreen from '@/modules/legal/DisclaimerScreen';

// Lazy feature subtrees (chunked off the initial bundle).
const ParkingHome = lazy(() => import('@/modules/parking/ParkingHome'));
const HosHome = lazy(() => import('@/modules/hos/HosHome'));
const AdminHome = lazy(() => import('@/modules/admin/AdminHome'));

export function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/affiliate-disclosure" element={<DisclaimerScreen />} />

      {/* Driver (auth-gated) */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <ParkingHome />
          </RequireAuth>
        }
      />
      <Route
        path="/parking"
        element={
          <RequireAuth>
            <ParkingHome />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <Settings />
          </RequireAuth>
        }
      />
      <Route
        path="/hos"
        element={
          <RequireAuth>
            <RequireHosAck>
              <HosShell>
                <HosHome />
              </HosShell>
            </RequireHosAck>
          </RequireAuth>
        }
      />

      {/* Admin (is_admin-gated) */}
      <Route
        path="/admin/*"
        element={
          <RequireAdmin>
            <AdminHome />
          </RequireAdmin>
        }
      />

      {/* Catch-all — unknown URLs fall back to the driver home rather than
          rendering a blank <Routes>. The whole /admin/* namespace is guarded
          above, so this never exposes an admin path. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
