import { getTranslations } from 'next-intl/server';
import type { Opportunity, Tag } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { OpportunityCard } from './opportunity-card';

export async function ResultsGrid({
  items,
  tagMap,
  savedSet,
  canSave,
}: {
  items: Opportunity[];
  tagMap: Map<string, Tag>;
  savedSet: Set<string>;
  canSave: boolean;
}) {
  const t = await getTranslations('opportunities');

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-20 text-center">
        <p className="text-lg font-medium">{t('empty.title')}</p>
        <p className="max-w-sm text-sm text-muted-foreground">{t('empty.hint')}</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/opportunities" />}>
          {t('empty.clear')}
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((opp) => (
        <OpportunityCard
          key={opp.id}
          opp={opp}
          tagMap={tagMap}
          saved={savedSet.has(opp.id)}
          canSave={canSave}
        />
      ))}
    </div>
  );
}
