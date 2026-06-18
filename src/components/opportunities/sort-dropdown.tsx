'use client';

import { ArrowDownUp, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDiscovery } from './use-discovery';

export function SortDropdown() {
  const t = useTranslations('opportunities');
  const { sp, setParam } = useDiscovery();
  const current = sp.get('sort') === 'newest' ? 'newest' : 'deadline';
  const options = [
    ['deadline', t('sort.deadline')],
    ['newest', t('sort.newest')],
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        <ArrowDownUp className="size-4" />
        <span className="hidden sm:inline">
          {current === 'newest' ? t('sort.newest') : t('sort.deadline')}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map(([val, label]) => (
          <DropdownMenuItem
            key={val}
            onClick={() => setParam('sort', val === 'deadline' ? null : val)}
            className="justify-between gap-6"
          >
            {label}
            <Check
              className={cn('size-4', current === val ? 'opacity-100' : 'opacity-0')}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
