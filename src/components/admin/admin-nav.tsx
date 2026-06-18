'use client';

import { ArrowLeft, BookOpen, Gauge, GraduationCap, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', key: 'overview', Icon: Gauge },
  { href: '/admin/opportunities', key: 'opportunities', Icon: GraduationCap },
  { href: '/admin/courses', key: 'courses', Icon: BookOpen },
  { href: '/admin/users', key: 'users', Icon: Users },
] as const;

export function AdminNav() {
  const t = useTranslations('admin.nav');
  const pathname = usePathname();

  return (
    <aside className="space-y-4">
      <nav className="space-y-1">
        {items.map(({ href, key, Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                active ? 'bg-muted font-medium text-foreground' : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
              )}
            >
              <Icon className="size-4" />
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {t('studentView')}
      </Link>
    </aside>
  );
}
