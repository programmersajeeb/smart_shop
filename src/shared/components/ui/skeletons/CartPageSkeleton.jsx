import React from "react";

export default function CartPageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="skeleton h-6 w-40 rounded-lg" />
        <div className="skeleton h-4 w-64 rounded-lg mt-3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border p-4">
              <div className="skeleton h-16 w-16 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-2/3 rounded-lg" />
                <div className="skeleton h-4 w-1/3 rounded-lg" />
              </div>
              <div className="skeleton h-10 w-24 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 rounded-2xl border bg-white p-6 shadow-sm space-y-3">
          <div className="skeleton h-5 w-28 rounded-lg" />
          <div className="skeleton h-4 w-full rounded-lg" />
          <div className="skeleton h-4 w-5/6 rounded-lg" />
          <div className="skeleton h-12 w-full rounded-2xl mt-3" />
        </div>
      </div>
    </div>
  );
}
