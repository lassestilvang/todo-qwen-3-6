'use client'

import { Skeleton } from '@/components/ui/skeleton'

export function TaskListSkeleton() {
  return (
    <div className="space-y-2 p-4 pr-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50"
        >
          <Skeleton className="h-4 w-4 rounded mt-0.5" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
