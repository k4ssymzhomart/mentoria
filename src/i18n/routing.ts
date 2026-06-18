import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // Kazakh is `kk` (the language code); `kz` is the country code — never use it here.
  locales: ['ru', 'en', 'kk'],
  // Russian is the demo / judging default, so its URLs stay clean (`/`, `/dashboard`).
  defaultLocale: 'ru',
  localePrefix: 'as-needed',
});

export type Locale = (typeof routing.locales)[number];
