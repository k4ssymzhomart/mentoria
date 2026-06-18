'use client';

import { RouteErrorBoundary } from '@/components/route-error-boundary';

export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary reset={reset} />;
}
