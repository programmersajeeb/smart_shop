import React, { memo } from "react";

function ProductGridSkeleton({
  count = 8,
  gridClassName = "grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6",
  imageClassName = "aspect-[4/5]",
  showButton = true,
  cardClassName = "overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.05)]",
}) {
  return (
    <div
      className={gridClassName}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cardClassName}>
          <div className={`relative w-full overflow-hidden bg-neutral-100 ${imageClassName}`}>
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-neutral-200 via-neutral-100 to-neutral-200" />
            <div className="absolute left-3 top-3 h-6 w-20 animate-pulse rounded-full bg-white/80" />
            <div className="absolute right-3 top-3 h-6 w-16 animate-pulse rounded-full bg-white/70" />
            {showButton ? (
              <div className="absolute inset-x-6 bottom-4 h-10 animate-pulse rounded-full bg-white/75" />
            ) : null}
          </div>

          <div className="space-y-3 p-4 sm:p-5">
            <div className="h-3 w-20 animate-pulse rounded-full bg-neutral-200" />
            <div className="h-5 w-4/5 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-5 w-2/3 animate-pulse rounded-lg bg-neutral-100" />
            <div className="pt-2">
              <div className="h-3 w-12 animate-pulse rounded-full bg-neutral-100" />
              <div className="mt-2 flex items-center gap-2">
                <div className="h-6 w-20 animate-pulse rounded-lg bg-neutral-200" />
                <div className="h-5 w-14 animate-pulse rounded-lg bg-neutral-100" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(ProductGridSkeleton);