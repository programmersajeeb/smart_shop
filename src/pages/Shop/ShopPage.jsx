import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  SlidersHorizontal,
  Shirt,
  ShoppingBag,
  Watch,
  Gem,
  Baby,
  Gift,
  Heart,
  Star,
  ChevronDown,
  Search,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/apiClient";

import ProductGridSkeleton from "../../shared/components/ui/skeletons/ProductGridSkeleton";
import SidebarFiltersSkeleton from "../../shared/components/ui/skeletons/SidebarFiltersSkeleton";

const ICONS = { ShoppingBag, Shirt, Watch, Gem, Baby, Gift };

function iconFromKey(iconKey) {
  return ICONS[String(iconKey || "")] || ShoppingBag;
}

export default function ShopPage() {
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);

  const [maxPrice, setMaxPrice] = useState(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [sortBy, setSortBy] = useState("newest");

  const pageSize = 12;
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  const { data: shopCfg, isPending: shopCfgPending, isError: shopCfgError } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60_000,
  });

  const cfg = shopCfg?.data || {};

  const { data: facets, isPending: facetsPending, isError: facetsError } = useQuery({
    queryKey: ["products", "facets"],
    queryFn: async () => (await api.get("/products/facets")).data,
    staleTime: 60_000,
  });

  const facetBrandsAll = facets?.brands || [];
  const facetPriceMax = Number(facets?.price?.max ?? 0);

  const allowedBrands = Array.isArray(cfg?.brands) ? cfg.brands : [];
  const facetBrands = useMemo(() => {
    if (!allowedBrands.length) return facetBrandsAll;
    const allow = new Set(allowedBrands.map((b) => String(b).toLowerCase().trim()));
    return facetBrandsAll.filter((b) => allow.has(String(b).toLowerCase().trim()));
  }, [facetBrandsAll, allowedBrands]);

  const sliderMax = useMemo(() => {
    const cfgMax = Number(cfg?.priceMax ?? 0);
    const candidates = [cfgMax, facetPriceMax].filter((n) => Number.isFinite(n) && n > 0);
    return candidates.length ? Math.min(...candidates) : 5000;
  }, [cfg?.priceMax, facetPriceMax]);

  useEffect(() => {
    if (!sliderMax) return;
    setMaxPrice((prev) => {
      if (prev == null) return sliderMax;
      return Math.min(prev, sliderMax);
    });
  }, [sliderMax]);

  const categoryPills = useMemo(() => {
    const pills = Array.isArray(cfg?.categories) ? cfg.categories : [];
    const normalized = pills
      .map((c) => ({
        name: String(c?.name || "").trim(),
        icon: iconFromKey(c?.iconKey),
      }))
      .filter((c) => c.name);

    const seen = new Set();
    const unique = [];
    for (const c of normalized) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(c);
    }

    return [{ name: "All", icon: ShoppingBag }, ...unique];
  }, [cfg?.categories]);

  const apiSort = sortBy === "priceLow" ? "price_asc" : sortBy === "priceHigh" ? "price_desc" : "";

  const params = useMemo(() => {
    const p = {
      page,
      limit: pageSize,
      ...(search ? { q: search } : {}),
      ...(apiSort ? { sort: apiSort } : {}),
    };

    if (category && category !== "All") p.category = category;
    if (brand) p.brand = brand;
    if (inStockOnly) p.inStock = 1;
    if (maxPrice != null && Number.isFinite(maxPrice)) p.priceMax = maxPrice;

    return p;
  }, [page, pageSize, search, apiSort, category, brand, inStockOnly, maxPrice]);

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["products", params],
    queryFn: async () => (await api.get("/products", { params })).data,
    placeholderData: (prev) => prev,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pages ?? 1);

  const isInitialLoading = (isPending && !data) || facetsPending || shopCfgPending;
  const isUpdating = isFetching && !!data;

  const clearFilters = () => {
    setCategory("All");
    setBrand("");
    setInStockOnly(false);
    setMaxPrice(sliderMax || 5000);
    setSearchInput("");
    setSearch("");
    setSortBy("newest");
    setPage(1);
  };

  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, brand, inStockOnly, maxPrice, search, sortBy]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Home size={16} />
            <Link to="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium">Shop</span>
          </div>

          <h1 className="text-3xl font-bold mt-3">{cfg?.heroTitle || "Shop All Products"}</h1>
          <p className="text-gray-600 mt-2 max-w-2xl">
            {cfg?.heroSubtitle || "Discover our latest collections, trending fashion, accessories, and more."}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {categoryPills.map((c) => {
              const Icon = c.icon;
              const active = category === c.name;
              return (
                <button
                  key={c.name}
                  onClick={() => {
                    setCategory(c.name);
                    resetPage();
                  }}
                  className={[
                    "flex items-center gap-2 px-4 py-2 rounded-full border transition",
                    active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-100",
                  ].join(" ")}
                >
                  <Icon size={18} />
                  <span className="text-sm font-medium">{c.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        <aside className="hidden md:block md:col-span-3 space-y-8">
          <h3 className="font-semibold text-lg">Filters</h3>

          {isInitialLoading ? (
            <SidebarFiltersSkeleton />
          ) : (
            <>
              <FilterRadio
                title="Brand"
                options={["", ...facetBrands]}
                value={brand}
                onChange={(v) => {
                  setBrand(v);
                  resetPage();
                }}
              />

              <div>
                <p className="font-medium mb-2">Max Price</p>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, sliderMax)}
                  value={Math.min(Number(maxPrice ?? sliderMax), sliderMax)}
                  onChange={(e) => {
                    setMaxPrice(Number(e.target.value));
                    resetPage();
                  }}
                  className="range range-sm"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>{sliderMax}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => {
                    setInStockOnly(e.target.checked);
                    resetPage();
                  }}
                />
                <label className="text-sm">In stock only</label>
              </div>

              <button onClick={clearFilters} className="w-full border py-3 rounded-xl">
                Clear Filters
              </button>
            </>
          )}
        </aside>

        <section className="md:col-span-9">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="flex items-center gap-2 w-full md:max-w-md border rounded-xl px-4 py-3 bg-white">
              <Search size={18} className="text-gray-500" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search products..."
                className="w-full outline-none text-sm"
              />
              {searchInput ? (
                <button
                  onClick={() => {
                    setSearchInput("");
                    setSearch("");
                  }}
                  className="text-gray-500 hover:text-black"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-outline rounded-xl">
                Sort by <ChevronDown size={16} />
              </label>
              <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-white rounded-box w-52">
                <li onClick={() => setSortBy("newest")}><a>Newest</a></li>
                <li onClick={() => setSortBy("priceLow")}><a>Price: Low to High</a></li>
                <li onClick={() => setSortBy("priceHigh")}><a>Price: High to Low</a></li>
              </ul>
            </div>

            <button
              onClick={() => setMobileFilterOpen(true)}
              className="md:hidden flex items-center gap-2 border rounded-xl px-4 py-3 bg-white"
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-500 flex items-center justify-between">
            <span>Showing {products.length} of {total} products</span>
            {isUpdating ? <span>Updating...</span> : null}
          </div>

          {isError || facetsError || shopCfgError ? (
            <div className="mt-6 bg-white border rounded-2xl p-4 text-sm text-red-600">
              {error?.response?.data?.message || error?.message || "Failed to load products / filters"}
            </div>
          ) : null}

          <div className="mt-6">
            {isInitialLoading ? (
              <ProductGridSkeleton />
            ) : products.length === 0 ? (
              <div className="bg-white border rounded-2xl p-6 text-center text-gray-600">
                No products found. Try changing filters.
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((p) => (
                  <ProductCard key={p._id} p={p} />
                ))}
              </div>
            )}
          </div>

          <div className="mt-8 flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn btn-outline rounded-xl">
              Prev
            </button>

            <div className="text-sm text-gray-600">
              Page <span className="font-semibold">{page}</span> / {totalPages}
            </div>

            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn btn-outline rounded-xl">
              Next
            </button>
          </div>
        </section>
      </div>

      {mobileFilterOpen ? (
        <div className="fixed inset-0 bg-black/40 z-50">
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <SlidersHorizontal size={18} /> Filters
              </h3>
              <button onClick={() => setMobileFilterOpen(false)} className="text-gray-500 hover:text-black">
                <X size={18} />
              </button>
            </div>

            {isInitialLoading ? (
              <div className="mt-6"><SidebarFiltersSkeleton /></div>
            ) : (
              <div className="mt-6 space-y-6">
                <FilterRadio title="Brand" options={["", ...facetBrands]} value={brand} onChange={(v) => setBrand(v)} />

                <div>
                  <p className="font-medium mb-2">Max Price</p>
                  <input
                    type="range"
                    min={0}
                    max={Math.max(1, sliderMax)}
                    value={Math.min(Number(maxPrice ?? sliderMax), sliderMax)}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="range range-sm"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>{sliderMax}</span>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)} />
                  In stock only
                </label>

                <button onClick={clearFilters} className="w-full border py-3 rounded-xl">Clear Filters</button>

                <button
                  onClick={() => {
                    setMobileFilterOpen(false);
                    resetPage();
                  }}
                  className="w-full bg-black text-white py-3 rounded-xl"
                >
                  Apply Filters
                </button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterRadio({ title, options, value, onChange }) {
  return (
    <div>
      <p className="font-medium mb-2">{title}</p>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o || "all"} className="flex items-center gap-2 text-sm">
            <input type="radio" checked={value === o} onChange={() => onChange(o)} />
            {o || "All"}
          </label>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ p }) {
  const title = p?.title || "Untitled Product";
  const price = Number(p?.price ?? 0);
  const image = p?.images?.[0] || "https://placehold.co/600x600?text=Product";
  const inStock = Number(p?.stock ?? 0) > 0;

  return (
    <div className="border rounded-2xl overflow-hidden bg-white">
      <div className="relative">
        <span className={["absolute top-3 left-3 text-xs px-2 py-1 rounded-full", inStock ? "bg-black text-white" : "bg-gray-200 text-gray-700"].join(" ")}>
          {inStock ? "In Stock" : "Out of Stock"}
        </span>

        <button type="button" className="absolute top-3 right-3 bg-white p-2 rounded-full shadow" aria-label="Add to wishlist">
          <Heart size={16} />
        </button>

        <img src={image} className="h-[200px] w-full object-cover" alt={title} loading="lazy" />
      </div>

      <div className="p-4">
        <h3 className="text-sm font-medium line-clamp-2">{title}</h3>

        <div className="flex items-center gap-1 text-yellow-500 mt-1">
          <Star size={14} fill="currentColor" />
          <span className="text-xs text-gray-600">4.7</span>
        </div>

        <p className="font-semibold mt-2">${price}</p>
      </div>
    </div>
  );
}
