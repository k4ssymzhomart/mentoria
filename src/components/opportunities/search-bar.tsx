'use client';

import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { useDiscovery } from './use-discovery';

export function SearchBar() {
  const t = useTranslations('opportunities');
  const { sp, setParam } = useDiscovery();
  const [value, setValue] = useState(() => sp.get('q') ?? '');
  const lastPushed = useRef(sp.get('q') ?? '');

  // Debounce pushes so typing doesn't thrash history or the server.
  useEffect(() => {
    if (value === (sp.get('q') ?? '')) return;
    const id = setTimeout(() => {
      lastPushed.current = value;
      setParam('q', value || null);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Sync from the URL only on external changes (e.g. "Clear all"), not our own pushes.
  useEffect(() => {
    const urlQ = sp.get('q') ?? '';
    if (urlQ !== lastPushed.current) {
      lastPushed.current = urlQ;
      setValue(urlQ);
    }
  }, [sp]);

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchPlaceholder')}
        className="pl-8"
      />
    </div>
  );
}
