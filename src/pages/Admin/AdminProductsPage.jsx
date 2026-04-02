import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Trash2,
  Pencil,
  Search,
  X,
  Loader2,
  Package2,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers3,
  Tag,
  Boxes,
  Upload,
  Copy,
  Hash,
  Check,
  AlertTriangle,
  RotateCcw,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function money(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0";
  return String(Math.round(x));
}

function productLabel(product) {
  return product?.title || product?.name || "Untitled";
}

function getApiOrigin() {
  try {
    const base = String(api?.defaults?.baseURL || "").trim();
    if (!base) return window.location.origin;
    return new URL(base).origin;
  } catch {
    return window.location.origin;
  }
}

function toAbsoluteMediaUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";

  if (
    /^https?:\/\//i.test(raw) ||
    raw.startsWith("data:") ||
    raw.startsWith("blob:")
  ) {
    return raw;
  }

  const origin = getApiOrigin();

  if (raw.startsWith("/")) {
    return `${origin}${raw}`;
  }

  return `${origin}/${raw.replace(/^\/+/, "")}`;
}

function normalizeImageObject(raw) {
  if (!raw) return null;

  if (typeof raw === "string") {
    const url = raw.trim();
    if (!url) return null;

    return {
      fileId: null,
      url,
      filename: null,
      mimetype: null,
      size: 0,
      width: null,
      height: null,
      format: null,
    };
  }

  if (typeof raw !== "object") return null;

  const url = String(raw.url || "").trim();
  if (!url) return null;

  return {
    fileId: raw.fileId ? String(raw.fileId).trim() : null,
    url,
    filename: raw.filename ? String(raw.filename).trim() : null,
    mimetype: raw.mimetype ? String(raw.mimetype).trim() : null,
    size: Number.isFinite(Number(raw.size)) ? Number(raw.size) : 0,
    width: Number.isFinite(Number(raw.width)) ? Number(raw.width) : null,
    height: Number.isFinite(Number(raw.height)) ? Number(raw.height) : null,
    format: raw.format ? String(raw.format).trim() : null,
  };
}

function getImageSrc(product) {
  if (Array.isArray(product?.images) && product.images.length) {
    const first = normalizeImageObject(product.images[0]);
    if (first?.url) return toAbsoluteMediaUrl(first.url);
  }

  if (typeof product?.thumbnail === "string" && product.thumbnail.trim()) {
    return toAbsoluteMediaUrl(product.thumbnail);
  }

  if (typeof product?.image === "string" && product.image.trim()) {
    return toAbsoluteMediaUrl(product.image);
  }

  return "";
}

function normalizeExistingImages(product) {
  if (Array.isArray(product?.images)) {
    const out = [];
    const seen = new Set();

    for (const raw of product.images) {
      const image = normalizeImageObject(raw);
      if (!image?.url) continue;

      const key = image.url.toLowerCase();
      if (seen.has(key)) continue;

      seen.add(key);
      out.push(image);
    }

    if (out.length) return out;
  }

  const fallback = [];

  if (typeof product?.thumbnail === "string" && product.thumbnail.trim()) {
    fallback.push(
      normalizeImageObject({
        url: product.thumbnail.trim(),
      })
    );
  }

  if (typeof product?.image === "string" && product.image.trim()) {
    fallback.push(
      normalizeImageObject({
        url: product.image.trim(),
      })
    );
  }

  return fallback.filter(Boolean);
}

