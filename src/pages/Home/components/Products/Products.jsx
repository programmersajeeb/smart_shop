import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ProductGridSkeleton from "../../../../shared/components/ui/skeletons/ProductGridSkeleton";

const FALLBACK_PRODUCT_IMAGE = "https://placehold.co/900x1100?text=Product";

function getPrimaryImage(product) {
  const first = Array.isArray(product?.images) ? product.images[0] : null;

  if (typeof first === "string" && first.trim()) {
    return first.trim();
  }

  if (
    first &&
    typeof first === "object" &&
    typeof first.url === "string" &&
    first.url.trim()
  ) {
    return first.url.trim();
  }

  if (typeof product?.image === "string" && product.image.trim()) {
    return product.image.trim();
  }

  return FALLBACK_PRODUCT_IMAGE;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "$0";
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

function ProductCard({ product }) {
  const [imgSrc, setImgSrc] = useState(FALLBACK_PRODUCT_IMAGE);

  useEffect(() => {
    setImgSrc(getPrimaryImage(product));
  }, [product]);

  const href = `/shop?q=${encodeURIComponent(product?.title || "")}`;
  const inStock = Number(product?.stock ?? 0) > 0;

  return (
    <Link
      to={href}
      className="group block h-full overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[24px] lg:rounded-[28px]"
      aria-label={product?.title || "Product"}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        <img
          src={imgSrc}
          alt={product?.title || "Product"}
          onError={() => {
            if (imgSrc !== FALLBACK_PRODUCT_IMAGE) {
              setImgSrc(FALLBACK_PRODUCT_IMAGE);
            }
          }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-2 sm:left-4 sm:top-4 sm:right-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {product?.category ? (
              <span className="max-w-full truncate rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 shadow-sm">
                {product.category}
              </span>
            ) : null}
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-sm ${
              inStock
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-3 flex justify-center px-3 opacity-0 transition duration-300 group-hover:opacity-100 sm:bottom-4">
          <span className="inline-flex min-h-[40px] items-center rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white shadow-lg">
            Explore product
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {product?.brand ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {product.brand}
          </p>
        ) : null}

        <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-gray-950 sm:min-h-[56px] sm:text-lg sm:leading-7">
          {product?.title || "Untitled product"}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
              Price
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-950 sm:text-xl">
              {formatMoney(product?.price)}
            </p>
          </div>

          <span className="inline-flex shrink-0 items-center rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition group-hover:bg-black group-hover:text-white">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function Products({ data, loading, error }) {
  const items = Array.isArray(data?.products) ? data.products : [];
  const title = data?.title || "Best Sellers";
  const subtitle =
    data?.subtitle ||
    "A curated selection of standout products from your active catalog.";
  const cta = data?.cta || null;

  if (
    !loading &&
    !error &&
    (data?.enabled === false || data?.visible === false || items.length === 0)
  ) {
    return null;
  }

  return (
    <section className="site-shell py-10 sm:py-12 md:py-14 lg:py-16" aria-label={title}>
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
          count={8}
          gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4"
          imageClassName="h-[280px] sm:h-[320px] md:h-[340px]"
          showButton={true}
        />
      )}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load products
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
          {items.map((p, idx) => (
            <ProductCard key={p?._id || p?.id || idx} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}