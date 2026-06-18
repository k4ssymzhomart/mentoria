'use client';

import { RouteErrorBoundary } from '@/components/route-error-boundary';

export default function AppSectionError({ reset }: { error: Error; reset: () => void }) {
  return <RouteErrorBoundary reset={reset} />;
}
