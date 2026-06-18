'use client';

import { useState, type FormEvent } from 'react';
import { Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { isDevAuthEnabled, isSupabaseConfigured } from '@/lib/env';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function GoogleGlyph() {
  // Monochrome (currentColor) to respect the strict-monochrome system.
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M12 11v2.6h6.18c-.25 1.45-1.7 4.25-6.18 4.25A6.85 6.85 0 1 1 12 5.1c1.96 0 3.27.83 4.02 1.55l2.74-2.64C16.96 2.35 14.7 1.4 12 1.4 6.07 1.4 1.27 6.2 1.27 12.13S6.07 22.87 12 22.87c6.2 0 10.3-4.36 10.3-10.5 0-.7-.08-1.24-.18-1.77H12Z"
      />
    </svg>
  );
}

export function SignInDialog({
  next = '/dashboard',
  open,
  onOpenChange,
  showTrigger = true,
  triggerLabel,
  title,
  description,
}: {
  next?: string;
  /** Controlled open state (omit for the default trigger-driven dialog). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
  triggerLabel?: string;
  title?: string;
  description?: string;
}) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);

  const supabaseReady = isSupabaseConfigured();
  const devReady = isDevAuthEnabled();

  async function signInWithGoogle() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      toast.error(error.message);
      setBusy(false);
    }
  }

  async function sendMagicLink(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error) toast.error(t('magicLinkError'));
    else toast.success(t('magicLinkSent'));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {showTrigger ? (
        <DialogTrigger render={<Button>{triggerLabel ?? tc('signIn')}</Button>} />
      ) : null}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title ?? t('signInTitle')}</DialogTitle>
          <DialogDescription>{description ?? t('signInSubtitle')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {supabaseReady ? (
            <div className="space-y-4">
              <Button
                onClick={signInWithGoogle}
                disabled={busy}
                variant="outline"
                className="w-full"
              >
                <GoogleGlyph />
                {t('google')}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-popover px-2 text-xs uppercase tracking-wide text-muted-foreground">
                    {tc('or')}
                  </span>
                </div>
              </div>

              <form onSubmit={sendMagicLink} className="space-y-2">
                <Label htmlFor="signin-email">{t('emailLabel')}</Label>
                <Input
                  id="signin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('emailPlaceholder')}
                />
                <Button
                  type="submit"
                  disabled={busy}
                  variant="secondary"
                  className="w-full"
                >
                  <Mail className="size-4" />
                  {t('sendMagicLink')}
                </Button>
              </form>
            </div>
          ) : null}

          {devReady ? (
            <div className="space-y-3 rounded-md border border-dashed p-3">
              <div className="space-y-1">
                <p className="text-sm font-medium">{t('dev')}</p>
                <p className="text-xs text-muted-foreground">{t('devSubtitle')}</p>
              </div>
              <div className="grid gap-2">
                <form action="/auth/dev-signin" method="post">
                  <input type="hidden" name="role" value="student" />
                  <input type="hidden" name="next" value={next} />
                  <Button type="submit" variant="secondary" className="w-full">
                    {t('devStudent')}
                  </Button>
                </form>
                <form action="/auth/dev-signin" method="post">
                  <input type="hidden" name="role" value="admin" />
                  <input type="hidden" name="next" value="/admin" />
                  <Button type="submit" variant="outline" className="w-full">
                    {t('devAdmin')}
                  </Button>
                </form>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
