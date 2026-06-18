'use client';

import { useTransition } from 'react';
import { Save } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';

type Result = { ok: true } | { ok: false; reason: string };

export function AdminForm({
  action,
  children,
  submitLabel,
}: {
  action: (fd: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel?: string;
}) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        start(async () => {
          const result = await action(new FormData(form));
          if (result.ok) {
            toast.success(t('toast.saved'));
            router.refresh();
          } else if (result.reason === 'validation') {
            toast.error(t('toast.validation'));
          } else {
            toast.error(t('toast.error'));
          }
        });
      }}
    >
      {children}
      <Button type="submit" disabled={pending}>
        <Save className="size-4" />
        {submitLabel ?? t('actions.save')}
      </Button>
    </form>
  );
}
