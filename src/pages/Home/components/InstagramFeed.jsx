import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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

function createFeedKey(item, index) {
  const rawId = String(item?.id || "").trim();
  const rawHref = String(item?.href || "").trim();
  const rawImage = String(item?.image || item?.img || "").trim();
  const rawTitle = String(item?.title || "").trim();

  return [
    rawId || "no-id",
    rawHref || "no-href",
    rawImage || "no-image",
    rawTitle || "no-title",
    index,
  ].join("::");
}

function FeedCard({
  item,
  featured = false,
  fallbackImage,
  loading = false,
  imagePosition = "center center",
}) {
  const resolvedImage = normalizeText(item?.image || item?.img, fallbackImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const title = normalizeText(item?.title, "Shop the look");
  const description = normalizeText(
    item?.description,
    featured
      ? "Discover a curated visual story built around standout catalog moments."
      : "A refined inspiration point for faster product discovery."
  );
  const href = normalizeHref(item?.href, "/shop");
  const badge = normalizeText(item?.eyebrow, "Inspired edit");

  return (
    <Link
      to={href}
      className="
        group relative block overflow-hidden rounded-[24px] md:rounded-[28px]
        border border-black/5 bg-neutral-100
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]
      "
      aria-label={title || "Shop inspiration"}
    >
      <div
        className={`relative w-full ${
          featured
            ? "h-[340px] sm:h-[400px] md:h-[480px]"
            : "h-[220px] sm:h-[235px] md:h-[240px]"
        }`}
      >
        {loading ? (
          <div className="absolute inset-0 animate-pulse bg-neutral-200" />
        ) : (
          <img
            src={imgSrc}
            alt={title || "Inspiration"}
            onError={() => setImgSrc(fallbackImage)}
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04]"
            style={{ objectPosition: imagePosition }}
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5 transition duration-300 group-hover:from-black/76" />

        <div className="absolute inset-x-0 bottom-0 z-10 p-4 sm:p-5 md:p-6">
          <div className="inline-flex max-w-full rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-md sm:text-[11px]">
            <span className="truncate">{badge}</span>
          </div>

          <div
            className={`mt-3 rounded-[18px] bg-white/92 shadow-[0_8px_30px_rgba(0,0,0,0.08)] backdrop-blur-md ${
              featured
                ? "max-w-[78%] px-4 py-4 sm:max-w-[72%] sm:px-5 sm:py-4 md:max-w-[68%]"
                : "max-w-[86%] px-3.5 py-3.5 sm:max-w-[88%] sm:px-4 sm:py-4"
            }`}
          >
            <h3
              className={`font-semibold tracking-tight text-gray-950 ${
                featured
                  ? "line-clamp-2 text-[20px] leading-[1.25] sm:text-[22px] md:text-[24px]"
                  : "line-clamp-2 text-[15px] leading-[1.4] sm:text-[16px]"
              }`}
            >
              {title}
            </h3>

            <p
              className={`mt-2 text-gray-600 ${
                featured
                  ? "line-clamp-2 text-xs leading-5 sm:text-sm sm:leading-6"
                  : "line-clamp-2 text-xs leading-5"
              }`}
            >
              {description}
            </p>

            <div
              className={`mt-4 inline-flex items-center gap-2 rounded-full bg-black font-semibold text-white transition duration-300 group-hover:bg-gray-900 ${
                featured
                  ? "px-4 py-2 text-sm"
                  : "px-3.5 py-2 text-[13px]"
              }`}
            >
              Shop this mood <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

function FeedSkeleton() {
  return (
    <section
      className="site-shell mt-16 mb-16 sm:mt-20 sm:mb-20 md:mt-24"
      aria-label="Inspired by the feed loading"
    >
      <div className="mb-8 text-center sm:mb-10">
        <div className="mx-auto h-8 w-60 animate-pulse rounded-2xl bg-gray-200 sm:h-10 sm:w-80" />
        <div className="mx-auto mt-4 h-4 w-[320px] max-w-full animate-pulse rounded-2xl bg-gray-100 sm:h-5 sm:w-[540px]" />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="h-[340px] animate-pulse rounded-[24px] bg-gray-200 sm:h-[400px] md:h-[480px] md:rounded-[28px]" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
          <div className="h-[220px] animate-pulse rounded-[24px] bg-gray-200 sm:h-[235px] md:h-[240px] md:rounded-[28px]" />
          <div className="h-[220px] animate-pulse rounded-[24px] bg-gray-200 sm:h-[235px] md:h-[240px] md:rounded-[28px]" />
          <div className="h-[220px] animate-pulse rounded-[24px] bg-gray-200 sm:h-[235px] md:h-[240px] md:rounded-[28px]" />
          <div className="h-[220px] animate-pulse rounded-[24px] bg-gray-200 sm:h-[235px] md:h-[240px] md:rounded-[28px]" />
        </div>
      </div>
    </section>
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
        key: createFeedKey(item, index),
        image: normalizeText(
          item?.image || item?.img,
          fallbackImages[index % fallbackImages.length]
        ),
        img: normalizeText(
          item?.img || item?.image,
          fallbackImages[index % fallbackImages.length]
        ),
        title: normalizeText(item?.title, "Shop the look"),
        description: normalizeText(item?.description, ""),
        eyebrow: normalizeText(item?.eyebrow, "Inspired edit"),
        href: normalizeHref(item?.href, "/shop"),
      }));
    }

    return fallbackImages.slice(0, 5).map((image, index) => ({
      id: `fallback-${index + 1}`,
      key: `fallback::${index}::${image}`,
      image,
      img: image,
      title: "Shop the look",
      description: "",
      eyebrow: "Inspired edit",
      href: "/shop",
    }));
  }, [data]);

  const featured = items[0] || null;
  const secondary = items.slice(1, 5);

  if (loading && !Array.isArray(data?.items)) {
    return <FeedSkeleton />;
  }

  return (
    <section
      className="site-shell mt-16 mb-16 sm:mt-20 sm:mb-20 md:mt-24"
      aria-label="Instagram feed"
    >
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base md:leading-7">
          {subtitle}
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load inspiration feed
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:gap-6 lg:grid-cols-[1.02fr_0.98fr]">
        {featured ? (
          <FeedCard
            item={featured}
            featured
            fallbackImage={fallbackImages[0]}
            loading={loading}
            imagePosition="center center"
          />
        ) : null}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
          {secondary.map((item, index) => (
            <FeedCard
              key={item?.key || `secondary-${index}`}
              item={item}
              fallbackImage={fallbackImages[(index + 1) % fallbackImages.length]}
              loading={loading}
              imagePosition="center center"
            />
          ))}
        </div>
      </div>

      <div className="mt-8 text-center">
        <Link
          to="/shop"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Explore the catalog <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}

export default InstagramFeed;