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

function normalizePills(items) {
  const list = Array.isArray(items) ? items : [];
  return list
    .map((item) => normalizeText(typeof item === "string" ? item : item?.label))
    .filter(Boolean)
    .slice(0, 4);
}

function SeasonalBannerSkeleton() {
  return (
    <section
      className="site-shell py-10 sm:py-12 md:py-14 lg:py-16"
      aria-label="Seasonal banner loading"
    >
      <div className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.06)] sm:rounded-[28px] lg:rounded-[32px]">
        <div className="relative min-h-[300px] sm:min-h-[360px] md:min-h-[440px] lg:min-h-[500px]">
          <div className="absolute inset-0 animate-pulse bg-[linear-gradient(135deg,#e5e7eb_0%,#f3f4f6_45%,#fafafa_100%)]" />

          <div className="relative z-10 flex min-h-[300px] items-center sm:min-h-[360px] md:min-h-[440px] lg:min-h-[500px]">
            <div className="w-full px-5 py-8 sm:px-7 sm:py-10 md:max-w-2xl md:px-10 lg:px-14">
              <div className="h-7 w-28 animate-pulse rounded-full bg-white/50" />
              <div className="mt-4 h-12 max-w-xl animate-pulse rounded-2xl bg-white/50 sm:h-14 md:h-16" />
              <div className="mt-3 h-5 max-w-xl animate-pulse rounded-full bg-white/40" />
              <div className="mt-3 h-5 max-w-lg animate-pulse rounded-full bg-white/35" />

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row">
                <div className="h-12 w-full animate-pulse rounded-full bg-white/60 sm:w-36" />
                <div className="h-12 w-full animate-pulse rounded-full bg-white/25 sm:w-40" />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="h-10 w-24 animate-pulse rounded-full bg-white/30" />
                <div className="h-10 w-28 animate-pulse rounded-full bg-white/30" />
                <div className="h-10 w-32 animate-pulse rounded-full bg-white/30" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function VisualPlaceholder({ title }) {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_30%),linear-gradient(135deg,#151515_0%,#262626_35%,#4b5563_100%)]" />
      <div className="absolute inset-x-[8%] top-[12%] h-[32%] rounded-[30px] border border-white/10 bg-white/[0.08] backdrop-blur-md" />
      <div className="absolute right-[9%] top-[24%] h-[24%] w-[34%] rounded-[24px] border border-white/10 bg-white/[0.08] backdrop-blur-md" />
      <div className="absolute bottom-[12%] left-[8%] h-[20%] w-[40%] rounded-[22px] border border-white/10 bg-white/[0.08] backdrop-blur-md" />
      <div className="absolute bottom-[10%] right-[9%] h-[16%] w-[26%] rounded-[20px] border border-white/10 bg-white/[0.08] backdrop-blur-md" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10 sm:from-black/68 sm:via-black/30 md:to-transparent" />

      <div className="absolute right-4 top-4 hidden rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/90 backdrop-blur md:inline-flex">
        Curated seasonal edit
      </div>

      {!title ? null : (
        <div className="absolute bottom-5 right-5 hidden max-w-[280px] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/90 backdrop-blur md:block">
          Designed to keep the seasonal spotlight elegant, flexible, and easy to manage from your admin panel.
        </div>
      )}
    </>
  );
}

function GlassInfoCard({ badge, text }) {
  if (!badge && !text) return null;

  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
      {badge ? (
        <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/85 sm:text-[11px]">
          {badge}
        </div>
      ) : null}
      {text ? (
        <div className="mt-1 text-sm font-medium leading-5 text-white">
          {text}
        </div>
      ) : null}
    </div>
  );
}

function SeasonalBanner({ data, loading, error }) {
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
      "Shop now"
    ),
    href: normalizeHref(
      data?.cta?.href ||
        data?.primaryCta?.href ||
        data?.ctaHref,
      "/shop"
    ),
  };

  const secondaryCta = {
    label: normalizeText(
      data?.secondaryCta?.label,
      "Explore latest"
    ),
    href: normalizeHref(
      data?.secondaryCta?.href,
      "/shop?sort=latest"
    ),
  };

  const pills = useMemo(() => normalizePills(data?.highlights || data?.pills), [
    data?.highlights,
    data?.pills,
  ]);

  const infoBadge = normalizeText(data?.featureBadge || data?.infoBadge);
  const infoText = normalizeText(data?.featureText || data?.infoText);

  const hasImage = Boolean(imgSrc) && !imageFailed;
  const hasTopContent = eyebrow || title || description;

  if (loading && !data) {
    return <SeasonalBannerSkeleton />;
  }

  return (
    <section
      className="site-shell py-10 sm:py-12 md:py-14 lg:py-16"
      aria-label="Seasonal banner"
    >
      <div className="relative overflow-hidden rounded-[24px] border border-black/5 bg-neutral-950 shadow-[0_22px_60px_rgba(15,23,42,0.14)] sm:rounded-[28px] lg:rounded-[32px]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="relative min-h-[320px] sm:min-h-[380px] md:min-h-[460px] lg:min-h-[520px]">
          {hasImage ? (
            <>
              <img
                src={imgSrc}
                alt={title || "Seasonal banner"}
                onError={() => {
                  setImageFailed(true);
                  setImgSrc("");
                }}
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20 sm:from-black/75 sm:via-black/42 md:to-transparent" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_28%)]" />
            </>
          ) : (
            <VisualPlaceholder title={title} />
          )}

          <div className="relative z-10 flex min-h-[320px] items-center sm:min-h-[380px] md:min-h-[460px] lg:min-h-[520px]">
            <div className="w-full px-5 py-8 sm:px-7 sm:py-10 md:max-w-2xl md:px-10 lg:px-14">
              {hasTopContent ? (
                <>
                  {eyebrow ? (
                    <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur sm:text-[11px]">
                      {eyebrow}
                    </div>
                  ) : null}

                  {title ? (
                    <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-5xl">
                      {title}
                    </h2>
                  ) : null}

                  {description ? (
                    <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                      {description}
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <div className="inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white backdrop-blur sm:text-[11px]">
                    Seasonal spotlight
                  </div>

                  <h2 className="mt-4 max-w-xl text-2xl font-semibold leading-tight text-white sm:text-3xl md:text-5xl">
                    Refresh the storefront with a more elevated seasonal story
                  </h2>

                  <p className="mt-4 max-w-xl text-sm leading-6 text-white/85 sm:text-base sm:leading-7">
                    Bring campaign content, image, and calls to action together in one polished section that feels premium across mobile and desktop.
                  </p>
                </>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center">
                <Link
                  to={primaryCta.href}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-gray-950 transition hover:bg-gray-100 sm:w-auto"
                >
                  {primaryCta.label}
                </Link>

                <Link
                  to={secondaryCta.href}
                  className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 sm:w-auto"
                >
                  {secondaryCta.label}
                </Link>
              </div>

              {pills.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-2.5 sm:mt-7 sm:gap-3">
                  {pills.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-medium text-white/90 backdrop-blur sm:text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}

              {!loading && error ? (
                <div className="mt-5 rounded-2xl border border-red-300/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  Failed to load seasonal content
                  {error?.message ? ` (${error.message})` : ""}
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-10 sm:bottom-4 sm:left-4 sm:right-4 md:bottom-5 md:left-auto md:right-5 md:w-[320px]">
            <GlassInfoCard badge={infoBadge} text={infoText} />
          </div>
        </div>
      </div>
    </section>
  );
}

export default SeasonalBanner;