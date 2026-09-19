import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  variant?: "shimmer" | "pulse" | "static";
}

export function Skeleton({
  className = "",
  variant = "shimmer",
  ...props
}: SkeletonProps) {
  const variantClass =
    variant === "shimmer"
      ? "skeleton-shimmer"
      : variant === "pulse"
      ? "skeleton-pulse"
      : "";

  return (
    <div
      role="status"
      aria-busy="true"
      className={`skeleton bg-white/5 relative overflow-hidden rounded ${variantClass} ${className}`}
      {...props}
    >
      <span className="sr-only">Loading content...</span>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      role="status"
      aria-busy="true"
      className="p-6 rounded-2xl border border-white/10 bg-slate-900/50 backdrop-blur-sm space-y-4"
    >
      <div className="flex items-center space-x-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-[92%]" />
        <Skeleton className="h-3 w-[65%]" />
      </div>
      <Skeleton className="w-full aspect-video rounded-xl mt-4" />
    </div>
  );
}

export function TableRowSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className="flex items-center gap-4 py-3 px-4 border-b border-white/5"
    >
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${Math.max(40, 100 - i * 15)}%` }}
        />
      ))}
    </div>
  );
}
