import React, { memo, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  Search,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  RefreshCcw,
  Shirt,
  Watch,
  Gem,
  Baby,
  Gift,
} from "lucide-react";

import menImg from "../../assets/men.png";
import womenImg from "../../assets/women.png";
import accessoriesImg from "../../assets/accessories.png";

/**
 * CollectionsPage (Production / Enterprise)
 * - Fully responsive
 * - Accessible
 * - Search + quick filters
 * - Premium cards + CTA
 * - Image skeleton (prevents blank flashes while remote images load)
 * - Works with current project stack: Tailwind + DaisyUI + Lucide
 */

const Pill = memo(function Pill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "px-4 py-2 rounded-full border text-sm whitespace-nowrap transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        active ? "bg-black text-white border-black" : "bg-white hover:bg-gray-50",
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
    <div className="relative w-full">
      {/* Skeleton placeholder */}
      {!loaded && !failed ? (
        <div className={`w-full skeleton ${className} ${skeletonClassName}`} />
      ) : null}

      {/* Real image */}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        className={[
          "w-full object-cover",
          className,
          // Hide image until it loads (prevents layout flash)
          loaded && !failed ? "opacity-100" : "opacity-0",
          "transition-opacity duration-300",
        ].join(" ")}
      />

      {/* Fallback if image fails */}
      {failed ? (
        <div
          className={[
            "absolute inset-0 flex items-center justify-center",
            "bg-gray-50 text-gray-500 text-sm border",
            className,
          ].join(" ")}
        >
          Image unavailable
        </div>
      ) : null}
    </div>
  );
}

