import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FALLBACK_PRODUCT_IMAGE = "https://placehold.co/900x1100?text=Product";

function getPrimaryImage(item) {
  const first = Array.isArray(item?.images) ? item.images[0] : null;

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

  if (typeof item?.image === "string" && item.image.trim()) {
    return item.image.trim();
  }

  return FALLBACK_PRODUCT_IMAGE;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "$0";
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

export default function Trend({ item }) {
  const [imgSrc, setImgSrc] = useState(FALLBACK_PRODUCT_IMAGE);

  useEffect(() => {
    setImgSrc(getPrimaryImage(item));
  }, [item]);

  if (!item) return null;

  const { title, price, category, brand, stock } = item;
  const href = `/shop?q=${encodeURIComponent(title || "")}`;
  const inStock = Number(stock ?? 0) > 0;

  return (
    <Link
      to={href}
      className="group block h-full overflow-hidden rounded-[22px] border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:rounded-[24px] lg:rounded-[28px]"
      aria-label={title || "Trending product"}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        <img
          src={imgSrc}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          alt={title || "Trending Product"}
          loading="lazy"
          onError={() => {
            if (imgSrc !== FALLBACK_PRODUCT_IMAGE) {
              setImgSrc(FALLBACK_PRODUCT_IMAGE);
            }
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        <div className="absolute left-3 top-3 right-3 flex items-start justify-between gap-2 sm:left-4 sm:top-4 sm:right-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {category ? (
              <span className="max-w-full truncate rounded-full bg-white/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-700 shadow-sm">
                {category}
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
        {brand ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {brand}
          </p>
        ) : null}

        <h3 className="line-clamp-2 min-h-[48px] text-base font-semibold leading-6 text-gray-950 sm:min-h-[56px] sm:text-lg sm:leading-7">
          {title || "Untitled product"}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
              Price
            </p>
            <p className="mt-1 text-lg font-semibold text-gray-950 sm:text-xl">
              {formatMoney(price)}
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