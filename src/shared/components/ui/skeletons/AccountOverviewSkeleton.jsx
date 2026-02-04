import React, { memo } from "react";
import RecentOrdersTableSkeleton from "./RecentOrdersTableSkeleton";

function AccountOverviewSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite" aria-busy="true">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="skeleton h-4 w-32 rounded-md" />
            <div className="skeleton h-8 w-72 rounded-md mt-3" />
            <div className="skeleton h-4 w-56 rounded-md mt-3" />
          </div>

          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-28 rounded-2xl" />
            <div className="skeleton h-10 w-36 rounded-2xl" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-2xl border bg-white p-5 shadow-sm space-y-3">
            <div className="skeleton h-3 w-24 rounded-md" />
            <div className="skeleton h-8 w-16 rounded-md" />
            <div className="skeleton h-4 w-28 rounded-md" />
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between gap-3">
          <div>
            <div className="skeleton h-4 w-28 rounded-md" />
            <div className="skeleton h-3 w-40 rounded-md mt-2" />
          </div>
          <div className="skeleton h-4 w-16 rounded-md" />
        </div>

        <RecentOrdersTableSkeleton rows={5} />
      </div>
    </div>
  );
}

export default memo(AccountOverviewSkeleton);