const CollectionCard = memo(function CollectionCard({ item }) {
  const Icon = item.icon;

  return (
    <div className="group rounded-2xl overflow-hidden border bg-white shadow-sm hover:shadow-xl transition">
      <div className="relative">
        <ImageWithSkeleton
          src={item.image}
          alt={item.title}
          className="h-[240px]"
          skeletonClassName="rounded-none"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-gray-800 shadow">
            <Icon size={14} />
            {item.tag}
          </span>
          {item.badge ? (
            <span className="rounded-full bg-black/85 px-3 py-1 text-xs font-medium text-white">
              {item.badge}
            </span>
          ) : null}
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-semibold text-white">{item.title}</h3>
          <p className="mt-1 text-sm text-white/85 line-clamp-2">
            {item.description}
          </p>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          {item.highlights.map((h) => (
            <span
              key={h}
              className="rounded-full border px-3 py-1 text-xs text-gray-700 bg-gray-50"
            >
              {h}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{item.count}</span>{" "}
            items
          </div>

          <Link
            to={item.href}
            className={[
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium",
              "bg-black text-white hover:bg-gray-900 transition",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            ].join(" ")}
            aria-label={`Shop ${item.title}`}
          >
            Shop now <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
});

export default function CollectionsPage() {
  const [q, setQ] = useState("");
  const [active, setActive] = useState("All");

  const collections = useMemo(
    () => [
      {
        key: "women",
        title: "Women",
        tag: "Signature",
        badge: "Trending",
        icon: Sparkles,
        image: womenImg,
        href: "/shop",
        description:
          "Premium outfits curated for modern lifestyle—daily essentials to statement pieces.",
        highlights: ["New arrivals", "Best sellers", "Limited drops"],
        count: 128,
      },
      {
        key: "men",
        title: "Men",
        tag: "Essential",
        badge: "Popular",
        icon: Shirt,
        image: menImg,
        href: "/shop",
        description:
          "Clean, timeless and versatile wardrobe staples—crafted for comfort & confidence.",
        highlights: ["Streetwear", "Formal", "Athleisure"],
        count: 96,
      },
      {
        key: "accessories",
        title: "Accessories",
        tag: "Upgrade",
        badge: "Hot",
        icon: Watch,
        image: accessoriesImg,
        href: "/shop",
        description:
          "Watches, bags and add-ons that elevate your look—minimal to bold.",
        highlights: ["Watches", "Bags", "Everyday carry"],
        count: 74,
      },
      {
        key: "jewelry",
        title: "Jewelry",
        tag: "Luxury",
        badge: "New",
        icon: Gem,
        image:
          "https://images.unsplash.com/photo-1601121141461-9d6647bca1d2?auto=format&fit=crop&w=1400&q=80",
        href: "/shop",
        description:
          "Modern jewelry designed to shine—minimal pieces to premium gifting.",
        highlights: ["Rings", "Necklaces", "Gift-ready"],
        count: 42,
      },
      {
        key: "kids",
        title: "Kids",
        tag: "Comfort",
        badge: "",
        icon: Baby,
        image:
          "https://images.unsplash.com/photo-1503457574465-19d3900d2d6f?auto=format&fit=crop&w=1400&q=80",
        href: "/shop",
        description:
          "Soft fabrics, playful styles—made for movement, made to last.",
        highlights: ["Soft cotton", "Daily wear", "Easy sizes"],
        count: 58,
      },
      {
        key: "gifts",
        title: "Gifts",
        tag: "Occasion",
        badge: "Best",
        icon: Gift,
        image:
          "https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&w=1400&q=80",
        href: "/shop",
        description:
          "Curated gift picks for every moment—fast and safe shopping experience.",
        highlights: ["Under $25", "Under $50", "Premium picks"],
        count: 36,
      },
    ],
    []
  );

  const categories = useMemo(
    () => ["All", "Women", "Men", "Accessories", "Jewelry", "Kids", "Gifts"],
    []
  );

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return collections.filter((c) => {
      const matchesCategory = active === "All" || c.title === active;

      const matchesQuery =
        !query ||
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.highlights.some((h) => h.toLowerCase().includes(query));

      return matchesCategory && matchesQuery;
    });
  }, [collections, q, active]);

  return (
    <div className="w-full">
      {/* HERO */}
      <section className="border-b bg-white">
        <div className="container mx-auto px-6 py-10">
          {/* Breadcrumb */}
          <div className="breadcrumbs text-sm mb-4">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold">Collections</li>
            </ul>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                Explore Collections
              </h1>
              <p className="mt-2 text-gray-600 max-w-2xl">
                Discover curated categories with premium quality and modern style.
                Fast, secure, and user-friendly shopping experience—built for everyone.
              </p>
            </div>

            {/* Search */}
            <div className="w-full lg:max-w-md">
              <label className="flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2">
                <Search size={18} className="text-gray-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search collections (e.g., watches, gifts, cotton)…"
                  className="w-full outline-none text-gray-800"
                  aria-label="Search collections"
                />
              </label>

              <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-gray-900">
                    {filtered.length}
                  </span>{" "}
                  collections
                </span>

                {(q || active !== "All") && (
                  <button
                    type="button"
                    className="underline hover:text-gray-900"
                    onClick={() => {
                      setQ("");
                      setActive("All");
                    }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick trust badges */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl border bg-white p-4 flex items-center gap-3">
              <ShieldCheck className="text-gray-800" />
              <div>
                <div className="font-semibold">Secure Checkout</div>
                <div className="text-sm text-gray-600">
                  Trusted payment protection
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 flex items-center gap-3">
              <Truck className="text-gray-800" />
              <div>
                <div className="font-semibold">Fast Delivery</div>
                <div className="text-sm text-gray-600">
                  Quick shipping options
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4 flex items-center gap-3">
              <RefreshCcw className="text-gray-800" />
              <div>
                <div className="font-semibold">Easy Returns</div>
                <div className="text-sm text-gray-600">
                  Hassle-free return policy
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FILTER PILLS */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-6 py-5">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map((c) => (
              <Pill key={c} active={active === c} onClick={() => setActive(c)}>
                {c}
              </Pill>
            ))}
          </div>
        </div>
      </section>

      {/* GRID */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
              <div className="mx-auto mb-3 w-fit rounded-full border px-3 py-1 text-sm bg-gray-50">
                No results
              </div>
              <h2 className="text-2xl font-bold">No collections found</h2>
              <p className="mt-2 text-gray-600">
                Try a different keyword or reset filters.
              </p>
              <button
                type="button"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-5 py-3 text-white hover:bg-gray-900 transition"
                onClick={() => {
                  setQ("");
                  setActive("All");
                }}
              >
                Reset filters <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filtered.map((item) => (
                <CollectionCard key={item.key} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="pb-16">
        <div className="container mx-auto px-6">
          <div className="rounded-2xl border bg-white p-8 md:p-10 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border px-3 py-1 text-sm">
                <Sparkles size={16} />
                Premium Collections
              </div>
              <h3 className="mt-3 text-2xl md:text-3xl font-bold">
                Ready to shop your favorites?
              </h3>
              <p className="mt-2 text-gray-600 max-w-xl">
                Browse the shop and discover products tailored to your style. Smooth UX,
                fast navigation and clean design.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-black px-6 py-4 text-white font-semibold hover:bg-gray-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Go to Shop <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
