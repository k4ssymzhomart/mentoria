import { Suspense } from 'react';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { db } from '@/lib/data/provider';
import { getAuthUserId, getProfile } from '@/lib/auth';
import type { Tag, Opportunity, OpportunityFilters } from '@/lib/data/types';
import {
  parseOpportunityFilters,
  activeFilterCount,
  type SearchParams,
} from '@/lib/opportunities/filters';
import { FilterRail } from '@/components/opportunities/filter-rail';
import { FiltersSheet } from '@/components/opportunities/filters-sheet';
import { SearchBar } from '@/components/opportunities/search-bar';
import { SortDropdown } from '@/components/opportunities/sort-dropdown';
import { ActiveFilters } from '@/components/opportunities/active-filters';
import { ResultsGrid } from '@/components/opportunities/results-grid';
import { Pagination } from '@/components/opportunities/pagination';
import { GridSkeleton } from '@/components/opportunities/card-skeleton';

// Filter-dependent slice — wrapped in Suspense so it re-suspends (shows skeletons)
// on every filter change while the rest of the page stays interactive.
async function Results({
  filters,
  tagMap,
  savedSet,
  canSave,
}: {
  filters: OpportunityFilters;
  tagMap: Map<string, Tag>;
  savedSet: Set<string>;
  canSave: boolean;
}) {
  const { items, total } = await db.listOpportunities(filters);
  return (
    <div className="space-y-6">
      <ResultsGrid items={items as Opportunity[]} tagMap={tagMap} savedSet={savedSet} canSave={canSave} />
      <Pagination page={filters.page ?? 0} pageSize={filters.pageSize ?? 12} total={total} />
    </div>
  );
}

export default async function OpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const filters = parseOpportunityFilters(sp);
  const activeCount = activeFilterCount(sp);

  const t = await getTranslations('opportunities');
  const [tags, userId, profile] = await Promise.all([db.getTags(), getAuthUserId(), getProfile()]);
  const saved = userId ? await db.listSaved(userId) : [];

  const tagMap = new Map(tags.map((tag) => [tag.slug, tag]));
  const savedSet = new Set(saved.map((s) => s.opportunity_id));
  const canSave = Boolean(userId);
  const myGrade = profile?.grade ?? null;
  const resultsKey = JSON.stringify(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-8 lg:flex-row">
        <aside className="hidden w-[280px] shrink-0 lg:block">
          <div className="sticky top-20">
            <FilterRail tags={tags} myGrade={myGrade} />
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-5">
          <header className="space-y-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('title')}</h1>
              <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <div className="flex items-center gap-2">
              <FiltersSheet tags={tags} myGrade={myGrade} activeCount={activeCount} />
              <SearchBar />
              <SortDropdown />
            </div>
            <ActiveFilters tags={tags} />
          </header>

          <Suspense key={resultsKey} fallback={<GridSkeleton />}>
            <Results filters={filters} tagMap={tagMap} savedSet={savedSet} canSave={canSave} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
