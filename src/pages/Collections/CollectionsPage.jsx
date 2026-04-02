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

import menImg from "../../assets/men.png";
import womenImg from "../../assets/women.png";
import accessoriesImg from "../../assets/accessories.png";

const ICONS = { ShoppingBag, Shirt, Watch, Gem, Baby, Gift };

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

function ImageWithSkeleton({
  src,
  alt,
  className = "",
  skeletonClassName = "",
  loading = "lazy",
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

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
          Image unavailable
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
          {item.highlights.map((h) => (
            <span
              key={h}
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

function getFallbackImage(name) {
  const value = String(name || "").trim().toLowerCase();
  if (value === "women") return womenImg;
  if (value === "men") return menImg;
  if (value === "accessories") return accessoriesImg;
  return womenImg;
}

function iconFromKey(iconKey) {
  return ICONS[String(iconKey || "")] || ShoppingBag;
}

function normalizeRegistryCategories(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => ({
      id: String(item?.id || "").trim(),
      name: String(item?.name || "").trim(),
      slug: String(item?.slug || "").trim(),
      image: String(item?.image || "").trim(),
      isActive: item?.isActive !== false,
      featured: Boolean(item?.featured),
      sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : 0,
      iconKey: String(item?.iconKey || "").trim(),
    }))
    .filter((item) => item.name && item.isActive)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
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

export default function CollectionsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");

  const { data: shopCfgDoc } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60000,
  });

  const { data: facetsDoc } = useQuery({
    queryKey: ["products", "facets"],
    queryFn: async () => (await api.get("/products/facets")).data,
    staleTime: 60000,
  });

  const registryCategories = useMemo(
    () => normalizeRegistryCategories(shopCfgDoc?.data?.categories),
    [shopCfgDoc?.data?.categories]
  );

  const countMap = useMemo(() => {
    const map = new Map();
    const categories = Array.isArray(facetsDoc?.categories) ? facetsDoc.categories : [];

    for (const item of categories) {
      const key = String(item?.value || item?.label || "").trim().toLowerCase();
      if (!key) continue;
      map.set(key, Number(item?.count || 0));
    }

    return map;
  }, [facetsDoc?.categories]);

  const collections = useMemo(() => {
    return registryCategories.map((item) => ({
      key: item.slug || item.id || item.name.toLowerCase(),
      title: item.name,
      tag: item.featured ? "Featured" : "Collection",
      badge: item.featured ? "Trending" : "",
      icon: iconFromKey(item.iconKey),
      image: resolveAssetUrl(item.image) || getFallbackImage(item.name),
      href: `/shop?category=${encodeURIComponent(item.name)}`,
      description: `${item.name} collection curated from the live catalog.`,
      highlights: item.featured
        ? ["Featured", "Live catalog", "Shop now"]
        : ["Live catalog", "Updated", "Category"],
      count: countMap.get(item.name.toLowerCase()) || 0,
    }));
  }, [registryCategories, countMap]);

  const categories = useMemo(
    () => ["All", ...collections.map((item) => item.title)],
    [collections]
  );

  const featuredCollection = useMemo(
    () => collections.find((item) => item.badge) || collections[0],
    [collections]
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return collections.filter((c) => {
      const matchesCategory = active === "All" || c.title === active;

      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.tag.toLowerCase().includes(query) ||
        c.highlights.some((h) => h.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [collections, q, active]);

  if (!featuredCollection) {
    return (
      <div className="site-shell py-16">
        <div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm">
          No active collections available.
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
                Shop by collection
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
                Find what you need faster with collections made for real shopping.
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-[15px]">
                Browse by category, explore what is popular right now, and jump straight to
                the styles that match what you are looking for.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  to="/shop"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  View all products <ArrowRight size={17} />
                </Link>

                <Link
                  to={featuredCollection.href}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  Shop featured collection
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-black/5 bg-gray-50/80 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Categories
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                    {collections.length}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">Easy ways to browse</div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-gray-50/80 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Products
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                    {collections.reduce((sum, item) => sum + Number(item.count || 0), 0)}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">Across different styles</div>
                </div>

                <div className="rounded-2xl border border-black/5 bg-gray-50/80 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-400">
                    Best on
                  </div>
                  <div className="mt-2 text-2xl font-bold tracking-tight text-gray-950">
                    Mobile
                  </div>
                  <div className="mt-1 text-sm text-gray-600">Simple and easy to use</div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="relative h-full min-h-[320px] sm:min-h-[380px]">
                <ImageWithSkeleton
                  src={featuredCollection.image}
                  alt={featuredCollection.title}
                  className="h-full min-h-[320px] sm:min-h-[380px]"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute left-5 right-5 top-5 flex items-center justify-between gap-3">
                  <div className="rounded-full bg-white/92 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-sm">
                    Featured
                  </div>

                  <div className="rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
                    {featuredCollection.badge || "Featured"}
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

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={ShieldCheck}
              title="Secure checkout"
              description="Safe payment process you can trust."
            />
            <StatCard
              icon={Truck}
              title="Fast delivery"
              description="Quick order handling and smooth delivery flow."
            />
            <StatCard
              icon={RefreshCcw}
              title="Easy returns"
              description="Simple support when you need to return something."
            />
            <StatCard
              icon={CheckCircle2}
              title="Easy to browse"
              description="Collections arranged to help shoppers find things quickly."
            />
          </div>
        </div>
      </section>

      <section className="border-b border-black/5 bg-white/70 backdrop-blur">
        <div className="site-shell py-5">
          <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                  <SlidersHorizontal size={14} />
                  Filter collections
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Search by category or use the quick filters below.
                </div>
              </div>

              <div className="w-full lg:max-w-md">
                <label className="flex min-h-[56px] items-center gap-3 rounded-[22px] border border-black/10 bg-white px-4 shadow-sm transition-colors transition-shadow focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]">
                  <Search size={18} className="shrink-0 text-gray-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search collections..."
                    className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none sm:text-[15px]"
                    aria-label="Search collections"
                  />
                </label>
              </div>
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {categories.map((c) => (
                <Pill key={c} active={active === c} onClick={() => setActive(c)}>
                  {c}
                </Pill>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-2 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing{" "}
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
                  Reset filters
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
                No collections found
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-600 sm:text-[15px]">
                Try a different keyword or clear the filters to see everything again.
              </p>

              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                onClick={() => {
                  setQ("");
                  setActive("All");
                }}
              >
                Reset filters <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                    Collections
                  </div>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                    Browse by category
                  </h2>
                </div>

                <p className="max-w-xl text-sm leading-7 text-gray-600">
                  Pick a collection and jump straight into the products that fit what you
                  want to shop.
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
                Why shop this way
              </div>

              <h3 className="mt-4 text-2xl font-bold tracking-tight text-gray-950">
                A simpler way to explore the store
              </h3>

              <div className="mt-5 space-y-4">
                {[
                  "Find categories faster without scrolling through everything.",
                  "Cleaner layout that feels easier to read on any screen.",
                  "Better mobile browsing with clearer tap targets.",
                  "Quick filters to help narrow things down right away.",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-black/5 bg-gray-50 text-gray-900">
                      <CheckCircle2 size={16} />
                    </div>
                    <p className="text-sm leading-7 text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="overflow-hidden rounded-[30px] border border-black/5 bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#1f2937_100%)] p-6 text-white shadow-[0_18px_40px_rgba(15,23,42,0.14)] sm:p-7 md:p-8">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/90">
                Start shopping
              </div>

              <h3 className="mt-4 max-w-2xl text-2xl font-bold tracking-tight sm:text-3xl">
                Ready to explore more?
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/75 sm:text-[15px]">
                Head over to the shop page to see all products, browse by category, and
                continue shopping without extra steps.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/shop"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                >
                  Go to shop <ArrowRight size={17} />
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
                >
                  Contact us
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                    Easy browsing
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">Responsive</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                    Clear layout
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">Clean UI</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
                    Works best on
                  </div>
                  <div className="mt-2 text-lg font-semibold text-white">Mobile</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}