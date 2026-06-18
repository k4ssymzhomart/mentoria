'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useDiscovery } from '@/components/opportunities/use-discovery';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
const KNOWN_SUBJECTS = new Set(['sat', 'ielts', 'admissions']);

function FilterMenu({
  paramKey,
  current,
  allLabel,
  options,
}: {
  paramKey: string;
  current: string | null;
  allLabel: string;
  options: { value: string; label: string }[];
}) {
  const { setParam } = useDiscovery();
  const active = options.find((o) => o.value === current);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" />}>
        {active ? active.label : allLabel}
        <ChevronDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem
          onClick={() => setParam(paramKey, null)}
          className="justify-between gap-6"
        >
          {allLabel}
          <Check className={cn('size-4', !current ? 'opacity-100' : 'opacity-0')} />
        </DropdownMenuItem>
        {options.map((o) => (
          <DropdownMenuItem
            key={o.value}
            onClick={() => setParam(paramKey, o.value)}
            className="justify-between gap-6"
          >
            {o.label}
            <Check className={cn('size-4', current === o.value ? 'opacity-100' : 'opacity-0')} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CatalogFilters({ subjects }: { subjects: string[] }) {
  const t = useTranslations('courses');
  const { sp } = useDiscovery();

  const subjectOptions = subjects.map((s) => ({
    value: s,
    label: KNOWN_SUBJECTS.has(s) ? t(`subjects.${s}`) : s.toUpperCase(),
  }));
  const difficultyOptions = DIFFICULTIES.map((d) => ({ value: d, label: t(`difficulty.${d}`) }));

  return (
    <div className="flex flex-wrap items-center gap-2">
      <FilterMenu
        paramKey="subject"
        current={sp.get('subject')}
        allLabel={t('filters.allSubjects')}
        options={subjectOptions}
      />
      <FilterMenu
        paramKey="difficulty"
        current={sp.get('difficulty')}
        allLabel={t('filters.allLevels')}
        options={difficultyOptions}
      />
    </div>
  );
}
