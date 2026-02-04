import React, { memo } from "react";

function ProductGridSkeleton({
  count = 12,

  // Keep it flexible for different pages
  gridClassName = "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6",

  // Allow different image heights (Home cards are taller, Shop cards can be shorter)
  imageClassName = "h-64",

  // Control how many text lines you want (Home may show button skeleton, Shop may show 2 lines only)
  showButton = true,

  // Optional: wrap each card with custom classes
  cardClassName = "rounded-xl border border-base-200 bg-base-100 overflow-hidden",
}) {
  return (
    <div className={gridClassName} role="status" aria-live="polite" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cardClassName}>
          <div className={`${imageClassName} w-full skeleton`} />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 skeleton rounded-lg" />
            <div className="h-4 w-1/2 skeleton rounded-lg" />
            <div className="h-4 w-1/3 skeleton rounded-lg" />
            {showButton ? <div className="h-10 w-full skeleton rounded-lg" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export default memo(ProductGridSkeleton);
