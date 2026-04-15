/**
 * Skeleton.tsx — Animated placeholder components displayed while data loads.
 *
 * Provides reusable Skeleton primitives (line, block, circle) that pulse
 * with a CSS animation, giving users visual feedback during API calls.
 */

interface SkeletonProps {
  className?: string;
}

/** Generic pulsing skeleton block. */
export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-gray-200 rounded ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
}

/** Skeleton replacement for a ResultCard. */
export function ResultCardSkeleton() {
  return (
    <div className="border-2 border-gray-200 p-6 space-y-4">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-10 w-2/3" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

/** Skeleton replacement for the StatsPanel metrics row. */
export function StatsPanelSkeleton() {
  return (
    <div className="border-2 border-gray-200">
      <div className="grid grid-cols-3 border-b border-gray-200">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`p-6 space-y-3 ${i < 2 ? 'border-r border-gray-200' : ''}`}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      <div className="p-6 space-y-3">
        <Skeleton className="h-4 w-40" />
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-6 w-full" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton replacement for the SoilResultCard. */
export function SoilResultCardSkeleton() {
  return (
    <div className="border-2 border-gray-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
