'use client';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton = ({ className = '', count = 1 }: SkeletonProps) => {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  return (
    <>
      {skeletons.map((i) => (
        <div
          key={i}
          className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
        />
      ))}
    </>
  );
};

export const SkeletonText = ({ lines = 1 }: { lines?: number }) => {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full" />
      ))}
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-7">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
};
