import React from "react";
import { Link } from "react-router-dom";
import Trend from "./Trend";
import ProductGridSkeleton from "../../../../shared/components/ui/skeletons/ProductGridSkeleton";

export default function Trending({
  trend,
  loading,
  error,
  sectionTitle,
  sectionSubtitle,
  cta,
}) {
  const items = Array.isArray(trend?.products) ? trend.products.slice(0, 4) : [];

  const title = sectionTitle || "Trending Now";
  const subtitle =
    sectionSubtitle ||
    "Fresh picks from the latest in-stock products across your active catalog.";

  return (
    <section
      className="container mx-auto px-4 py-10 sm:py-12 md:py-14 lg:py-16"
      aria-label={title}
    >
      <div className="mb-8 flex flex-col gap-4 sm:mb-10 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl md:text-4xl">
            {title}
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
            {subtitle}
          </p>
        </div>

        {cta?.href ? (
          <Link
            to={cta.href}
            className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 sm:w-auto"
          >
            {cta?.label || "View all"}
          </Link>
        ) : null}
      </div>

      {loading && (
        <ProductGridSkeleton
          count={4}
          gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
          imageClassName="h-[280px] sm:h-[320px] md:h-[340px]"
          showButton={false}
        />
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load trending products
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {items.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-black/10 bg-white px-6 py-12 text-center">
              <p className="text-base font-medium text-gray-800">
                No trending products found.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Try exploring the full shop catalog for the latest arrivals.
              </p>
            </div>
          ) : (
            items.map((item, index) => (
              <Trend key={item?._id || item?.id || index} item={item} />
            ))
          )}
        </div>
      )}
    </section>
  );
}