import { Check, Circle, Lock, PlayCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LessonStatus = 'completed' | 'todo' | 'locked';

/**
 * Presentational outline row, shared by the enrolled list (links) and the locked
 * preview (buttons). No hooks → safe in both Server and Client trees. The accent
 * appears only on the completed check; lock/empty states stay monochrome.
 */
export function LessonRowContent({
  n,
  title,
  contentType,
  typeLabel,
  durationLabel,
  status,
  current = false,
}: {
  n: number;
  title: string;
  contentType: 'text' | 'video';
  typeLabel: string;
  durationLabel?: string | null;
  status: LessonStatus;
  current?: boolean;
}) {
  const TypeIcon = contentType === 'video' ? PlayCircle : FileText;
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-md border px-3 py-2.5 transition-colors',
        current ? 'border-foreground/30 bg-muted/50' : 'border-border',
        status === 'locked' ? 'text-muted-foreground' : 'hover:border-foreground/30',
      )}
    >
      <span className="w-5 shrink-0 text-center text-xs tabular-nums text-muted-foreground">{n}</span>
      <div className="min-w-0 flex-1">
        <p className={cn('truncate text-sm', current ? 'font-semibold' : 'font-medium')}>{title}</p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TypeIcon className="size-3" />
          {typeLabel}
          {durationLabel ? <span>· {durationLabel}</span> : null}
        </p>
      </div>
      {status === 'completed' ? (
        <Check className="size-4 shrink-0 text-brand" aria-hidden />
      ) : status === 'locked' ? (
        <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      ) : (
        <Circle className="size-4 shrink-0 text-muted-foreground/40" aria-hidden />
      )}
    </div>
  );
}
