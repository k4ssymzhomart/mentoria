import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Lives outside [locale]; uses static copy so it never depends on the i18n context.
export default function AuthCodeErrorPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Authentication
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign-in could not be completed
          </h1>
          <p className="text-sm text-muted-foreground">
            The link may have expired or already been used. Please try signing in
            again.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/" />}>
          Back to Mentoria Hub
        </Button>
      </div>
    </main>
  );
}
