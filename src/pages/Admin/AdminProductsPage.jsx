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

function ConfirmModal({
  open,
  title = "Confirm action",
  description,
  confirmText = "Confirm",
  tone = "danger",
  onClose,
  onConfirm,
  busy,
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

  const confirmClass =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-black text-white hover:bg-gray-900";

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 p-3 backdrop-blur-[2px] sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
            <div className="min-w-0">
              <div className="text-base font-semibold text-gray-950 sm:text-lg">
                {title}
              </div>
              {description ? (
                <div className="mt-1 text-sm leading-6 text-gray-600">
                  {description}
                </div>
              ) : null}
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

          <div className="flex items-center justify-end gap-3 px-4 py-4 sm:px-5">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={[
                "rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                confirmClass,
                busy ? "cursor-not-allowed opacity-70" : "",
              ].join(" ")}
            >
              {busy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="animate-spin" size={16} />
                  Working...
                </span>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ open, mode, initial, onClose, onSubmit, busy }) {
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
  const allPreviewImages = [
    ...existingImages.map((image) => toAbsoluteMediaUrl(image?.url)).filter(Boolean),
    ...previewUrls,
  ];

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
                    <input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="Men / Women / Accessories..."
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm transition focus:border-gray-300 focus:ring-2 focus:ring-black focus:ring-offset-2"
                    />
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
            <div className="mt-2 skeleton h-3 w-20 rounded-lg" />
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
              <div className="skeleton h-9 w-10 rounded-2xl" />
              <div className="skeleton h-9 w-10 rounded-2xl" />
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
            <div className="skeleton h-20 w-20 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <div className="skeleton h-4 w-3/4 rounded-lg" />
              <div className="mt-2 skeleton h-3 w-20 rounded-lg" />
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

  return (
    <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md md:hidden">
      <div className="flex items-start gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
          {image ? (
            <SmartImage
              src={image}
              alt={label}
              className="h-full w-full object-cover"
              fallbackClassName="bg-gray-100"
              fallbackIconSize={24}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Package2 size={24} />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="line-clamp-2 text-sm font-semibold text-gray-950">
                {label}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                #{String(product._id).slice(-6)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => onToggle({ id: product._id, isActive: !product.isActive })}
              disabled={busy}
              className={[
                "shrink-0 rounded-full border px-3 py-1 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                product.isActive
                  ? "border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                  : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
              ].join(" ")}
            >
              {product.isActive ? "Active" : "Inactive"}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Price</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                ৳{money(product.price)}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Stock</div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {money(product.stock)}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Category</div>
              <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                {product.category || "-"}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Brand</div>
              <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                {product.brand || "-"}
              </div>
            </div>

            <div className="rounded-2xl bg-gray-50 px-3 py-2">
              <div className="text-[11px] text-gray-500">Sale</div>
              <div className="mt-1 truncate text-sm font-semibold text-gray-900">
                {Number(product?.compareAtPrice || 0) > Number(product?.price || 0)
                  ? `৳${money(product.compareAtPrice)}`
                  : "-"}
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onEdit(product)}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Pencil size={16} />
              Edit
            </button>

            <button
              type="button"
              onClick={() => onDelete(product)}
              disabled={busy}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Trash2 size={16} />
              Deactivate
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
    staleTime: 30_000,
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
      staleTime: 30_000,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pages, q, isActive]);

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

      toast.error("Deactivate failed", {
        description:
          err?.response?.data?.message ||
          err?.message ||
          "Failed to deactivate product.",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deactivated");
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
        description: err?.response?.data?.message || err?.message || "Update failed.",
      });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.message("Status updated", {
        description: variables?.isActive
          ? "Product is now active."
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
            Create, update, activate or deactivate products displayed in your
            store catalog.
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
              <div className="text-xs text-gray-500">Filter</div>
              <div className="mt-1 text-lg font-semibold text-gray-950">
                {isActive === ""
                  ? "All status"
                  : isActive === "true"
                  ? "Active"
                  : "Inactive"}
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
          <table className="w-full min-w-[960px]">
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

                        <div className="max-w-[360px] min-w-0">
                          <div className="line-clamp-2 font-medium text-gray-900">
                            {label}
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            #{String(product._id).slice(-6)}
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
                          title="Edit"
                          disabled={busy}
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <Pencil size={18} />
                        </button>

                        <button
                          type="button"
                          title="Deactivate"
                          disabled={busy}
                          onClick={() => {
                            setConfirmTarget(product);
                            setConfirmOpen(true);
                          }}
                          className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-3 py-2 text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <Trash2 size={18} />
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
      />

      <ConfirmModal
        open={confirmOpen}
        title="Deactivate product?"
        description={
          confirmTarget
            ? `This will deactivate "${
                confirmTarget.title || confirmTarget.name || "this product"
              }".`
            : "This action will hide the product from the active catalog."
        }
        confirmText="Deactivate"
        tone="danger"
        busy={deleteMutation.isPending}
        onClose={() => {
          if (deleteMutation.isPending) return;
          setConfirmOpen(false);
          setConfirmTarget(null);
        }}
        onConfirm={() => {
          if (!confirmTarget?._id) return;

          deleteMutation.mutate(confirmTarget._id, {
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