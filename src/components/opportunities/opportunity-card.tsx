import { getLocale, getTranslations } from 'next-intl/server';
import type { Opportunity, Tag } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDeadlineLabel } from '@/lib/opportunities/format';
import { SaveButton } from './save-button';

export async function OpportunityCard({
  opp,
  tagMap,
  saved,
  canSave,
}: {
  opp: Opportunity;
  tagMap: Map<string, Tag>;
  saved: boolean;
  canSave: boolean;
}) {
  const t = await getTranslations('opportunities');
  const locale = await getLocale();
  const deadline = formatDeadlineLabel(opp.deadline, locale, t);
  const chips = opp.tags
    .map((s) => tagMap.get(s))
    .filter((x): x is Tag => Boolean(x))
    .slice(0, 3);

  return (
    <div className="group relative flex flex-col gap-3 rounded-md border border-border bg-card p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-foreground/40 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
      <div className="flex items-start justify-between gap-2">
        <Badge variant="outline">{t(`types.${opp.type}`)}</Badge>
        <SaveButton opportunityId={opp.id} initialSaved={saved} canSave={canSave} />
      </div>

      <Link
        href={`/opportunities/${opp.id}`}
        className="after:absolute after:inset-0 after:rounded-md focus:outline-none"
      >
        <h3 className="line-clamp-2 font-semibold tracking-tight">{tl(opp.title, locale)}</h3>
      </Link>

      {opp.summary ? (
        <p className="line-clamp-1 text-sm text-muted-foreground">{tl(opp.summary, locale)}</p>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
        {chips.map((c) => (
          <span
            key={c.slug}
            className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
          >
            {tl(c.label, locale)}
          </span>
        ))}
        {deadline ? (
          <span
            className={cn(
              'ml-auto text-xs tabular-nums',
              deadline.urgent ? 'font-semibold text-foreground' : 'text-muted-foreground',
            )}
          >
            {deadline.text}
          </span>
        ) : null}
      </div>
    </div>
  );
}
