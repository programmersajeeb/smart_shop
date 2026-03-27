import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  Truck,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  Minus,
  Plus,
  BadgeCheck,
  Package,
  Layers3,
  Sparkles,
  FileText,
} from "lucide-react";

import api from "../../services/apiClient";
import { useCart } from "../../shared/hooks/useCart";
import ProductDetailsPageSkeleton from "../../shared/components/ui/skeletons/ProductDetailsPageSkeleton";

const FALLBACK_IMAGE = "https://placehold.co/1200x1200?text=Product";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong."
  );
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

function normalizeImage(raw) {
  if (!raw) return "";
  if (typeof raw === "string") return resolveAssetUrl(raw.trim());

  if (typeof raw === "object" && typeof raw.url === "string") {
    return resolveAssetUrl(raw.url.trim());
  }

  return "";
}

function getProductImages(product) {
  const list = Array.isArray(product?.images) ? product.images : [];
  const out = [];
  const seen = new Set();

  for (const item of list) {
    const url = normalizeImage(item);
    if (!url) continue;

    const key = url.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(url);
  }

  if (!out.length && typeof product?.image === "string" && product.image.trim()) {
    out.push(resolveAssetUrl(product.image.trim()));
  }

  if (!out.length) {
    out.push(FALLBACK_IMAGE);
  }

  return out;
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return "৳0";
  return `৳${amount.toFixed(0)}`;
}

function ProductInfoPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
          <Icon size={18} className="text-gray-800" />
        </div>

        <div className="min-w-0">
          <div className="text-xs uppercase tracking-[0.16em] text-gray-500">
            {label}
          </div>
          <div className="mt-1 break-words text-sm font-semibold text-gray-900">
            {value || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}

function RelatedProductCard({ product }) {
  const title = product?.title || "Untitled Product";
  const href = `/products/${product?._id || product?.id}`;
  const stock = Math.max(0, Number(product?.stock || 0));
  const inStock = stock > 0;
  const brand = String(product?.brand || "").trim();
  const image = getProductImages(product)[0];

  const [imgSrc, setImgSrc] = useState(image);

  useEffect(() => {
    setImgSrc(image);
  }, [image]);

  return (
    <Link
      to={href}
      className="overflow-hidden rounded-[24px] border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative bg-gray-100">
        <img
          src={imgSrc}
          alt={title}
          className="h-[220px] w-full object-cover"
          loading="lazy"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={cx(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm",
              inStock ? "bg-black text-white" : "bg-white text-gray-700"
            )}
          >
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>

      <div className="p-4">
        {brand ? (
          <div className="mb-2 inline-flex rounded-full bg-gray-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
            {brand}
          </div>
        ) : null}

        <div className="line-clamp-2 text-sm font-semibold text-gray-900">{title}</div>

        <div className="mt-3 text-base font-bold text-gray-950">
          {formatMoney(product?.price)}
        </div>
      </div>
    </Link>
  );
}

function TabButton({ active, children, onClick, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-black text-white"
          : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
      )}
    >
      {Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
}

