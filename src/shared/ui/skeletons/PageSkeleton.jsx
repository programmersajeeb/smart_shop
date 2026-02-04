import React from "react";

export default function PageSkeleton() {
  return (
    <div>
      {/* Heading skeleton */}
      <div className="mb-6 space-y-3">
        <div className="h-8 w-2/3 skeleton rounded-lg" />
        <div className="h-4 w-1/2 skeleton rounded-lg" />
        <div className="h-4 w-1/3 skeleton rounded-lg" />
      </div>

      {/* Generic grid skeleton */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-base-200 bg-base-100 p-3">
            <div className="h-32 w-full skeleton rounded-lg" />
            <div className="mt-3 h-4 w-3/4 skeleton rounded-lg" />
            <div className="mt-2 h-4 w-1/2 skeleton rounded-lg" />
            <div className="mt-4 h-9 w-full skeleton rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
