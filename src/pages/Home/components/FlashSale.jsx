import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ProductGridSkeleton from "../../../shared/components/ui/skeletons/ProductGridSkeleton";
import api from "../../../services/apiClient";

const FALLBACK_IMAGE = "https://placehold.co/900x1100?text=Product";

function getApiOrigin() {
  try {
    const base = String(api?.defaults?.baseURL || "").trim();
    if (!base) return window.location.origin;
    return new URL(base, window.location.origin).origin;
  } catch {
    return window.location.origin;
  }
}

function resolveMediaUrl(raw) {
  const value = String(raw || "").trim();
  if (!value) return FALLBACK_IMAGE;

  if (
    /^https?:\/\//i.test(value) ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("//")) {
    return `${window.location.protocol}${value}`;
  }

  const origin = getApiOrigin();

  if (value.startsWith("/")) {
    return `${origin}${value}`;
  }

  return `${origin}/${value.replace(/^\/+/, "")}`;
}

function getPrimaryImage(product) {
  if (!product) return FALLBACK_IMAGE;

  if (typeof product.image === "string" && product.image.trim()) {
    return resolveMediaUrl(product.image);
  }

  const first = Array.isArray(product.images) ? product.images[0] : null;

  if (typeof first === "string" && first.trim()) {
    return resolveMediaUrl(first);
  }

  if (
    first &&
    typeof first === "object" &&
    typeof first.url === "string" &&
    first.url.trim()
  ) {
    return resolveMediaUrl(first.url);
  }

  return FALLBACK_IMAGE;
}

function formatMoney(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "৳0";
  return `৳${amount.toFixed(0)}`;
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

function getCountdownParts(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  return { days, hours, minutes, seconds };
}

function pad(num) {
  return String(num || 0).padStart(2, "0");
}

function FlashTimer({ startAt, endAt }) {
  const [now, setNow] = useState(Date.now());

  const start = useMemo(() => parseDate(startAt), [startAt]);
  const end = useMemo(() => parseDate(endAt), [endAt]);

  useEffect(() => {
    if (!start && !end) return;

    const id = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(id);
  }, [start, end]);

  if (!start && !end) return null;

  const nowDate = new Date(now);

  if (start && nowDate < start) {
    const diff = start.getTime() - now;
    const t = getCountdownParts(diff);

    return (
      <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-700">
          Starts soon
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { label: "Days", value: t.days },
            { label: "Hours", value: pad(t.hours) },
            { label: "Minutes", value: pad(t.minutes) },
            { label: "Seconds", value: pad(t.seconds) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-blue-100 bg-white px-3 py-3 text-center"
            >
              <div className="text-lg font-semibold text-gray-950">{item.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (end && nowDate <= end) {
    const diff = end.getTime() - now;
    const t = getCountdownParts(diff);

    return (
      <div className="rounded-[24px] border border-red-200 bg-red-50 p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-700">
          Offer ends in
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { label: "Days", value: t.days },
            { label: "Hours", value: pad(t.hours) },
            { label: "Minutes", value: pad(t.minutes) },
            { label: "Seconds", value: pad(t.seconds) },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-red-100 bg-white px-3 py-3 text-center"
            >
              <div className="text-lg font-semibold text-gray-950">{item.value}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-500">
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}

function FlashDealCard({ item }) {
  const price = Number(item?.price || 0);
  const comparePrice = Number(item?.compareAtPrice || 0);
  const discount =
    comparePrice > price
      ? Math.max(1, Math.round(((comparePrice - price) / comparePrice) * 100))
      : null;

  const inStock = Number(item?.stock ?? 0) > 0;
  const productId = String(item?._id || item?.id || "").trim();
  const href = productId
    ? `/products/${productId}`
    : `/shop?q=${encodeURIComponent(item?.title || "")}`;

  const image = getPrimaryImage(item);
  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  return (
    <Link
      to={href}
      className="group block overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-100">
        <img
          src={imgSrc}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          alt={item?.title || "Product"}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/18 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100" />

        {discount ? (
          <div className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white shadow-sm">
            -{discount}% Off
          </div>
        ) : null}

        <div className="absolute right-4 top-4">
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] shadow-sm ${
              inStock
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>

        <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 transition duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-black px-5 py-2.5 text-xs font-semibold text-white shadow-lg">
            Unlock deal
          </span>
        </div>
      </div>

      <div className="p-5">
        {item?.category ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
            {item.category}
          </p>
        ) : null}

        <h3 className="line-clamp-2 min-h-[56px] text-lg font-semibold leading-7 text-gray-950">
          {item?.title || "Untitled product"}
        </h3>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
              Deal price
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xl font-semibold text-red-600">
                {formatMoney(price)}
              </span>
              {discount ? (
                <span className="text-sm text-gray-400 line-through">
                  {formatMoney(comparePrice)}
                </span>
              ) : null}
            </div>
          </div>

          <span className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700 transition group-hover:bg-black group-hover:text-white">
            View
          </span>
        </div>
      </div>
    </Link>
  );
}

function FlashSale({ data, loading, error }) {
  const sectionTitle = normalizeText(data?.title, "Flash Sale");
  const sectionSubtitle = normalizeText(
    data?.subtitle,
    "Live discounted products with real compare-at pricing."
  );

  const cta = {
    label: normalizeText(data?.cta?.label, "Shop deals"),
    href: normalizeHref(data?.cta?.href, "/shop"),
  };

  const items = Array.isArray(data?.products) ? data.products : [];
  const startAt = data?.startAt || data?.campaign?.startAt || null;
  const endAt = data?.endAt || data?.campaign?.endAt || null;

  if (
    !loading &&
    !error &&
    (data?.enabled === false || data?.visible === false || items.length === 0)
  ) {
    return null;
  }

  return (
    <section className="container mx-auto mt-20 px-4" aria-label="Flash sale">
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">
            Limited time offer
          </div>

          <h2 className="mt-3 text-3xl font-semibold text-gray-950 md:text-4xl">
            {sectionTitle}
          </h2>

          <p className="mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
            {sectionSubtitle}
          </p>
        </div>

        <Link
          to={cta.href}
          className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {cta.label}
        </Link>
      </div>

      {(startAt || endAt) && !loading && !error ? (
        <div className="mb-6">
          <FlashTimer startAt={startAt} endAt={endAt} />
        </div>
      ) : null}

      {loading ? (
        <ProductGridSkeleton
          count={4}
          gridClassName="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          imageClassName="h-[340px]"
          showButton={true}
        />
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load flash sale products
          {error?.message ? ` (${error.message})` : ""}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, idx) => (
            <FlashDealCard key={item?._id || item?.id || idx} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

export default FlashSale;