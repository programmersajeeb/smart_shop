import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Home,
  SlidersHorizontal,
  Shirt,
  ShoppingBag,
  Watch,
  Gem,
  Baby,
  Gift,
  ChevronDown,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/apiClient";

import ProductGridSkeleton from "../../shared/components/ui/skeletons/ProductGridSkeleton";
import SidebarFiltersSkeleton from "../../shared/components/ui/skeletons/SidebarFiltersSkeleton";

const ICONS = { ShoppingBag, Shirt, Watch, Gem, Baby, Gift };
const DEFAULT_PAGE_SIZE = 12;
const DEFAULT_SLIDER_MAX = 5000;
const FALLBACK_IMAGE = "https://placehold.co/800x800?text=Product";

function iconFromKey(iconKey) {
  return ICONS[String(iconKey || "")] || ShoppingBag;
}

function resolveAssetUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) return "";

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

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

function normalizeSortFromUrl(value, fallback = "newest") {
  const v = String(value || "").trim().toLowerCase();
  if (v === "price_asc" || v === "pricelow" || v === "pricelowtohigh") return "priceLow";
  if (v === "price_desc" || v === "pricehigh" || v === "pricehightolow") return "priceHigh";
  if (v === "latest" || v === "newest") return "newest";

  const safeFallback = String(fallback || "").trim();
  return safeFallback === "priceLow" || safeFallback === "priceHigh" || safeFallback === "newest"
    ? safeFallback
    : "newest";
}

function getPrimaryImage(product) {
  const first = Array.isArray(product?.images) ? product.images[0] : null;

  if (typeof first === "string" && first.trim()) {
    return resolveAssetUrl(first.trim());
  }

  if (
    first &&
    typeof first === "object" &&
    typeof first.url === "string" &&
    first.url.trim()
  ) {
    return resolveAssetUrl(first.url.trim());
  }

  if (typeof product?.image === "string" && product.image.trim()) {
    return resolveAssetUrl(product.image.trim());
  }

  return FALLBACK_IMAGE;
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "৳0";
  return `৳${amount.toFixed(0)}`;
}

function normalizeFacetOptions(input) {
  const list = Array.isArray(input) ? input : [];
  const out = [];
  const seen = new Set();

  for (const item of list) {
    if (typeof item === "string") {
      const value = item.trim();
      if (!value) continue;

      const key = value.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        value,
        label: value,
        count: null,
      });
      continue;
    }

    if (item && typeof item === "object") {
      const rawValue = String(item.value ?? item.label ?? "").trim();
      if (!rawValue) continue;

      const key = rawValue.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      out.push({
        value: rawValue,
        label: String(item.label ?? rawValue).trim() || rawValue,
        count:
          Number.isFinite(Number(item.count)) && Number(item.count) >= 0
            ? Number(item.count)
            : null,
      });
    }
  }

  return out;
}

