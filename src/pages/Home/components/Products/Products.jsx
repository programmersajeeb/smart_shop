import React from "react";
import ProductGridSkeleton from "../../../../shared/components/ui/skeletons/ProductGridSkeleton";

export default function Products({ product, loading, error }) {
  const items = (product?.products || []).slice(0, 8);

  return (
    <section className="container mx-auto px-4 my-20">
      <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
        Best Sellers
      </h2>

      {loading && (
        <ProductGridSkeleton
          count={8}
          gridClassName="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          imageClassName="h-64"
          showButton={true}
        />
      )}

      {!loading && error && (
        <div className="alert alert-error">
          <span>
            Failed to load products {error?.message ? `(${error.message})` : ""}
          </span>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full text-center opacity-70">
              No products found.
            </div>
          ) : (
            items.map((p, idx) => {
              const img =
                p?.images?.[0] || "https://placehold.co/600x600?text=Product";

              return (
                <div
                  key={p?._id || p?.id || idx}
                  className="card shadow-lg rounded-xl group cursor-pointer overflow-hidden bg-white"
                >
                  <figure className="relative">
                    <img
                      src={img}
                      alt={p?.title || "Product"}
                      className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
                      loading="lazy"
                    />

                    <button className="hidden group-hover:flex absolute bottom-3 left-1/2 -translate-x-1/2 btn btn-sm bg-black text-white border-none">
                      Add to Cart
                    </button>
                  </figure>

                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {p?.title}
                    </h3>
                    <p className="text-gray-600 mb-1">${p?.price}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
