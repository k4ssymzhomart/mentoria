'use client';

import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-svh bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center px-4 text-center">
          <div className="flex size-12 items-center justify-center rounded-lg border bg-muted/30">
            <RefreshCw className="size-5" aria-hidden />
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mentoria Hub could not finish loading. Try again to restore the app.
          </p>
          <Button className="mt-6" onClick={reset}>
            <RefreshCw className="size-4" />
            Try again
          </Button>
        </main>
      </body>
    </html>
  );
}
