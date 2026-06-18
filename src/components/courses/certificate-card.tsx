import { getTranslations } from 'next-intl/server';
import { Award } from 'lucide-react';
import { formatCertificateDate } from '@/lib/courses/format';

/**
 * The certificate artifact: strictly monochrome except the single accent — the
 * top rule and the seal. Designed to print full-bleed (see the page's print CSS).
 */
export async function CertificateCard({
  studentName,
  courseTitle,
  serial,
  issuedAt,
  locale,
}: {
  studentName: string;
  courseTitle: string;
  serial: string;
  issuedAt: string;
  locale: string;
}) {
  const t = await getTranslations('certificate');
  const tc = await getTranslations('common');

  return (
    <div className="certificate-card relative mx-auto w-full max-w-2xl overflow-hidden rounded-lg border bg-card p-10 text-center shadow-sm sm:p-14 print:border-0 print:shadow-none">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-brand" aria-hidden />

      <div className="space-y-8">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          {tc('appName')}
        </p>

        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{t('completionTitle')}</h1>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t('awardedTo')}</p>
          <p className="text-2xl font-semibold tracking-tight">{studentName}</p>
        </div>

        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{t('completedCourse')}</p>
          <p className="text-lg font-medium">{courseTitle}</p>
        </div>

        <div className="flex justify-center">
          <span className="grid size-16 place-items-center rounded-full border-2 border-brand text-brand">
            <Award className="size-8" />
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 border-t pt-5 text-xs text-muted-foreground">
          <span>
            {t('serialLabel')}: <span className="font-mono text-foreground">{serial}</span>
          </span>
          <span>
            {t('dateLabel')}: <span className="text-foreground">{formatCertificateDate(issuedAt, locale)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
