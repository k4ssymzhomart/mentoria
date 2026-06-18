/**
 * Centralized, typed access to the public runtime configuration.
 *
 * Phase 0 ships in two modes:
 *  - Supabase mode  — real Google / magic-link auth (set the SUPABASE_* vars).
 *  - Dev-mock mode  — NEXT_PUBLIC_DEV_AUTH=true, no Supabase needed, fake sessions.
 *
 * Everything that talks to Supabase first checks `isSupabaseConfigured()` so the
 * app never crashes when the keys are absent (the swap is config, not code).
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';

// Accept the new publishable key or the legacy anon key (valid through end of 2026).
export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

/** True once both the project URL and a client key are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

/** True when the env-gated developer mock auth is switched on. */
export function isDevAuthEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEV_AUTH === 'true';
}
