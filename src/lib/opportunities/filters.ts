import type {
  OpportunityFilters,
  OpportunityType,
  OpportunityFormat,
} from '@/lib/data/types';

export const PAGE_SIZE = 12;

/** Raw searchParams as Next.js hands them to a page (already awaited). */
export type SearchParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const csv = (v: string | string[] | undefined) => {
  const s = first(v);
  return s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];
};

/** `30` / `90` → an ISO date that many days out; `all`/missing → no bound. */
export function computeDeadlineBefore(window: string | undefined): string | undefined {
  if (!window || window === 'all') return undefined;
  const days = Number(window);
  if (!Number.isFinite(days) || days <= 0) return undefined;
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The URL query string is the single source of truth → typed filters for `db`. */
export function parseOpportunityFilters(sp: SearchParams): OpportunityFilters {
  const grade = first(sp.grade);
  return {
    search: first(sp.q)?.trim() || undefined,
    types: csv(sp.type) as OpportunityType[],
    formats: csv(sp.format) as OpportunityFormat[],
    tags: csv(sp.tags),
    grade: grade ? Number(grade) : undefined,
    deadlineBefore: computeDeadlineBefore(first(sp.deadline)),
    sort: first(sp.sort) === 'newest' ? 'newest' : 'deadline',
    page: Math.max(0, Math.floor(Number(first(sp.page)) || 0)),
    pageSize: PAGE_SIZE,
  };
}

/** Count of applied discovery filters (for the "Filters · N" affordances). */
export function activeFilterCount(sp: SearchParams): number {
  let n = 0;
  if (first(sp.q)?.trim()) n++;
  n += csv(sp.type).length;
  n += csv(sp.format).length;
  n += csv(sp.tags).length;
  if (first(sp.grade)) n++;
  const dl = first(sp.deadline);
  if (dl && dl !== 'all') n++;
  return n;
}