function parseBooleanParam(value) {
  const v = String(value || "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function parsePositivePage(value) {
  const page = Number(value || 1);
  return Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
}

function parsePriceParam(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function parseStateFromParams(searchParams, fallbackSort = "newest") {
  return {
    category: searchParams.get("category") || "All",
    brand: searchParams.get("brand") || "",
    inStockOnly: parseBooleanParam(searchParams.get("inStock")),
    maxPrice: parsePriceParam(searchParams.get("priceMax")),
    search: searchParams.get("q") || searchParams.get("search") || "",
    sortBy: normalizeSortFromUrl(searchParams.get("sort"), fallbackSort),
    page: parsePositivePage(searchParams.get("page")),
  };
}

function buildSearchParams({
  category,
  brand,
  inStockOnly,
  maxPrice,
  search,
  sortBy,
  page,
  sliderMax,
}) {
  const next = new URLSearchParams();

  if (search) next.set("q", search);
  if (category && category !== "All") next.set("category", category);
  if (brand) next.set("brand", brand);
  if (inStockOnly) next.set("inStock", "true");

  if (
    maxPrice != null &&
    Number.isFinite(maxPrice) &&
    maxPrice >= 0 &&
    Number.isFinite(sliderMax) &&
    maxPrice < sliderMax
  ) {
    next.set("priceMax", String(Math.round(maxPrice)));
  }

  if (sortBy === "priceLow") next.set("sort", "price_asc");
  else if (sortBy === "priceHigh") next.set("sort", "price_desc");
  else next.set("sort", "latest");

  if (page > 1) next.set("page", String(page));

  return next;
}

function getVisiblePages(current, total) {
  if (total <= 1) return [1];

  const pages = new Set([1, total, current, current - 1, current + 1]);

  if (current <= 2) {
    pages.add(2);
    pages.add(3);
  }

  if (current >= total - 1) {
    pages.add(total - 1);
    pages.add(total - 2);
  }

  return Array.from(pages)
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
}

function getResultsRange(page, pageSize, total, count) {
  if (!total || !count) return { start: 0, end: 0 };
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(total, start + count - 1);
  return { start, end };
}

function getErrorMessage(...errors) {
  for (const error of errors) {
    const message =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.message;
    if (message) return String(message);
  }
  return "Failed to load products or filters.";
}

function normalizeMaxPriceValue(value, sliderMax) {
  const next = Number(value);
  if (!Number.isFinite(next)) return null;

  const rounded = Math.max(0, Math.min(Math.round(next), Math.max(1, sliderMax)));
  return rounded >= sliderMax ? null : rounded;
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchParamsKey = searchParams.toString();

  const {
    data: shopCfg,
    isPending: shopCfgPending,
    isError: shopCfgError,
    error: shopCfgErrorData,
  } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60_000,
  });

  const cfg = shopCfg?.data || {};
  const defaultSort = normalizeSortFromUrl(cfg?.defaultSort, "newest");

  const urlState = useMemo(
    () => parseStateFromParams(searchParams, defaultSort),
    [searchParamsKey, searchParams, defaultSort]
  );

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [category, setCategory] = useState(urlState.category);
  const [brand, setBrand] = useState(urlState.brand);
  const [inStockOnly, setInStockOnly] = useState(urlState.inStockOnly);
  const [maxPrice, setMaxPrice] = useState(urlState.maxPrice);
  const [searchInput, setSearchInput] = useState(urlState.search);
  const [search, setSearch] = useState(urlState.search);
  const [sortBy, setSortBy] = useState(urlState.sortBy);
  const [page, setPage] = useState(urlState.page);

  const [draftCategory, setDraftCategory] = useState(urlState.category);
  const [draftBrand, setDraftBrand] = useState(urlState.brand);
  const [draftInStockOnly, setDraftInStockOnly] = useState(urlState.inStockOnly);
  const [draftMaxPrice, setDraftMaxPrice] = useState(urlState.maxPrice);

  useEffect(() => {
    setCategory(urlState.category);
    setBrand(urlState.brand);
    setInStockOnly(urlState.inStockOnly);
    setMaxPrice(urlState.maxPrice);
    setSearchInput(urlState.search);
    setSearch(urlState.search);
    setSortBy(urlState.sortBy);
    setPage(urlState.page);

    setDraftCategory(urlState.category);
    setDraftBrand(urlState.brand);
    setDraftInStockOnly(urlState.inStockOnly);
    setDraftMaxPrice(urlState.maxPrice);
  }, [
    urlState.category,
    urlState.brand,
    urlState.inStockOnly,
    urlState.maxPrice,
    urlState.search,
    urlState.sortBy,
    urlState.page,
  ]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = searchInput.trim();
      setSearch((prev) => {
        if (prev === next) return prev;
        setPage(1);
        return next;
      });
    }, 350);

    return () => window.clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    if (!mobileFilterOpen) return;

    setDraftCategory(category);
    setDraftBrand(brand);
    setDraftInStockOnly(inStockOnly);
    setDraftMaxPrice(maxPrice);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileFilterOpen, category, brand, inStockOnly, maxPrice]);

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === "Escape") {
        setMobileFilterOpen(false);
      }
    }

    if (mobileFilterOpen) {
      document.addEventListener("keydown", handleKeydown);
    }

    return () => document.removeEventListener("keydown", handleKeydown);
  }, [mobileFilterOpen]);

  const {
    data: facets,
    isPending: facetsPending,
    isError: facetsError,
    error: facetsErrorData,
  } = useQuery({
    queryKey: ["products", "facets"],
    queryFn: async () => (await api.get("/products/facets")).data,
    staleTime: 60_000,
  });

  const facetBrandsAll = useMemo(
    () => normalizeFacetOptions(facets?.brands),
    [facets?.brands]
  );

  const facetCategoriesAll = useMemo(
    () => normalizeFacetOptions(facets?.categories),
    [facets?.categories]
  );

  const facetPriceMax = Number(facets?.price?.max ?? 0);

  const allowedBrands = Array.isArray(cfg?.brands) ? cfg.brands : [];
  const facetBrands = useMemo(() => {
    if (!allowedBrands.length) return facetBrandsAll;

    const allowed = new Set(
      allowedBrands.map((b) => String(b || "").trim().toLowerCase()).filter(Boolean)
    );

    return facetBrandsAll.filter((brandItem) =>
      allowed.has(String(brandItem.value || "").trim().toLowerCase())
    );
  }, [facetBrandsAll, allowedBrands]);

  const sliderMax = useMemo(() => {
    const cfgMax = Number(cfg?.priceMax ?? 0);
    if (Number.isFinite(cfgMax) && cfgMax > 0) return Math.round(cfgMax);
    if (Number.isFinite(facetPriceMax) && facetPriceMax > 0) {
      return Math.round(facetPriceMax);
    }
    return DEFAULT_SLIDER_MAX;
  }, [cfg?.priceMax, facetPriceMax]);

  useEffect(() => {
    setMaxPrice((prev) => {
      if (prev == null) return prev;
      return Math.min(prev, sliderMax);
    });

    setDraftMaxPrice((prev) => {
      if (prev == null) return prev;
      return Math.min(prev, sliderMax);
    });
  }, [sliderMax]);

  const categoryPills = useMemo(() => {
    const configCategories = Array.isArray(cfg?.categories) ? cfg.categories : [];
    const source =
      configCategories.length > 0
        ? configCategories.map((item) => ({
            name: String(item?.name || "").trim(),
            icon: iconFromKey(item?.iconKey),
          }))
        : facetCategoriesAll.map((item) => ({
            name: String(item?.value || "").trim(),
            icon: ShoppingBag,
          }));

    const seen = new Set();
    const unique = [];

    for (const item of source) {
      if (!item.name) continue;
      const key = item.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(item);
    }

    return [{ name: "All", icon: ShoppingBag }, ...unique];
  }, [cfg?.categories, facetCategoriesAll]);

  const params = useMemo(() => {
    const apiSort =
      sortBy === "priceLow"
        ? "price_asc"
        : sortBy === "priceHigh"
          ? "price_desc"
          : "";

    const p = {
      page,
      limit: DEFAULT_PAGE_SIZE,
      ...(search ? { q: search } : {}),
      ...(apiSort ? { sort: apiSort } : {}),
    };

    if (category && category !== "All") p.category = category;
    if (brand) p.brand = brand;
    if (inStockOnly) p.inStock = 1;
    if (maxPrice != null && Number.isFinite(maxPrice) && maxPrice < sliderMax) {
      p.priceMax = Math.round(maxPrice);
    }

    return p;
  }, [page, search, sortBy, category, brand, inStockOnly, maxPrice, sliderMax]);

  const {
    data,
    isPending: productsPending,
    isFetching,
    isError: productsError,
    error: productsErrorData,
  } = useQuery({
    queryKey: ["products", params],
    queryFn: async () => (await api.get("/products", { params })).data,
    placeholderData: (prev) => prev,
  });

  const products = Array.isArray(data?.products) ? data.products : [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.max(1, Number(data?.pages ?? 1));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    const next = buildSearchParams({
      category,
      brand,
      inStockOnly,
      maxPrice,
      search,
      sortBy,
      page,
      sliderMax,
    });

    const current = searchParams.toString();
    const upcoming = next.toString();

    if (current !== upcoming) {
      setSearchParams(next, { replace: true });
    }
  }, [
    category,
    brand,
    inStockOnly,
    maxPrice,
    search,
    sortBy,
    page,
    sliderMax,
    searchParams,
    setSearchParams,
  ]);

  const isInitialLoading =
    ((productsPending && !data) || facetsPending || shopCfgPending) && !products.length;

  const isUpdating = isFetching && !!data;
  const hasPriceFilter =
    maxPrice != null && Number.isFinite(maxPrice) && Number(maxPrice) < sliderMax;

  const activeFilterCount = [
    category !== "All",
    !!brand,
    inStockOnly,
    hasPriceFilter,
    !!search,
  ].filter(Boolean).length;

  const resultsRange = getResultsRange(page, DEFAULT_PAGE_SIZE, total, products.length);
  const pageNumbers = getVisiblePages(page, totalPages);

  const sortLabel =
    sortBy === "priceLow"
      ? "Price: Low to High"
      : sortBy === "priceHigh"
        ? "Price: High to Low"
        : "Newest";

  const combinedErrorMessage =
    productsError || facetsError || shopCfgError
      ? getErrorMessage(productsErrorData, facetsErrorData, shopCfgErrorData)
      : "";

  const handleCategoryChange = (value) => {
    setCategory(value);
    setPage(1);
  };

  const handleBrandChange = (value) => {
    setBrand(value);
    setPage(1);
  };

  const handleInStockChange = (value) => {
    setInStockOnly(Boolean(value));
    setPage(1);
  };

  const handleMaxPriceChange = (value) => {
    setMaxPrice(normalizeMaxPriceValue(value, sliderMax));
    setPage(1);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    setPage(1);
  };

  const clearFilters = () => {
    setCategory("All");
    setBrand("");
    setInStockOnly(false);
    setMaxPrice(null);
    setSearchInput("");
    setSearch("");
    setSortBy(defaultSort);
    setPage(1);
  };

  const clearSingleFilter = (key) => {
    if (key === "category") setCategory("All");
    if (key === "brand") setBrand("");
    if (key === "stock") setInStockOnly(false);
    if (key === "price") setMaxPrice(null);
    if (key === "search") {
      setSearchInput("");
      setSearch("");
    }
    setPage(1);
  };

  const applyMobileFilters = () => {
    setCategory(draftCategory);
    setBrand(draftBrand);
    setInStockOnly(draftInStockOnly);
    setMaxPrice(draftMaxPrice);
    setPage(1);
    setMobileFilterOpen(false);
  };

  const clearMobileDraftFilters = () => {
    setDraftCategory("All");
    setDraftBrand("");
    setDraftInStockOnly(false);
    setDraftMaxPrice(null);
  };

  const displayedMaxPrice =
    maxPrice != null && Number.isFinite(maxPrice) ? Math.min(maxPrice, sliderMax) : sliderMax;

  const displayedDraftMaxPrice =
    draftMaxPrice != null && Number.isFinite(draftMaxPrice)
      ? Math.min(draftMaxPrice, sliderMax)
      : sliderMax;

  const trustBadges = Array.isArray(cfg?.trustBadges) ? cfg.trustBadges : [];
  const featuredCollections = Array.isArray(cfg?.featuredCollections)
    ? cfg.featuredCollections
    : [];

  const heroImageSrc = resolveAssetUrl(cfg?.heroImage);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-black/5 bg-gradient-to-b from-white via-white to-gray-50">
        <div className="container mx-auto px-4 py-6 sm:px-6 sm:py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Home size={16} />
            <Link to="/" className="transition hover:text-black hover:underline">
              Home
            </Link>
            <span>/</span>
            <span className="font-medium text-gray-700">Shop</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-7 xl:col-span-8">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                  <ShoppingBag size={14} />
                  {cfg?.heroEyebrow || "Premium catalog"}
                </div>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
                  {cfg?.heroTitle || "Shop All Products"}
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
                  {cfg?.heroSubtitle ||
                    "Discover our latest collections, trending fashion, accessories, and more. Explore a cleaner, faster and more premium storefront experience."}
                </p>
              </div>

              {trustBadges.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {trustBadges.map((badge, index) => {
                    const label = String(badge?.label || "").trim();
                    if (!label) return null;

                    return (
                      <span
                        key={badge?.id || `${label}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700"
                      >
                        <CheckCircle2 size={13} />
                        {label}
                      </span>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-3">
                {categoryPills.map((pill) => {
                  const Icon = pill.icon;
                  const active = category === pill.name;

                  return (
                    <button
                      key={pill.name}
                      type="button"
                      onClick={() => handleCategoryChange(pill.name)}
                      className={[
                        "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                        active
                          ? "border-black bg-black text-white shadow-sm"
                          : "border-black/10 bg-white text-gray-700 hover:bg-gray-100 hover:text-black",
                      ].join(" ")}
                    >
                      <Icon size={17} />
                      <span>{pill.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-7 xl:col-span-4">
              {heroImageSrc ? (
                <div className="mb-5 overflow-hidden rounded-[24px] bg-gray-100">
                  <img
                    src={heroImageSrc}
                    alt={cfg?.heroTitle || "Shop hero"}
                    className="h-[180px] w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = FALLBACK_IMAGE;
                    }}
                  />
                </div>
              ) : null}

              <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
                <Filter size={14} />
                Shop experience
              </div>

              <h2 className="mt-4 text-xl font-semibold tracking-tight text-gray-950">
                {cfg?.promoTitle || "Curated storefront experience"}
              </h2>

              <p className="mt-2 text-sm leading-7 text-gray-600">
                {cfg?.promoText ||
                  "Browse a cleaner, faster and more premium shopping experience with refined filters and structured discovery."}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  Sort: {sortLabel}
                </span>
                <span className="rounded-full bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                  {total} items
                </span>
              </div>
            </div>
          </div>

          {featuredCollections.length > 0 ? (
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {featuredCollections.slice(0, 6).map((item, index) => {
                const title = String(item?.title || "").trim();
                if (!title) return null;

                const description = String(item?.description || "").trim();
                const href = String(item?.href || "/shop").trim() || "/shop";
                const image = resolveAssetUrl(item?.image);

                return (
                  <Link
                    key={item?.id || `${title}-${index}`}
                    to={href}
                    className="group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {image ? (
                      <div className="overflow-hidden bg-gray-100">
                        <img
                          src={image}
                          alt={title}
                          className="h-[160px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                          onError={(e) => {
                            e.currentTarget.src = FALLBACK_IMAGE;
                          }}
                        />
                      </div>
                    ) : null}

                    <div className="p-5">
                      <div className="text-lg font-semibold tracking-tight text-gray-950">
                        {title}
                      </div>
                      {description ? (
                        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
                      ) : null}

                      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition group-hover:bg-black group-hover:text-white">
                        Explore collection
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="container mx-auto grid grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:py-10">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-28 space-y-5">
            <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-gray-700" />
                <h2 className="text-lg font-semibold text-gray-950">Filters</h2>
              </div>

              <p className="mt-2 text-sm text-gray-500">
                Narrow down the catalog with cleaner, faster filtering controls.
              </p>

              {isInitialLoading ? (
                <div className="mt-5">
                  <SidebarFiltersSkeleton />
                </div>
              ) : (
                <div className="mt-5 space-y-6">
                  <FilterRadio
                    title="Brand"
                    options={[{ value: "", label: "All brands" }, ...facetBrands]}
                    value={brand}
                    onChange={handleBrandChange}
                  />

                  <div>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-medium text-gray-900">Max price</p>
                      <span className="text-sm font-semibold text-gray-700">
                        {hasPriceFilter ? formatMoney(displayedMaxPrice) : "Any"}
                      </span>
                    </div>

                    <input
                      type="range"
                      min={0}
                      max={Math.max(1, sliderMax)}
                      value={displayedMaxPrice}
                      onChange={(e) => handleMaxPriceChange(e.target.value)}
                      className="range range-sm"
                    />

                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>৳0</span>
                      <span>{formatMoney(sliderMax)}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setMaxPrice(null);
                        setPage(1);
                      }}
                      className="mt-3 text-xs font-medium text-gray-600 transition hover:text-black"
                    >
                      Reset price
                    </button>
                  </div>

                  <label className="flex items-start gap-3 rounded-2xl border border-black/5 bg-gray-50 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={inStockOnly}
                      onChange={(e) => handleInStockChange(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-gray-900">
                        In stock only
                      </span>
                      <span className="block text-xs text-gray-500">
                        Show only products that are currently available.
                      </span>
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={clearFilters}
                    className="w-full rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="lg:col-span-9">
          <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex w-full items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 sm:max-w-md">
                  <Search size={18} className="text-gray-500" />
                  <input
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-transparent text-sm text-gray-700 outline-none"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        setSearch("");
                        setPage(1);
                      }}
                      className="text-gray-500 transition hover:text-black"
                      aria-label="Clear search"
                    >
                      <X size={16} />
                    </button>
                  ) : null}
                </div>

                <div className="flex items-center gap-3">
                  <label className="sr-only" htmlFor="shop-sort">
                    Sort products
                  </label>
                  <div className="relative min-w-[200px]">
                    <select
                      id="shop-sort"
                      value={sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-black/10 bg-white px-4 py-3 pr-10 text-sm font-medium text-gray-800 outline-none transition focus:ring-2 focus:ring-black/10"
                    >
                      <option value="newest">Newest</option>
                      <option value="priceLow">Price: Low to High</option>
                      <option value="priceHigh">Price: High to Low</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileFilterOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 lg:hidden"
                  >
                    <SlidersHorizontal size={18} />
                    Filters
                    {activeFilterCount > 0 ? (
                      <span className="rounded-full bg-black px-2 py-0.5 text-xs text-white">
                        {activeFilterCount}
                      </span>
                    ) : null}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span className="rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-700">
                  Sort: {sortLabel}
                </span>
                {isUpdating ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
                    Updating
                  </span>
                ) : null}
              </div>
            </div>

            {activeFilterCount > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-4">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                  Active
                </span>

                {search ? (
                  <ActiveFilterChip
                    label={`Search: ${search}`}
                    onRemove={() => clearSingleFilter("search")}
                  />
                ) : null}

                {category !== "All" ? (
                  <ActiveFilterChip
                    label={`Category: ${category}`}
                    onRemove={() => clearSingleFilter("category")}
                  />
                ) : null}

                {brand ? (
                  <ActiveFilterChip
                    label={`Brand: ${brand}`}
                    onRemove={() => clearSingleFilter("brand")}
                  />
                ) : null}

                {inStockOnly ? (
                  <ActiveFilterChip
                    label="In stock only"
                    onRemove={() => clearSingleFilter("stock")}
                  />
                ) : null}

                {hasPriceFilter ? (
                  <ActiveFilterChip
                    label={`Up to ${formatMoney(displayedMaxPrice)}`}
                    onRemove={() => clearSingleFilter("price")}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-1 text-sm font-medium text-gray-600 transition hover:text-black"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-black/5 bg-white px-4 py-4 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-gray-600">
              {total > 0 ? (
                <>
                  Showing <span className="font-semibold text-gray-900">{resultsRange.start}</span>
                  {" – "}
                  <span className="font-semibold text-gray-900">{resultsRange.end}</span>
                  {" of "}
                  <span className="font-semibold text-gray-900">{total}</span> products
                </>
              ) : (
                <>No products found</>
              )}
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              {activeFilterCount > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
                  <SlidersHorizontal size={14} />
                  {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} applied
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5">
                  <CheckCircle2 size={14} />
                  Catalog ready
                </span>
              )}
            </div>
          </div>

          {combinedErrorMessage ? (
            <div className="mt-6 rounded-[24px] border border-red-200 bg-white p-5 text-sm text-red-700 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-red-800">
                    Couldn’t load the shop view
                  </div>
                  <div className="mt-1">{combinedErrorMessage}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6">
            {isInitialLoading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-700">
                  <ShoppingBag size={24} />
                </div>

                <h3 className="mt-4 text-xl font-semibold text-gray-950">
                  {cfg?.emptyStateTitle || "No products found"}
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-gray-600">
                  {cfg?.emptyStateSubtitle ||
                    "Try removing a filter, changing your search, or browsing the full catalog again."}
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product?._id || product?.id} p={product} />
                ))}
              </div>
            )}
          </div>

          {totalPages > 1 ? (
            <div className="mt-8 rounded-[24px] border border-black/5 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className={[
                    "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    page === 1
                      ? "cursor-not-allowed border-black/5 bg-gray-100 text-gray-400"
                      : "border-black/10 bg-white text-gray-800 hover:bg-gray-50",
                  ].join(" ")}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  {pageNumbers.map((pageNumber, index) => {
                    const prev = pageNumbers[index - 1];
                    const showGap = prev && pageNumber - prev > 1;

                    return (
                      <React.Fragment key={pageNumber}>
                        {showGap ? (
                          <span className="px-1 text-sm text-gray-400">…</span>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setPage(pageNumber)}
                          className={[
                            "inline-flex h-11 min-w-[44px] items-center justify-center rounded-2xl px-3 text-sm font-semibold transition",
                            pageNumber === page
                              ? "bg-black text-white shadow-sm"
                              : "border border-black/10 bg-white text-gray-800 hover:bg-gray-50",
                          ].join(" ")}
                        >
                          {pageNumber}
                        </button>
                      </React.Fragment>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className={[
                    "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                    page === totalPages
                      ? "cursor-not-allowed border-black/5 bg-gray-100 text-gray-400"
                      : "border-black/10 bg-white text-gray-800 hover:bg-gray-50",
                  ].join(" ")}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      {mobileFilterOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close filters"
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />

          <div className="absolute right-0 top-0 h-full w-[88%] max-w-sm overflow-y-auto border-l border-black/5 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-950">
                <SlidersHorizontal size={18} />
                Filters
              </h3>

              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-black"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {isInitialLoading ? (
              <div className="mt-6">
                <SidebarFiltersSkeleton />
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <FilterRadio
                  title="Category"
                  options={categoryPills.map((pill) => ({
                    value: pill.name,
                    label: pill.name,
                    count: null,
                  }))}
                  value={draftCategory}
                  onChange={setDraftCategory}
                />

                <FilterRadio
                  title="Brand"
                  options={[{ value: "", label: "All brands" }, ...facetBrands]}
                  value={draftBrand}
                  onChange={setDraftBrand}
                />

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="font-medium text-gray-900">Max price</p>
                    <span className="text-sm font-semibold text-gray-700">
                      {draftMaxPrice != null
                        ? formatMoney(displayedDraftMaxPrice)
                        : "Any"}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, sliderMax)}
                    value={displayedDraftMaxPrice}
                    onChange={(e) =>
                      setDraftMaxPrice(normalizeMaxPriceValue(e.target.value, sliderMax))
                    }
                    className="range range-sm"
                  />

                  <div className="mt-2 flex justify-between text-xs text-gray-500">
                    <span>৳0</span>
                    <span>{formatMoney(sliderMax)}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDraftMaxPrice(null)}
                    className="mt-3 text-xs font-medium text-gray-600 transition hover:text-black"
                  >
                    Reset price
                  </button>
                </div>

                <label className="flex items-start gap-3 rounded-2xl border border-black/5 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={draftInStockOnly}
                    onChange={(e) => setDraftInStockOnly(e.target.checked)}
                    className="mt-1"
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-gray-900">
                      In stock only
                    </span>
                    <span className="block text-xs text-gray-500">
                      Hide products that are currently unavailable.
                    </span>
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    onClick={clearMobileDraftFilters}
                    className="rounded-2xl border border-black/10 px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={applyMobileFilters}
                    className="rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterRadio({ title, options, value, onChange }) {
  const safeOptions = Array.isArray(options) ? options : [];

  return (
    <div>
      <p className="mb-3 font-medium text-gray-900">{title}</p>

      <div className="space-y-2">
        {safeOptions.map((option) => {
          const optionValue = String(option?.value ?? "");
          const label = String((option?.label ?? optionValue) || "All").trim() || "All";
          const checked = value === optionValue;

          return (
            <label
              key={optionValue || "all"}
              className={[
                "flex cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm transition",
                checked
                  ? "border-black bg-black text-white"
                  : "border-black/5 bg-gray-50 text-gray-700 hover:bg-white",
              ].join(" ")}
            >
              <span className="inline-flex items-center gap-3">
                <input
                  type="radio"
                  checked={checked}
                  onChange={() => onChange(optionValue)}
                  className="sr-only"
                />
                <span>{label}</span>
              </span>

              {option?.count != null ? (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-xs",
                    checked ? "bg-white/10 text-white" : "bg-white text-gray-500",
                  ].join(" ")}
                >
                  {option.count}
                </span>
              ) : null}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ActiveFilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
      <span>{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full text-gray-500 transition hover:text-black"
        aria-label={`Remove ${label}`}
      >
        <X size={14} />
      </button>
    </span>
  );
}

function ProductCard({ p }) {
  const title = p?.title || "Untitled Product";
  const price = Number(p?.price ?? 0);
  const compareAtPrice = Number(p?.compareAtPrice ?? 0);
  const image = getPrimaryImage(p);
  const inStock = Number(p?.stock ?? 0) > 0;
  const productId = p?._id || p?.id;
  const href = productId ? `/products/${productId}` : "/shop";
  const brand = String(p?.brand || "").trim();
  const category = String(p?.category || "").trim();
  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  const hasComparePrice =
    Number.isFinite(compareAtPrice) && compareAtPrice > 0 && compareAtPrice > price;

  return (
    <Link
      to={href}
      className="group overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative overflow-hidden bg-gray-100">
        <img
          src={imgSrc}
          className="h-[260px] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
          alt={title}
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span
            className={[
              "rounded-full px-3 py-1 text-[11px] font-semibold shadow-sm",
              inStock ? "bg-black text-white" : "bg-white text-gray-700",
            ].join(" ")}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>

          {category ? (
            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-gray-700 shadow-sm">
              {category}
            </span>
          ) : null}
        </div>
      </div>

      <div className="p-5">
        <div className="mb-2 flex min-h-[20px] items-center gap-2">
          {brand ? (
            <span className="rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              {brand}
            </span>
          ) : null}
        </div>

        <h3 className="line-clamp-2 text-base font-semibold tracking-tight text-gray-950">
          {title}
        </h3>

        {p?.description ? (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
            {p.description}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-400">Premium catalog listing</p>
        )}

        <div className="mt-4 flex items-end justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-gray-950">{formatMoney(price)}</div>
            {hasComparePrice ? (
              <div className="mt-1 text-sm text-gray-400 line-through">
                {formatMoney(compareAtPrice)}
              </div>
            ) : null}
          </div>

          <span className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition group-hover:bg-black group-hover:text-white">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}