import React from "react";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function Skel({ className }) {
  return (
    <div
      className={cx(
        "animate-pulse rounded-2xl bg-gray-100 border border-gray-200",
        className
      )}
    />
  );
}

function Card({ className, children }) {
  return (
    <div className={cx("rounded-3xl border bg-white p-6 md:p-8 shadow-sm", className)}>
      {children}
    </div>
  );
}

export default function AdminSettingsSkeleton() {
  const sections = [
    { rows: 6 },
    { rows: 5 },
    { rows: 5 },
    { rows: 5 },
    { rows: 5 },
    { rows: 4 },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="min-w-0 flex-1">
            <Skel className="h-3 w-20 rounded-xl" />
            <Skel className="mt-3 h-8 w-48 md:w-64 rounded-2xl" />
            <Skel className="mt-3 h-4 w-full max-w-2xl rounded-xl" />
            <Skel className="mt-2 h-4 w-full max-w-xl rounded-xl" />
            <Skel className="mt-4 h-4 w-56 rounded-xl" />
          </div>

          <div className="shrink-0">
            <Skel className="h-11 w-40 rounded-2xl" />
          </div>
        </div>
      </Card>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left nav */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-6">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <Skel className="h-4 w-40 rounded-xl" />
              <Skel className="mt-2 h-3 w-52 rounded-xl" />

              <div className="mt-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skel key={i} className="h-12 w-full rounded-2xl" />
                ))}
              </div>

              <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
                <Skel className="h-3 w-28 rounded-xl bg-gray-200 border-gray-200" />
                <Skel className="mt-2 h-3 w-full rounded-xl bg-gray-200 border-gray-200" />
                <Skel className="mt-2 h-3 w-11/12 rounded-xl bg-gray-200 border-gray-200" />
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:col-span-8 space-y-5">
          {/* Mobile picker */}
          <div className="lg:hidden rounded-3xl border bg-white p-4 shadow-sm">
            <Skel className="h-3 w-20 rounded-xl" />
            <Skel className="mt-2 h-12 w-full rounded-2xl" />
          </div>

          {/* Sections */}
          {sections.map((s, idx) => (
            <div key={idx} className="rounded-3xl border bg-white p-5 md:p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <Skel className="h-10 w-10 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <Skel className="h-4 w-40 rounded-xl" />
                  <Skel className="mt-2 h-3 w-full max-w-xl rounded-xl" />
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: s.rows }).map((_, r) => (
                  <div key={r} className={cx(r === 0 ? "md:col-span-2" : "")}>
                    <Skel className="h-3 w-28 rounded-xl" />
                    <Skel className="mt-2 h-12 w-full rounded-2xl" />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Sticky bar */}
          <div className="sticky bottom-0 z-10">
            <div className="mt-5 rounded-3xl border bg-white/90 backdrop-blur p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skel className="h-9 w-9 rounded-2xl" />
                  <div>
                    <Skel className="h-4 w-36 rounded-xl" />
                    <Skel className="mt-2 h-3 w-52 rounded-xl" />
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Skel className="h-10 w-24 rounded-2xl" />
                  <Skel className="h-10 w-24 rounded-2xl" />
                  <Skel className="h-10 w-36 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