export default function ProductDetailsPage() {
  const { id } = useParams();
  const { addItem } = useCart();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeImageSrc, setActiveImageSrc] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    setSelectedImageIndex(0);
    setQty(1);
    setActiveTab("overview");
  }, [id]);

  const productQuery = useQuery({
    queryKey: ["product", id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await api.get(`/products/${id}`);
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  const product = productQuery.data?.product || null;

  const images = useMemo(() => getProductImages(product), [product]);
  const activeImage = images[selectedImageIndex] || images[0] || FALLBACK_IMAGE;

  useEffect(() => {
    setSelectedImageIndex((prev) => {
      if (!images.length) return 0;
      return Math.min(prev, images.length - 1);
    });
  }, [images]);

  useEffect(() => {
    setActiveImageSrc(activeImage || FALLBACK_IMAGE);
  }, [activeImage]);

  const stockCount = Math.max(0, Number(product?.stock ?? 0));
  const inStock = stockCount > 0;
  const maxQty = inStock ? stockCount : 0;

  useEffect(() => {
    if (!inStock) {
      setQty(1);
      return;
    }

    setQty((prev) => Math.min(Math.max(1, prev), maxQty));
  }, [inStock, maxQty]);

  const lowStock =
    inStock &&
    Number(product?.lowStockThreshold ?? 5) > 0 &&
    stockCount <= Number(product?.lowStockThreshold ?? 5);

  const price = Number(product?.price ?? 0);
  const compareAtPrice = Number(product?.compareAtPrice ?? 0);
  const hasComparePrice =
    Number.isFinite(compareAtPrice) && compareAtPrice > 0 && compareAtPrice > price;
  const savings = hasComparePrice ? Math.max(0, compareAtPrice - price) : 0;
  const discountPercent =
    hasComparePrice && compareAtPrice > 0
      ? Math.round((savings / compareAtPrice) * 100)
      : 0;

  const relatedQuery = useQuery({
    queryKey: ["related-products", product?._id, product?.category, product?.brand],
    enabled: Boolean(product?._id && (product?.category || product?.brand)),
    queryFn: async () => {
      const params = {
        limit: 8,
        inStock: 1,
        sort: "latest",
      };

      if (product?.category) {
        params.category = product.category;
      } else if (product?.brand) {
        params.brand = product.brand;
      }

      const response = await api.get("/products", { params });
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  const relatedProducts = useMemo(() => {
    const list = Array.isArray(relatedQuery.data?.products)
      ? relatedQuery.data.products
      : [];

    return list
      .filter((item) => String(item?._id || item?.id) !== String(product?._id || ""))
      .slice(0, 4);
  }, [relatedQuery.data, product?._id]);

  async function handleAddToCart() {
    if (!product || !inStock || adding) return;

    const safeQty = Math.min(Math.max(1, qty), maxQty || 1);
    if (safeQty <= 0) return;

    setAdding(true);
    try {
      await addItem(product, safeQty);
    } finally {
      setAdding(false);
    }
  }

  const isProductLoading = productQuery.isPending || productQuery.isLoading;
  const isRelatedLoading = relatedQuery.isPending || relatedQuery.isLoading;

  if (isProductLoading) {
    return <ProductDetailsPageSkeleton />;
  }

  if (productQuery.isError || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10 sm:px-6">
          <div className="rounded-[32px] border border-gray-200 bg-white p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 text-rose-600" size={20} />
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Failed to load product
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  {getErrorMessage(productQuery.error)}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => productQuery.refetch()}
                    className="inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Retry
                  </button>

                  <Link
                    to="/shop"
                    className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
                  >
                    Back to shop
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stockText = !inStock
    ? "Currently unavailable"
    : lowStock
      ? `Low stock • ${stockCount} left`
      : `In stock • ${stockCount} available`;

  return (
    <div className="min-h-screen bg-gray-50 pb-28 md:pb-0">
      <div className="container mx-auto px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="transition hover:text-black hover:underline">
            Home
          </Link>
          <span>/</span>
          <Link to="/shop" className="transition hover:text-black hover:underline">
            Shop
          </Link>
          {product?.category ? (
            <>
              <span>/</span>
              <span>{product.category}</span>
            </>
          ) : null}
        </div>

        <div className="mb-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            <ArrowLeft size={16} />
            Back to shop
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="overflow-hidden rounded-[32px] border border-gray-200 bg-white shadow-sm">
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={activeImageSrc}
                  alt={product?.title || "Product image"}
                  className="h-full w-full object-cover"
                  onError={() => setActiveImageSrc(FALLBACK_IMAGE)}
                />

                <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                  <span
                    className={cx(
                      "rounded-full px-3 py-1 text-xs font-semibold shadow-sm",
                      inStock ? "bg-black text-white" : "bg-white text-gray-700"
                    )}
                  >
                    {inStock ? "In Stock" : "Out of Stock"}
                  </span>

                  {lowStock ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Low stock
                    </span>
                  ) : null}

                  {discountPercent > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                      Save {discountPercent}%
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            {images.length > 1 ? (
              <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((img, index) => (
                  <button
                    key={`${img}-${index}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(index)}
                    className={cx(
                      "overflow-hidden rounded-2xl border bg-white transition",
                      selectedImageIndex === index
                        ? "border-black ring-2 ring-black/10"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img
                      src={img}
                      alt={`Product preview ${index + 1}`}
                      className="h-24 w-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = FALLBACK_IMAGE;
                      }}
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="space-y-5 lg:col-span-5">
            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap items-center gap-2">
                {product?.brand ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                    {product.brand}
                  </span>
                ) : null}

                {product?.category ? (
                  <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                    {product.category}
                  </span>
                ) : null}
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                {product?.title || "Untitled Product"}
              </h1>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="text-3xl font-bold text-gray-950">
                  {formatMoney(product?.price)}
                </div>

                {hasComparePrice ? (
                  <div className="pb-1 text-lg text-gray-400 line-through">
                    {formatMoney(compareAtPrice)}
                  </div>
                ) : null}

                {savings > 0 ? (
                  <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                    Save {formatMoney(savings)}
                  </div>
                ) : null}
              </div>

              <p className="mt-5 text-base leading-7 text-gray-600">
                {product?.description ||
                  "A premium catalog item with a clean presentation, strong merchandising structure, and a polished shopping experience."}
              </p>

              <div className="mt-6">
                {inStock ? (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 size={18} />
                    {stockText}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                    <AlertTriangle size={18} />
                    {stockText}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-gray-700 transition hover:bg-white disabled:opacity-50"
                    onClick={() => setQty((prev) => Math.max(1, prev - 1))}
                    disabled={qty <= 1 || !inStock}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>

                  <div className="min-w-[56px] text-center text-base font-semibold text-gray-900">
                    {qty}
                  </div>

                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-gray-700 transition hover:bg-white disabled:opacity-50"
                    onClick={() => setQty((prev) => Math.min(maxQty, prev + 1))}
                    disabled={!inStock || qty >= maxQty}
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!inStock || adding}
                  className={cx(
                    "inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold transition",
                    inStock
                      ? "bg-black text-white hover:bg-gray-900"
                      : "cursor-not-allowed bg-gray-200 text-gray-500"
                  )}
                >
                  <ShoppingCart size={18} />
                  {adding ? "Adding..." : "Add to cart"}
                </button>
              </div>

              {inStock ? (
                <div className="mt-3 text-xs text-gray-500">
                  Maximum available quantity: <span className="font-semibold">{maxQty}</span>
                </div>
              ) : null}

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <ProductInfoPill
                  icon={ShieldCheck}
                  label="Secure checkout"
                  value="Protected purchase flow"
                />
                <ProductInfoPill
                  icon={Truck}
                  label="Shipping"
                  value="Fast fulfillment support"
                />
                <ProductInfoPill
                  icon={RefreshCcw}
                  label="Returns"
                  value="Easy return-ready flow"
                />
                <ProductInfoPill
                  icon={BadgeCheck}
                  label="Quality"
                  value="Curated premium listing"
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm md:p-7">
              <div className="flex flex-wrap gap-3">
                <TabButton
                  active={activeTab === "overview"}
                  onClick={() => setActiveTab("overview")}
                  icon={Sparkles}
                >
                  Overview
                </TabButton>

                <TabButton
                  active={activeTab === "specs"}
                  onClick={() => setActiveTab("specs")}
                  icon={Layers3}
                >
                  Specs
                </TabButton>

                <TabButton
                  active={activeTab === "shipping"}
                  onClick={() => setActiveTab("shipping")}
                  icon={FileText}
                >
                  Shipping
                </TabButton>
              </div>

              <div className="mt-6">
                {activeTab === "overview" ? (
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">
                      Product overview
                    </div>

                    <p className="text-sm leading-7 text-gray-600">
                      {product?.description ||
                        "This product is presented with a premium storefront experience, structured inventory support, and modern merchandising details for better customer trust and conversion."}
                    </p>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ProductInfoPill
                        icon={BadgeCheck}
                        label="Brand"
                        value={product?.brand || "Not specified"}
                      />
                      <ProductInfoPill
                        icon={Layers3}
                        label="Category"
                        value={product?.category || "Not specified"}
                      />
                    </div>
                  </div>
                ) : null}

                {activeTab === "specs" ? (
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">
                      Product specs
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ProductInfoPill
                        icon={Layers3}
                        label="Category"
                        value={product?.category || "Not specified"}
                      />
                      <ProductInfoPill
                        icon={BadgeCheck}
                        label="Brand"
                        value={product?.brand || "Not specified"}
                      />
                      <ProductInfoPill
                        icon={Package}
                        label="Stock"
                        value={String(stockCount)}
                      />
                      <ProductInfoPill
                        icon={ShieldCheck}
                        label="Status"
                        value={product?.isActive ? "Active listing" : "Inactive"}
                      />
                      <ProductInfoPill
                        icon={BadgeCheck}
                        label="Price"
                        value={formatMoney(price)}
                      />
                      <ProductInfoPill
                        icon={BadgeCheck}
                        label="Compare price"
                        value={hasComparePrice ? formatMoney(compareAtPrice) : "—"}
                      />
                    </div>
                  </div>
                ) : null}

                {activeTab === "shipping" ? (
                  <div className="space-y-4">
                    <div className="text-lg font-semibold text-gray-900">
                      Shipping & support
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-7 text-gray-600">
                      Orders are processed through a secure backend flow with stock-aware
                      handling. Shipping speed, return support, and order updates depend on
                      your store configuration and fulfillment rules.
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ProductInfoPill
                        icon={Truck}
                        label="Fulfillment"
                        value="Operationally supported"
                      />
                      <ProductInfoPill
                        icon={RefreshCcw}
                        label="Return flow"
                        value="Customer-friendly process"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-12">
          <div className="rounded-[32px] border border-gray-200 bg-white p-6 shadow-sm md:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold tracking-tight text-gray-950">
                  Related products
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Similar products from the same catalog category.
                </div>
              </div>

              <Link
                to="/shop"
                className="hidden rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 md:inline-flex"
              >
                Browse more
              </Link>
            </div>

            {isRelatedLoading ? (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[320px] animate-pulse rounded-[24px] bg-gray-100"
                  />
                ))}
              </div>
            ) : relatedProducts.length > 0 ? (
              <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <RelatedProductCard key={item?._id || item?.id} product={item} />
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-6 text-sm text-gray-600">
                No related products available right now.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 p-4 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-gray-900">
              {product?.title}
            </div>
            <div className="text-base font-bold text-gray-950">
              {formatMoney(product?.price)}
            </div>
            {hasComparePrice ? (
              <div className="text-xs text-gray-400 line-through">
                {formatMoney(compareAtPrice)}
              </div>
            ) : null}
          </div>

          <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50 p-1">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-gray-700 disabled:opacity-50"
              onClick={() => setQty((prev) => Math.max(1, prev - 1))}
              disabled={qty <= 1 || !inStock}
              aria-label="Decrease quantity"
            >
              <Minus size={15} />
            </button>

            <div className="min-w-[44px] text-center text-sm font-semibold text-gray-900">
              {qty}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl text-gray-700 disabled:opacity-50"
              onClick={() => setQty((prev) => Math.min(maxQty, prev + 1))}
              disabled={!inStock || qty >= maxQty}
              aria-label="Increase quantity"
            >
              <Plus size={15} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!inStock || adding}
            className={cx(
              "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition",
              inStock
                ? "bg-black text-white"
                : "cursor-not-allowed bg-gray-200 text-gray-500"
            )}
          >
            <ShoppingCart size={16} />
            {adding ? "Adding..." : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}