function useLockBodyScroll(active) {
  useEffect(() => {
    if (!active) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

async function copyText(value, successMessage = "Copied") {
  const text = String(value || "").trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Copy failed");
  }
}

function ImageFallback({ className = "", iconSize = 24 }) {
  return (
    <div
      className={`flex h-full w-full items-center justify-center text-gray-400 ${className}`}
    >
      <ImageIcon size={iconSize} />
    </div>
  );
}

function SmartImage({
  src,
  alt,
  className = "",
  fallbackClassName = "",
  fallbackIconSize = 24,
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <ImageFallback
        className={fallbackClassName}
        iconSize={fallbackIconSize}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}

function ProductIdBadge({ id, compact = false }) {
  const text = String(id || "").trim();
  if (!text) return null;

  return (
    <div
      className={[
        "inline-flex max-w-full items-center gap-2 rounded-full border border-gray-200 bg-gray-50",
        compact ? "px-2.5 py-1 text-[11px]" : "px-3 py-1.5 text-xs",
      ].join(" ")}
    >
      <Hash size={compact ? 12 : 14} className="text-gray-500" />
      <span className="truncate font-mono text-gray-700">{text}</span>
      <button
        type="button"
        onClick={() => copyText(text, "Product ID copied")}
        className="rounded-full p-1 text-gray-500 transition hover:bg-white hover:text-gray-800"
        title="Copy Product ID"
      >
        <Copy size={compact ? 11 : 12} />
      </button>
    </div>
  );
}

function ProductActionModal({
  open,
  product,
  busy,
  onClose,
  onPrimaryAction,
  onPermanentDelete,
}) {
  useLockBodyScroll(open);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose?.();
    }

    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, busy]);

  if (!open) return null;

  const title = product?.title || product?.name || "this product";
  const productId = String(product?._id || "").trim();
  const isInactive = product?.isActive === false;

  const primaryTitle = isInactive ? "Make active again" : "Hide from store";
  const primaryDescription = isInactive
    ? "This will make the product visible in active lists again so it can be managed and sold normally."
    : "This keeps the product in your database but removes it from active catalog views. This is the safer option for products already used in orders or promotions.";
  const primaryButtonLabel = isInactive
    ? "Restore product"
    : "Deactivate product";
  const PrimaryIcon = isInactive ? RotateCcw : EyeOff;
  const primaryButtonClass = isInactive
    ? "border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700"
    : "border-gray-900 bg-gray-900 text-white hover:bg-black";

  return (
    <div
      className="fixed inset-0 z-[72] bg-black/55 p-3 backdrop-blur-[2px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-xl overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-2xl">
          <div className="border-b border-gray-100 px-4 py-5 sm:px-6">
            <div className="flex items-start gap-3">
              <div
                className={[
                  "rounded-2xl p-3",
                  isInactive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600",
                ].join(" ")}
              >
                {isInactive ? <RotateCcw size={20} /> : <AlertTriangle size={20} />}
              </div>

              <div className="min-w-0">
                <div className="text-lg font-semibold text-gray-950">
                  {isInactive ? "Manage inactive product" : "Manage product visibility"}
                </div>
                <div className="mt-1 text-sm leading-6 text-gray-600">
                  {isInactive
                    ? "This product is currently inactive. You can restore it or remove it permanently."
                    : "Choose whether you want to hide this product from the storefront or remove it permanently."}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 px-4 py-5 sm:px-6">
            <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="text-base font-semibold text-gray-900">{title}</div>
              {productId ? (
                <div className="mt-3">
                  <ProductIdBadge id={productId} />
                </div>
              ) : null}
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">{primaryTitle}</div>
              <div className="mt-1 text-sm leading-6 text-gray-600">
                {primaryDescription}
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={onPrimaryAction}
                className={[
                  "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                  primaryButtonClass,
                ].join(" ")}
              >
                <PrimaryIcon size={18} />
                {primaryButtonLabel}
              </button>
            </div>

            <div className="rounded-[24px] border border-red-200 bg-red-50 p-4">
              <div className="text-sm font-semibold text-red-800">
                Delete permanently
              </div>
              <div className="mt-1 text-sm leading-6 text-red-700">
                This removes the product completely. If the product is already linked to orders or promotions, permanent deletion will be blocked automatically.
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={onPermanentDelete}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100"
              >
                <Trash2 size={18} />
                Delete permanently
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 px-4 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function normalizeMasterCategories(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => ({
      id: String(item?.id || "").trim(),
      name: String(item?.name || "").trim(),
      slug: String(item?.slug || "").trim(),
      isActive: item?.isActive !== false,
      featured: Boolean(item?.featured),
      image: String(item?.image || "").trim(),
      iconKey: String(item?.iconKey || "").trim(),
      sortOrder: Number.isFinite(Number(item?.sortOrder)) ? Number(item.sortOrder) : 0,
    }))
    .filter((item) => item.name)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function ProductModal({
  open,
  mode,
  initial,
  onClose,
  onSubmit,
  busy,
  categories = [],
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("0");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [compareAtPrice, setCompareAtPrice] = useState("");

  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;

    const product = initial || {};
    setTitle(product.title || "");
    setDescription(product.description || "");
    setPrice(product.price != null ? String(product.price) : "0");
    setStock(product.stock != null ? String(product.stock) : "0");
    setCategory(product.category || "");
    setBrand(product.brand || "");
    setExistingImages(normalizeExistingImages(product));
    setNewFiles([]);
    setCompareAtPrice(
      product.compareAtPrice != null && Number(product.compareAtPrice) > 0
        ? String(product.compareAtPrice)
        : ""
    );
  }, [open, initial]);

  useEffect(() => {
    const urls = newFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape" && !busy) onClose?.();
    }

    if (open) document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, busy]);

  if (!open) return null;

  const isCreate = mode === "create";
  const productId = String(initial?._id || "").trim();

  const allPreviewImages = [
    ...existingImages.map((image) => toAbsoluteMediaUrl(image?.url)).filter(Boolean),
    ...previewUrls,
  ];

  const activeCategories = categories.filter((item) => item.isActive);
  const selectedCategoryMissing =
    category &&
    !categories.some(
      (item) => item.name.toLowerCase() === String(category).trim().toLowerCase()
    );

  function onPickFiles(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    const validFiles = [];
    const invalidFiles = [];

    for (const file of files) {
      const type = String(file.type || "").toLowerCase().trim();
      const name = String(file.name || "").toLowerCase().trim();
      const hasValidExtension = allowedExtensions.some((ext) =>
        name.endsWith(ext)
      );

      if (allowedTypes.includes(type) || hasValidExtension) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name || "Unknown file");
      }
    }

    if (invalidFiles.length) {
      toast.error("Some files were skipped", {
        description: `Only JPG, PNG, and WEBP are allowed. Skipped: ${invalidFiles.join(
          ", "
        )}`,
      });
    }

    if (!validFiles.length) return;

    setNewFiles((prev) => [...prev, ...validFiles].slice(0, 10));
    event.target.value = "";
  }

  function removeExistingImage(index) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function removeNewFile(index) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function validateAndSubmit() {
    const cleanTitle = String(title || "").trim();
    const parsedPrice = price === "" ? 0 : Number(price);
    const parsedCompareAtPrice =
      compareAtPrice === "" ? null : Number(compareAtPrice);
    const parsedStock = stock === "" ? 0 : Number(stock);

    if (!cleanTitle) return toast.error("Title is required.");
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return toast.error("Price must be 0 or greater.");
    }
    if (
      parsedCompareAtPrice != null &&
      (!Number.isFinite(parsedCompareAtPrice) || parsedCompareAtPrice < 0)
    ) {
      return toast.error("Compare price must be 0 or greater.");
    }
    if (
      parsedCompareAtPrice != null &&
      parsedCompareAtPrice > 0 &&
      parsedCompareAtPrice <= parsedPrice
    ) {
      return toast.error("Compare price must be greater than price for a sale.");
    }
    if (!Number.isFinite(parsedStock) || parsedStock < 0) {
      return toast.error("Stock must be 0 or greater.");
    }

    onSubmit({
      title: cleanTitle,
      description: String(description || ""),
      price: parsedPrice,
      compareAtPrice: parsedCompareAtPrice,
      stock: parsedStock,
      category: String(category || "").trim() || null,
      brand: String(brand || "").trim() || null,
      existingImages,
      newFiles,
    });
  }

  return (
    <div
      className="fixed inset-0 z-[65] bg-black/50 p-2 backdrop-blur-[2px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-950 sm:text-xl">
                {isCreate ? "Create product" : "Edit product"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Add or update product information, images and catalog details.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="shrink-0 rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                {!isCreate && productId ? (
                  <div className="rounded-[24px] border border-blue-200 bg-blue-50 p-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                      <Hash size={16} />
                      Product ID
                    </div>
                    <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 rounded-2xl bg-white px-4 py-3 font-mono text-sm text-gray-800 shadow-sm">
                        <div className="truncate">{productId}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyText(productId, "Product ID copied")}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                      >
                        <Copy size={16} />
                        Copy ID
                      </button>
                    </div>

                    <div className="mt-2 text-xs text-blue-800/80">
                      Use this Product ID directly in promotion targeting when needed.
                    </div>
                  </div>
                ) : null}

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Title *</div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Product title"
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Description</div>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description"
                    className="mt-2 min-h-[130px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <label className="block">
                    <div className="text-sm font-medium text-gray-800">Price *</div>
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm font-medium text-gray-800">
                      Compare at price
                    </div>
                    <input
                      type="number"
                      min={0}
                      value={compareAtPrice}
                      onChange={(e) => setCompareAtPrice(e.target.value)}
                      placeholder="Optional sale strike price"
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                    />
                  </label>

                  <label className="block">
                    <div className="text-sm font-medium text-gray-800">Stock</div>
                    <input
                      type="number"
                      min={0}
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block">
                    <div className="text-sm font-medium text-gray-800">Category</div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                    >
                      <option value="">Select category</option>
                      {activeCategories.map((item) => (
                        <option key={item.id || item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>

                    {selectedCategoryMissing ? (
                      <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                        This product uses a category that is no longer in the master registry.
                      </div>
                    ) : null}
                  </label>

                  <label className="block">
                    <div className="text-sm font-medium text-gray-800">Brand</div>
                    <input
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      placeholder="Nike / Apple..."
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                    />
                  </label>
                </div>

                <div className="block">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                    <ImageIcon size={16} />
                    Product images
                  </div>

                  <label
                    htmlFor="product-image-upload"
                    className="mt-2 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-gray-300 bg-white px-4 py-6 text-center transition hover:border-gray-400 hover:bg-gray-50"
                  >
                    <Upload size={22} className="text-gray-500" />
                    <div className="mt-2 text-sm font-medium text-gray-900">
                      Click to upload images
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      JPG, PNG, WEBP — up to 10 images
                    </div>
                  </label>

                  <input
                    id="product-image-upload"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={onPickFiles}
                  />

                  {existingImages.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                        Existing images
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {existingImages.map((image, idx) => (
                          <div
                            key={`existing-${image?.url || idx}-${idx}`}
                            className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm"
                          >
                            <div className="aspect-square bg-gray-100">
                              <SmartImage
                                src={toAbsoluteMediaUrl(image.url)}
                                alt={`Existing ${idx + 1}`}
                                className="h-full w-full object-cover"
                                fallbackClassName="bg-gray-100"
                                fallbackIconSize={24}
                              />
                            </div>

                            <div className="truncate px-2 pt-2 text-[11px] text-gray-500">
                              {image?.filename || `Image ${idx + 1}`}
                            </div>

                            <div className="p-2">
                              <button
                                type="button"
                                onClick={() => removeExistingImage(idx)}
                                disabled={busy}
                                className="w-full rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {newFiles.length > 0 ? (
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                        New images
                      </div>

                      <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {previewUrls.map((src, idx) => (
                          <div
                            key={`new-${src}-${idx}`}
                            className="overflow-hidden rounded-[22px] border border-gray-200 bg-white shadow-sm"
                          >
                            <div className="aspect-square bg-gray-100">
                              <SmartImage
                                src={src}
                                alt={`New ${idx + 1}`}
                                className="h-full w-full object-cover"
                                fallbackClassName="bg-gray-100"
                                fallbackIconSize={24}
                              />
                            </div>

                            <div className="truncate px-2 pt-2 text-[11px] text-gray-500">
                              {newFiles[idx]?.name || `Image ${idx + 1}`}
                            </div>

                            <div className="p-2">
                              <button
                                type="button"
                                onClick={() => removeNewFile(idx)}
                                disabled={busy}
                                className="w-full rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-2 text-xs text-gray-500">
                    Existing images remain unless removed. New images are uploaded when you
                    save.
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="rounded-[28px] border border-gray-200 bg-gray-50/80 p-4 sm:p-5">
                  <div className="text-sm font-semibold text-gray-900">Live preview</div>

                  <div className="mt-4 overflow-hidden rounded-[24px] border border-gray-200 bg-white shadow-sm">
                    <div className="aspect-[4/3] bg-gray-100">
                      {allPreviewImages[0] ? (
                        <SmartImage
                          src={allPreviewImages[0]}
                          alt="Preview"
                          className="h-full w-full object-cover"
                          fallbackClassName="bg-gray-100"
                          fallbackIconSize={28}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <ImageIcon size={28} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="line-clamp-2 text-sm font-semibold text-gray-950">
                        {title.trim() || "Product title preview"}
                      </div>

                      <div className="text-xs leading-5 text-gray-500">
                        {description.trim() ||
                          "Short description preview will appear here."}
                      </div>

                      {!isCreate && productId ? (
                        <div>
                          <ProductIdBadge id={productId} />
                        </div>
                      ) : null}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <div className="text-gray-500">Price</div>
                          <div className="mt-1 font-semibold text-gray-900">
                            ৳{money(price)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <div className="text-gray-500">Compare</div>
                          <div className="mt-1 font-semibold text-gray-900">
                            {compareAtPrice ? `৳${money(compareAtPrice)}` : "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <div className="text-gray-500">Stock</div>
                          <div className="mt-1 font-semibold text-gray-900">
                            {money(stock)}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <div className="text-gray-500">Sale status</div>
                          <div className="mt-1 truncate font-semibold text-gray-900">
                            {compareAtPrice &&
                            Number(compareAtPrice) > Number(price || 0)
                              ? "Flash sale eligible"
                              : "Regular price"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <div className="text-gray-500">Category</div>
                          <div className="mt-1 truncate font-semibold text-gray-900">
                            {category.trim() || "-"}
                          </div>
                        </div>

                        <div className="rounded-2xl bg-gray-50 px-3 py-2">
                          <div className="text-gray-500">Brand</div>
                          <div className="mt-1 truncate font-semibold text-gray-900">
                            {brand.trim() || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-gray-500">
                        Images added:{" "}
                        <span className="font-semibold text-gray-800">
                          {allPreviewImages.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isCreate ? (
                    <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                        <Check size={16} />
                        Promotion ready
                      </div>
                      <div className="mt-1 text-xs leading-5 text-emerald-800/90">
                        This Product ID can now be copied directly from here and used inside the Promotions page.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={validateAndSubmit}
                disabled={busy}
                className={[
                  "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-auto",
                  busy
                    ? "cursor-not-allowed bg-gray-200 text-gray-600"
                    : "bg-black text-white hover:bg-gray-900",
                ].join(" ")}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <Save size={18} />
                    Save product
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 8 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-gray-100 last:border-b-0">
          <td className="px-4 py-4">
            <div className="skeleton h-4 w-56 rounded-lg" />
            <div className="mt-2 skeleton h-3 w-36 rounded-lg" />
          </td>
          <td className="px-4 py-4">
            <div className="skeleton h-4 w-16 rounded-lg" />
          </td>
          <td className="px-4 py-4">
            <div className="skeleton h-4 w-14 rounded-lg" />
          </td>
          <td className="px-4 py-4">
            <div className="skeleton h-4 w-24 rounded-lg" />
          </td>
          <td className="px-4 py-4">
            <div className="skeleton h-4 w-24 rounded-lg" />
          </td>
          <td className="px-4 py-4">
            <div className="skeleton h-4 w-24 rounded-lg" />
          </td>
          <td className="px-4 py-4">
            <div className="skeleton h-6 w-20 rounded-full" />
          </td>
          <td className="px-4 py-4 text-right">
            <div className="inline-flex gap-2">
              <div className="skeleton h-11 w-11 rounded-2xl" />
              <div className="skeleton h-11 w-11 rounded-2xl" />
              <div className="skeleton h-11 w-11 rounded-2xl" />
            </div>
          </td>
        </tr>
      ))}
    </>
  );
}

function MobileCardSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <div className="skeleton h-24 w-24 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-3/4 rounded-lg" />
              <div className="mt-2 skeleton h-4 w-40 rounded-lg" />
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="skeleton h-12 rounded-2xl" />
                <div className="skeleton h-12 rounded-2xl" />
                <div className="skeleton h-12 rounded-2xl" />
                <div className="skeleton h-12 rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ q }) {
  return (
    <div className="rounded-[28px] border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-gray-100 text-gray-500">
        <Package2 size={28} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No products found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {q
          ? `No result matched "${q}". Try another product title or clear filters.`
          : "There are no products to show yet. Create your first product to get started."}
      </p>
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete, onToggle, busy }) {
  const image = getImageSrc(product);
  const label = productLabel(product);
  const productId = String(product?._id || "").trim();
  const isInactive = product?.isActive === false;

  return (
    <div className="rounded-[26px] border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md md:hidden">
      <div className="flex items-start gap-4">
        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          {image ? (
            <SmartImage
              src={image}
              alt={label}
              className="h-full w-full object-cover"
              fallbackClassName="bg-gray-100"
              fallbackIconSize={28}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package2 size={28} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-base font-semibold text-gray-950">
                {label}
              </h3>
              <div className="mt-2">
                <ProductIdBadge id={productId} compact />
              </div>
            </div>

            <button
              type="button"
              onClick={() => onToggle({ id: product._id, isActive: !product.isActive })}
              disabled={busy}
              className={[
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                product.isActive
                  ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {product.isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
              <div className="text-[11px] text-gray-500">Price</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                ৳{money(product.price)}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
              <div className="text-[11px] text-gray-500">Stock</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {money(product.stock)}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
              <div className="text-[11px] text-gray-500">Category</div>
              <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                {product.category || "-"}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2.5">
              <div className="text-[11px] text-gray-500">Brand</div>
              <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                {product.brand || "-"}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => copyText(productId, "Product ID copied")}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Copy size={18} />
            </button>

            <button
              type="button"
              onClick={() => onEdit(product)}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Pencil size={18} />
            </button>

            <button
              type="button"
              onClick={() => onDelete(product)}
              disabled={busy}
              className={[
                "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-semibold transition",
                isInactive
                  ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  : "border-red-200 text-red-600 hover:bg-red-50",
              ].join(" ")}
            >
              {isInactive ? <RotateCcw size={18} /> : <Trash2 size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

async function uploadSingleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await api.post("/upload/local", formData);
    const data = response?.data || {};

    if (!String(data?.url || "").trim()) {
      throw new Error("Image upload failed.");
    }

    return {
      fileId: data?.fileId ? String(data.fileId).trim() : null,
      url: String(data.url || "").trim(),
      filename: data?.filename ? String(data.filename).trim() : null,
      mimetype: data?.mimetype ? String(data.mimetype).trim() : null,
      size: Number.isFinite(Number(data?.size)) ? Number(data.size) : 0,
      width: Number.isFinite(Number(data?.width)) ? Number(data.width) : null,
      height: Number.isFinite(Number(data?.height)) ? Number(data.height) : null,
      format: data?.format ? String(data.format).trim() : null,
    };
  } catch (err) {
    throw new Error(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to upload image."
    );
  }
}

async function uploadImages(files) {
  const list = Array.isArray(files) ? files : [];
  if (!list.length) return [];

  const uploaded = [];
  for (const file of list) {
    const image = await uploadSingleImage(file);
    uploaded.push(image);
  }

  return uploaded;
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [isActive, setIsActive] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editing, setEditing] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  const { data: shopCfgDoc } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60000,
  });

  const masterCategories = useMemo(
    () => normalizeMasterCategories(shopCfgDoc?.data?.categories),
    [shopCfgDoc?.data?.categories]
  );

  useEffect(() => {
    const id = setTimeout(() => setQ(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [q, isActive]);

  const params = useMemo(() => {
    const next = { page, limit };
    if (q) next.q = q;
    if (isActive !== "") next.isActive = isActive;
    return next;
  }, [page, limit, q, isActive]);

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["admin-products", params],
    queryFn: async ({ signal }) =>
      (await api.get("/products/admin", { params, signal })).data,
    staleTime: 30000,
    placeholderData: (previous) => previous,
  });

  const items = data?.products || [];
  const total = data?.total || 0;
  const pages = Math.max(1, data?.pages || 1);

  useEffect(() => {
    const nextPage = page + 1;
    if (nextPage > pages) return;

    const nextParams = { ...params, page: nextPage };

    queryClient.prefetchQuery({
      queryKey: ["admin-products", nextParams],
      queryFn: async ({ signal }) =>
        (await api.get("/products/admin", { params: nextParams, signal })).data,
      staleTime: 30000,
    });
  }, [page, pages, params, queryClient]);

  function openCreate() {
    setModalMode("create");
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product) {
    setModalMode("edit");
    setEditing(product);
    setModalOpen(true);
  }

  function patchAdminProductsCache(updater) {
    queryClient.setQueriesData({ queryKey: ["admin-products"] }, (old) => {
      if (!old) return old;

      try {
        return updater(old);
      } catch {
        return old;
      }
    });
  }

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const uploadedImages = await uploadImages(payload?.newFiles || []);
      const finalPayload = {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        compareAtPrice: payload.compareAtPrice,
        stock: payload.stock,
        category: payload.category,
        brand: payload.brand,
        images: [...(payload.existingImages || []), ...uploadedImages],
      };

      return (await api.post("/products", finalPayload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setModalOpen(false);
      toast.success("Product created");
    },
    onError: (err) => {
      toast.error("Create failed", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to create product.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const uploadedImages = await uploadImages(payload?.newFiles || []);
      const finalPayload = {
        title: payload.title,
        description: payload.description,
        price: payload.price,
        compareAtPrice: payload.compareAtPrice,
        stock: payload.stock,
        category: payload.category,
        brand: payload.brand,
        images: [...(payload.existingImages || []), ...uploadedImages],
      };

      return (await api.patch(`/products/${id}`, finalPayload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setModalOpen(false);
      toast.success("Product updated");
    },
    onError: (err) => {
      toast.error("Update failed", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to update product.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/products/${id}`)).data,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["admin-products"] });

      patchAdminProductsCache((old) => ({
        ...old,
        products: Array.isArray(old.products)
          ? old.products.filter((product) => product._id !== id)
          : old.products,
        total:
          Number(old.total || 0) > 0 ? Number(old.total || 0) - 1 : old.total,
      }));

      return { snapshot };
    },
    onError: (err, _id, context) => {
      if (context?.snapshot) {
        for (const [key, value] of context.snapshot) {
          queryClient.setQueryData(key, value);
        }
      }

      toast.error("Hide failed", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Could not update product visibility.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Product moved to inactive");
    },
  });

  const permanentDeleteMutation = useMutation({
    mutationFn: async (id) =>
      (await api.delete(`/products/admin/${id}/permanent`)).data,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["admin-products"] });

      patchAdminProductsCache((old) => ({
        ...old,
        products: Array.isArray(old.products)
          ? old.products.filter((product) => product._id !== id)
          : old.products,
        total:
          Number(old.total || 0) > 0 ? Number(old.total || 0) - 1 : old.total,
      }));

      return { snapshot };
    },
    onError: (err, _id, context) => {
      if (context?.snapshot) {
        for (const [key, value] of context.snapshot) {
          queryClient.setQueryData(key, value);
        }
      }

      toast.error("Permanent delete failed", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to permanently delete product.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.success("Product permanently deleted");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive: nextIsActive }) =>
      (await api.patch(`/products/${id}`, { isActive: nextIsActive })).data,
    onMutate: async ({ id, isActive: nextIsActive }) => {
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });
      const snapshot = queryClient.getQueriesData({ queryKey: ["admin-products"] });

      patchAdminProductsCache((old) => ({
        ...old,
        products: Array.isArray(old.products)
          ? old.products.map((product) =>
              product._id === id ? { ...product, isActive: nextIsActive } : product
            )
          : old.products,
      }));

      return { snapshot };
    },
    onError: (err, _vars, context) => {
      if (context?.snapshot) {
        for (const [key, value] of context.snapshot) {
          queryClient.setQueryData(key, value);
        }
      }

      toast.error("Status update failed", {
        description:
          err?.response?.data?.message || err?.message || "Update failed.",
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      toast.message("Status updated", {
        description: variables?.isActive
          ? "Product is active again."
          : "Product is now inactive.",
      });
    },
  });

  function submitModal(payload) {
    const cleanTitle = String(payload?.title || "").trim();
    if (!cleanTitle) return toast.error("Title is required.");

    if (modalMode === "create") {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate({ id: editing?._id, payload });
    }
  }

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    permanentDeleteMutation.isPending ||
    toggleActiveMutation.isPending;

  return (
    <div className="rounded-[30px] border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <Package2 size={14} />
            Product Management
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
            Products
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage your catalog, keep products up to date, and control what stays visible in the storefront.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:w-auto"
        >
          <Plus size={18} />
          Create product
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr),220px,auto] xl:items-center">
        <div className="w-full">
          <div className="flex items-center gap-2 rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm transition focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2">
            <Search size={18} className="shrink-0 opacity-60" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title..."
              aria-label="Search products"
              className="w-full min-w-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
            />

            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label="Clear search"
                className="rounded-xl p-2 transition hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        <select
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
          aria-label="Filter status"
          className="w-full rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <div className="rounded-[22px] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm xl:justify-self-end">
          {isFetching ? "Updating..." : `Total: ${total}`}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-gray-100 p-2.5 text-gray-700">
              <Boxes size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-500">All products</div>
              <div className="mt-1 text-lg font-semibold text-gray-950">
                {total}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-green-50 p-2.5 text-green-700">
              <Layers3 size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-500">Current page</div>
              <div className="mt-1 text-lg font-semibold text-gray-950">
                {page} / {pages}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-2.5 text-blue-700">
              <Tag size={18} />
            </div>
            <div>
              <div className="text-xs text-gray-500">View</div>
              <div className="mt-1 text-lg font-semibold text-gray-950">
                {isActive === ""
                  ? "All products"
                  : isActive === "true"
                  ? "Active only"
                  : "Inactive only"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {isError ? (
        <div className="mt-4 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">Couldn’t load products</div>
          <div className="mt-1 opacity-90">
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load products."}
          </div>
        </div>
      ) : null}

      <div className="mt-5 md:hidden">
        {isPending && items.length === 0 ? (
          <MobileCardSkeleton rows={5} />
        ) : !isPending && items.length === 0 ? (
          <EmptyState q={q} />
        ) : (
          <div className="space-y-3">
            {items.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={openEdit}
                onDelete={(targetProduct) => {
                  setConfirmTarget(targetProduct);
                  setConfirmOpen(true);
                }}
                onToggle={(vars) => toggleActiveMutation.mutate(vars)}
                busy={busy}
              />
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 hidden overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                <th className="px-4 py-4 font-semibold">Product</th>
                <th className="px-4 py-4 font-semibold">Price</th>
                <th className="px-4 py-4 font-semibold">Stock</th>
                <th className="px-4 py-4 font-semibold">Category</th>
                <th className="px-4 py-4 font-semibold">Brand</th>
                <th className="px-4 py-4 font-semibold">Sale</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isPending && items.length === 0 ? <TableSkeleton rows={8} /> : null}

              {!isPending && items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10">
                    <EmptyState q={q} />
                  </td>
                </tr>
              ) : null}

              {items.map((product) => {
                const label = productLabel(product);
                const image = getImageSrc(product);
                const productId = String(product?._id || "").trim();
                const isInactive = product?.isActive === false;

                return (
                  <tr
                    key={product._id}
                    className="border-b border-gray-100 transition hover:bg-gray-50/70 last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                          {image ? (
                            <SmartImage
                              src={image}
                              alt={label}
                              className="h-full w-full object-cover"
                              fallbackClassName="bg-gray-100"
                              fallbackIconSize={20}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-gray-400">
                              <Package2 size={20} />
                            </div>
                          )}
                        </div>

                        <div className="max-w-[420px] min-w-0">
                          <div className="line-clamp-2 font-medium text-gray-900">
                            {label}
                          </div>
                          <div className="mt-2">
                            <ProductIdBadge id={productId} compact />
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 font-medium text-gray-900">
                      ৳{money(product.price)}
                    </td>
                    <td className="px-4 py-4 font-medium text-gray-900">
                      {money(product.stock)}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {product.category || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {product.brand || "-"}
                    </td>
                    <td className="px-4 py-4 text-gray-700">
                      {Number(product.compareAtPrice || 0) >
                      Number(product.price || 0)
                        ? `৳${money(product.compareAtPrice)}`
                        : "-"}
                    </td>

                    <td className="px-4 py-4">
                      <button
                        type="button"
                        title="Toggle status"
                        disabled={busy}
                        onClick={() =>
                          toggleActiveMutation.mutate({
                            id: product._id,
                            isActive: !product.isActive,
                          })
                        }
                        className={[
                          "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          product.isActive
                            ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                            : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
                        ].join(" ")}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="inline-flex justify-end gap-2">
                        <button
                          type="button"
                          title="Copy Product ID"
                          disabled={busy}
                          onClick={() => copyText(productId, "Product ID copied")}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <Copy size={20} strokeWidth={2.2} />
                        </button>

                        <button
                          type="button"
                          title="Edit"
                          disabled={busy}
                          onClick={() => openEdit(product)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <Pencil size={20} strokeWidth={2.2} />
                        </button>

                        <button
                          type="button"
                          title={isInactive ? "Restore or delete" : "Hide or delete"}
                          disabled={busy}
                          onClick={() => {
                            setConfirmTarget(product);
                            setConfirmOpen(true);
                          }}
                          className={[
                            "inline-flex h-11 w-11 items-center justify-center rounded-2xl border bg-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                            isInactive
                              ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                              : "border-red-200 text-red-600 hover:bg-red-50",
                          ].join(" ")}
                        >
                          {isInactive ? (
                            <RotateCcw size={20} strokeWidth={2.2} />
                          ) : (
                            <Trash2 size={20} strokeWidth={2.2} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-500">
          Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
          <span className="font-semibold text-gray-900">{pages}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => clamp(prev - 1, 1, pages))}
            disabled={page <= 1}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:flex-none"
          >
            <ChevronLeft size={16} />
            Prev
          </button>

          <button
            type="button"
            onClick={() => setPage((prev) => clamp(prev + 1, 1, pages))}
            disabled={page >= pages}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 sm:flex-none"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <ProductModal
        open={modalOpen}
        mode={modalMode}
        initial={editing}
        onClose={() => setModalOpen(false)}
        onSubmit={submitModal}
        busy={createMutation.isPending || updateMutation.isPending}
        categories={masterCategories}
      />

      <ProductActionModal
        open={confirmOpen}
        product={confirmTarget}
        busy={deleteMutation.isPending || permanentDeleteMutation.isPending || toggleActiveMutation.isPending}
        onClose={() => {
          if (
            deleteMutation.isPending ||
            permanentDeleteMutation.isPending ||
            toggleActiveMutation.isPending
          ) {
            return;
          }
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onPrimaryAction={() => {
          if (!confirmTarget?._id) return;

          if (confirmTarget.isActive === false) {
            toggleActiveMutation.mutate(
              { id: confirmTarget._id, isActive: true },
              {
                onSettled: () => {
                  setConfirmOpen(false);
                  setConfirmTarget(null);
                },
              }
            );
            return;
          }

          deleteMutation.mutate(confirmTarget._id, {
            onSettled: () => {
              setConfirmOpen(false);
              setConfirmTarget(null);
            },
          });
        }}
        onPermanentDelete={() => {
          if (!confirmTarget?._id) return;

          permanentDeleteMutation.mutate(confirmTarget._id, {
            onSettled: () => {
              setConfirmOpen(false);
              setConfirmTarget(null);
            },
          });
        }}
      />
    </div>
  );
}