'use client';

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface rounded-lg ${className}`}
      style={{
        background: 'linear-gradient(90deg, #18181b 0%, #27272a 50%, #18181b 100%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

function MarketCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-12" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-3/4 mb-4" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <Skeleton className="h-3 w-8 mb-1" />
            <Skeleton className="h-6 w-16" />
          </div>
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-8 w-12" />
          ))}
        </div>
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function BriefSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-48" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export { Skeleton, MarketCardSkeleton, ChartSkeleton, BriefSkeleton };
