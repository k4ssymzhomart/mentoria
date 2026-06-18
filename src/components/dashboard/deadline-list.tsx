import { getLocale, getTranslations } from 'next-intl/server';
import type { Opportunity } from '@/lib/data/types';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { formatDeadlineLabel } from '@/lib/opportunities/format';

/** Saved/applied opportunities by nearest deadline — monochrome, urgency by weight. */
export async function DeadlineList({ items }: { items: Opportunity[] }) {
  const t = await getTranslations('opportunities');
  const locale = await getLocale();
  return (
    <ul className="divide-y rounded-lg border">
      {items.map((opp) => {
        const dl = formatDeadlineLabel(opp.deadline, locale, t);
        return (
          <li key={opp.id}>
            <Link
              href={`/opportunities/${opp.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{tl(opp.title, locale)}</p>
                <p className="text-xs text-muted-foreground">{t(`types.${opp.type}`)}</p>
              </div>
              {dl ? (
                <span
                  className={cn(
                    'shrink-0 text-xs tabular-nums',
                    dl.urgent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {dl.text}
                </span>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
