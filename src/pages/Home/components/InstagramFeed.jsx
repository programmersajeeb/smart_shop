import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const fallbackImages = [
  "https://images.unsplash.com/photo-1520970014086-2208d0858db2?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1520960579280-8c46f15d8d20?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1520974735194-3b1c3ac20740?auto=format&fit=crop&w=1400&q=80",
];

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function FeedCard({ item, featured = false, fallbackImage }) {
  const resolvedImage = normalizeText(item?.image, fallbackImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const title = normalizeText(item?.title, "Shop the look");
  const href = normalizeHref(item?.href, "/shop");

  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-[28px] border border-black/5 bg-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      aria-label={title || "Shop inspiration"}
    >
      <div
        className={`relative w-full ${
          featured ? "h-[420px] md:h-[520px]" : "h-[250px] md:h-[248px]"
        }`}
      >
        <img
          src={imgSrc}
          alt={title || "Inspiration"}
          onError={() => setImgSrc(fallbackImage)}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
            Inspiration
          </div>

          <div className="mt-3 max-w-sm rounded-2xl bg-white/95 px-4 py-3 shadow-sm">
            <p
              className={`line-clamp-2 font-semibold text-gray-900 ${
                featured ? "text-base md:text-lg" : "text-sm"
              }`}
            >
              {title}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}

function InstagramFeed({ data, loading, error }) {
  const title = normalizeText(data?.title, "Inspired by the Feed");
  const subtitle = normalizeText(
    data?.subtitle,
    "Editorial-style product inspiration built from your live catalog."
  );

  const items = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length > 0) {
      return data.items.slice(0, 5).map((item, index) => ({
        id: item?.id || `feed-${index + 1}`,
        image: normalizeText(
          item?.image,
          fallbackImages[index % fallbackImages.length]
        ),
        title: normalizeText(item?.title, "Shop the look"),
        href: normalizeHref(item?.href, "/shop"),
      }));
    }

    return fallbackImages.slice(0, 5).map((image, index) => ({
      id: `fallback-${index + 1}`,
      image,
      title: "Shop the look",
      href: "/shop",
    }));
  }, [data]);

  const featured = items[0] || null;
  const secondary = items.slice(1, 5);

  return (
    <section
      className="container mx-auto mt-24 mb-20 px-4"
      aria-label="Instagram feed"
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-gray-950 md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
          {subtitle}
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load inspiration feed
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {featured ? (
          <FeedCard
            item={featured}
            featured
            fallbackImage={fallbackImages[0]}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {secondary.map((item, index) => (
            <FeedCard
              key={item?.id || index}
              item={item}
              fallbackImage={fallbackImages[(index + 1) % fallbackImages.length]}
            />
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Explore the catalog
        </Link>
      </div>
    </section>
  );
}

export default InstagramFeed;