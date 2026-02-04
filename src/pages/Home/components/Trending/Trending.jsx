import React from "react";
import Trend from "./Trend";
import ProductGridSkeleton from "../../../../shared/components/ui/skeletons/ProductGridSkeleton";

export default function Trending({ trend, loading, error }) {
  const items = (trend?.products || []).slice(0, 4);

  return (
    <section className="container mx-auto mt-20 px-4">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        Trending Now
      </h2>

      {loading && (
        <ProductGridSkeleton
          count={4}
          gridClassName="grid grid-cols-2 md:grid-cols-4 gap-6"
          imageClassName="h-64"
          showButton={false}
        />
      )}

      {!loading && error && (
        <div className="alert alert-error">
          <span>
            Failed to load trending products{" "}
            {error?.message ? `(${error.message})` : ""}
          </span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full text-center opacity-70">
              No products found.
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
