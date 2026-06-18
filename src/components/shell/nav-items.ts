import type { UserRole } from '@/lib/data/types';

export type NavItem = { href: string; key: string };

const opportunities: NavItem = { href: '/opportunities', key: 'opportunities' };
const courses: NavItem = { href: '/courses', key: 'courses' };

/** Role-aware primary navigation (keys map into the `nav` message namespace). */
export function navItemsFor(role: UserRole | null): NavItem[] {
  // Signed out: only the public browse routes.
  if (!role) return [opportunities, courses];

  const items: NavItem[] = [
    { href: '/dashboard', key: 'dashboard' },
    opportunities,
    courses,
    { href: '/roadmap', key: 'roadmap' },
    { href: '/calendar', key: 'calendar' },
  ];
  if (role === 'admin') items.push({ href: '/admin', key: 'admin' });
  return items;
}

/** `pathname` here is locale-stripped (from next-intl's usePathname). */
export function isActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
