import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../../services/apiClient";

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

function normalizeImage(value) {
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
    if (typeof value.src === "string" && value.src.trim()) {
      return resolveAssetUrl(value.src.trim());
    }
  }

  return "";
}

function normalizeStats(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => ({
      label: normalizeText(item?.label),
      value: normalizeText(item?.value),
    }))
    .filter((item) => item.label && item.value)
    .slice(0, 3);
}

function normalizeHighlights(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => normalizeText(typeof item === "string" ? item : item?.label))
    .filter(Boolean)
    .slice(0, 4);
}

function HeroBannerSkeleton() {
  return (
    <section className="site-shell py-4 sm:py-6 md:py-8" aria-label="Hero banner loading">
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.06)] sm:rounded-[30px] lg:rounded-[36px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="px-5 py-8 sm:px-7 sm:py-10 md:px-10 md:py-12 lg:px-14 lg:py-14 xl:px-16">
            <div className="h-8 w-28 animate-pulse rounded-full bg-gray-200" />
            <div className="mt-5 h-12 max-w-xl animate-pulse rounded-2xl bg-gray-200 sm:h-14 md:h-16" />
            <div className="mt-3 h-12 max-w-lg animate-pulse rounded-2xl bg-gray-100 sm:h-14" />
            <div className="mt-6 h-5 max-w-2xl animate-pulse rounded-full bg-gray-100" />
            <div className="mt-3 h-5 max-w-xl animate-pulse rounded-full bg-gray-100" />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="h-12 w-full animate-pulse rounded-full bg-gray-900/90 sm:w-44" />
              <div className="h-12 w-full animate-pulse rounded-full bg-gray-200 sm:w-40" />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <div className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
              <div className="h-10 w-32 animate-pulse rounded-full bg-gray-100" />
              <div className="h-10 w-36 animate-pulse rounded-full bg-gray-100" />
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
              <div className="h-24 animate-pulse rounded-[22px] bg-gray-100" />
              <div className="h-24 animate-pulse rounded-[22px] bg-gray-100" />
              <div className="hidden h-24 animate-pulse rounded-[22px] bg-gray-100 sm:block" />
            </div>
          </div>

          <div className="relative min-h-[320px] sm:min-h-[360px] md:min-h-[430px] lg:min-h-full">
            <div className="absolute inset-0 p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="h-full w-full animate-pulse rounded-[22px] bg-[linear-gradient(135deg,#e5e7eb_0%,#f3f4f6_45%,#fafafa_100%)] sm:rounded-[26px] lg:rounded-[30px]" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function HeroBanner({ data, loading, error }) {
  const resolvedImage = normalizeImage(data?.image);
  const [imgSrc, setImgSrc] = useState(resolvedImage);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImgSrc(resolvedImage);
    setImageFailed(false);
  }, [resolvedImage]);

  const eyebrow = normalizeText(data?.eyebrow);
  const title = normalizeText(data?.title);
  const description = normalizeText(data?.description);

  const primaryCta = {
    label: normalizeText(
      data?.primaryCta?.label || data?.primaryCtaLabel,
      "Shop now"
    ),
    href: normalizeHref(
      data?.primaryCta?.href || data?.primaryCtaHref,
      "/shop"
    ),
  };

  const secondaryCta = {
    label: normalizeText(
      data?.secondaryCta?.label || data?.secondaryCtaLabel,
      "Discover more"
    ),
    href: normalizeHref(
      data?.secondaryCta?.href || data?.secondaryCtaHref,
      "/collections"
    ),
  };

  const stats = useMemo(() => normalizeStats(data?.stats), [data?.stats]);
  const highlights = useMemo(() => normalizeHighlights(data?.highlights), [data?.highlights]);

  const featureBadge = normalizeText(data?.featureBadge);
  const featureText = normalizeText(data?.featureText);

  const hasImage = Boolean(imgSrc) && !imageFailed;
  const hasTopContent = eyebrow || title || description;
  const hasFeatureCard = featureBadge || featureText;

  if (loading && !data) {
    return <HeroBannerSkeleton />;
  }

  return (
    <section className="site-shell py-4 sm:py-6 md:py-8" aria-label="Hero banner">
      <div className="relative overflow-hidden rounded-[28px] border border-black/5 bg-[linear-gradient(135deg,#f8f5f0_0%,#fbfaf8_42%,#ffffff_100%)] shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:rounded-[30px] lg:rounded-[36px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(17,24,39,0.06),transparent_28%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-black/10 to-transparent" />

        <div className="grid grid-cols-1 lg:grid-cols-[1.04fr_0.96fr]">
          <div className="relative z-10 order-1 flex flex-col justify-center px-5 py-8 sm:px-7 sm:py-10 md:px-10 md:py-12 lg:px-14 lg:py-14 xl:px-16">
            {hasTopContent ? (
              <>
                {eyebrow && (
                  <div className="mb-4 inline-flex items-center gap-2">
                    <span className="inline-flex rounded-full border border-black/10 bg-white/90 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-600 backdrop-blur sm:text-[11px]">
                      {eyebrow}
                    </span>
                  </div>
                )}

                {title && (
                  <h1 className="max-w-2xl text-[2rem] font-semibold leading-[1.02] tracking-tight text-gray-950 sm:text-[2.7rem] md:text-5xl lg:text-[3.45rem] xl:text-[4rem]">
                    {title}
                  </h1>
                )}

                {description && (
                  <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:mt-5 sm:text-base sm:leading-7 md:text-lg">
                    {description}
                  </p>
                )}
              </>
            ) : (
              <div className="max-w-2xl">
                <div className="inline-flex rounded-full border border-black/10 bg-white/90 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-gray-500 sm:text-[11px]">
                  Premium storefront
                </div>
                <h1 className="mt-4 text-[2rem] font-semibold leading-[1.02] tracking-tight text-gray-950 sm:text-[2.7rem] md:text-5xl lg:text-[3.45rem] xl:text-[4rem]">
                  A refined shopping experience shaped by live storefront content
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600 sm:text-base sm:leading-7 md:text-lg">
                  Connect hero content from your admin dashboard to keep the first impression fresh, polished, and fully manageable.
                </p>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
              <Link
                to={primaryCta.href}
                className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                {primaryCta.label}
              </Link>

              <Link
                to={secondaryCta.href}
                className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-black/10 bg-white/90 px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                {secondaryCta.label}
              </Link>
            </div>

            {highlights.length > 0 && (
              <div className="mt-7 flex flex-wrap items-center gap-2.5 text-sm text-gray-600 sm:mt-8 sm:gap-3">
                {highlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white/88 px-3.5 py-2 ring-1 ring-black/5"
                  >
                    {item}
                  </span>
                ))}
              </div>
            )}

            {stats.length > 0 && (
              <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:grid-cols-3 sm:gap-4">
                {stats.map((item, idx) => (
                  <div
                    key={`${item.label}-${idx}`}
                    className="rounded-[22px] border border-black/5 bg-white/82 px-4 py-4 backdrop-blur"
                  >
                    <div className="text-xl font-semibold text-gray-950 sm:text-2xl">
                      {item.value}
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

          <div className="relative order-2 min-h-[320px] sm:min-h-[360px] md:min-h-[430px] lg:min-h-full">
            <div className="absolute inset-0 p-3 sm:p-4 md:p-5 lg:p-6">
              <div className="relative h-full w-full overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,#e7e5e4_0%,#f5f5f4_38%,#fafaf9_100%)] shadow-[0_18px_44px_rgba(15,23,42,0.12)] sm:rounded-[26px] lg:rounded-[30px]">
                {hasImage ? (
                  <>
                    <img
                      src={imgSrc}
                      alt={title || "Hero banner image"}
                      onError={() => {
                        setImageFailed(true);
                        setImgSrc("");
                      }}
                      loading="eager"
                      fetchPriority="high"
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-black/10 to-transparent" />
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),transparent_30%),linear-gradient(135deg,#d6d3d1_0%,#f5f5f4_48%,#ffffff_100%)]" />
                    <div className="absolute inset-x-[9%] top-[10%] h-[38%] rounded-[28px] border border-white/70 bg-white/50 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur-md" />
                    <div className="absolute right-[10%] top-[23%] h-[30%] w-[36%] rounded-[24px] border border-white/80 bg-white/60 shadow-[0_18px_40px_rgba(15,23,42,0.08)] backdrop-blur-md" />
                    <div className="absolute bottom-[10%] left-[8%] h-[26%] w-[42%] rounded-[24px] border border-white/80 bg-black/[0.03] shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur-md" />
                    <div className="absolute bottom-[13%] right-[9%] h-[18%] w-[26%] rounded-[20px] border border-white/70 bg-white/70 shadow-[0_16px_36px_rgba(15,23,42,0.07)] backdrop-blur-md" />

                    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/10 to-transparent" />

                    <div className="absolute left-5 top-5 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gray-600 shadow-sm backdrop-blur-md sm:left-6 sm:top-6 sm:text-[11px]">
                      Premium visual
                    </div>
                  </>
                )}

                {hasFeatureCard && (
                  <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-5 md:left-5 md:max-w-xs">
                    <div className="rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-md">
                      {featureBadge && (
                        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 sm:text-[11px]">
                          {featureBadge}
                        </div>
                      )}
                      {featureText && (
                        <div className="mt-1 text-sm font-medium leading-5 text-white">
                          {featureText}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}