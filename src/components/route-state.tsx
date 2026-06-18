import { AlertTriangle, ArrowLeft, FileQuestion } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

type SkeletonVariant =
  | 'admin'
  | 'calendar'
  | 'catalog'
  | 'dashboard'
  | 'detail'
  | 'roadmap';

export function RouteSkeleton({ variant = 'catalog' }: { variant?: SkeletonVariant }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-6" aria-busy>
      <header className="space-y-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-full max-w-md" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </header>
      {variant === 'dashboard' ? <DashboardSkeleton /> : null}
      {variant === 'calendar' ? <CalendarSkeleton /> : null}
      {variant === 'roadmap' ? <RoadmapSkeleton /> : null}
      {variant === 'admin' ? <AdminSkeleton /> : null}
      {variant === 'detail' ? <DetailSkeleton /> : null}
      {variant === 'catalog' ? <CatalogSkeleton /> : null}
    </div>
  );
}

export function RouteStatus({
  title,
  description,
  actionLabel,
  actionHref = '/',
  kind = 'not-found',
  children,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  kind?: 'error' | 'not-found';
  children?: React.ReactNode;
}) {
  const Icon = kind === 'error' ? AlertTriangle : FileQuestion;

  return (
    <div className="mx-auto flex min-h-[50svh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <div className="flex size-12 items-center justify-center rounded-lg border bg-muted/30">
        <Icon className="size-5" aria-hidden />
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {children}
        {actionLabel ? (
          <Button variant="outline" nativeButton={false} render={<Link href={actionHref} />}>
            <ArrowLeft className="size-4" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
      <div className="hidden space-y-3 rounded-lg border p-4 lg:block">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4">
            <Skeleton className="h-8 w-12" />
            <Skeleton className="mt-3 h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-lg border p-4">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md" />
          ))}
        </div>
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-5 w-24" />
          {Array.from({ length: 3 }).map((__, j) => (
            <Skeleton key={j} className="h-24 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

function AdminSkeleton() {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="grid gap-3 border-b pb-3 last:border-b-0 sm:grid-cols-[1fr_8rem_8rem]">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4 rounded-lg border p-5">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-48 w-full" />
      </div>
      <div className="space-y-3 rounded-lg border p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-2/3" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border p-5">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-8 w-28" />
    </div>
  );
}
