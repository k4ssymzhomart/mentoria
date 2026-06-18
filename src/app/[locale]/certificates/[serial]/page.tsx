import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/data/provider';
import { requireUser, getAuthUserId, getProfile } from '@/lib/auth';
import { tl } from '@/lib/data/types';
import { Link } from '@/i18n/navigation';
import { CertificateCard } from '@/components/courses/certificate-card';
import { PrintButton } from '@/components/courses/print-button';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; serial: string }>;
}): Promise<Metadata> {
  const { serial } = await params;
  return { title: serial };
}

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ locale: string; serial: string }>;
}) {
  const { locale, serial } = await params;
  setRequestLocale(locale);
  await requireUser();

  const t = await getTranslations('certificate');
  const userId = await getAuthUserId();
  if (!userId) notFound();

  const cert = await db.getCertificateBySerial(userId, serial);
  if (!cert) notFound();

  const profile = await getProfile();
  const studentName = profile?.full_name || profile?.email || serial;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Print: strip app chrome so the certificate prints full-bleed. */}
      <style>{`@media print {
        body:has(.certificate-card) header,
        body:has(.certificate-card) footer,
        body:has(.certificate-card) .no-print { display: none !important; }
        body:has(.certificate-card) { background: #fff; }
      }`}</style>

      <div className="no-print mb-6 flex items-center justify-between gap-4">
        <Link
          href={`/courses/${cert.course.slug}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t('back')}
        </Link>
        <PrintButton />
      </div>

      <CertificateCard
        studentName={studentName}
        courseTitle={tl(cert.course.title, locale)}
        serial={cert.serial}
        issuedAt={cert.issued_at}
        locale={locale}
      />
    </div>
  );
}
