import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const fallbackBannerImage =
  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1800&q=80";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function SeasonalBanner({ data, loading, error }) {
  const resolvedImage = normalizeText(data?.image, fallbackBannerImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const eyebrow = normalizeText(data?.eyebrow, "Seasonal edit");
  const title = normalizeText(data?.title, "Refresh your collection");
  const description = normalizeText(
    data?.description,
    "Discover curated premium styles crafted for comfort, confidence, and modern elegance."
  );

  const cta = {
    label: normalizeText(data?.cta?.label, "Shop now"),
    href: normalizeHref(data?.cta?.href, "/shop"),
  };

  return (
    <section
      className="container mx-auto px-4 py-10 sm:py-12 md:py-14 lg:py-16"
      aria-label="Seasonal banner"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-black/5 bg-neutral-200 shadow-sm sm:rounded-[28px] lg:rounded-[32px]">
        <div className="relative min-h-[300px] sm:min-h-[360px] md:min-h-[440px] lg:min-h-[500px]">
          <img
            src={imgSrc}
            alt={title || "Seasonal banner"}
            onError={() => setImgSrc(fallbackBannerImage)}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/25 sm:from-black/75 sm:via-black/40 md:to-transparent" />

          <div className="relative z-10 flex min-h-[300px] items-center sm:min-h-[360px] md:min-h-[440px] lg:min-h-[500px]">
            <div className="w-full px-5 py-8 sm:px-7 sm:py-10 md:max-w-2xl md:px-10 lg:px-14">
              <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur sm:text-[11px]">
                {eyebrow}
              </div>

              <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-5xl">
                {title}
              </h2>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                {description}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  to={cta.href}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-100 sm:w-auto"
                >
                  {cta.label}
                </Link>

                <Link
                  to="/shop?sort=latest"
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
                >
                  Explore latest
                </Link>
              </div>

              {!loading && error && (
                <div className="mt-5 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Failed to load seasonal content
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

export default SeasonalBanner;