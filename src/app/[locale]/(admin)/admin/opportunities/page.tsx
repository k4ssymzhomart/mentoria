import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server';
import { Search } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { tl } from '@/lib/data/types';
import { Input } from '@/components/ui/input';
import { OpportunityForm } from '@/components/admin/opportunity-form';
import { DeleteOpportunityButton, PublishOpportunityButton } from '@/components/admin/action-buttons';

export default async function AdminOpportunitiesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  const { q = '' } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations('admin');
  const to = await getTranslations('opportunities');
  const activeLocale = await getLocale();
  const [all, tags] = await Promise.all([db.adminListOpportunities(), db.getTags()]);
  const query = q.trim().toLowerCase();
  const opportunities = query
    ? all.filter((item) => tl(item.title, activeLocale).toLowerCase().includes(query))
    : all;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t('opportunities.title')}</h1>
          <p className="text-muted-foreground">{t('opportunities.subtitle')}</p>
        </div>
      </header>

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">{t('actions.newOpportunity')}</summary>
        <div className="mt-5 border-t pt-5">
          <OpportunityForm tags={tags} />
        </div>
      </details>

      <form className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-2.5 top-2 size-4 text-muted-foreground" />
        <Input name="q" defaultValue={q} placeholder={t('filters.search')} className="pl-8" />
      </form>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead className="border-b bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">{t('table.title')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.type')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.format')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.deadline')}</th>
              <th className="px-3 py-2 font-medium">{t('fields.status')}</th>
              <th className="px-3 py-2 font-medium">{t('table.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {opportunities.map((item) => (
              <tr key={item.id} className="align-top">
                <td className="px-3 py-3">
                  <details>
                    <summary className="cursor-pointer font-medium">{tl(item.title, activeLocale)}</summary>
                    <div className="mt-4 rounded-lg border bg-background p-4">
                      <OpportunityForm opportunity={item} tags={tags} />
                    </div>
                  </details>
                </td>
                <td className="px-3 py-3 text-muted-foreground">{to(`types.${item.type}`)}</td>
                <td className="px-3 py-3 text-muted-foreground">{to(`formats.${item.format}`)}</td>
                <td className="px-3 py-3 text-muted-foreground">{item.deadline ?? '—'}</td>
                <td className="px-3 py-3">
                  <span className="rounded-full border px-2 py-0.5 text-xs">
                    {item.is_published ? t('status.published') : t('status.draft')}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <PublishOpportunityButton id={item.id} published={item.is_published} />
                    <DeleteOpportunityButton id={item.id} />
                  </div>
                </td>
              </tr>
            ))}
            {opportunities.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-10 text-center text-muted-foreground">
                  {t('empty.opportunities')}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
