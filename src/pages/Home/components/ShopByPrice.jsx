import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const fallbackItems = [
  {
    id: "under-budget",
    label: "Under Budget",
    href: "/shop?priceMax=50",
    img: "https://images.unsplash.com/photo-1520975918318-3f8cbc7b6217?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "Accessible picks",
  },
  {
    id: "mid-range",
    label: "Mid Range",
    href: "/shop?priceMax=100",
    img: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "Balanced value",
  },
  {
    id: "premium-picks",
    label: "Premium Picks",
    href: "/shop?priceMin=100",
    img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1200&q=80",
    eyebrow: "Elevated selection",
  },
];

function PriceCard({ item, featured = false, fallbackImage }) {
  const [imgSrc, setImgSrc] = useState(item?.img || fallbackImage);

  return (
    <Link
      to={item?.href || "/shop"}
      className="group relative block overflow-hidden rounded-[28px] border border-black/5 bg-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      aria-label={item?.label || "Shop by price"}
    >
      <div className={`relative w-full ${featured ? "h-[420px] md:h-[520px]" : "h-[250px] md:h-[248px]"}`}>
        <img
          src={imgSrc}
          alt={item?.label || "Price collection"}
          onError={() => setImgSrc(fallbackImage)}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent transition duration-300 group-hover:from-black/80" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
            {item?.eyebrow || "Price edit"}
          </div>

          <h3
            className={`mt-3 font-semibold text-white ${
              featured ? "text-3xl md:text-4xl" : "text-2xl"
            }`}
          >
            {item?.label || "Shop now"}
          </h3>

          <div className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-950 transition group-hover:bg-gray-100">
            Explore range
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function ShopByPrice({ data, loading, error }) {
  const title = data?.title || "Shop by Price";

  const items = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length > 0) {
      return data.items.slice(0, 3).map((item, index) => ({
        id: item?.id || `price-${index + 1}`,
        label: item?.label || "Shop now",
        href: item?.href || "/shop",
        img: item?.img || fallbackItems[index % fallbackItems.length]?.img,
        eyebrow: fallbackItems[index % fallbackItems.length]?.eyebrow,
      }));
    }
    return fallbackItems;
  }, [data]);

  const featured = items[0] || fallbackItems[0];
  const secondary = items.slice(1, 3);

  return (
    <section className="container mx-auto mt-24 mb-20 px-4" aria-label="Shop by price">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-gray-950 md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
          Budget-aware shopping paths that help customers discover the right
          products faster.
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load price collections
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <PriceCard
          item={featured}
          featured
          fallbackImage={fallbackItems[0].img}
        />

        <div className="grid grid-cols-1 gap-6">
          {secondary.map((item, index) => (
            <PriceCard
              key={item?.id || index}
              item={item}
              fallbackImage={fallbackItems[(index + 1) % fallbackItems.length].img}
            />
          ))}
        </div>
      </div>
    </section>
  );
}