import React from "react";

function SkeletonBlock({ className = "" }) {
  return (
    <div
      className={[
        "animate-pulse rounded-2xl bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200",
        className,
      ].join(" ")}
    />
  );
}

function InfoPillSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <SkeletonBlock className="h-10 w-10 shrink-0 rounded-2xl" />

        <div className="min-w-0 flex-1">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="mt-2 h-4 w-28" />
          <SkeletonBlock className="mt-2 h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

function RelatedCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
      <SkeletonBlock className="h-[220px] w-full rounded-none" />

      <div className="p-4">
        <SkeletonBlock className="h-4 w-4/5" />
        <SkeletonBlock className="mt-2 h-3 w-16 rounded-full" />
        <SkeletonBlock className="mt-3 h-5 w-24" />
      </div>
    </div>
  );
}

function ThumbnailSkeleton() {
  return <SkeletonBlock className="h-24 w-full rounded-2xl" />;
}

export default function ProductDetailsPageSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-0">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <SkeletonBlock className="h-4 w-12" />
          <SkeletonBlock className="h-4 w-3" />
          <SkeletonBlock className="h-4 w-14" />
          <SkeletonBlock className="h-4 w-3" />
          <SkeletonBlock className="h-4 w-20" />
        </div>

        <div className="mb-6">
          <SkeletonBlock className="h-11 w-36 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
              <SkeletonBlock className="aspect-square w-full rounded-none" />
            </div>

            <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, index) => (
                <ThumbnailSkeleton key={index} />
              ))}
            </div>
          </section>

          <section className="space-y-5 lg:col-span-5">
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap gap-2">
                <SkeletonBlock className="h-7 w-20 rounded-full" />
                <SkeletonBlock className="h-7 w-24 rounded-full" />
              </div>

              <SkeletonBlock className="mt-4 h-10 w-5/6" />
              <SkeletonBlock className="mt-3 h-10 w-40" />

              <div className="mt-5 space-y-3">
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
                <SkeletonBlock className="h-4 w-10/12" />
              </div>

              <SkeletonBlock className="mt-6 h-12 w-56 rounded-2xl" />

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <SkeletonBlock className="h-[52px] w-[170px] rounded-2xl" />
                <SkeletonBlock className="h-[52px] flex-1 rounded-2xl" />
                <SkeletonBlock className="h-[52px] w-[52px] rounded-2xl" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <InfoPillSkeleton key={index} />
                ))}
              </div>
            </div>

            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap gap-3">
                <SkeletonBlock className="h-11 w-28 rounded-2xl" />
                <SkeletonBlock className="h-11 w-24 rounded-2xl" />
                <SkeletonBlock className="h-11 w-28 rounded-2xl" />
              </div>

              <div className="mt-6 space-y-4">
                <SkeletonBlock className="h-6 w-40" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-11/12" />
                <SkeletonBlock className="h-4 w-10/12" />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoPillSkeleton />
                  <InfoPillSkeleton />
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className="mt-12">
          <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <SkeletonBlock className="h-8 w-52" />
                <SkeletonBlock className="mt-2 h-4 w-72 max-w-full" />
              </div>

              <SkeletonBlock className="hidden h-10 w-28 rounded-2xl md:block" />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <RelatedCardSkeleton key={index} />
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="mt-2 h-5 w-20" />
          </div>

          <SkeletonBlock className="h-12 w-32 rounded-2xl" />
          <SkeletonBlock className="h-12 w-28 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}