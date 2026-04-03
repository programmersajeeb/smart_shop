import React, { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Search,
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Shirt,
  Watch,
  Gem,
  Baby,
  Gift,
  CheckCircle2,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/apiClient";

const COLLECTION_ICONS = {
  ShoppingBag,
  Shirt,
  Watch,
  Gem,
  Baby,
  Gift,
};

const DEFAULT_HIGHLIGHTS = [
  {
    id: "secure-checkout",
    title: "Secure checkout",
    description: "A smooth checkout flow from cart to order confirmation.",
    iconKey: "ShieldCheck",
  },
  {
    id: "fast-delivery",
    title: "Fast delivery",
    description: "Quick handling and a dependable order experience.",
    iconKey: "Truck",
  },
  {
    id: "easy-returns",
    title: "Easy returns",
    description: "Simple follow-up support when customers need help after purchase.",
    iconKey: "RefreshCcw",
  },
  {
    id: "easy-browsing",
    title: "Easy browsing",
    description: "A cleaner layout that helps shoppers get where they want faster.",
    iconKey: "CheckCircle2",
  },
];

const DEFAULT_WHY_ITEMS = [
  {
    id: "faster-discovery",
    text: "Browse categories faster without digging through everything at once.",
  },
  {
    id: "cleaner-layout",
    text: "A cleaner layout that feels easier to scan on desktop and mobile.",
  },
  {
    id: "mobile-friendly",
    text: "A more comfortable mobile experience with clearer spacing and tap targets.",
  },
  {
    id: "quick-filters",
    text: "Quick filters that help narrow things down right away.",
  },
];

const DEFAULT_FINAL_STATS = [
  { id: "responsive", label: "Browsing", value: "Responsive" },
  { id: "clean-ui", label: "Layout", value: "Clean UI" },
  { id: "mobile", label: "Best on", value: "Mobile" },
];

const HIGHLIGHT_ICONS = {
  ShieldCheck,
  Truck,
  RefreshCcw,
  CheckCircle2,
};

const Pill = memo(function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        active
          ? "border-black bg-black text-white shadow-sm"
          : "border-black/10 bg-white text-gray-700 hover:border-black/15 hover:bg-gray-50 hover:text-black",
      ].join(" ")}
    >
      {children}
    </button>
  );
});

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

function collectionIconFromKey(iconKey) {
  return COLLECTION_ICONS[String(iconKey || "")] || ShoppingBag;
}

function highlightIconFromKey(iconKey) {
  return HIGHLIGHT_ICONS[String(iconKey || "")] || ShieldCheck;
}

function normalizeHighlightCards(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => ({
      id: String(item?.id || "").trim(),
      title: String(item?.title || "").trim(),
      description: String(item?.description || "").trim(),
      iconKey: String(item?.iconKey || "").trim(),
    }))
    .filter((item) => item.title || item.description)
    .slice(0, 4);
}

function normalizeStatItems(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => ({
      id: String(item?.id || "").trim(),
      label: String(item?.label || "").trim(),
      value: String(item?.value || "").trim(),
      hint: String(item?.hint || "").trim(),
    }))
    .filter((item) => item.label || item.value || item.hint)
    .slice(0, 6);
}

function normalizeWhyItems(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => ({
      id: String(item?.id || "").trim(),
      text: String(item?.text || "").trim(),
    }))
    .filter((item) => item.text)
    .slice(0, 6);
}

