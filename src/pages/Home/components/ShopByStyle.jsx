import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const fallbackImages = [
  "https://images.unsplash.com/photo-1520974735194-3b1c3ac20740?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1520975692194-e75c31d08b06?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1562157873-818bc0726f8f?auto=format&fit=crop&w=1400&q=80",
];

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "/shop") {
  const href = String(value || "").trim();
  return href || fallback;
}

function StyleCard({ item, featured = false, fallbackImage }) {
  const resolvedImage = normalizeText(item?.img || item?.image, fallbackImage);
  const [imgSrc, setImgSrc] = useState(resolvedImage);

  useEffect(() => {
    setImgSrc(resolvedImage);
  }, [resolvedImage]);

  const label = normalizeText(item?.label, "Style");
  const href = normalizeHref(item?.href, "/shop");
  const badge = item?.type === "brand" ? "Brand edit" : "Style edit";

  return (
    <Link
      to={href}
      className="group relative block overflow-hidden rounded-[28px] border border-black/5 bg-neutral-100 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      aria-label={label || "Shop by style"}
    >
      <div
        className={`relative w-full ${
          featured ? "h-[420px] md:h-[520px]" : "h-[250px] md:h-[248px]"
        }`}
      >
        <img
          src={imgSrc}
          alt={label || "Style"}
          onError={() => setImgSrc(fallbackImage)}
          className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          loading="lazy"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
          <div className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white backdrop-blur">
            {badge}
          </div>

          <h3
            className={`mt-3 font-semibold leading-tight text-white ${
              featured ? "text-3xl md:text-4xl" : "text-2xl"
            }`}
          >
            {label}
          </h3>

          <div className="mt-4 inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition group-hover:bg-neutral-100">
            Explore style
          </div>
        </div>
      </div>
    </Link>
  );
}

function ShopByStyle({ data, loading, error }) {
  const title = normalizeText(data?.title, "Shop by Style");
  const subtitle = normalizeText(
    data?.subtitle,
    "Fast discovery paths based on category and brand-led shopping intent."
  );

  const items = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length > 0) {
      return data.items.slice(0, 4).map((item, index) => ({
        id: item?.id || `style-${index + 1}`,
        label: normalizeText(item?.label, "Style"),
        href: normalizeHref(item?.href, "/shop"),
        img: normalizeText(item?.img || item?.image, fallbackImages[index % fallbackImages.length]),
        type: normalizeText(item?.type, "style").toLowerCase(),
      }));
    }

    return [
      {
        id: "casual",
        label: "Casual",
        href: "/shop?q=Casual",
        img: fallbackImages[0],
        type: "style",
      },
      {
        id: "formal",
        label: "Formal",
        href: "/shop?q=Formal",
        img: fallbackImages[1],
        type: "style",
      },
      {
        id: "streetwear",
        label: "Streetwear",
        href: "/shop?q=Streetwear",
        img: fallbackImages[2],
        type: "style",
      },
      {
        id: "sportswear",
        label: "Sportswear",
        href: "/shop?q=Sportswear",
        img: fallbackImages[3],
        type: "style",
      },
    ];
  }, [data]);

  const featured = items[0];
  const secondary = items.slice(1, 4);

  return (
    <section className="container mx-auto mt-24 mb-20 px-4" aria-label="Shop by style">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold text-gray-950 md:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600 md:text-base">
          {subtitle}
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load style collections
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {featured ? (
          <StyleCard item={featured} featured fallbackImage={fallbackImages[0]} />
        ) : null}

        <div className="grid grid-cols-1 gap-6">
          {secondary.map((item, index) => (
            <StyleCard
              key={item?.id || index}
              item={item}
              fallbackImage={fallbackImages[(index + 1) % fallbackImages.length]}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default ShopByStyle;