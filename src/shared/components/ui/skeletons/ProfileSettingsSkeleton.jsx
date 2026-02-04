import React, { memo } from "react";

function ProfileSettingsSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-live="polite" aria-busy="true">
      {/* Header skeleton */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="skeleton h-4 w-24 rounded-md" />
            <div className="skeleton h-7 w-56 rounded-md mt-3" />
          </div>
          <div className="skeleton h-10 w-24 rounded-2xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Profile card skeleton */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-2xl" />
              <div className="space-y-2">
                <div className="skeleton h-4 w-24 rounded-md" />
                <div className="skeleton h-4 w-40 rounded-md" />
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <div className="skeleton h-4 w-28 rounded-md" />
                <div className="skeleton h-12 w-full rounded-2xl mt-2" />
              </div>

              <div>
                <div className="skeleton h-4 w-24 rounded-md" />
                <div className="skeleton h-12 w-full rounded-2xl mt-2" />
                <div className="skeleton h-4 w-2/3 rounded-md mt-2" />
              </div>

              <div>
                <div className="skeleton h-4 w-16 rounded-md" />
                <div className="skeleton h-12 w-full rounded-2xl mt-2" />
              </div>

              <div className="skeleton h-12 w-full rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Security + tips skeleton */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
            <div className="skeleton h-4 w-20 rounded-md" />
            <div className="skeleton h-4 w-full rounded-md" />
            <div className="skeleton h-4 w-5/6 rounded-md" />
            <div className="skeleton h-12 w-full rounded-2xl mt-2" />
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
            <div className="skeleton h-4 w-14 rounded-md" />
            <div className="skeleton h-4 w-full rounded-md" />
            <div className="skeleton h-4 w-5/6 rounded-md" />
            <div className="skeleton h-4 w-2/3 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default memo(ProfileSettingsSkeleton);
