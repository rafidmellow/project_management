'use client';

import { Spinner } from '@/components/ui/spinner';
import { Skeleton } from '@/components/ui/skeleton';

interface SubtaskLoadingIndicatorProps {
  isLoading: boolean;
}

export function SubtaskLoadingIndicator({ isLoading }: SubtaskLoadingIndicatorProps) {
  if (!isLoading) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-md shadow-md p-2 z-50 flex items-center gap-2">
      <Spinner className="h-4 w-4" />
      <span className="text-xs">Updating subtasks...</span>
    </div>
  );
}

interface SubtaskLoadingSkeletonProps {
  count?: number;
}

export function SubtaskLoadingSkeleton({ count = 2 }: SubtaskLoadingSkeletonProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 animate-pulse">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
      ))}
    </div>
  );
}
