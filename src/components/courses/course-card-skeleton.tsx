import { Skeleton } from '@/components/ui/skeleton';

export function CourseCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-md border p-0">
      <Skeleton className="aspect-[16/9] w-full rounded-b-none" />
      <div className="flex flex-col gap-3 p-5 pt-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <div className="mt-2 flex gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </div>
  );
}
