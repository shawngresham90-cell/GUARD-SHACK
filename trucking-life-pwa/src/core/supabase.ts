// src/core/supabase.ts
//
// Singleton Supabase anon client (architecture.md:915). Typed with the
// generated `Database` type so every query is schema-checked at compile time.
//
// This is the ANON client used by driver-facing code. Admin privileges are
// NEVER granted here — they come exclusively from the `is_admin` JWT claim
// stamped by the server-side custom_access_token_hook (Story 1.3) and enforced
// by Postgres RLS. The client cannot manufacture admin access (FR60 / NFR-S4).

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/core/types/supabase';
import { env } from '@/core/env';

export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
