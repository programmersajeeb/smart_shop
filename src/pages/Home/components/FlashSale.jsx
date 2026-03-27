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

function buildComparePrice(price) {
  const amount = Number(price || 0);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 1.25);
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function FlashDealCard({ item }) {
  const price = Number(item?.price || 0);
  const comparePrice = buildComparePrice(price);
  const discount =
    comparePrice && comparePrice > price
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
              {comparePrice ? (
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
  const saleEnd = useMemo(() => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
  }, []);

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const diff = saleEnd - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return false;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
      return true;
    };

    updateCountdown();

    const timer = setInterval(() => {
      const active = updateCountdown();
      if (!active) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [saleEnd]);

  const sectionTitle = normalizeText(data?.title, "Flash Sale");
  const sectionSubtitle = normalizeText(
    data?.subtitle,
    "Limited-time picks from your value-focused in-stock catalog."
  );

  const cta = {
    label: normalizeText(data?.cta?.label, "Shop deals"),
    href: normalizeHref(data?.cta?.href, "/shop"),
  };

  const items = Array.isArray(data?.products) ? data.products.slice(0, 4) : [];

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

        <div className="flex flex-wrap items-center gap-3">
          {[
            { label: "Hours", value: timeLeft.hours },
            { label: "Minutes", value: timeLeft.minutes },
            { label: "Seconds", value: timeLeft.seconds },
          ].map((item) => (
            <div
              key={item.label}
              className="min-w-[82px] rounded-2xl border border-black/10 bg-white px-4 py-3 text-center shadow-sm"
            >
              <p className="text-xl font-semibold text-gray-950">
                {String(item.value).padStart(2, "0")}
              </p>
              <span className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                {item.label}
              </span>
            </div>
          ))}

          <Link
            to={cta.href}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            {cta.label}
          </Link>
        </div>
      </div>

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
          {items.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-dashed border-black/10 px-6 py-12 text-center">
              <p className="text-base font-medium text-gray-800">
                No flash sale items available right now.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Check the shop for the latest in-stock offers.
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <FlashDealCard
                key={item?._id || item?.id || idx}
                item={item}
              />
            ))
          )}
        </div>
      )}
    </section>
  );
}

export default FlashSale;