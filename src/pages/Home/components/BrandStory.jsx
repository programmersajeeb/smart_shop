import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const fallbackImage =
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1400&q=80";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function BrandStory({ data, loading, error }) {
  const resolvedImage = normalizeText(data?.image, fallbackImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const eyebrow = normalizeText(data?.eyebrow, "Our story");
  const title = normalizeText(
    data?.title,
    "Built for a smarter modern shopping experience"
  );
  const description = normalizeText(
    data?.description,
    "Smart Shop was founded with a simple idea: to bring premium products closer to everyone through a cleaner, more trustworthy, and more elegant digital shopping experience."
  );

  const cta = {
    label: normalizeText(data?.cta?.label, "Explore the catalog"),
    href: normalizeHref(data?.cta?.href, "/shop"),
  };

  return (
    <section className="site-shell mt-24 mb-20" aria-label="Brand story">
      <div className="overflow-hidden rounded-[32px] border border-black/5 bg-gradient-to-br from-white via-[#faf7f2] to-[#f3f4f6] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[320px] bg-neutral-200 lg:min-h-[560px]">
            <img
              src={imgSrc}
              alt={title || "Brand story"}
              onError={() => setImgSrc(fallbackImage)}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent lg:bg-gradient-to-r lg:from-black/20 lg:via-transparent lg:to-transparent" />

            <div className="absolute bottom-5 left-5 right-5 lg:bottom-6 lg:left-6 lg:right-auto">
              <div className="max-w-xs rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
                  Smart retail
                </div>
                <div className="mt-1 text-sm font-medium text-white">
                  Designed to make discovery, trust, and conversion feel more seamless
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-16">
              <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                {eyebrow}
              </div>

              <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-gray-950 md:text-4xl lg:text-5xl">
                {title}
              </h2>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                {description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5">
                  Curated catalog
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5">
                  Cleaner discovery
                </span>
                <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5">
                  Premium storefront
                </span>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-start">
                <Link
                  to={cta.href}
                  className="inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                >
                  {cta.label}
                </Link>

                <Link
                  to="/shop?sort=latest"
                  className="inline-flex items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  View latest arrivals
                </Link>
              </div>

              {!loading && error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load brand story
                  {error?.message ? ` (${error.message})` : ""}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandStory;