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

function normalizeItems(items, limit = 4) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) =>
      typeof item === "string"
        ? normalizeText(item)
        : {
            label: normalizeText(item?.label),
            value: normalizeText(item?.value),
          }
    )
    .filter((item) => {
      if (typeof item === "string") return Boolean(item);
      return item.label || item.value;
    })
    .slice(0, limit);
}

function BrandStorySkeleton() {
  return (
    <section
      className="site-shell mt-16 mb-16 sm:mt-20 sm:mb-20 lg:mt-24"
      aria-label="Brand story loading"
    >
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.06)] sm:rounded-[32px]">
        <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[320px] bg-[linear-gradient(135deg,#e5e7eb_0%,#f3f4f6_45%,#fafafa_100%)] lg:min-h-[560px]" />
          <div className="flex items-center">
            <div className="w-full px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-16">
              <div className="h-7 w-28 animate-pulse rounded-full bg-gray-200" />
              <div className="mt-4 h-12 max-w-2xl animate-pulse rounded-2xl bg-gray-200 md:h-14 lg:h-16" />
              <div className="mt-3 h-5 max-w-xl animate-pulse rounded-full bg-gray-100" />
              <div className="mt-3 h-5 max-w-2xl animate-pulse rounded-full bg-gray-100" />
              <div className="mt-8 flex flex-wrap gap-3">
                <div className="h-10 w-28 animate-pulse rounded-full bg-gray-100" />
                <div className="h-10 w-32 animate-pulse rounded-full bg-gray-100" />
                <div className="h-10 w-36 animate-pulse rounded-full bg-gray-100" />
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <div className="h-12 w-full animate-pulse rounded-full bg-gray-900/90 sm:w-40" />
                <div className="h-12 w-full animate-pulse rounded-full bg-gray-200 sm:w-44" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StoryVisualFallback() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_26%),linear-gradient(135deg,#ded8cf_0%,#f5f1ea_38%,#ffffff_100%)]" />
      <div className="absolute left-[9%] top-[10%] h-[32%] w-[54%] rounded-[30px] border border-white/70 bg-white/45 shadow-[0_16px_40px_rgba(15,23,42,0.08)] backdrop-blur-md" />
      <div className="absolute right-[10%] top-[22%] h-[22%] w-[28%] rounded-[22px] border border-white/70 bg-white/55 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-md" />
      <div className="absolute bottom-[12%] left-[9%] h-[18%] w-[34%] rounded-[22px] border border-white/70 bg-black/[0.04] shadow-[0_16px_36px_rgba(15,23,42,0.06)] backdrop-blur-md" />
      <div className="absolute bottom-[9%] right-[10%] h-[28%] w-[36%] rounded-[26px] border border-white/70 bg-white/65 shadow-[0_16px_36px_rgba(15,23,42,0.08)] backdrop-blur-md" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent lg:bg-gradient-to-r lg:from-black/10 lg:via-transparent lg:to-transparent" />
    </>
  );
}

function OverlayCard({ badge, text }) {
  if (!badge && !text) return null;

  return (
    <div className="max-w-xs rounded-2xl border border-white/20 bg-white/12 px-4 py-3 backdrop-blur-md">
      {badge ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90">
          {badge}
        </div>
      ) : null}
      {text ? <div className="mt-1 text-sm font-medium text-white">{text}</div> : null}
    </div>
  );
}

function BrandStory({ data, loading, error }) {
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
      data?.cta?.label ||
        data?.primaryCta?.label ||
        data?.ctaLabel,
      "Explore the catalog"
    ),
    href: normalizeHref(
      data?.cta?.href ||
        data?.primaryCta?.href ||
        data?.ctaHref,
      "/shop"
    ),
  };

  const secondaryCta = {
    label: normalizeText(data?.secondaryCta?.label, "View latest arrivals"),
    href: normalizeHref(data?.secondaryCta?.href, "/shop?sort=latest"),
  };

  const pills = useMemo(
    () =>
      normalizeItems(data?.highlights || data?.pills, 4).map((item) =>
        typeof item === "string" ? item : item.label || item.value
      ),
    [data?.highlights, data?.pills]
  );

  const stats = useMemo(
    () =>
      normalizeItems(data?.stats, 3).filter(
        (item) => typeof item !== "string" && item.label && item.value
      ),
    [data?.stats]
  );

  const overlayBadge = normalizeText(data?.featureBadge || data?.overlayBadge);
  const overlayText = normalizeText(data?.featureText || data?.overlayText);

  const hasImage = Boolean(imgSrc) && !imageFailed;
  const hasTextContent = eyebrow || title || description;

  if (loading && !data) {
    return <BrandStorySkeleton />;
  }

  return (
    <section
      className="site-shell mt-16 mb-16 sm:mt-20 sm:mb-20 lg:mt-24"
      aria-label="Brand story"
    >
      <div className="overflow-hidden rounded-[28px] border border-black/5 bg-gradient-to-br from-white via-[#faf7f2] to-[#f3f4f6] shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:rounded-[32px]">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative min-h-[320px] bg-neutral-200 lg:min-h-[560px]">
            {hasImage ? (
              <>
                <img
                  src={imgSrc}
                  alt={title || "Brand story"}
                  onError={() => {
                    setImageFailed(true);
                    setImgSrc("");
                  }}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/5 to-transparent lg:bg-gradient-to-r lg:from-black/20 lg:via-transparent lg:to-transparent" />
              </>
            ) : (
              <StoryVisualFallback />
            )}

            <div className="absolute bottom-5 left-5 right-5 lg:bottom-6 lg:left-6 lg:right-auto">
              <OverlayCard
                badge={overlayBadge || "Brand story"}
                text={
                  overlayText ||
                  "A more polished storefront experience built around trust, discovery, and stronger presentation."
                }
              />
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full px-6 py-10 md:px-10 md:py-12 lg:px-14 lg:py-16">
              {hasTextContent ? (
                <>
                  {eyebrow ? (
                    <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                      {eyebrow}
                    </div>
                  ) : null}

                  {title ? (
                    <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-gray-950 md:text-4xl lg:text-5xl">
                      {title}
                    </h2>
                  ) : null}

                  {description ? (
                    <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                      {description}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
                    Our story
                  </div>

                  <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-gray-950 md:text-4xl lg:text-5xl">
                    A premium storefront should feel thoughtful from the first glance
                  </h2>

                  <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
                    Build trust with cleaner presentation, stronger storytelling, and flexible admin-managed content that keeps your homepage refined across every device.
                  </p>
                </>
              )}

              {pills.length > 0 ? (
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  {pills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}

              {stats.length > 0 ? (
                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {stats.map((item) => (
                    <div
                      key={`${item.label}-${item.value}`}
                      className="rounded-[22px] border border-black/5 bg-white/85 px-4 py-4"
                    >
                      <div className="text-xl font-semibold text-gray-950">
                        {item.value}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-start">
                <Link
                  to={primaryCta.href}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                >
                  {primaryCta.label}
                </Link>

                <Link
                  to={secondaryCta.href}
                  className="inline-flex min-h-[50px] items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                >
                  {secondaryCta.label}
                </Link>
              </div>

              {!loading && error ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  Failed to load brand story
                  {error?.message ? ` (${error.message})` : ""}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default BrandStory;