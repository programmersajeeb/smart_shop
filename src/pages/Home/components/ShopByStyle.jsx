import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import api from "../../../services/apiClient";

const fallbackImages = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1600&q=80",
];

const fallbackItems = [
  {
    id: "women",
    label: "Women",
    href: "/shop?category=Women",
    img: fallbackImages[0],
    type: "category",
    eyebrow: "Everyday edit",
    description:
      "Style and sophistication for every occasion with elevated wardrobe essentials.",
  },
  {
    id: "accessories",
    label: "Accessories",
    href: "/shop?category=Accessories",
    img: fallbackImages[1],
    type: "category",
    eyebrow: "Tailored focus",
    description:
      "Premium finishing pieces that bring polish, depth, and signature detail.",
  },
  {
    id: "jewelry",
    label: "Jewelry",
    href: "/shop?category=Jewelry",
    img: fallbackImages[2],
    type: "category",
    eyebrow: "Refined accents",
    description:
      "Refined accents crafted to add confidence, elegance, and distinction.",
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
    if (typeof value.img === "string" && value.img.trim()) {
      return resolveAssetUrl(value.img.trim());
    }
  }

  return fallback;
}

function resolveBadge(item) {
  if (normalizeText(item?.eyebrow)) return normalizeText(item?.eyebrow);

  const type = normalizeText(item?.type, "style").toLowerCase();
  if (type === "brand") return "Brand edit";
  if (type === "category") return "Category edit";
  if (type === "collection") return "Collection edit";
  return "Style edit";
}

