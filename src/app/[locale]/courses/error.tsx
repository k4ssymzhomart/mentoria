'use client';

import { RouteErrorBoundary } from '@/components/route-error-boundary';

export default function CoursesError({ reset }: { error: Error; reset: () => void }) {
  return <RouteErrorBoundary reset={reset} />;
}
