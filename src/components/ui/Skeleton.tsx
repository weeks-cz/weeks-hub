'use client';

import { cn } from '@/lib/utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('skeleton', className)} />;
}

// Dashboard skeleton loaders
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-12 rounded-lg" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskListSkeleton() {
  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)] p-4 space-y-3">
      <Skeleton className="h-5 w-32 rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-primary)]">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="w-6 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, colIdx) => (
        <div
          key={colIdx}
          className="flex-shrink-0 w-72 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-default)] p-3"
        >
          <div className="flex items-center gap-2 mb-3 px-1">
            <Skeleton className="h-5 w-24 rounded-lg" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 3 - colIdx }).map((_, cardIdx) => (
              <div
                key={cardIdx}
                className="bg-[var(--bg-surface)] rounded-xl p-3 border border-[var(--border-default)] space-y-2"
              >
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <Skeleton className="w-2 h-2 rounded-full" />
                    <Skeleton className="h-3 w-14 rounded" />
                  </div>
                  <Skeleton className="w-6 h-6 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex justify-center py-2">
            <Skeleton className="h-3 w-8 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-t border-l border-[var(--border-default)]">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[80px] sm:min-h-[100px] p-1.5 border-r border-b border-[var(--border-default)]"
          >
            <Skeleton className="w-7 h-7 rounded-full mb-1" />
            {i % 5 === 0 && <Skeleton className="h-4 w-full rounded mt-1" />}
            {i % 7 === 2 && <Skeleton className="h-4 w-3/4 rounded mt-1" />}
          </div>
        ))}
      </div>
    </div>
  );
}