function StyleCard({
  item,
  featured = false,
  fallbackImage,
  loading = false,
  imagePosition = "center center",
}) {
  const resolvedImage = normalizeImage(item?.img || item?.image, fallbackImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const label = normalizeText(item?.label, "Style");
  const href = normalizeHref(item?.href, "/shop");
  const badge = resolveBadge(item);
  const description = normalizeText(
    item?.description,
    featured
      ? "Discover a polished direction shaped for premium product discovery and stronger visual storytelling."
      : "Explore a carefully selected edit built around this style direction."
  );

  return (
    <Link
      to={href}
      className="
        group relative block overflow-hidden rounded-[24px] md:rounded-[30px]
        border border-black/5 bg-neutral-100
        shadow-[0_12px_35px_rgba(0,0,0,0.07)]
        transition-all duration-300
        hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)]
      "
      aria-label={label}
    >
      <div
        className={`relative w-full ${
          featured
            ? "h-[380px] sm:h-[460px] lg:h-[560px]"
            : "h-[260px] sm:h-[310px] lg:h-[267px]"
        }`}
      >
        {loading ? (
          <div className="absolute inset-0 animate-pulse bg-neutral-200" />
        ) : (
          <img
            src={imgSrc}
            alt={label}
            onError={() => setImgSrc(fallbackImage)}
            className="absolute inset-0 h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04]"
            style={{ objectPosition: imagePosition }}
            loading="lazy"
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/28 to-black/5 transition duration-300 group-hover:from-black/84" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.18),transparent_45%,rgba(0,0,0,0.10))]" />

        {featured ? (
          <div className="absolute inset-0 z-10 flex flex-col justify-end p-5 sm:p-6 md:p-7 lg:justify-between">
            <div className="hidden lg:flex justify-end">
              <div className="max-w-[52%] text-right">
                <div className="inline-flex max-w-full rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-[11px]">
                  <span className="truncate">{badge}</span>
                </div>

                <h3 className="mt-3 text-3xl font-semibold leading-[1.05] text-white sm:text-4xl lg:text-5xl">
                  {label}
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/88 sm:text-base">
                  {description}
                </p>

                <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition duration-300 group-hover:bg-neutral-100">
                  Browse popular styles <ArrowRight size={15} />
                </div>
              </div>
            </div>

            <div className="max-w-full lg:max-w-[52%]">
              <div className="inline-flex max-w-full rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-[11px]">
                <span className="truncate">{badge}</span>
              </div>

              <h3 className="mt-3 text-2xl font-semibold leading-[1.02] text-white sm:text-4xl lg:text-6xl">
                {label}
              </h3>

              <p className="mt-3 max-w-[36rem] text-sm leading-6 text-white/90 sm:text-base sm:leading-7">
                {description}
              </p>

              <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition duration-300 group-hover:bg-neutral-100 sm:mt-6 sm:py-3">
                Explore style <ArrowRight size={15} />
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-6 md:p-7">
            <div className="inline-flex max-w-full rounded-full bg-white/14 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md sm:text-[11px]">
              <span className="truncate">{badge}</span>
            </div>

            <h3 className="mt-3 max-w-[90%] text-xl font-semibold leading-[1.05] text-white sm:text-[28px]">
              {label}
            </h3>

            <p className="mt-3 max-w-[34rem] text-sm leading-6 text-white/88">
              {description}
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition duration-300 group-hover:bg-neutral-100">
              Explore style <ArrowRight size={15} />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function ShopByStyleSkeleton() {
  return (
    <section
      className="site-shell mb-16 mt-16 sm:mb-20 sm:mt-20 md:mt-24"
      aria-label="Shop by style loading"
    >
      <div className="mb-8 text-center sm:mb-10">
        <div className="mx-auto h-8 w-56 animate-pulse rounded-2xl bg-gray-200 sm:h-10 sm:w-72" />
        <div className="mx-auto mt-4 h-4 w-[320px] max-w-full animate-pulse rounded-2xl bg-gray-100 sm:h-5 sm:w-[520px]" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="h-[380px] animate-pulse rounded-[24px] bg-gray-200 md:rounded-[30px] sm:h-[460px] lg:h-[560px]" />
        <div className="grid grid-cols-1 gap-6">
          <div className="h-[260px] animate-pulse rounded-[24px] bg-gray-200 md:rounded-[30px] sm:h-[310px] lg:h-[267px]" />
          <div className="h-[260px] animate-pulse rounded-[24px] bg-gray-200 md:rounded-[30px] sm:h-[310px] lg:h-[267px]" />
        </div>
      </div>
    </section>
  );
}

function ShopByStyle({ data, loading, error }) {
  const title = normalizeText(data?.title, "Shop by Style");
  const subtitle = normalizeText(
    data?.subtitle,
    "Fast discovery paths based on category and brand-led shopping intent."
  );

  const items = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length > 0) {
      return data.items.slice(0, 3).map((item, index) => {
        const fallback = fallbackItems[index % fallbackItems.length];

        return {
          id: item?.id || `style-${index + 1}`,
          label: normalizeText(item?.label, fallback.label),
          href: normalizeHref(item?.href, fallback.href),
          img: normalizeImage(item?.img || item?.image, fallback.img),
          image: normalizeImage(item?.image || item?.img, fallback.img),
          type: normalizeText(item?.type, fallback.type).toLowerCase(),
          eyebrow: normalizeText(item?.eyebrow, fallback.eyebrow),
          description: normalizeText(item?.description, fallback.description),
        };
      });
    }

    return fallbackItems;
  }, [data]);

  const featured = items[0] || fallbackItems[0];
  const secondary = items.slice(1, 3);

  if (loading && !Array.isArray(data?.items)) {
    return <ShopByStyleSkeleton />;
  }

  return (
    <section
      className="site-shell mb-16 mt-16 sm:mb-20 sm:mt-20 md:mt-24"
      aria-label="Shop by style"
    >
      <div className="mb-8 text-center sm:mb-10">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl md:text-4xl">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 md:text-base md:leading-7">
          {subtitle}
        </p>
      </div>

      {!loading && error ? (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load style collections
          {error?.message ? ` (${error.message})` : ""}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[1.08fr_0.92fr]">
        <StyleCard
          item={featured}
          featured
          fallbackImage={fallbackImages[0]}
          loading={loading}
          imagePosition="center center"
        />

        <div className="grid grid-cols-1 gap-6">
          {(secondary.length > 0 ? secondary : fallbackItems.slice(1, 3)).map(
            (item, index) => (
              <StyleCard
                key={item?.id || index}
                item={item}
                fallbackImage={fallbackImages[(index + 1) % fallbackImages.length]}
                loading={loading}
                imagePosition="center center"
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default ShopByStyle;