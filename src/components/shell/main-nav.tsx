'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/data/types';
import { isActive, navItemsFor } from './nav-items';

export function MainNav({ role }: { role: UserRole | null }) {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="hidden items-center md:flex">
      {navItemsFor(role).map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'relative flex h-14 items-center px-3 text-sm font-medium transition-colors',
              active
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(item.key)}
            {/* The one accent: the active-nav indicator sits on the header's hairline. */}
            {active && (
              <span
                aria-hidden
                className="absolute inset-x-3 bottom-0 h-0.5 bg-brand"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
