import { Skeleton } from '@/components/ui/skeleton';

export function CardGridSkeleton({ count = 6, columns = 'md:grid-cols-2 lg:grid-cols-3' }: { count?: number; columns?: string }) {
  return (
    <div className={`grid gap-6 ${columns}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-lg border shadow-sm overflow-hidden">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function GalleryGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full rounded-lg" />
      ))}
    </div>
  );
}

export function FeaturedNewsSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
        <Skeleton className="h-64 w-full rounded-none" />
        <div className="p-6 space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-6 w-4/5" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 bg-card rounded-xl border p-4">
            <Skeleton className="w-28 h-24 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="container max-w-4xl py-12 space-y-8">
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="grid sm:grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-52" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  );
}
