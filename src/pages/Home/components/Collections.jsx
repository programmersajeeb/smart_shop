import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../../../services/apiClient";

const fallbackCollections = [
  {
    id: "women",
    title: "Women",
    image:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=80",
    href: "/shop?category=Women",
    count: null,
    badge: "Most loved",
    description:
      "Everyday staples and statement pieces for a more polished wardrobe.",
  },
  {
    id: "men",
    title: "Men",
    image:
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=80",
    href: "/shop?category=Men",
    count: null,
    badge: "Popular pick",
    description:
      "Well-balanced essentials designed for smart daily styling.",
  },
  {
    id: "accessories",
    title: "Accessories",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1400&q=80",
    href: "/shop?category=Accessories",
    count: null,
    badge: "Easy finishing touches",
    description: "The details that help every look feel complete.",
  },
];

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function resolveAssetUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  if (/^(https?:|data:|blob:)/i.test(value)) return value;

  const base = String(api?.defaults?.baseURL || window.location.origin).trim();

  try {
    const normalizedPath = value.startsWith("/")
      ? value
      : `/${value.replace(/^\.?\//, "")}`;
    return new URL(normalizedPath, base).toString();
  } catch {
    return value;
  }
}

function normalizeImage(value, fallback) {
  if (typeof value === "string" && value.trim()) {
    return resolveAssetUrl(value.trim());
  }

  if (value && typeof value === "object") {
    if (typeof value.url === "string" && value.url.trim()) {
      return resolveAssetUrl(value.url.trim());
    }
    if (typeof value.image === "string" && value.image.trim()) {
      return resolveAssetUrl(value.image.trim());
    }
  }

  return fallback;
}

function CollectionsSkeleton() {
  return (
    <section className="site-shell my-16 md:my-20" aria-label="Collections loading">
      <div className="mb-10 text-center">
        <div className="mx-auto h-10 w-72 animate-pulse rounded-2xl bg-gray-200" />
        <div className="mx-auto mt-4 h-5 w-[560px] max-w-full animate-pulse rounded-2xl bg-gray-100" />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="h-[360px] animate-pulse rounded-[30px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 sm:h-[430px] lg:h-[500px]" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">
          <div className="h-[210px] animate-pulse rounded-[30px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
          <div className="h-[210px] animate-pulse rounded-[30px] bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200" />
        </div>
      </div>
    </section>
  );
}

function CollectionCard({ item, featured = false }) {
  const fallbackImage = item?.fallbackImage || fallbackCollections[0].image;
  const [imgSrc, setImgSrc] = useState(item?.image || fallbackImage);

  useEffect(() => {
    setImgSrc(item?.image || fallbackImage);
  }, [item?.image, fallbackImage]);

  return (
    <Link
      to={item?.href || "/shop"}
      className="group relative block overflow-hidden rounded-[30px] border border-black/5 bg-neutral-100 shadow-[0_10px_30px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(15,23,42,0.12)]"
      aria-label={`Explore ${item?.title || "collection"}`}
    >
      <div
        className={`relative w-full ${
          featured
            ? "h-[360px] sm:h-[430px] lg:h-[500px]"
            : "h-[220px] sm:h-[240px] xl:h-[238px]"
        }`}
      >
        <img
          src={imgSrc}
          alt={item?.title || "Collection"}
          onError={() => setImgSrc(fallbackImage)}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-[1.04]"
          loading="lazy"
        />

        <div
          className={`absolute inset-0 ${
            featured
              ? "bg-gradient-to-t from-black/72 via-black/18 to-transparent"
              : "bg-gradient-to-t from-black/70 via-black/14 to-transparent"
          }`}
        />

        <div className="absolute left-4 right-4 top-4 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-900 shadow-sm">
            {item?.badge || "Collection"}
          </span>

          {item?.count != null ? (
            <span className="rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
              {item.count} items
            </span>
          ) : null}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <h3
            className={`font-semibold leading-tight text-white ${
              featured ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl"
            }`}
          >
            {item?.title || "Collection"}
          </h3>

          <p className="mt-2 max-w-md text-sm leading-6 text-white/82">
            {item?.description ||
              "Curated pieces from one of the store’s most visited collections."}
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition group-hover:bg-gray-100">
            Explore collection <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function Collections({ data, loading, error }) {
  const sectionTitle = normalizeText(data?.title, "Popular Collections");
  const sectionSubtitle = normalizeText(
    data?.subtitle,
    "Discover the collections customers browse most often, each arranged to make product discovery feel faster and more natural."
  );

  const items = useMemo(() => {
    const serverItems = Array.isArray(data?.items) ? data.items : [];

    if (serverItems.length > 0) {
      return serverItems.slice(0, 3).map((item, index) => {
        const fallbackItem =
          fallbackCollections[index % fallbackCollections.length];

        const rawTitle = normalizeText(
          item?.title || item?.name || item?.label,
          "Collection"
        );

        return {
          id: item?.id || item?._id || `collection-${index + 1}`,
          title: rawTitle,
          image: normalizeImage(item?.image, fallbackItem.image),
          fallbackImage: fallbackItem.image,
          href: normalizeHref(
            item?.href,
            `/shop?category=${encodeURIComponent(rawTitle)}`
          ),
          count: Number.isFinite(Number(item?.count))
            ? Number(item.count)
            : null,
          badge: normalizeText(
            item?.badge,
            index === 0 ? "Most loved" : "Popular pick"
          ),
          description: normalizeText(item?.description, fallbackItem.description),
        };
      });
    }

    return fallbackCollections.map((item) => ({
      ...item,
      fallbackImage: item.image,
    }));
  }, [data]);

  const featured = items[0] || fallbackCollections[0];
  const secondary = items.slice(1, 3);

  if (loading && !items.length) {
    return <CollectionsSkeleton />;
  }

  return (
    <section className="site-shell my-16 md:my-20" aria-label="Popular collections">
      <div className="mb-10 text-center md:mb-12">
        <h2 className="text-3xl font-semibold tracking-tight text-gray-950 md:text-4xl">
          {sectionTitle}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
          {sectionSubtitle}
        </p>
      </div>

      {!loading && error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load collections
          {error?.message ? ` (${error.message})` : ""}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <CollectionCard item={featured} featured />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-1">
          {secondary.map((item, index) => (
            <CollectionCard key={item?.id || index} item={item} />
          ))}
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/collections"
          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 hover:shadow-md"
        >
          View all collections
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}