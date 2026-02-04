import React from "react";

export default function FooterSkeleton() {
  return (
    <footer className="bg-black text-white pt-16 pb-10" role="status" aria-live="polite" aria-busy="true">
      <div className="container mx-auto px-6">
        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16">
          {/* BRAND INFO */}
          <div className="space-y-4">
            <div className="skeleton h-8 w-40 rounded-lg bg-gray-800" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-full rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-11/12 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-10/12 rounded-lg bg-gray-800" />
            </div>
          </div>

          {/* SHOP LINKS */}
          <div className="space-y-4">
            <div className="skeleton h-6 w-24 rounded-lg bg-gray-800" />
            <div className="space-y-3">
              <div className="skeleton h-4 w-40 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-36 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-32 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-28 rounded-lg bg-gray-800" />
            </div>
          </div>

          {/* SUPPORT LINKS */}
          <div className="space-y-4">
            <div className="skeleton h-6 w-28 rounded-lg bg-gray-800" />
            <div className="space-y-3">
              <div className="skeleton h-4 w-36 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-20 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-40 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-36 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-28 rounded-lg bg-gray-800" />
            </div>
          </div>

          {/* NEWSLETTER */}
          <div className="space-y-4">
            <div className="skeleton h-6 w-32 rounded-lg bg-gray-800" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-11/12 rounded-lg bg-gray-800" />
              <div className="skeleton h-4 w-9/12 rounded-lg bg-gray-800" />
            </div>

            {/* Input skeleton */}
            <div className="rounded-xl overflow-hidden border border-gray-800 bg-gray-900">
              <div className="skeleton h-12 w-full rounded-none bg-gray-800" />
            </div>

            {/* Button skeleton */}
            <div className="skeleton h-12 w-full rounded-xl bg-gray-800" />
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-full h-px bg-gray-700 my-10" />

        {/* BOTTOM ROW */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* COPYRIGHT */}
          <div className="skeleton h-4 w-64 rounded-lg bg-gray-800" />

          {/* SOCIAL ICONS */}
          <div className="flex gap-4">
            <div className="skeleton h-10 w-10 rounded-full bg-gray-800" />
            <div className="skeleton h-10 w-10 rounded-full bg-gray-800" />
            <div className="skeleton h-10 w-10 rounded-full bg-gray-800" />
            <div className="skeleton h-10 w-10 rounded-full bg-gray-800" />
          </div>
        </div>
      </div>
    </footer>
  );
}