function normalizeCollectionCards(input) {
  const list = Array.isArray(input) ? input : [];

  return list
    .map((item, index) => {
      const title = String(item?.title || "").trim();
      const slug = String(item?.slug || "").trim();
      const highlights = Array.isArray(item?.highlights)
        ? item.highlights
            .map((entry) => String(entry || "").trim())
            .filter(Boolean)
            .slice(0, 6)
        : [];

      return {
        id: String(item?.id || slug || `collection-${index + 1}`).trim(),
        key: String(item?.id || slug || title || `collection-${index + 1}`).trim(),
        title,
        slug,
        tag: String(item?.tag || "").trim(),
        badge: String(item?.badge || "").trim(),
        description: String(item?.description || "").trim(),
        image: String(item?.image || "").trim(),
        href: String(item?.href || "").trim(),
        iconKey: String(item?.iconKey || "").trim(),
        count: Number.isFinite(Number(item?.count)) ? Number(item.count) : 0,
        isActive: item?.isActive !== false,
        featured:
          item?.featured === true ||
          item?.featured === "true" ||
          item?.featured === 1 ||
          item?.featured === "1",
        sortOrder:
          Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index + 1,
        highlights,
      };
    })
    .filter((item) => item.title && item.isActive)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function normalizeShopCategories(input) {
  const list = Array.isArray(input) ? input : [];

  return list
    .map((item, index) => ({
      id: String(item?.id || item?.slug || `category-${index + 1}`).trim(),
      title: String(item?.name || "").trim(),
      slug: String(item?.slug || "").trim(),
      image: String(item?.image || "").trim(),
      iconKey: String(item?.iconKey || "").trim(),
      isActive: item?.isActive !== false,
      featured:
        item?.featured === true ||
        item?.featured === "true" ||
        item?.featured === 1 ||
        item?.featured === "1",
      sortOrder:
        Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : index + 1,
    }))
    .filter((item) => item.title && item.isActive)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function buildFallbackCollectionsFromShopCategories(categories, countMap) {
  return normalizeShopCategories(categories).map((item) => {
    const titleKey = String(item.title || "").trim().toLowerCase();
    const slugKey = String(item.slug || "").trim().toLowerCase();
    const countFromFacets = countMap.get(slugKey) ?? countMap.get(titleKey) ?? 0;

    return {
      id: item.id,
      key: item.id || item.slug || item.title.toLowerCase(),
      title: item.title,
      slug: item.slug,
      tag: item.featured ? "Featured" : "Collection",
      badge: item.featured ? "Popular now" : "",
      description: `${item.title} picks arranged in a cleaner way for easier browsing.`,
      image: resolveAssetUrl(item.image),
      href: `/shop?category=${encodeURIComponent(item.title)}`,
      icon: collectionIconFromKey(item.iconKey),
      count: countFromFacets,
      featured: Boolean(item.featured),
      highlights: item.featured
        ? ["Featured", "Popular picks", "Shop now"]
        : ["Live catalog", "Updated", "Category"],
    };
  });
}

function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  loading = "lazy",
  fallbackLabel = "Image unavailable",
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!src) {
    return (
      <div
        className={[
          "flex items-center justify-center border bg-gray-50 text-sm text-gray-500",
          className,
        ].join(" ")}
      >
        {fallbackLabel}
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      {!loaded && !failed ? (
        <div
          className={`skeleton absolute inset-0 z-10 w-full ${className} ${skeletonClassName}`}
        />
      ) : null}

      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={[
          "w-full object-cover",
          className,
          loaded && !failed ? "opacity-100" : "opacity-0",
          "transition-opacity duration-500",
        ].join(" ")}
      />

      {failed ? (
        <div
          className={[
            "absolute inset-0 flex items-center justify-center border bg-gray-50 text-sm text-gray-500",
            className,
          ].join(" ")}
        >
          {fallbackLabel}
        </div>
      ) : null}
    </div>
  );
}

const StatCard = memo(function StatCard({ icon: Icon, title, description }) {
  return (
    <div className="rounded-[26px] border border-black/5 bg-white/90 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.05)] backdrop-blur sm:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-gray-950">{title}</div>
          <div className="mt-1 text-sm leading-6 text-gray-600">{description}</div>
        </div>
      </div>
    </div>
  );
});

const CollectionCard = memo(function CollectionCard({ item }) {
  const Icon = item.icon;

  return (
    <article
      className={[
        "group relative overflow-hidden rounded-[30px] border border-black/5 bg-white",
        "shadow-[0_12px_35px_rgba(15,23,42,0.06)] transition duration-300",
        "hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(15,23,42,0.1)]",
      ].join(" ")}
    >
      <div className="relative overflow-hidden">
        <ImageWithSkeleton
          src={item.image}
          alt={item.title}
          className="h-[260px] sm:h-[300px]"
          skeletonClassName="rounded-none"
          fallbackLabel="No image added yet"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/18 to-transparent" />

        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm backdrop-blur">
            <Icon size={14} />
            {item.tag}
          </div>

          {item.badge ? (
            <div className="rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur">
              {item.badge}
            </div>
          ) : null}
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
          <div className="max-w-[92%]">
            <h3 className="text-2xl font-semibold tracking-tight text-white">
              {item.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/85">
              {item.description}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          {item.highlights.map((h, index) => (
            <span
              key={`${item.key}-highlight-${index}`}
              className="rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/5 pt-5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
              In this collection
            </div>
            <div className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-gray-950">{item.count}</span> items
            </div>
          </div>

          <Link
            to={item.href}
            className={[
              "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition",
              "bg-black text-white hover:bg-gray-900",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            ].join(" ")}
            aria-label={`Shop ${item.title}`}
          >
            Shop now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
});

function SkeletonBlock({ className = "" }) {
  return <div className={`rounded-2xl bg-gray-100 ${className}`} />;
}

function SkeletonPill({ className = "" }) {
  return <div className={`h-10 rounded-full bg-gray-100 ${className}`} />;
}

function CollectionsPageSkeleton() {
  return (
    <div className="w-full animate-pulse">
      <section className="border-b border-black/5">
        <div className="site-shell py-6 sm:py-8 lg:py-12">
          <SkeletonBlock className="mb-5 h-5 w-32 sm:w-40" />

          <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-sm sm:rounded-[32px] sm:p-6 lg:p-8">
              <SkeletonBlock className="h-8 w-32 rounded-full sm:w-40" />
              <SkeletonBlock className="mt-4 h-10 w-full max-w-[92%] sm:h-12" />
              <SkeletonBlock className="mt-3 h-10 w-full max-w-[75%] sm:h-12" />

              <div className="mt-5 space-y-3">
                <SkeletonBlock className="h-4 w-full max-w-[95%]" />
                <SkeletonBlock className="h-4 w-full max-w-[88%]" />
                <SkeletonBlock className="h-4 w-full max-w-[65%]" />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <SkeletonBlock className="h-12 w-full rounded-2xl sm:w-40" />
                <SkeletonBlock className="h-12 w-full rounded-2xl sm:w-36" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-black/5 bg-gray-50/80 p-4"
                  >
                    <SkeletonBlock className="h-3 w-20" />
                    <SkeletonBlock className="mt-3 h-8 w-16" />
                    <SkeletonBlock className="mt-3 h-4 w-full max-w-[140px]" />
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm sm:rounded-[32px]">
              <SkeletonBlock className="h-[320px] w-full sm:h-[380px] lg:h-full lg:min-h-[420px]" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-black/5 bg-white/90 p-4 shadow-sm sm:rounded-[26px] sm:p-5"
              >
                <div className="flex items-start gap-3">
                  <SkeletonBlock className="h-11 w-11 rounded-2xl" />
                  <div className="flex-1">
                    <SkeletonBlock className="h-4 w-28" />
                    <SkeletonBlock className="mt-3 h-3 w-full max-w-[180px]" />
                    <SkeletonBlock className="mt-2 h-3 w-full max-w-[150px]" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-black/5 bg-white/70">
        <div className="site-shell py-5">
          <div className="rounded-[24px] border border-black/5 bg-white p-4 shadow-sm sm:rounded-[28px] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                <SkeletonBlock className="h-4 w-32" />
                <SkeletonBlock className="mt-3 h-4 w-full max-w-[260px] sm:max-w-[340px]" />
              </div>

              <SkeletonBlock className="h-14 w-full rounded-[22px] lg:max-w-md" />
            </div>

            <div className="mt-4 flex gap-2 overflow-hidden">
              <SkeletonPill className="w-20" />
              <SkeletonPill className="w-24" />
              <SkeletonPill className="w-28" />
              <SkeletonPill className="hidden sm:block w-24" />
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-8 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 lg:py-14">
        <div className="site-shell">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <SkeletonBlock className="h-3 w-24" />
              <SkeletonBlock className="mt-3 h-8 w-48 sm:w-56" />
            </div>
            <SkeletonBlock className="h-4 w-full max-w-xl" />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm sm:rounded-[30px]"
              >
                <SkeletonBlock className="h-[240px] w-full sm:h-[280px] md:h-[300px]" />
                <div className="p-5 sm:p-6">
                  <div className="flex flex-wrap gap-2">
                    <SkeletonPill className="w-20 h-8" />
                    <SkeletonPill className="w-24 h-8" />
                    <SkeletonPill className="w-16 h-8" />
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4 border-t border-black/5 pt-5">
                    <div className="flex-1">
                      <SkeletonBlock className="h-3 w-24" />
                      <SkeletonBlock className="mt-3 h-4 w-20" />
                    </div>
                    <SkeletonBlock className="h-11 w-28 rounded-2xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-10 sm:pb-12 lg:pb-16">
        <div className="site-shell">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:rounded-[30px] sm:p-7">
              <SkeletonBlock className="h-8 w-36 rounded-full" />
              <SkeletonBlock className="mt-4 h-8 w-full max-w-[280px]" />

              <div className="mt-5 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <SkeletonBlock className="h-8 w-8 rounded-xl" />
                    <div className="flex-1">
                      <SkeletonBlock className="h-4 w-full max-w-[260px]" />
                      <SkeletonBlock className="mt-2 h-4 w-full max-w-[220px]" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-black/5 bg-[#111827] p-5 shadow-sm sm:rounded-[30px] sm:p-7 md:p-8">
              <SkeletonBlock className="h-8 w-32 rounded-full bg-white/10" />
              <SkeletonBlock className="mt-4 h-8 w-full max-w-[300px] bg-white/10" />
              <SkeletonBlock className="mt-3 h-4 w-full max-w-[420px] bg-white/10" />
              <SkeletonBlock className="mt-2 h-4 w-full max-w-[360px] bg-white/10" />

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <SkeletonBlock className="h-12 w-full rounded-2xl bg-white/10 sm:w-36" />
                <SkeletonBlock className="h-12 w-full rounded-2xl bg-white/10 sm:w-36" />
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <SkeletonBlock className="h-3 w-16 bg-white/10" />
                    <SkeletonBlock className="mt-3 h-5 w-24 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function CollectionsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");

  const {
    data: collectionsDoc,
    isLoading: collectionsLoading,
    isFetching: collectionsFetching,
  } = useQuery({
    queryKey: ["page-config", "collections"],
    queryFn: async () => (await api.get("/page-config/collections")).data,
    staleTime: 60000,
  });

  const {
    data: shopDoc,
    isLoading: shopLoading,
  } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60000,
  });

  const { data: facetsDoc, isLoading: facetsLoading } = useQuery({
    queryKey: ["products", "facets"],
    queryFn: async () => (await api.get("/products/facets")).data,
    staleTime: 60000,
  });

  const collectionsConfig = collectionsDoc?.data || {};
  const shopConfig = shopDoc?.data || {};

  const countMap = useMemo(() => {
    const map = new Map();
    const categories = Array.isArray(facetsDoc?.categories) ? facetsDoc.categories : [];

    for (const item of categories) {
      const valueKey = String(item?.value || "").trim().toLowerCase();
      const labelKey = String(item?.label || "").trim().toLowerCase();
      const count = Number(item?.count || 0);

      if (valueKey) map.set(valueKey, count);
      if (labelKey) map.set(labelKey, count);
    }

    return map;
  }, [facetsDoc?.categories]);

  const configuredCollections = useMemo(() => {
    return normalizeCollectionCards(collectionsConfig?.collectionCards).map((item) => {
      const titleKey = String(item.title || "").trim().toLowerCase();
      const slugKey = String(item.slug || "").trim().toLowerCase();
      const countFromFacets = countMap.get(slugKey) ?? countMap.get(titleKey) ?? 0;

      return {
        ...item,
        key: item.key || item.slug || item.id || item.title.toLowerCase(),
        tag: item.tag || (item.featured ? "Featured" : "Collection"),
        badge: item.badge || (item.featured ? "Popular now" : ""),
        icon: collectionIconFromKey(item.iconKey),
        image: resolveAssetUrl(item.image),
        href: item.href || `/shop?category=${encodeURIComponent(item.title)}`,
        description:
          item.description ||
          `${item.title} picks arranged in a cleaner way for easier browsing.`,
        highlights: item.highlights?.length
          ? item.highlights
          : item.featured
            ? ["Featured", "Popular picks", "Shop now"]
            : ["Live catalog", "Updated", "Category"],
        count: Number(item.count || 0) > 0 ? Number(item.count || 0) : countFromFacets,
        featured: Boolean(item.featured),
      };
    });
  }, [collectionsConfig?.collectionCards, countMap]);

  const fallbackCollections = useMemo(() => {
    return buildFallbackCollectionsFromShopCategories(shopConfig?.categories, countMap);
  }, [shopConfig?.categories, countMap]);

  const collections = useMemo(() => {
    return configuredCollections.length > 0 ? configuredCollections : fallbackCollections;
  }, [configuredCollections, fallbackCollections]);

  const heroStats = useMemo(() => {
    const source = normalizeStatItems(collectionsConfig?.hero?.statItems).slice(0, 3);
    const fallback = [
      { id: "collections", label: "Collections", value: "", hint: "Easy ways to browse" },
      { id: "products", label: "Products", value: "", hint: "Across active categories" },
      {
        id: "experience",
        label: "Experience",
        value: "Mobile first",
        hint: "Clean, quick and responsive",
      },
    ];

    const items = source.length ? source : fallback;

    return items.map((item) => {
      const labelKey = String(item.label || "").trim().toLowerCase();

      if (labelKey === "collections") {
        return {
          ...item,
          value:
            String(item.value || "").trim() && String(item.value).trim() !== "0"
              ? item.value
              : String(collections.length),
        };
      }

      if (labelKey === "products") {
        return {
          ...item,
          value:
            String(item.value || "").trim() && String(item.value).trim() !== "0"
              ? item.value
              : String(
                  collections.reduce((sum, entry) => sum + Number(entry.count || 0), 0)
                ),
        };
      }

      return item;
    });
  }, [collectionsConfig?.hero?.statItems, collections]);

  const highlightCards = useMemo(() => {
    const items = normalizeHighlightCards(collectionsConfig?.trustHighlights);
    return items.length ? items : DEFAULT_HIGHLIGHTS;
  }, [collectionsConfig?.trustHighlights]);

  const categories = useMemo(
    () => ["All", ...collections.map((item) => item.title)],
    [collections]
  );

  const featuredCollection = useMemo(
    () => collections.find((item) => item.featured) || collections[0],
    [collections]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return collections.filter((item) => {
      const matchesCategory = active === "All" || item.title === active;
      const matchesQuery =
        !query ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tag.toLowerCase().includes(query) ||
        item.badge.toLowerCase().includes(query) ||
        item.highlights.some((entry) => entry.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [collections, q, active]);

  const whyItems = useMemo(() => {
    const items = normalizeWhyItems(collectionsConfig?.whySection?.items);
    return items.length ? items : DEFAULT_WHY_ITEMS;
  }, [collectionsConfig?.whySection?.items]);

  const finalStats = useMemo(() => {
    const items = normalizeStatItems(collectionsConfig?.finalCta?.statItems).slice(0, 3);
    return items.length ? items : DEFAULT_FINAL_STATS;
  }, [collectionsConfig?.finalCta?.statItems]);

  const pageLoading =
    (collectionsLoading || shopLoading || facetsLoading) &&
    !collectionsDoc &&
    !shopDoc &&
    !facetsDoc;

  if (pageLoading) {
    return <CollectionsPageSkeleton />;
  }

  if (!featuredCollection) {
    return (
      <div className="site-shell py-16">
        <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm">
          No active collections are available right now.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <section className="relative overflow-hidden border-b border-black/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_38%,rgba(243,244,246,0.92)_100%)]" />
        <div className="absolute left-[-8rem] top-[-6rem] h-52 w-52 rounded-full bg-black/[0.03] blur-3xl" />
        <div className="absolute bottom-[-5rem] right-[-4rem] h-56 w-56 rounded-full bg-black/[0.04] blur-3xl" />

        <div className="site-shell relative py-8 sm:py-10 lg:py-12">
          <div className="breadcrumbs mb-5 text-sm">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold text-gray-900">Collections</li>
            </ul>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-stretch">
            <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white/88 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] backdrop-blur sm:p-7 lg:p-8">
              <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-700">
                {collectionsConfig?.hero?.eyebrow || "Browse collections"}
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
                {collectionsConfig?.hero?.title ||
                  "Find your next pick by browsing collections built around how people actually shop."}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-[15px]">
                {collectionsConfig?.hero?.description ||
                  "Explore curated collections, jump into the categories that matter most, and find what fits your style without extra steps."}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to={collectionsConfig?.hero?.primaryCtaHref || "/shop"}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {collectionsConfig?.hero?.primaryCtaLabel || "View all products"}{" "}
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to={collectionsConfig?.hero?.secondaryCtaHref || featuredCollection.href}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  {collectionsConfig?.hero?.secondaryCtaLabel || "Shop featured"}
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {heroStats.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-2xl border border-black/5 bg-gray-50/80 p-4"
                  >
                    <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                      {item.label}
                    </div>
                    <div className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                      {item.value || "—"}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">{item.hint}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="relative h-full min-h-[320px] sm:min-h-[380px]">
                <ImageWithSkeleton
                  src={
                    resolveAssetUrl(collectionsConfig?.hero?.featuredImage) ||
                    featuredCollection.image
                  }
                  alt={featuredCollection.title}
                  className="h-full min-h-[320px] sm:min-h-[380px]"
                  fallbackLabel="No featured image added yet"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
                  <div className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
                    {collectionsConfig?.hero?.featuredTag || "Featured collection"}
                  </div>

                  <div className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                    {collectionsConfig?.hero?.featuredBadge || featuredCollection.badge || "Popular now"}
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 lg:p-7">
                  <div className="max-w-md">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      {featuredCollection.tag}
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                      {featuredCollection.title}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-white/85">
                      {featuredCollection.description}
                    </p>

                    <Link
                      to={featuredCollection.href}
                      className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/20"
                    >
                      Shop now <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {highlightCards.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {highlightCards.map((item, index) => {
                const Icon = highlightIconFromKey(item.iconKey);
                return (
                  <StatCard
                    key={item.id || index}
                    icon={Icon}
                    title={item.title}
                    description={item.description}
                  />
                );
              })}
            </div>
          ) : null}

          {collectionsFetching ? (
            <div className="mt-4 text-xs text-gray-500">Refreshing collections…</div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="site-shell py-5">
          <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  <SlidersHorizontal size={14} />
                  {collectionsConfig?.filterPanel?.eyebrow || "Filter collections"}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  {collectionsConfig?.filterPanel?.title ||
                    "Search by category or use the quick filters below."}
                </div>
              </div>

              <div className="w-full lg:max-w-md">
                <label className="flex min-h-[56px] items-center gap-3 rounded-[22px] border border-black/10 bg-white px-4 shadow-sm transition-colors transition-shadow focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]">
                  <Search size={18} className="shrink-0 text-gray-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={
                      collectionsConfig?.filterPanel?.searchPlaceholder || "Search collections..."
                    }
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none sm:text-[15px]"
                    aria-label="Search collections"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((entry) => (
                <Pill
                  key={entry}
                  active={active === entry}
                  onClick={() => setActive(entry)}
                >
                  {entry}
                </Pill>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                {collectionsConfig?.filterPanel?.resultLabel || "Showing"}{" "}
                <span className="font-semibold text-gray-900">{filtered.length}</span>{" "}
                collection{filtered.length === 1 ? "" : "s"}
              </span>

              {(q || active !== "All") && (
                <button
                  type="button"
                  className="w-fit rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  onClick={() => {
                    setQ("");
                    setActive("All");
                  }}
                >
                  {collectionsConfig?.filterPanel?.resetLabel || "Reset filters"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-12 lg:py-14">
        <div className="site-shell">
          {filtered.length === 0 ? (
            <div className="rounded-[30px] border border-black/5 bg-white p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-10">
              <div className="mx-auto w-fit rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-600">
                No results
              </div>

              <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                {collectionsConfig?.filterPanel?.emptyTitle || "No collections found"}
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-600 sm:text-[15px]">
                {collectionsConfig?.filterPanel?.emptyDescription ||
                  "Try a different keyword or clear the filters to see everything again."}
              </p>

              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                onClick={() => {
                  setQ("");
                  setActive("All");
                }}
              >
                {collectionsConfig?.filterPanel?.resetLabel || "Reset filters"}{" "}
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    {collectionsConfig?.intro?.eyebrow || "Collections"}
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                    {collectionsConfig?.intro?.title || "Browse by category"}
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-7 text-gray-600">
                  {collectionsConfig?.intro?.description ||
                    "Pick a collection and jump straight into the products that fit what you want to shop."}
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((item) => (
                  <CollectionCard key={item.key} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="pb-10 sm:pb-12 lg:pb-16">
        <div className="site-shell">
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-7">
              <div className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-gray-700">
                {collectionsConfig?.whySection?.eyebrow || "Why shop this way"}
              </div>

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-gray-950">
                {collectionsConfig?.whySection?.title || "A simpler way to explore the store"}
              </h3>

              <div className="mt-5 space-y-4">
                {whyItems.map((item, index) => (
                  <div key={item.id || index} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-gray-50 text-gray-900">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm leading-7 text-gray-600">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-black/5 bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#1f2937_100%)] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:p-7 md:p-8">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
                {collectionsConfig?.finalCta?.eyebrow || "Start shopping"}
              </div>

              <h3 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                {collectionsConfig?.finalCta?.title || "Ready to explore more?"}
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-[15px]">
                {collectionsConfig?.finalCta?.description ||
                  "Head over to the shop page to browse all products, compare categories, and keep shopping without extra clicks."}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={collectionsConfig?.finalCta?.primaryHref || "/shop"}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                >
                  {collectionsConfig?.finalCta?.primaryLabel || "Go to shop"}{" "}
                  <ArrowRight size={17} />
                </Link>

                <Link
                  to={collectionsConfig?.finalCta?.secondaryHref || "/contact"}
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                >
                  {collectionsConfig?.finalCta?.secondaryLabel || "Contact us"}
                </Link>
              </div>

              {finalStats.length > 0 ? (
                <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {finalStats.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="rounded-2xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                        {item.label}
                      </div>
                      <div className="mt-2 text-lg font-semibold text-white">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}