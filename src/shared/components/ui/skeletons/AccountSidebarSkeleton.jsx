import React, { memo } from "react";

function AccountSidebarSkeleton() {
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden" role="status" aria-live="polite" aria-busy="true">
      <div className="p-6 border-b">
        <div className="flex items-center gap-4">
          <div className="skeleton w-14 h-14 rounded-2xl" />

          <div className="min-w-0 flex-1 space-y-2">
            <div className="skeleton h-4 w-40 rounded-md" />
            <div className="skeleton h-4 w-56 rounded-md" />
            <div className="skeleton h-3 w-28 rounded-md mt-2" />
          </div>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="skeleton h-12 w-full rounded-2xl" />
        <div className="skeleton h-12 w-full rounded-2xl" />

        <div className="h-px bg-gray-100 my-3" />

        <div className="skeleton h-12 w-full rounded-2xl" />
      </div>
    </div>
  );
}

export default memo(AccountSidebarSkeleton);
