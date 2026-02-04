import React from "react";
import PageSkeleton from "../skeletons/PageSkeleton";

export default function RouteOverlaySkeleton() {
  return (
    <div
      className="absolute inset-0 z-[40] bg-base-100/70 backdrop-blur-[1px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-auto w-full max-w-7xl p-4 md:p-6">
        <PageSkeleton />
      </div>
    </div>
  );
}
