'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

/**
 * Thin URL controller for the discovery filters. Every control reads the current
 * query and writes back to it; the server re-renders results from the URL. Any
 * filter change resets `page`. Locale is preserved (it lives in the pathname).
 */
export function useDiscovery() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const commit = useCallback(
    (params: URLSearchParams, scroll = false) => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll });
    },
    [router, pathname],
  );

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(sp.toString());
      if (!value) params.delete(key);
      else params.set(key, value);
      params.delete('page');
      commit(params);
    },
    [sp, commit],
  );

  const toggleInList = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      const current = params.get(key)?.split(',').filter(Boolean) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (next.length) params.set(key, next.join(','));
      else params.delete(key);
      params.delete('page');
      commit(params);
    },
    [sp, commit],
  );

  const setPage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(sp.toString());
      if (page > 0) params.set('page', String(page));
      else params.delete('page');
      commit(params, true);
    },
    [sp, commit],
  );

  const clearAll = useCallback(() => commit(new URLSearchParams()), [commit]);

  const has = useCallback((key: string, value: string) =>
    (sp.get(key)?.split(',').filter(Boolean) ?? []).includes(value), [sp]);

  return { sp, setParam, toggleInList, setPage, clearAll, has };
}
