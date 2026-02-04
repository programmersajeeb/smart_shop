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

/* =========================================================
   SHOP PAGE (Enterprise-ready)
   - Server-driven pagination, search, category, brand, sorting
   - Smooth skeleton loading (initial + transitions)
   ========================================================= */

export default function ShopPage() {
  // Mobile filter drawer open/close
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filters
  const [category, setCategory] = useState("All");
  const [brand, setBrand] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [maxPrice, setMaxPrice] = useState(999999); // client-side refinement (optional)

  // Search (debounced)
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // Sorting
  const [sortBy, setSortBy] = useState("newest"); // newest | priceLow | priceHigh

  // Pagination
  const pageSize = 12;
  const [page, setPage] = useState(1);

  const resetPage = () => setPage(1);

  // Debounce search input to avoid firing requests on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Category pills (keep these aligned with your real product categories)
  const categories = [
    { name: "All", icon: ShoppingBag },
    { name: "Men", icon: Shirt },
    { name: "Women", icon: ShoppingBag },
    { name: "Accessories", icon: Watch },
    { name: "Jewelry", icon: Gem },
    { name: "Kids", icon: Baby },
    { name: "Gifts", icon: Gift },
  ];

  // Map UI sort to API sort
  const apiSort =
    sortBy === "priceLow"
      ? "price_asc"
      : sortBy === "priceHigh"
      ? "price_desc"
      : undefined;

  const params = {
    page,
    limit: pageSize,
    ...(category !== "All" ? { category } : {}),
    ...(brand ? { brand } : {}),
    ...(search ? { q: search } : {}),
    ...(apiSort ? { sort: apiSort } : {}),
  };

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const res = await api.get("/products", { params });
      return res.data;
    },
    // Keep previous page while next page loads (no UI flicker)
    placeholderData: (prev) => prev,
  });

  const serverProducts = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.pages ?? 1);

  // Optional client-side refinement filters (works on the current page items)
  const displayProducts = useMemo(() => {
    let list = [...serverProducts];

    if (Number.isFinite(maxPrice) && maxPrice > 0) {
      list = list.filter((p) => Number(p?.price ?? 0) <= maxPrice);
    }

    if (inStockOnly) {
      list = list.filter((p) => Number(p?.stock ?? 0) > 0);
    }

    return list;
  }, [serverProducts, maxPrice, inStockOnly]);

  const isInitialLoading = isPending && !data;
  const isUpdating = isFetching && !!data;

  const clearFilters = () => {
    setCategory("All");
    setBrand("");
    setInStockOnly(false);
    setMaxPrice(999999);
    setSearchInput("");
    setSearch("");
    setSortBy("newest");
    setPage(1);
  };

  return (
    <div className="w-full">
      {/* ================= HERO HEADER ================= */}
      <section className="border-b bg-white py-8">
        <div className="container mx-auto px-6">
          <div className="breadcrumbs text-sm mb-3">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold">Shop</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Shop All Products</h1>
              <p className="text-gray-600 mt-2 max-w-xl">
                Discover our latest collections, trending fashion, accessories, and more.
                Shop with confidence—premium quality guaranteed.
              </p>
            </div>

            {/* Search box */}
            <div className="w-full md:w-[420px]">
              <label className="input input-bordered flex items-center gap-2">
                <Search size={18} className="opacity-60" />
                <input
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                    resetPage();
                  }}
                  type="text"
                  className="grow"
                  placeholder="Search products..."
                />
                {searchInput ? (
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs"
                    onClick={() => {
                      setSearchInput("");
                      setSearch("");
                      resetPage();
                    }}
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </label>
              <p className="text-xs text-gray-500 mt-1">
                Tip: Search runs automatically after a short pause.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================= CATEGORY PILL BAR ================= */}
      <section className="border-b py-5 bg-white">
        <div className="container mx-auto px-6 flex gap-3 overflow-x-auto">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.name}
                onClick={() => {
                  setCategory(c.name);
                  resetPage();
                }}
                className={[
                  "flex items-center gap-2 px-5 py-2 rounded-full border text-sm whitespace-nowrap",
                  category === c.name ? "bg-black text-white" : "bg-white",
                ].join(" ")}
              >
                <Icon size={16} />
                {c.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* ================= TOP BAR (SORT + FILTER BTN) ================= */}
      <section className="py-5">
        <div className="container mx-auto px-6 flex flex-col gap-3 md:flex-row md:justify-between md:items-center">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">
              Showing <span className="font-semibold">{displayProducts.length}</span>{" "}
              items {total ? <span>(of {total} total)</span> : null}
            </span>

            {isUpdating ? (
              <span className="text-xs text-gray-500 flex items-center gap-2">
                <span className="h-3 w-20 skeleton rounded-md" />
                Updating...
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              className="md:hidden flex gap-2 px-4 py-2 border rounded-lg"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={18} />
              Filters
            </button>

            <button className="btn btn-sm" onClick={clearFilters}>
              Clear
            </button>

            {/* Sort dropdown */}
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-sm">
                Sort by <ChevronDown size={16} />
              </label>
              <ul
                tabIndex={0}
                className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52"
              >
                <li onClick={() => setSortBy("newest")}>
                  <a>Newest</a>
                </li>
                <li onClick={() => setSortBy("priceLow")}>
                  <a>Price: Low → High</a>
                </li>
                <li onClick={() => setSortBy("priceHigh")}>
                  <a>Price: High → Low</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN CONTENT ================= */}
      <section className="pb-16">
        <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* ================= DESKTOP SIDEBAR ================= */}
          <aside className="hidden md:block space-y-8">
            <h3 className="font-semibold text-lg">Filters</h3>

            {isInitialLoading ? (
              <SidebarFiltersSkeleton />
            ) : (
              <>
                <FilterRadio
                  title="Brand"
                  options={["", "Nike", "Apple", "Chanel"]}
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
                    min="0"
                    max="5000"
                    value={Math.min(maxPrice, 5000)}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      resetPage();
                    }}
                    className="range range-sm"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>${Math.min(maxPrice, 5000)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Note: This refines items on the current page.
                  </p>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      resetPage();
                    }}
                  />
                  In stock only
                </label>
              </>
            )}
          </aside>

          {/* ================= PRODUCT GRID ================= */}
          <div className="md:col-span-3">
            {isInitialLoading ? (
              <ProductGridSkeleton
                count={pageSize}
                gridClassName="grid grid-cols-2 md:grid-cols-3 gap-6"
                imageClassName="h-[200px]"
                showButton={false}
              />
            ) : isError ? (
              <div className="alert alert-error">
                <span>
                  Failed to load products.{" "}
                  {error?.message ? `(${error.message})` : ""}
                </span>
              </div>
            ) : (
              <div className={isUpdating ? "opacity-60 pointer-events-none" : ""}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {displayProducts.length === 0 ? (
                    <div className="col-span-full text-center text-gray-600 py-10">
                      No products found for the selected filters.
                    </div>
                  ) : (
                    displayProducts.map((p) => <ProductCard key={p?._id} p={p} />)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center pb-16">
        <div className="join">
          <button
            className="join-item btn btn-sm"
            disabled={page === 1 || isFetching}
            onClick={() => setPage((v) => Math.max(1, v - 1))}
          >
            Prev
          </button>
          <button className="join-item btn btn-sm btn-active">{page}</button>
          <button
            className="join-item btn btn-sm"
            disabled={page >= totalPages || isFetching}
            onClick={() => setPage((v) => Math.min(totalPages, v + 1))}
          >
            Next
          </button>
        </div>
      </div>

      {/* ================= MOBILE FILTER DRAWER ================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden">
          <div className="absolute bottom-0 w-full bg-white rounded-t-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Filters</h3>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setMobileFilterOpen(false)}
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {isInitialLoading ? (
              <SidebarFiltersSkeleton />
            ) : (
              <>
                <FilterRadio
                  title="Brand"
                  options={["", "Nike", "Apple", "Chanel"]}
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
                    min="0"
                    max="5000"
                    value={Math.min(maxPrice, 5000)}
                    onChange={(e) => {
                      setMaxPrice(Number(e.target.value));
                      resetPage();
                    }}
                    className="range range-sm"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>$0</span>
                    <span>${Math.min(maxPrice, 5000)}</span>
                  </div>
                </div>

                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => {
                      setInStockOnly(e.target.checked);
                      resetPage();
                    }}
                  />
                  In stock only
                </label>

                <button
                  onClick={() => {
                    setMobileFilterOpen(false);
                    resetPage();
                  }}
                  className="w-full bg-black text-white py-3 rounded-xl"
                >
                  Apply Filters
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* =========================
   Reusable UI helpers
   ========================= */

function FilterRadio({ title, options, value, onChange }) {
  return (
    <div>
      <p className="font-medium mb-2">{title}</p>
      <div className="space-y-2">
        {options.map((o) => (
          <label key={o || "all"} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={value === o}
              onChange={() => onChange(o)}
            />
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
        <span
          className={[
            "absolute top-3 left-3 text-xs px-2 py-1 rounded-full",
            inStock ? "bg-black text-white" : "bg-gray-200 text-gray-700",
          ].join(" ")}
        >
          {inStock ? "In Stock" : "Out of Stock"}
        </span>

        <button
          type="button"
          className="absolute top-3 right-3 bg-white p-2 rounded-full shadow"
          aria-label="Add to wishlist"
        >
          <Heart size={16} />
        </button>

        <img
          src={image}
          className="h-[200px] w-full object-cover"
          alt={title}
          loading="lazy"
        />
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
