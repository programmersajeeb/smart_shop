import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const fallbackHeroImage =
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=1600&auto=format&fit=crop";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function normalizeStats(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      label: normalizeText(item?.label),
      value: normalizeText(item?.value, "--"),
    }))
    .filter((item) => item.label)
    .slice(0, 3);
}

export default function HeroBanner({ data, loading, error }) {
  const resolvedImage = normalizeText(data?.image, fallbackHeroImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const eyebrow = normalizeText(data?.eyebrow, "New arrivals");
  const title = normalizeText(
    data?.title,
    "Elevate your everyday wardrobe with refined essentials"
  );
  const description = normalizeText(
    data?.description,
    "Discover premium pieces curated for comfort, confidence, and a more polished modern look."
  );

  const primaryCta = {
    label: normalizeText(data?.primaryCta?.label, "Shop collection"),
    href: normalizeHref(data?.primaryCta?.href, "/shop"),
  };

  const secondaryCta = {
    label: normalizeText(data?.secondaryCta?.label, "Explore latest"),
    href: normalizeHref(data?.secondaryCta?.href, "/shop?sort=latest"),
  };

  const stats = useMemo(() => normalizeStats(data?.stats), [data?.stats]);

  return (
    <section
      className="container mx-auto px-4 py-4 sm:py-6 md:py-8"
      aria-label="Hero banner"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-black/5 bg-gradient-to-br from-[#f7f1ea] via-[#f7f4ef] to-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[28px] lg:rounded-[32px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(17,24,39,0.06),transparent_28%)]" />

        <div className="grid grid-cols-1 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="relative z-10 order-1 flex flex-col justify-center px-5 py-8 sm:px-7 sm:py-10 md:px-10 md:py-12 lg:px-14 lg:py-14 xl:px-16">
            <div className="mb-4 inline-flex items-center gap-2">
              <span className="inline-flex rounded-full border border-black/10 bg-white/80 px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-600 backdrop-blur sm:px-4 sm:text-[11px]">
                {eyebrow}
              </span>
            </div>

            <h1 className="max-w-2xl text-[2rem] font-semibold leading-[1.02] tracking-tight text-gray-950 sm:text-[2.6rem] md:text-5xl lg:text-[3.4rem] xl:text-[4rem]">
              {title}
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
              {description}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to={primaryCta.href}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                {primaryCta.label}
              </Link>

              <Link
                to={secondaryCta.href}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-black/10 bg-white/85 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                {secondaryCta.label}
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-2.5 text-sm text-gray-600 sm:mt-8 sm:gap-3">
              <span className="rounded-full bg-white/80 px-3.5 py-2 ring-1 ring-black/5">
                Premium catalog
              </span>
              <span className="rounded-full bg-white/80 px-3.5 py-2 ring-1 ring-black/5">
                Curated discovery
              </span>
              <span className="rounded-full bg-white/80 px-3.5 py-2 ring-1 ring-black/5">
                Modern storefront
              </span>
            </div>

            {stats.length > 0 && (
              <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
                {stats.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="rounded-2xl border border-black/5 bg-white/75 px-4 py-4 backdrop-blur"
                  >
                    <div className="text-xl font-semibold text-gray-950 sm:text-2xl">
                      {item.value || "--"}
                    </div>
                    <div className="mt-1 text-xs text-gray-600 sm:text-sm">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && error && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load hero content
                {error?.message ? ` (${error.message})` : ""}
              </div>
            )}
          </div>

          <div className="relative order-2 min-h-[280px] sm:min-h-[340px] md:min-h-[420px] lg:min-h-full">
            <div className="absolute inset-0 p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="relative h-full w-full overflow-hidden rounded-[20px] bg-neutral-200 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:rounded-[24px] lg:rounded-[28px]">
                <img
                  src={imgSrc}
                  alt={title || "Hero banner image"}
                  onError={() => setImgSrc(fallbackHeroImage)}
                  loading="eager"
                  fetchPriority="high"
                  width="1200"
                  height="1200"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent" />

                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-5 md:left-5 md:max-w-xs">
                  <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-md">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 sm:text-[11px]">
                      Featured edit
                    </div>
                    <div className="mt-1 text-sm font-medium leading-5 text-white">
                      Curated seasonal picks for a more elevated shopping
                      experience
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}