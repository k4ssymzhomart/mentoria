import 'server-only';
import { cookies } from 'next/headers';
import { isDevAuthEnabled } from '@/lib/env';
import type { Profile, SessionUser, UserRole } from '@/lib/data/types';

/**
 * Developer mock auth — env-gated (NEXT_PUBLIC_DEV_AUTH=true). Lets the authed
 * and admin areas run with zero Supabase setup by storing a chosen role in a
 * cookie and synthesizing a session/profile from it. The moment real Supabase
 * keys are present and DEV_AUTH is off, this path is skipped entirely.
 */
export const DEV_ROLE_COOKIE = 'mh_dev_role';

const DEV_ROLES: readonly UserRole[] = ['student', 'admin', 'mentor'];

export function isDevRole(value: string | undefined | null): value is UserRole {
  return !!value && DEV_ROLES.includes(value as UserRole);
}

/** The mock role from the cookie, or null when not dev-signed-in. */
export async function getDevRole(): Promise<UserRole | null> {
  if (!isDevAuthEnabled()) return null;
  const store = await cookies();
  const value = store.get(DEV_ROLE_COOKIE)?.value;
  return isDevRole(value) ? value : null;
}

const PRESETS: Record<UserRole, { id: string; name: string; email: string }> = {
  student: { id: 'dev-student', name: 'Demo Student', email: 'student@mentoria.dev' },
  admin: { id: 'dev-admin', name: 'Demo Admin', email: 'admin@mentoria.dev' },
  mentor: { id: 'dev-mentor', name: 'Demo Mentor', email: 'mentor@mentoria.dev' },
};

export function devUser(role: UserRole): SessionUser {
  const preset = PRESETS[role];
  return { id: preset.id, email: preset.email };
}

export function devProfile(role: UserRole): Profile {
  const preset = PRESETS[role];
  return {
    id: preset.id,
    full_name: preset.name,
    email: preset.email,
    avatar_url: null,
    role,
    grade: role === 'student' ? 11 : null,
    interests: [],
    subjects: [],
    goals: [],
    locale: 'ru',
    onboarded: true,
    created_at: new Date(0).toISOString(),
  };
}
