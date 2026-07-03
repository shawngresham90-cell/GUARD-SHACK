// src/core/env.ts
//
// Boot-time validation of the public Vite env vars (architecture.md:918).
// Imported by src/core/supabase.ts so a missing/blank Supabase URL or anon
// key fails loudly at app startup instead of surfacing as an opaque network
// error deep inside an auth call.
//
// Only VITE_*-prefixed vars are exposed to client code by Vite. These two are
// the minimum the app needs to construct the Supabase anon client. VITE_SITE_URL
// and VITE_PLAUSIBLE_DOMAIN are intentionally optional (see src/core/siteUrl.ts).

import { z } from 'zod';

const envSchema = z.object({
  VITE_SUPABASE_URL: z.url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
});

if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ');
  throw new Error(
    `Missing or invalid environment variables: ${missing}. ` +
      `Set them in .env.local (see .env.example).`,
  );
}

export const env = parsed.data;
