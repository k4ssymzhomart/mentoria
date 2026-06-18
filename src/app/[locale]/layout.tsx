import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { Header } from '@/components/shell/header';
import { Footer } from '@/components/shell/footer';
import { PageTransition } from '@/components/motion/page-transition';
import { AssistantProvider } from '@/components/assistant/assistant-provider';

const localePaths = {
  ru: '/',
  en: '/en',
  kk: '/kk',
} as const;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'common' });
  const path = localePaths[locale as keyof typeof localePaths] ?? '/';
  return {
    title: { default: t('appName'), template: `%s · ${t('appName')}` },
    description: t('tagline'),
    alternates: {
      canonical: path,
      languages: {
        ru: localePaths.ru,
        en: localePaths.en,
        kk: localePaths.kk,
        'x-default': localePaths.ru,
      },
    },
    openGraph: {
      title: t('appName'),
      description: t('tagline'),
      url: path,
      siteName: t('appName'),
      locale,
      alternateLocale: routing.locales.filter((item) => item !== locale),
      type: 'website',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'common' });

  return (
    <AssistantProvider>
      <div className="flex min-h-svh flex-col">
        <a
          href="#main"
          className="sr-only fixed left-3 top-3 z-[100] rounded-md bg-background px-3 py-2 text-sm ring-1 ring-border focus:not-sr-only"
        >
          {t('skipToContent')}
        </a>
        <Header />
        <main id="main" className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </AssistantProvider>
  );
}
