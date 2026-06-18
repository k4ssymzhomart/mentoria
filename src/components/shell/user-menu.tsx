'use client';

import { LayoutDashboard, LogOut, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { UserRole } from '@/lib/data/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function initialsOf(name: string | null, email: string | null) {
  const src = (name || email || 'U').trim();
  const parts = src.split(/\s+/);
  const first = parts[0]?.[0] ?? 'U';
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + last).toUpperCase();
}

export function UserMenu({
  name,
  email,
  avatarUrl,
  role,
}: {
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
  role: UserRole;
}) {
  const t = useTranslations('common');
  const tn = useTranslations('nav');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" className="size-9 rounded-full p-0" />}
      >
        <Avatar className="size-9">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? ''} /> : null}
          <AvatarFallback className="text-xs">
            {initialsOf(name, email)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex flex-col gap-0.5 px-1.5 py-1">
          <span className="truncate text-sm font-medium">{name || email}</span>
          {email ? (
            <span className="truncate text-xs font-normal text-muted-foreground">
              {email}
            </span>
          ) : null}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/dashboard" />}>
          <LayoutDashboard className="size-4" />
          {tn('dashboard')}
        </DropdownMenuItem>
        {role === 'admin' ? (
          <DropdownMenuItem render={<Link href="/admin" />}>
            <Shield className="size-4" />
            {tn('admin')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem
            render={<button type="submit" className="w-full cursor-pointer" />}
          >
            <LogOut className="size-4" />
            {t('signOut')}
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
