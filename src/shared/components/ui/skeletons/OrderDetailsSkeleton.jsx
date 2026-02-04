import React, { memo } from "react";

function OrderDetailsSkeleton({ items = 3 }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5" role="status" aria-live="polite" aria-busy="true">
      {/* Summary skeleton */}
      <div className="lg:col-span-5">
        <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>

          <div className="space-y-3">
            <div className="flex justify-between gap-3">
              <div className="skeleton h-4 w-16 rounded-md" />
              <div className="skeleton h-4 w-28 rounded-md" />
            </div>
          </div>

          <div className="h-px bg-gray-100" />

          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex justify-between gap-3">
                <div className="skeleton h-4 w-20 rounded-md" />
                <div className="skeleton h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100" />

          <div className="flex justify-between gap-3">
            <div className="skeleton h-4 w-12 rounded-md" />
            <div className="skeleton h-5 w-20 rounded-md" />
          </div>

          <div className="mt-2 rounded-2xl border bg-gray-50 p-4 space-y-3">
            <div className="skeleton h-4 w-36 rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
            <div className="skeleton h-4 w-1/2 rounded-md" />
            <div className="skeleton h-4 w-3/4 rounded-md" />
          </div>
        </div>
      </div>

      {/* Items skeleton */}
      <div className="lg:col-span-7">
        <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
          <div className="p-6 border-b">
            <div className="skeleton h-4 w-16 rounded-md" />
            <div className="skeleton h-3 w-24 rounded-md mt-2" />
          </div>

          <div className="p-6 space-y-4">
            {Array.from({ length: items }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 rounded-2xl border p-4">
                <div className="w-16 h-16 rounded-2xl skeleton flex-shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="skeleton h-4 w-2/3 rounded-md" />
                  <div className="skeleton h-4 w-1/2 rounded-md" />
                </div>
                <div className="skeleton h-4 w-16 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(OrderDetailsSkeleton);
