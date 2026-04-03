import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const fallbackItems = [
  {
    id: "under-budget",
    label: "Under Budget",
    href: "/shop?priceMax=50",
    img: "https://images.unsplash.com/photo-1520975918318-3f8cbc7b6217?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "Accessible picks",
    description: "Curated essentials for smart everyday shopping.",
  },
  {
    id: "mid-range",
    label: "Mid Range",
    href: "/shop?priceMax=100",
    img: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "Balanced value",
    description: "Well-crafted options that balance quality and price.",
  },
  {
    id: "premium-picks",
    label: "Premium Picks",
    href: "/shop?priceMin=100",
    img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "Elevated selection",
    description: "Statement pieces for a more refined wardrobe.",
  },
];

function normalizeText(value, fallback = "") {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function PriceCard({ item, featured = false, fallbackImage, loading = false }) {
  const resolvedLabel = normalizeText(item?.label, "Shop now");
  const resolvedHref = normalizeHref(item?.href, "/shop");
  const resolvedEyebrow = normalizeText(item?.eyebrow, "Price edit");
  const resolvedDescription = normalizeText(
    item?.description,
    featured
      ? "Explore a curated selection designed to match your budget and style."
      : "Discover well-matched products at the right price point."
  );

  const initialImage = normalizeText(item?.img, fallbackImage);
  const [imgSrc, setImgSrc] = useState(initialImage);

  return (
    <Link
      to={resolvedHref}
      className="
        group relative block overflow-hidden rounded-[24px] md:rounded-[28px]
        border border-black/5 bg-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)]
      "
      aria-label={resolvedLabel}
    >
      <div
        className={`relative w-full ${
          featured
            ? "h-[360px] sm:h-[420px] md:h-[520px]"
            : "h-[240px] sm:h-[260px] md:h-[248px]"
        }`}
      >
        {loading ? (
          <div className="absolute inset-0 animate-pulse bg-neutral-200" />
        ) : (
          <img
            src={imgSrc}
            alt={resolvedLabel}
            onError={() => setImgSrc(fallbackImage)}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/5 transition duration-300 group-hover:from-black/85" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6 md:p-7">
          <div className="inline-flex max-w-full rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-[11px]">
            <span className="truncate">{resolvedEyebrow}</span>
          </div>

          <h3
            className={`mt-3 max-w-[90%] font-semibold leading-tight text-white ${
              featured
                ? "text-2xl sm:text-3xl md:text-4xl"
                : "text-xl sm:text-2xl"
            }`}
          >
            {resolvedLabel}
          </h3>

          <p
            className={`mt-2 max-w-[34rem] text-white/85 ${
              featured
                ? "text-sm sm:text-[15px] md:text-base"
                : "text-sm md:text-[15px]"
            }`}
          >
            {resolvedDescription}
          </p>

          <div className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-950 transition duration-300 group-hover:bg-gray-100 sm:px-5">
            Explore range
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ShopByPrice({ data, loading, error }) {
  const title = normalizeText(data?.title, "Shop by Price");
  const subtitle = normalizeText(
    data?.subtitle,
    "Budget-aware shopping paths that help customers discover the right products faster."
  );

  const items = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length > 0) {
      return data.items.slice(0, 3).map((item, index) => {
        const fallback = fallbackItems[index % fallbackItems.length];
        return {
          id: item?.id || `price-${index + 1}`,
          label: normalizeText(item?.label, fallback.label),
          href: normalizeHref(item?.href, fallback.href),
          img: normalizeText(item?.img, fallback.img),
          eyebrow: normalizeText(item?.eyebrow, fallback.eyebrow),
          description: normalizeText(item?.description, fallback.description),
        };
      });
    }

    return fallbackItems;
  }, [data]);

  const featured = items[0] || fallbackItems[0];
  const secondary = items.slice(1, 3);

  return (
    <section
      className="site-shell mt-16 mb-16 sm:mt-20 sm:mb-20 md:mt-24"
      aria-label="Shop by price"
    >
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl md:text-4xl">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base">
          {subtitle}
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load price collections
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <PriceCard
          item={featured}
          featured
          fallbackImage={fallbackItems[0].img}
          loading={loading}
        />

        <div className="grid grid-cols-1 gap-5 sm:gap-6">
          {secondary.map((item, index) => (
            <PriceCard
              key={item?.id || index}
              item={item}
              fallbackImage={
                fallbackItems[(index + 1) % fallbackItems.length].img
              }
              loading={loading}
            />
          ))}

          {!loading && secondary.length === 0 && (
            <PriceCard
              item={fallbackItems[1]}
              fallbackImage={fallbackItems[1].img}
            />
          )}
        </div>
      </div>
    </section>
  );
}