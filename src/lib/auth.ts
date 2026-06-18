import 'server-only';
import { getLocale } from 'next-intl/server';
import { createClient } from '@/utils/supabase/server';
import { redirect } from '@/i18n/navigation';
import { isDevAuthEnabled, isSupabaseConfigured } from '@/lib/env';
import { devProfile, devUser, getDevRole } from '@/lib/dev-auth';
import type { Profile, SessionUser } from '@/lib/data/types';

/** The signed-in user (dev-mock first, then Supabase), or null when signed out. */
export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDevAuthEnabled()) {
    const role = await getDevRole();
    if (role) return devUser(role);
  }
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ? { id: user.id, email: user.email ?? null } : null;
}

/**
 * The real Supabase auth user id (ignores dev-mock, which can't own DB rows
 * because profiles.id references auth.users). Use this for ownership of saves,
 * enrollments, etc. Returns null when there is no real session.
 */
export async function getAuthUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/** The signed-in user's profile row (with role), or null when signed out. */
export async function getProfile(): Promise<Profile | null> {
  if (isDevAuthEnabled()) {
    const role = await getDevRole();
    if (role) return devProfile(role);
  }
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return (data as Profile | null) ?? null;
}

/** Gate for the (app) area: redirects signed-out users to the locale home. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    redirect({ href: '/', locale: await getLocale() });
  }
  return user as SessionUser;
}

/** Gate for the (admin) area: redirects anyone who isn't an admin. */
export async function requireAdmin(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile || profile.role !== 'admin') {
    redirect({ href: '/', locale: await getLocale() });
  }
  return profile as Profile;
}
