// src/modules/auth/Login.tsx — passwordless sign-in screen (Story 1.11, AC1).
// Eagerly loaded: it's the unauthenticated entry point that guards redirect to
// (architecture.md:504 "Auth eager"). Default export, public (no guard).
//
// The <h1> accessible name "Sign in" is load-bearing — the E2E smoke asserts
// getByRole('heading', { name: 'Sign in' }); keep it exact.
import { MagicLinkForm } from '@/modules/auth/components/MagicLinkForm';

export default function Login() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 p-6 text-center text-neutral-50">
      <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
      <p className="max-w-sm text-sm text-neutral-400">
        Enter your email and we&apos;ll send you a one-tap sign-in link. No password needed.
      </p>
      <MagicLinkForm />
    </main>
  );
}
