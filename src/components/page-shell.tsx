import { getTranslations } from 'next-intl/server';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * A titled empty page with a "coming soon" badge and a skeleton grid. Every
 * Phase 0 route shell uses this — real content replaces it in later phases.
 */
export async function PageShell({ namespace }: { namespace: string }) {
  const t = await getTranslations(namespace);
  const tc = await getTranslations('common');

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12 sm:px-6">
      <header className="space-y-3">
        <Badge
          variant="outline"
          className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
        >
          {tc('comingSoon')}
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-5">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="mt-2 h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}
