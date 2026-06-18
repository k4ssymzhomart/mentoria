import type { Metadata } from 'next';
import { getLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Mentoria Hub',
  description: 'Opportunities, courses, and a personal plan — in one place.',
  openGraph: {
    title: 'Mentoria Hub',
    description: 'Opportunities, courses, and a personal plan — in one place.',
    siteName: 'Mentoria Hub',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mentoria Hub',
    description: 'Opportunities, courses, and a personal plan — in one place.',
  },
};

// Single root layout: it owns <html>/<body> for BOTH the localized tree and the
// non-localized /auth/* routes. `getLocale()` resolves the lang from next-intl's
// request context (falls back to the default locale outside /[locale]).
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
