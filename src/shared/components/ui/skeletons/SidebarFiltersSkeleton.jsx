import React, { memo } from "react";

function SidebarFiltersSkeleton({ className = "" }) {
  return (
    <div
      className={`space-y-8 ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="space-y-3">
        <div className="h-5 w-24 skeleton rounded-lg" />
        <div className="h-4 w-full skeleton rounded-lg" />
        <div className="h-4 w-5/6 skeleton rounded-lg" />
      </div>

      <div className="space-y-3">
        <div className="h-5 w-20 skeleton rounded-lg" />
        <div className="h-4 w-2/3 skeleton rounded-lg" />
        <div className="h-4 w-1/2 skeleton rounded-lg" />
        <div className="h-4 w-3/5 skeleton rounded-lg" />
      </div>

      <div className="space-y-3">
        <div className="h-5 w-16 skeleton rounded-lg" />
        <div className="h-4 w-1/2 skeleton rounded-lg" />
        <div className="h-4 w-2/3 skeleton rounded-lg" />
      </div>

      <div className="h-10 w-full skeleton rounded-xl" />
    </div>
  );
}

export default memo(SidebarFiltersSkeleton);
