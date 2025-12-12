import { useState } from "react";
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
} from "lucide-react";

/* =========================================================
   SHOP PAGE – FULLY FUNCTIONAL & RESPONSIVE
   ========================================================= */

export default function Shop() {

  /* =========================
     🔹 GLOBAL STATES
     ========================= */

  // Mobile filter drawer open/close
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Filter states
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(500);
  const [brand, setBrand] = useState("");
  const [size, setSize] = useState("");
  const [inStock, setInStock] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const pageSize = 6;
  const [page, setPage] = useState(1);

  /* =========================
     🔹 CATEGORY PILLS
     ========================= */

  const categories = [
    { name: "All", icon: ShoppingBag },
    { name: "Men", icon: Shirt },
    { name: "Women", icon: ShoppingBag },
    { name: "Accessories", icon: Watch },
    { name: "Jewelry", icon: Gem },
    { name: "Kids", icon: Baby },
    { name: "Gifts", icon: Gift },
  ];

  /* =========================
     🔹 PRODUCT DATA (DEMO)
     ========================= */

  const products = [
    {
      id: 1,
      name: "Premium Cotton T-Shirt",
      category: "Men",
      brand: "Nike",
      size: "M",
      price: 29,
      rating: 4.8,
      inStock: true,
      badge: "-25%",
      image: "https://images.unsplash.com/photo-1520974735194-9c7e2c97f4c1",
    },
    {
      id: 2,
      name: "Minimal Watch",
      category: "Accessories",
      brand: "Apple",
      size: "M",
      price: 199,
      rating: 4.6,
      inStock: true,
      badge: "New",
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    },
    {
      id: 3,
      name: "Running Sneakers",
      category: "Men",
      brand: "Nike",
      size: "L",
      price: 120,
      rating: 4.9,
      inStock: true,
      badge: "-20%",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    },
    {
      id: 4,
      name: "Luxury Perfume",
      category: "Accessories",
      brand: "Chanel",
      size: "M",
      price: 250,
      rating: 4.7,
      inStock: false,
      badge: "Hot",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601",
    },
  ];

  /* =========================
     🔹 FILTER LOGIC
     ========================= */

  let filtered = products.filter((p) => {
    return (
      (category === "All" || p.category === category) &&
      p.price <= maxPrice &&
      (brand === "" || p.brand === brand) &&
      (size === "" || p.size === size) &&
      (!inStock || p.inStock)
    );
  });

  /* =========================
     🔹 SORT LOGIC
     ========================= */

  if (sortBy === "priceLow") filtered.sort((a, b) => a.price - b.price);
  if (sortBy === "priceHigh") filtered.sort((a, b) => b.price - a.price);
  if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);

  /* =========================
     🔹 PAGINATION LOGIC
     ========================= */

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  const resetPage = () => setPage(1);

  /* =========================================================
     🔹 UI START
     ========================================================= */

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
          <h1 className="text-3xl font-bold">Shop All Products</h1>
          {/* Subtitle */}
        <p className="text-gray-600 mt-2 max-w-xl">
          Discover our latest collections, trending fashion, accessories, and more.
          Shop with confidence—premium quality guaranteed.
        </p>
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
                className={`
                  flex items-center gap-2 px-5 py-2
                  rounded-full border text-sm whitespace-nowrap
                  ${category === c.name ? "bg-black text-white" : "bg-white"}
                `}
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
        <div className="container mx-auto px-6 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Showing {filtered.length} Products
          </span>

          <div className="flex items-center gap-3">
            {/* Mobile filter button */}
            <button
              className="md:hidden flex gap-2 px-4 py-2 border rounded-lg"
              onClick={() => setMobileFilterOpen(true)}
            >
              <SlidersHorizontal size={18} />
              Filter
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
                <li onClick={() => setSortBy("newest")}><a>Newest</a></li>
                <li onClick={() => setSortBy("priceLow")}><a>Price: Low → High</a></li>
                <li onClick={() => setSortBy("priceHigh")}><a>Price: High → Low</a></li>
                <li onClick={() => setSortBy("rating")}><a>Top Rated</a></li>
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

            {/* PRICE */}
            <div>
              <p className="font-medium mb-2">Price Range</p>
              <input
                type="range"
                min="0"
                max="500"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(Number(e.target.value));
                  resetPage();
                }}
                className="range range-sm"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>$0</span>
                <span>${maxPrice}</span>
              </div>
            </div>

            {/* BRAND */}
            <FilterRadio
              title="Brand"
              options={["", "Nike", "Apple", "Chanel"]}
              value={brand}
              onChange={(v) => {
                setBrand(v);
                resetPage();
              }}
            />

            {/* SIZE */}
            <FilterButtons
              title="Size"
              options={["S", "M", "L"]}
              value={size}
              onChange={(v) => {
                setSize(v);
                resetPage();
              }}
            />

            {/* STOCK */}
            <label className="flex gap-2 text-sm">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => {
                  setInStock(e.target.checked);
                  resetPage();
                }}
              />
              In Stock Only
            </label>
          </aside>

          {/* ================= PRODUCT GRID ================= */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-3 gap-6">
            {paginated.map((p) => (
              <div key={p.id} className="border rounded-2xl overflow-hidden bg-white">
                <div className="relative">
                  <span className="absolute top-3 left-3 bg-black text-white text-xs px-2 py-1 rounded-full">
                    {p.badge}
                  </span>
                  <button className="absolute top-3 right-3 bg-white p-2 rounded-full shadow">
                    <Heart size={16} />
                  </button>
                  <img src={p.image} className="h-[200px] w-full object-cover" />
                </div>

                <div className="p-4">
                  <h3 className="text-sm font-medium">{p.name}</h3>
                  <div className="flex items-center gap-1 text-yellow-500 mt-1">
                    <Star size={14} fill="currentColor" />
                    <span className="text-xs text-gray-600">{p.rating}</span>
                  </div>
                  <p className="font-semibold mt-2">${p.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-center pb-16">
        <div className="join">
          <button
            className="join-item btn btn-sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Prev
          </button>
          <button className="join-item btn btn-sm btn-active">{page}</button>
          <button
            className="join-item btn btn-sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* ================= MOBILE FILTER DRAWER ================= */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden">
          <div className="absolute bottom-0 w-full bg-white rounded-t-2xl p-6 space-y-6">
            <h3 className="font-semibold text-lg">Filters</h3>

            <FilterRadio title="Brand" options={["", "Nike", "Apple", "Chanel"]} value={brand} onChange={setBrand} />
            <FilterButtons title="Size" options={["S", "M", "L"]} value={size} onChange={setSize} />

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
        </div>
      )}
    </div>
  );
}

/* =========================
   🔹 REUSABLE FILTER UI
   ========================= */

function FilterRadio({ title, options, value, onChange }) {
  return (
    <div>
      <p className="font-medium mb-2">{title}</p>
      {options.map((o) => (
        <label key={o || "all"} className="flex gap-2 text-sm">
          <input
            type="radio"
            checked={value === o}
            onChange={() => onChange(o)}
          />
          {o || "All"}
        </label>
      ))}
    </div>
  );
}

function FilterButtons({ title, options, value, onChange }) {
  return (
    <div>
      <p className="font-medium mb-2">{title}</p>
      <div className="flex gap-2 flex-wrap">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o === value ? "" : o)}
            className={`px-3 py-1 border rounded-md text-sm ${
              value === o ? "bg-black text-white" : ""
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
