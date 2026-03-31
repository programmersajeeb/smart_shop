import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";

import men from "../../../assets/men.png";
import women from "../../../assets/women.png";
import accessories from "../../../assets/accessories.png";

const fallbackCollections = [
  {
    id: "women",
    title: "Women's",
    image: women,
    href: "/shop?category=Women",
    count: null,
  },
  {
    id: "men",
    title: "Men's",
    image: men,
    href: "/shop?category=Men",
    count: null,
  },
  {
    id: "accessories",
    title: "Accessories",
    image: accessories,
    href: "/shop?category=Accessories",
    count: null,
  },
];

const FALLBACK_CARD_IMAGE = women;

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function normalizeImage(value, fallback = FALLBACK_CARD_IMAGE) {
  if (typeof value === "string" && value.trim()) return value.trim();

  if (value && typeof value === "object") {
    if (typeof value.url === "string" && value.url.trim()) {
      return value.url.trim();
    }
    if (typeof value.image === "string" && value.image.trim()) {
      return value.image.trim();
    }
  }

  return fallback;
}

function CollectionCard({ item, featured = false }) {
  const fallbackImage = item?.fallbackImage || FALLBACK_CARD_IMAGE;
  const [imgSrc, setImgSrc] = useState(item?.image || fallbackImage);

  useEffect(() => {
    setImgSrc(item?.image || fallbackImage);
  }, [item?.image, fallbackImage]);

  return (
    <Link
      to={item?.href || "/shop"}
      className="group relative block overflow-hidden rounded-[28px] border border-black/5 bg-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      aria-label={`Explore ${item?.title || "collection"}`}
    >
      <div
        className={`relative w-full ${
          featured ? "h-[420px] sm:h-[480px] lg:h-[520px]" : "h-[250px] md:h-[248px]"
        }`}
      >
        <img
          src={imgSrc}
          alt={item?.title || "Collection"}
          onError={() => setImgSrc(fallbackImage)}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent transition duration-500 group-hover:from-black/75" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
            Collection
          </div>

          <h3
            className={`mt-3 font-semibold text-white ${
              featured ? "text-3xl md:text-4xl" : "text-2xl"
            }`}
          >
            {item?.title || "Collection"}
          </h3>

          <div className="mt-3 flex items-center justify-between gap-3">
            <span className="text-sm text-white/85">
              {item?.count != null ? `${item.count} products` : "Explore now"}
            </span>

            <span className="inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition group-hover:bg-gray-100">
              Shop
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Collections({ data, loading, error }) {
  const sectionTitle = normalizeText(data?.title, "Explore Our Collections");
  const sectionSubtitle = normalizeText(
    data?.subtitle,
    "Curated categories from your live catalog to help customers discover products faster."
  );

  const items = useMemo(() => {
    const serverItems = Array.isArray(data?.items) ? data.items : [];

    if (serverItems.length > 0) {
      return serverItems.slice(0, 5).map((item, index) => {
        const fallbackItem =
          fallbackCollections[index % fallbackCollections.length];

        return {
          id: item?.id || item?._id || `collection-${index + 1}`,
          title: normalizeText(item?.title, "Collection"),
          image: normalizeImage(item?.image, fallbackItem.image),
          fallbackImage: fallbackItem.image,
          href: normalizeHref(item?.href, "/shop"),
          count: Number.isFinite(Number(item?.count))
            ? Number(item.count)
            : null,
        };
      });
    }

    return fallbackCollections.map((item) => ({
      ...item,
      fallbackImage: item.image,
    }));
  }, [data]);

  const featured = items[0] || {
    ...fallbackCollections[0],
    fallbackImage: fallbackCollections[0].image,
  };

  const secondary = items.slice(1, 5);

  return (
    <section className="site-shell my-16" aria-label="Collections">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-gray-950 md:text-4xl">
          {sectionTitle}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
          {sectionSubtitle}
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load collections
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <CollectionCard item={featured} featured />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {secondary.length > 0 ? (
            secondary.map((item, index) => (
              <CollectionCard key={item?.id || index} item={item} />
            ))
          ) : (
            <>
              <CollectionCard
                item={{
                  ...fallbackCollections[1],
                  fallbackImage: fallbackCollections[1].image,
                }}
              />
              <CollectionCard
                item={{
                  ...fallbackCollections[2],
                  fallbackImage: fallbackCollections[2].image,
                }}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}