'use client';

import { useTransition } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import {
  deleteCourseAction,
  deleteLessonAction,
  deleteOpportunityAction,
  deleteQuizAction,
  reorderLessonsAction,
  toggleCourseAction,
  toggleOpportunityAction,
} from '@/lib/admin/actions';

type Result = { ok: true } | { ok: false; reason: string };

export function AdminActionButton({
  label,
  confirm,
  action,
  icon,
  variant = 'outline',
  disabled = false,
}: {
  label: string;
  confirm?: string;
  action: () => Promise<Result>;
  icon?: React.ReactNode;
  variant?: 'outline' | 'ghost' | 'destructive';
  disabled?: boolean;
}) {
  const t = useTranslations('admin');
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      type="button"
      variant={variant}
      size="sm"
      disabled={pending || disabled}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const result = await action();
          if (result.ok) {
            toast.success(t('toast.saved'));
            router.refresh();
          } else {
            toast.error(t('toast.error'));
          }
        });
      }}
    >
      {icon}
      {label}
    </Button>
  );
}

export function PublishOpportunityButton({ id, published }: { id: string; published: boolean }) {
  const t = useTranslations('admin');
  return (
    <AdminActionButton
      label={published ? t('actions.unpublish') : t('actions.publish')}
      confirm={published ? t('confirm.unpublish') : undefined}
      icon={published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      action={() => toggleOpportunityAction(id, !published)}
    />
  );
}

export function DeleteOpportunityButton({ id }: { id: string }) {
  const t = useTranslations('admin');
  return (
    <AdminActionButton
      label={t('actions.delete')}
      confirm={t('confirm.deleteOpportunity')}
      icon={<Trash2 className="size-3.5" />}
      variant="destructive"
      action={() => deleteOpportunityAction(id)}
    />
  );
}

export function PublishCourseButton({ id, published }: { id: string; published: boolean }) {
  const t = useTranslations('admin');
  return (
    <AdminActionButton
      label={published ? t('actions.unpublish') : t('actions.publish')}
      confirm={published ? t('confirm.unpublish') : undefined}
      icon={published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
      action={() => toggleCourseAction(id, !published)}
    />
  );
}

export function DeleteCourseButton({ id }: { id: string }) {
  const t = useTranslations('admin');
  return (
    <AdminActionButton
      label={t('actions.delete')}
      confirm={t('confirm.deleteCourse')}
      icon={<Trash2 className="size-3.5" />}
      variant="destructive"
      action={() => deleteCourseAction(id)}
    />
  );
}

export function DeleteLessonButton({ id }: { id: string }) {
  const t = useTranslations('admin');
  return (
    <AdminActionButton
      label={t('actions.delete')}
      confirm={t('confirm.deleteLesson')}
      icon={<Trash2 className="size-3.5" />}
      variant="destructive"
      action={() => deleteLessonAction(id)}
    />
  );
}

export function DeleteQuizButton({ id }: { id: string }) {
  const t = useTranslations('admin');
  return (
    <AdminActionButton
      label={t('actions.deleteQuiz')}
      confirm={t('confirm.deleteQuiz')}
      icon={<Trash2 className="size-3.5" />}
      variant="destructive"
      action={() => deleteQuizAction(id)}
    />
  );
}

export function MoveLessonButton({
  items,
  index,
  direction,
}: {
  items: { id: string }[];
  index: number;
  direction: -1 | 1;
}) {
  const t = useTranslations('admin');
  const next = index + direction;
  const disabled = next < 0 || next >= items.length;
  const reordered = [...items];
  if (!disabled) [reordered[index], reordered[next]] = [reordered[next], reordered[index]];

  return (
    <AdminActionButton
      label={direction < 0 ? t('actions.moveUp') : t('actions.moveDown')}
      icon={direction < 0 ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />}
      variant="ghost"
      action={() =>
        reorderLessonsAction(reordered.map((item, i) => ({ id: item.id, position: i + 1 })))
      }
      disabled={disabled}
    />
  );
}
