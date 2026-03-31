import React, { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Tag,
  Plus,
  Search,
  X,
  Loader2,
  Pencil,
  Trash2,
  Power,
  Clock3,
  TicketPercent,
  BadgePercent,
  CalendarRange,
  Sparkles,
  Check,
  Copy,
  Hash,
  Package2,
  Shapes,
  BadgeInfo,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function formatMoney(n) {
  const v = Number(n || 0);
  if (!Number.isFinite(v)) return "৳0";
  return `৳${Math.round(v)}`;
}

function formatDateTime(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "-";
  return d.toLocaleString();
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong."
  );
}

function getStatusBadgeClass(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "scheduled":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "expired":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "inactive":
    default:
      return "border-gray-200 bg-gray-50 text-gray-700";
  }
}

function isObjectId(value) {
  return /^[0-9a-fA-F]{24}$/.test(String(value || "").trim());
}

function uniqueNormalizedList(list = [], options = {}) {
  const {
    transform = (value) => normalizeText(value),
    compare = (value) => String(value || "").toLowerCase(),
    limit = 200,
  } = options;

  const out = [];
  const seen = new Set();

  for (const raw of Array.isArray(list) ? list : []) {
    const value = transform(raw);
    if (!value) continue;

    const key = compare(value);
    if (!key || seen.has(key)) continue;

    seen.add(key);
    out.push(value);

    if (out.length >= limit) break;
  }

  return out;
}

function parseCsvLines(value) {
  return String(value || "")
    .split(",")
    .map((x) => normalizeText(x))
    .filter(Boolean);
}

function parseManualIds(value) {
  return uniqueNormalizedList(parseCsvLines(value), {
    transform: (x) => String(x || "").trim(),
    compare: (x) => String(x || "").trim().toLowerCase(),
    limit: 200,
  });
}

function defaultForm() {
  return {
    name: "",
    description: "",
    type: "coupon",
    discountType: "percentage",
    code: "",
    value: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    appliesTo: "all",
    target: {
      productIds: [],
      categories: [],
      brands: [],
    },
    startAt: "",
    endAt: "",
    isActive: true,
    stackable: false,
    usageLimit: "",
    usageLimitPerUser: "",
  };
}

function toLocalDatetimeInput(value) {
  if (!value) return "";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "";
  const pad = (x) => String(x).padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeFormFromPromotion(item) {
  return {
    name: item?.name || "",
    description: item?.description || "",
    type: item?.type || "coupon",
    discountType: item?.discountType || "percentage",
    code: item?.code || "",
    value: item?.value != null ? String(item.value) : "",
    minOrderAmount:
      item?.minOrderAmount != null ? String(item.minOrderAmount) : "",
    maxDiscountAmount:
      item?.maxDiscountAmount != null ? String(item.maxDiscountAmount) : "",
    appliesTo: item?.appliesTo || "all",
    target: {
      productIds: uniqueNormalizedList(item?.target?.productIds || [], {
        transform: (x) => String(x || "").trim(),
        compare: (x) => String(x || "").trim().toLowerCase(),
        limit: 200,
      }),
      categories: uniqueNormalizedList(item?.target?.categories || [], {
        transform: (x) => normalizeText(x),
        compare: (x) => normalizeText(x).toLowerCase(),
        limit: 100,
      }),
      brands: uniqueNormalizedList(item?.target?.brands || [], {
        transform: (x) => normalizeText(x),
        compare: (x) => normalizeText(x).toLowerCase(),
        limit: 100,
      }),
    },
    startAt: toLocalDatetimeInput(item?.startAt),
    endAt: toLocalDatetimeInput(item?.endAt),
    isActive: item?.isActive !== false,
    stackable: item?.stackable === true,
    usageLimit: item?.usageLimit != null ? String(item.usageLimit) : "",
    usageLimitPerUser:
      item?.usageLimitPerUser != null ? String(item.usageLimitPerUser) : "",
  };
}

async function copyText(value, label = "Copied") {
  const text = String(value || "").trim();
  if (!text) return;

  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error("Copy failed");
  }
}

function TargetChip({ label, onRemove, onCopy, tone = "default" }) {
  const toneClass =
    tone === "product"
      ? "border-blue-200 bg-blue-50 text-blue-800"
      : tone === "category"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "brand"
      ? "border-violet-200 bg-violet-50 text-violet-800"
      : "border-gray-200 bg-gray-50 text-gray-800";

  return (
    <div
      className={cx(
        "inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
        toneClass
      )}
    >
      <span className="truncate">{label}</span>

      {onCopy ? (
        <button
          type="button"
          onClick={onCopy}
          className="rounded-full p-1 transition hover:bg-white/70"
          title="Copy"
        >
          <Copy size={12} />
        </button>
      ) : null}

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="rounded-full p-1 transition hover:bg-white/70"
          title="Remove"
        >
          <X size={12} />
        </button>
      ) : null}
    </div>
  );
}

function SelectionPanel({
  icon: Icon,
  title,
  hint,
  children,
  tone = "default",
}) {
  const toneClass =
    tone === "product"
      ? "bg-blue-50 text-blue-700"
      : tone === "category"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "brand"
      ? "bg-violet-50 text-violet-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div className="rounded-[26px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className={cx("rounded-2xl p-2.5", toneClass)}>
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-gray-900">{title}</div>
          {hint ? (
            <div className="mt-1 text-xs leading-5 text-gray-500">{hint}</div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProductSuggestionCard({ product, onSelect, selected }) {
  const productId = String(product?._id || "").trim();
  const title = product?.title || "Untitled";
  const category = normalizeText(product?.category);
  const brand = normalizeText(product?.brand);
  const price = Number(product?.price || 0);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(product)}
      className={cx(
        "w-full rounded-[22px] border px-4 py-3 text-left transition",
        selected
          ? "border-blue-300 bg-blue-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="line-clamp-1 text-sm font-semibold text-gray-900">
            {title}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
            <span className="rounded-full bg-gray-100 px-2 py-1">
              ID: {productId}
            </span>
            {category ? (
              <span className="rounded-full bg-gray-100 px-2 py-1">
                {category}
              </span>
            ) : null}
            {brand ? (
              <span className="rounded-full bg-gray-100 px-2 py-1">
                {brand}
              </span>
            ) : null}
            <span className="rounded-full bg-gray-100 px-2 py-1">
              {formatMoney(price)}
            </span>
          </div>
        </div>

        <div
          className={cx(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
            selected
              ? "border-blue-300 bg-blue-100 text-blue-700"
              : "border-gray-200 bg-white text-gray-500"
          )}
        >
          {selected ? <Check size={16} /> : <Plus size={16} />}
        </div>
      </div>
    </button>
  );
}

function ProductIdManualInput({
  value,
  onChange,
  onApply,
  invalidIds = [],
  busy,
}) {
  return (
    <div className="rounded-[22px] border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
        <Hash size={16} />
        Manual Product ID input
      </div>

      <div className="mt-1 text-xs leading-5 text-gray-500">
        You can still paste one or multiple Mongo Product IDs separated by comma.
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="661a1f..., 661a20..., 661a33..."
        className="mt-3 min-h-[92px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
      />

      {invalidIds.length > 0 ? (
        <div className="mt-2 text-xs text-red-600">
          Invalid IDs ignored: {invalidIds.join(", ")}
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onApply}
          disabled={busy}
          className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Add IDs
        </button>
      </div>
    </div>
  );
}

function PromotionModal({
  open,
  initial,
  mode,
  onClose,
  onSubmit,
  busy,
}) {
  const [form, setForm] = useState(defaultForm());

  const [productSearchInput, setProductSearchInput] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [categorySearchInput, setCategorySearchInput] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [brandSearchInput, setBrandSearchInput] = useState("");
  const [brandSearch, setBrandSearch] = useState("");

  const [manualProductIds, setManualProductIds] = useState("");
  const [manualCategoryValue, setManualCategoryValue] = useState("");
  const [manualBrandValue, setManualBrandValue] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initial ? normalizeFormFromPromotion(initial) : defaultForm());
    setProductSearchInput("");
    setProductSearch("");
    setCategorySearchInput("");
    setCategorySearch("");
    setBrandSearchInput("");
    setBrandSearch("");
    setManualProductIds("");
    setManualCategoryValue("");
    setManualBrandValue("");
  }, [open, initial]);

  useEffect(() => {
    const id = setTimeout(
      () => setProductSearch(normalizeText(productSearchInput)),
      300
    );
    return () => clearTimeout(id);
  }, [productSearchInput]);

  useEffect(() => {
    const id = setTimeout(
      () => setCategorySearch(normalizeText(categorySearchInput)),
      250
    );
    return () => clearTimeout(id);
  }, [categorySearchInput]);

  useEffect(() => {
    const id = setTimeout(
      () => setBrandSearch(normalizeText(brandSearchInput)),
      250
    );
    return () => clearTimeout(id);
  }, [brandSearchInput]);

  const appliesToProducts = form.appliesTo === "specific_products";
  const appliesToCategories = form.appliesTo === "categories";
  const appliesToBrands = form.appliesTo === "brands";

  const productLookupQuery = useQuery({
    queryKey: ["promotion-product-lookup", productSearch],
    enabled: open && appliesToProducts,
    queryFn: async ({ signal }) =>
      (
        await api.get("/products/admin", {
          params: {
            q: productSearch || undefined,
            limit: 8,
            page: 1,
          },
          signal,
        })
      ).data,
    staleTime: 30_000,
  });

  const categoryQuery = useQuery({
    queryKey: ["promotion-category-options", categorySearch],
    enabled: open && appliesToCategories,
    queryFn: async ({ signal }) =>
      (
        await api.get("/products/admin/categories", {
          params: { q: categorySearch || undefined },
          signal,
        })
      ).data,
    staleTime: 60_000,
  });

  const facetsQuery = useQuery({
    queryKey: ["promotion-brand-options"],
    enabled: open && appliesToBrands,
    queryFn: async ({ signal }) =>
      (await api.get("/products/facets", { signal })).data,
    staleTime: 60_000,
  });

  const productOptions = Array.isArray(productLookupQuery.data?.products)
    ? productLookupQuery.data.products
    : [];

  const categoryOptions = useMemo(() => {
    const raw = Array.isArray(categoryQuery.data?.categories)
      ? categoryQuery.data.categories
      : [];

    return raw
      .map((item) => normalizeText(item?.name || item?._id))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categoryQuery.data]);

  const brandOptions = useMemo(() => {
    const raw = Array.isArray(facetsQuery.data?.brands)
      ? facetsQuery.data.brands
      : [];

    return raw
      .map((item) => normalizeText(item?.label || item?.value))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [facetsQuery.data]);

  const filteredBrandOptions = useMemo(() => {
    if (!brandSearch) return brandOptions.slice(0, 20);

    return brandOptions
      .filter((item) =>
        item.toLowerCase().includes(String(brandSearch).toLowerCase())
      )
      .slice(0, 20);
  }, [brandOptions, brandSearch]);

  const selectedProductSet = useMemo(
    () =>
      new Set(
        (Array.isArray(form?.target?.productIds) ? form.target.productIds : []).map(
          (id) => String(id || "").trim()
        )
      ),
    [form?.target?.productIds]
  );

  if (!open) return null;

  const isCoupon = form.type === "coupon";
  const isFlashSale = form.type === "flash_sale";
  const usesValue = form.discountType !== "free_shipping";

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function setTargetField(key, value) {
    setForm((prev) => ({
      ...prev,
      target: {
        ...prev.target,
        [key]: value,
      },
    }));
  }

  function addProductId(productId) {
    const cleanId = String(productId || "").trim();
    if (!isObjectId(cleanId)) {
      toast.error("Invalid Product ID");
      return;
    }

    setTargetField(
      "productIds",
      uniqueNormalizedList([...(form.target.productIds || []), cleanId], {
        transform: (x) => String(x || "").trim(),
        compare: (x) => String(x || "").trim().toLowerCase(),
        limit: 200,
      })
    );
  }

  function addCategory(name) {
    const clean = normalizeText(name);
    if (!clean) return;

    setTargetField(
      "categories",
      uniqueNormalizedList([...(form.target.categories || []), clean], {
        transform: (x) => normalizeText(x),
        compare: (x) => normalizeText(x).toLowerCase(),
        limit: 100,
      })
    );
  }

  function addBrand(name) {
    const clean = normalizeText(name);
    if (!clean) return;

    setTargetField(
      "brands",
      uniqueNormalizedList([...(form.target.brands || []), clean], {
        transform: (x) => normalizeText(x),
        compare: (x) => normalizeText(x).toLowerCase(),
        limit: 100,
      })
    );
  }

  function removeTargetItem(key, value) {
    setTargetField(
      key,
      (Array.isArray(form?.target?.[key]) ? form.target[key] : []).filter(
        (item) =>
          String(item || "").toLowerCase() !== String(value || "").toLowerCase()
      )
    );
  }

  function applyManualProductIds() {
    const parsed = parseManualIds(manualProductIds);
    const validIds = parsed.filter((id) => isObjectId(id));
    const invalidIds = parsed.filter((id) => !isObjectId(id));

    if (!validIds.length && invalidIds.length) {
      toast.error("No valid Product ID found");
      return;
    }

    if (!validIds.length) {
      toast.error("Enter at least one valid Product ID");
      return;
    }

    setTargetField(
      "productIds",
      uniqueNormalizedList([...(form.target.productIds || []), ...validIds], {
        transform: (x) => String(x || "").trim(),
        compare: (x) => String(x || "").trim().toLowerCase(),
        limit: 200,
      })
    );

    setManualProductIds("");

    toast.success(
      invalidIds.length
        ? `${validIds.length} Product ID added, ${invalidIds.length} invalid ignored`
        : `${validIds.length} Product ID added`
    );
  }

  function applyManualCategory() {
    const clean = normalizeText(manualCategoryValue);
    if (!clean) return toast.error("Category is required");
    addCategory(clean);
    setManualCategoryValue("");
  }

  function applyManualBrand() {
    const clean = normalizeText(manualBrandValue);
    if (!clean) return toast.error("Brand is required");
    addBrand(clean);
    setManualBrandValue("");
  }

  function validateAndSubmit() {
    const normalizedProductIds = uniqueNormalizedList(form.target.productIds || [], {
      transform: (x) => String(x || "").trim(),
      compare: (x) => String(x || "").trim().toLowerCase(),
      limit: 200,
    }).filter((id) => isObjectId(id));

    const normalizedCategories = uniqueNormalizedList(
      form.target.categories || [],
      {
        transform: (x) => normalizeText(x),
        compare: (x) => normalizeText(x).toLowerCase(),
        limit: 100,
      }
    );

    const normalizedBrands = uniqueNormalizedList(form.target.brands || [], {
      transform: (x) => normalizeText(x),
      compare: (x) => normalizeText(x).toLowerCase(),
      limit: 100,
    });

    const payload = {
      ...form,
      name: normalizeText(form.name),
      description: normalizeText(form.description),
      code: normalizeText(form.code).toUpperCase(),
      value: form.value === "" ? 0 : Number(form.value),
      minOrderAmount:
        form.minOrderAmount === "" ? 0 : Number(form.minOrderAmount),
      maxDiscountAmount:
        form.maxDiscountAmount === "" ? null : Number(form.maxDiscountAmount),
      usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
      usageLimitPerUser:
        form.usageLimitPerUser === "" ? null : Number(form.usageLimitPerUser),
      target: {
        productIds: appliesToProducts ? normalizedProductIds : [],
        categories: appliesToCategories ? normalizedCategories : [],
        brands: appliesToBrands ? normalizedBrands : [],
      },
      startAt: form.startAt || null,
      endAt: form.endAt || null,
    };

    if (!payload.name) {
      return toast.error("Promotion name is required");
    }

    if (payload.type === "coupon" && !payload.code) {
      return toast.error("Coupon code is required");
    }

    if (payload.discountType === "percentage" && Number(payload.value) > 100) {
      return toast.error("Percentage discount cannot exceed 100");
    }

    if (
      payload.endAt &&
      payload.startAt &&
      new Date(payload.endAt) < new Date(payload.startAt)
    ) {
      return toast.error("End date must be after start date");
    }

    if (appliesToProducts && payload.target.productIds.length === 0) {
      return toast.error("Select at least one product or add a valid Product ID");
    }

    if (appliesToCategories && payload.target.categories.length === 0) {
      return toast.error("Select at least one category");
    }

    if (appliesToBrands && payload.target.brands.length === 0) {
      return toast.error("Select at least one brand");
    }

    onSubmit(payload);
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/50 p-3 backdrop-blur-[2px] sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose?.();
      }}
    >
      <div className="flex min-h-full items-center justify-center">
        <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <h3 className="text-lg font-semibold text-gray-950 sm:text-xl">
                {mode === "edit" ? "Edit promotion" : "Create promotion"}
              </h3>
              <p className="mt-1 text-sm leading-6 text-gray-500">
                Configure flash sales, coupon codes, automatic discount rules and campaign timing.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="shrink-0 rounded-2xl p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <label className="block">
                <div className="text-sm font-medium text-gray-800">Promotion name *</div>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="Weekend Flash Sale"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Promotion type</div>
                <select
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  <option value="coupon">Coupon</option>
                  <option value="flash_sale">Flash Sale</option>
                  <option value="automatic">Automatic</option>
                </select>
              </label>

              <div className="lg:col-span-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Description</div>
                  <textarea
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                    placeholder="Short internal description for this campaign"
                    className="mt-2 min-h-[96px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              </div>

              {isCoupon ? (
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Coupon code *</div>
                  <input
                    value={form.code}
                    onChange={(e) => setField("code", e.target.value.toUpperCase())}
                    placeholder="SAVE10"
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 uppercase outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  {isFlashSale
                    ? "Flash sale campaigns use scheduling and targeting without requiring a coupon code."
                    : "Automatic promotions are applied by rules without coupon entry."}
                </div>
              )}

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Discount type</div>
                <select
                  value={form.discountType}
                  onChange={(e) => setField("discountType", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed amount</option>
                  <option value="free_shipping">Free shipping</option>
                </select>
              </label>

              {usesValue ? (
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">
                    {form.discountType === "percentage" ? "Discount %" : "Discount value"}
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => setField("value", e.target.value)}
                    placeholder={form.discountType === "percentage" ? "10" : "250"}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Free shipping discounts do not need a value.
                </div>
              )}

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Minimum order amount</div>
                <input
                  type="number"
                  min={0}
                  value={form.minOrderAmount}
                  onChange={(e) => setField("minOrderAmount", e.target.value)}
                  placeholder="0"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              {form.discountType === "percentage" ? (
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Max discount amount</div>
                  <input
                    type="number"
                    min={0}
                    value={form.maxDiscountAmount}
                    onChange={(e) => setField("maxDiscountAmount", e.target.value)}
                    placeholder="Optional cap"
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              ) : (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  Max discount cap is only used for percentage-based campaigns.
                </div>
              )}

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Applies to</div>
                <select
                  value={form.appliesTo}
                  onChange={(e) => setField("appliesTo", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                >
                  <option value="all">All products</option>
                  <option value="specific_products">Specific products</option>
                  <option value="categories">Categories</option>
                  <option value="brands">Brands</option>
                </select>
              </label>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {form.appliesTo === "all"
                  ? "This promotion applies to the whole catalog."
                  : form.appliesTo === "specific_products"
                  ? "Search products, pick from suggestions, or paste Product IDs manually."
                  : form.appliesTo === "categories"
                  ? "Select one or multiple categories or add a custom category manually."
                  : "Select one or multiple brands or add a custom brand manually."}
              </div>

              {appliesToProducts ? (
                <div className="lg:col-span-2">
                  <SelectionPanel
                    icon={Package2}
                    title="Product targeting"
                    hint="Search products by title/category/brand, select from results, or paste Product IDs manually. This solves the current UX issue where admins cannot easily discover IDs."
                    tone="product"
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr),minmax(0,1fr)]">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                          <Search size={18} className="shrink-0 text-gray-500" />
                          <input
                            value={productSearchInput}
                            onChange={(e) => setProductSearchInput(e.target.value)}
                            placeholder="Search product by title, category or brand..."
                            className="w-full min-w-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                          />
                          {productSearchInput ? (
                            <button
                              type="button"
                              onClick={() => setProductSearchInput("")}
                              className="rounded-xl p-2 transition hover:bg-gray-50"
                            >
                              <X size={16} />
                            </button>
                          ) : null}
                        </div>

                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Product results
                            </div>
                            <div className="text-xs text-gray-500">
                              {productLookupQuery.isFetching ? "Searching..." : `${productOptions.length} result`}
                            </div>
                          </div>

                          <div className="space-y-2">
                            {productLookupQuery.isLoading ? (
                              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                <span className="inline-flex items-center gap-2">
                                  <Loader2 size={16} className="animate-spin" />
                                  Loading products...
                                </span>
                              </div>
                            ) : productOptions.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                No products found.
                              </div>
                            ) : (
                              productOptions.map((product) => {
                                const id = String(product?._id || "").trim();
                                return (
                                  <ProductSuggestionCard
                                    key={id}
                                    product={product}
                                    selected={selectedProductSet.has(id)}
                                    onSelect={(picked) => addProductId(picked?._id)}
                                  />
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <ProductIdManualInput
                          value={manualProductIds}
                          onChange={setManualProductIds}
                          onApply={applyManualProductIds}
                          invalidIds={parseManualIds(manualProductIds).filter(
                            (id) => !isObjectId(id)
                          )}
                          busy={busy}
                        />

                        <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                          <div className="text-sm font-semibold text-gray-900">
                            Selected products
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Full Product ID is visible and copyable, so admin users do not get confused anymore.
                          </div>

                          {form.target.productIds.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                              No products selected yet.
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {form.target.productIds.map((id) => (
                                <TargetChip
                                  key={id}
                                  label={id}
                                  tone="product"
                                  onCopy={() => copyText(id, "Product ID copied")}
                                  onRemove={() => removeTargetItem("productIds", id)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectionPanel>
                </div>
              ) : null}

              {appliesToCategories ? (
                <div className="lg:col-span-2">
                  <SelectionPanel
                    icon={Shapes}
                    title="Category targeting"
                    hint="Pick from existing categories found in your current catalog, or manually add a new category value."
                    tone="category"
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(0,1fr)]">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                          <Search size={18} className="shrink-0 text-gray-500" />
                          <input
                            value={categorySearchInput}
                            onChange={(e) => setCategorySearchInput(e.target.value)}
                            placeholder="Search category..."
                            className="w-full min-w-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                          />
                        </div>

                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Existing categories
                            </div>
                            <div className="text-xs text-gray-500">
                              {categoryQuery.isFetching ? "Loading..." : `${categoryOptions.length} found`}
                            </div>
                          </div>

                          <div className="flex max-h-[300px] flex-wrap gap-2 overflow-y-auto">
                            {categoryQuery.isLoading ? (
                              <div className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                <span className="inline-flex items-center gap-2">
                                  <Loader2 size={16} className="animate-spin" />
                                  Loading categories...
                                </span>
                              </div>
                            ) : categoryOptions.length === 0 ? (
                              <div className="w-full rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                No categories found.
                              </div>
                            ) : (
                              categoryOptions.map((category) => {
                                const selected = form.target.categories.some(
                                  (item) => item.toLowerCase() === category.toLowerCase()
                                );

                                return (
                                  <button
                                    key={category}
                                    type="button"
                                    onClick={() => addCategory(category)}
                                    className={cx(
                                      "rounded-full border px-3 py-2 text-xs font-medium transition",
                                      selected
                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                  >
                                    {category}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[22px] border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                          <div className="text-sm font-medium text-gray-800">
                            Add custom category
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            Useful if you want to target a category value manually.
                          </div>

                          <div className="mt-3 flex gap-2">
                            <input
                              value={manualCategoryValue}
                              onChange={(e) => setManualCategoryValue(e.target.value)}
                              placeholder="Type category name"
                              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                            />
                            <button
                              type="button"
                              onClick={applyManualCategory}
                              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                          <div className="text-sm font-semibold text-gray-900">
                            Selected categories
                          </div>

                          {form.target.categories.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                              No categories selected yet.
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {form.target.categories.map((value) => (
                                <TargetChip
                                  key={value}
                                  label={value}
                                  tone="category"
                                  onCopy={() => copyText(value, "Category copied")}
                                  onRemove={() => removeTargetItem("categories", value)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectionPanel>
                </div>
              ) : null}

              {appliesToBrands ? (
                <div className="lg:col-span-2">
                  <SelectionPanel
                    icon={BadgeInfo}
                    title="Brand targeting"
                    hint="Pick from existing brands in the catalog, or add a brand manually."
                    tone="brand"
                  >
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr),minmax(0,1fr)]">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
                          <Search size={18} className="shrink-0 text-gray-500" />
                          <input
                            value={brandSearchInput}
                            onChange={(e) => setBrandSearchInput(e.target.value)}
                            placeholder="Search brand..."
                            className="w-full min-w-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
                          />
                        </div>

                        <div className="rounded-[24px] border border-gray-200 bg-gray-50 p-3">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Existing brands
                            </div>
                            <div className="text-xs text-gray-500">
                              {facetsQuery.isFetching ? "Loading..." : `${filteredBrandOptions.length} found`}
                            </div>
                          </div>

                          <div className="flex max-h-[300px] flex-wrap gap-2 overflow-y-auto">
                            {facetsQuery.isLoading ? (
                              <div className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                <span className="inline-flex items-center gap-2">
                                  <Loader2 size={16} className="animate-spin" />
                                  Loading brands...
                                </span>
                              </div>
                            ) : filteredBrandOptions.length === 0 ? (
                              <div className="w-full rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                                No brands found.
                              </div>
                            ) : (
                              filteredBrandOptions.map((brand) => {
                                const selected = form.target.brands.some(
                                  (item) => item.toLowerCase() === brand.toLowerCase()
                                );

                                return (
                                  <button
                                    key={brand}
                                    type="button"
                                    onClick={() => addBrand(brand)}
                                    className={cx(
                                      "rounded-full border px-3 py-2 text-xs font-medium transition",
                                      selected
                                        ? "border-violet-300 bg-violet-50 text-violet-800"
                                        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                                    )}
                                  >
                                    {brand}
                                  </button>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[22px] border border-dashed border-gray-300 bg-gray-50 px-4 py-4">
                          <div className="text-sm font-medium text-gray-800">
                            Add custom brand
                          </div>

                          <div className="mt-3 flex gap-2">
                            <input
                              value={manualBrandValue}
                              onChange={(e) => setManualBrandValue(e.target.value)}
                              placeholder="Type brand name"
                              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                            />
                            <button
                              type="button"
                              onClick={applyManualBrand}
                              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                            >
                              Add
                            </button>
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-gray-200 bg-white p-4">
                          <div className="text-sm font-semibold text-gray-900">
                            Selected brands
                          </div>

                          {form.target.brands.length === 0 ? (
                            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                              No brands selected yet.
                            </div>
                          ) : (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {form.target.brands.map((value) => (
                                <TargetChip
                                  key={value}
                                  label={value}
                                  tone="brand"
                                  onCopy={() => copyText(value, "Brand copied")}
                                  onRemove={() => removeTargetItem("brands", value)}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </SelectionPanel>
                </div>
              ) : null}

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Start at</div>
                <input
                  type="datetime-local"
                  value={form.startAt}
                  onChange={(e) => setField("startAt", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-gray-800">End at</div>
                <input
                  type="datetime-local"
                  value={form.endAt}
                  onChange={(e) => setField("endAt", e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Usage limit</div>
                <input
                  type="number"
                  min={0}
                  value={form.usageLimit}
                  onChange={(e) => setField("usageLimit", e.target.value)}
                  placeholder="Optional total usage cap"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Per-user limit</div>
                <input
                  type="number"
                  min={0}
                  value={form.usageLimitPerUser}
                  onChange={(e) => setField("usageLimitPerUser", e.target.value)}
                  placeholder="Optional per-user cap"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(form.isActive)}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-800">Active</span>
              </label>

              <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(form.stackable)}
                  onChange={(e) => setField("stackable", e.target.checked)}
                />
                <span className="text-sm font-medium text-gray-800">Stackable</span>
              </label>
            </div>
          </div>

          <div className="border-t border-gray-100 bg-white px-4 py-4 sm:px-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 sm:w-auto"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={validateAndSubmit}
                disabled={busy}
                className={cx(
                  "w-full rounded-2xl px-4 py-3 text-sm font-semibold transition sm:w-auto",
                  busy
                    ? "cursor-not-allowed bg-gray-200 text-gray-600"
                    : "bg-black text-white hover:bg-gray-900"
                )}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} />
                    Saving...
                  </span>
                ) : mode === "edit" ? (
                  "Update promotion"
                ) : (
                  "Create promotion"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, tone = "default" }) {
  const toneClass =
    tone === "danger"
      ? "bg-red-50 text-red-700"
      : tone === "success"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "info"
      ? "bg-blue-50 text-blue-700"
      : "bg-gray-100 text-gray-700";

  return (
    <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={cx("rounded-2xl p-2.5", toneClass)}>
          <Icon size={18} />
        </div>
        <div>
          <div className="text-xs text-gray-500">{label}</div>
          <div className="mt-1 text-lg font-semibold text-gray-950">{value}</div>
        </div>
      </div>
    </div>
  );
}

function renderTargetSummary(item) {
  const appliesTo = String(item?.appliesTo || "all");

  if (appliesTo === "all") {
    return "All products";
  }

  if (appliesTo === "specific_products") {
    const count = Array.isArray(item?.target?.productIds)
      ? item.target.productIds.length
      : 0;
    return `${count} product${count === 1 ? "" : "s"}`;
  }

  if (appliesTo === "categories") {
    const values = Array.isArray(item?.target?.categories)
      ? item.target.categories
      : [];
    return values.length ? values.join(", ") : "Categories";
  }

  if (appliesTo === "brands") {
    const values = Array.isArray(item?.target?.brands) ? item.target.brands : [];
    return values.length ? values.join(", ") : "Brands";
  }

  return "-";
}

export default function AdminPromotionsPage() {
  const queryClient = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setQ(normalizeText(searchInput)), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  const params = useMemo(() => {
    const next = {};
    if (q) next.q = q;
    if (type) next.type = type;
    if (status) next.status = status;
    return next;
  }, [q, type, status]);

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["admin-promotions", params],
    queryFn: async ({ signal }) =>
      (await api.get("/promotions/admin", { params, signal })).data,
    staleTime: 30_000,
  });

  const items = Array.isArray(data?.promotions) ? data.promotions : [];

  const summary = useMemo(() => {
    const total = items.length;
    const active = items.filter((x) => x.computedStatus === "active").length;
    const scheduled = items.filter((x) => x.computedStatus === "scheduled").length;
    const expired = items.filter((x) => x.computedStatus === "expired").length;
    const coupons = items.filter((x) => x.type === "coupon").length;

    return { total, active, scheduled, expired, coupons };
  }, [items]);

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/promotions/admin", payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      setModalOpen(false);
      setEditing(null);
      toast.success("Promotion created");
    },
    onError: (err) => {
      toast.error("Create failed", { description: getErrorMessage(err) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) =>
      (await api.patch(`/promotions/admin/${id}`, payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      setModalOpen(false);
      setEditing(null);
      toast.success("Promotion updated");
    },
    onError: (err) => {
      toast.error("Update failed", { description: getErrorMessage(err) });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }) =>
      (await api.patch(`/promotions/admin/${id}/toggle`, { isActive })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promotion status updated");
    },
    onError: (err) => {
      toast.error("Status update failed", { description: getErrorMessage(err) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/promotions/admin/${id}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-promotions"] });
      toast.success("Promotion removed");
    },
    onError: (err) => {
      toast.error("Delete failed", { description: getErrorMessage(err) });
    },
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(item) {
    setEditing(item);
    setModalOpen(true);
  }

  function handleSubmit(payload) {
    if (editing?._id) {
      updateMutation.mutate({ id: editing._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const modalBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="rounded-[30px] border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <Tag size={14} />
            Promotions Control
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
            Promotions
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Manage flash sales, coupon campaigns, automatic discount rules and limited-time offers from one control center.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-900 sm:w-auto"
        >
          <Plus size={18} />
          Create promotion
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard icon={Sparkles} label="All promotions" value={summary.total} />
        <SummaryCard icon={BadgePercent} label="Active" value={summary.active} tone="success" />
        <SummaryCard icon={CalendarRange} label="Scheduled" value={summary.scheduled} tone="info" />
        <SummaryCard icon={Clock3} label="Expired" value={summary.expired} tone="danger" />
        <SummaryCard icon={TicketPercent} label="Coupons" value={summary.coupons} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr),200px,200px,auto] xl:items-center">
        <div className="w-full">
          <div className="flex items-center gap-2 rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm">
            <Search size={18} className="shrink-0 opacity-60" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name or code..."
              className="w-full min-w-0 bg-transparent text-gray-900 outline-none placeholder:text-gray-400"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="rounded-xl p-2 transition hover:bg-gray-50"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="w-full rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none"
        >
          <option value="">All types</option>
          <option value="coupon">Coupon</option>
          <option value="flash_sale">Flash Sale</option>
          <option value="automatic">Automatic</option>
        </select>

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full rounded-[22px] border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="scheduled">Scheduled</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="rounded-[22px] border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm xl:justify-self-end">
          {isFetching ? "Updating..." : `Rows: ${items.length}`}
        </div>
      </div>

      {isError ? (
        <div className="mt-4 rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">Couldn’t load promotions</div>
          <div className="mt-1 opacity-90">{getErrorMessage(error)}</div>
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1240px]">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                <th className="px-4 py-4 font-semibold">Promotion</th>
                <th className="px-4 py-4 font-semibold">Type</th>
                <th className="px-4 py-4 font-semibold">Discount</th>
                <th className="px-4 py-4 font-semibold">Applies to</th>
                <th className="px-4 py-4 font-semibold">Code</th>
                <th className="px-4 py-4 font-semibold">Schedule</th>
                <th className="px-4 py-4 font-semibold">Usage</th>
                <th className="px-4 py-4 font-semibold">Status</th>
                <th className="px-4 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>

            <tbody>
              {isPending ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Loading promotions...
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-500">
                    No promotions found.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const usageText =
                    item?.usageLimit != null
                      ? `${Number(item?.usage?.totalUsed || 0)} / ${item.usageLimit}`
                      : `${Number(item?.usage?.totalUsed || 0)} used`;

                  return (
                    <tr
                      key={item._id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/70 last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <div className="max-w-[240px]">
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="mt-1 line-clamp-2 text-xs text-gray-500">
                            {item.description || "No description"}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {item.type === "flash_sale"
                          ? "Flash Sale"
                          : item.type === "coupon"
                          ? "Coupon"
                          : "Automatic"}
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {item.discountType === "percentage"
                          ? `${Number(item.value || 0)}%`
                          : item.discountType === "fixed"
                          ? formatMoney(item.value || 0)
                          : "Free shipping"}
                      </td>

                      <td className="px-4 py-4 text-xs text-gray-600">
                        <div className="font-medium text-gray-800">
                          {item.appliesTo === "specific_products"
                            ? "Specific products"
                            : item.appliesTo === "categories"
                            ? "Categories"
                            : item.appliesTo === "brands"
                            ? "Brands"
                            : "All products"}
                        </div>
                        <div className="mt-1 line-clamp-2">
                          {renderTargetSummary(item)}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">
                        {item.code || "-"}
                      </td>

                      <td className="px-4 py-4 text-xs text-gray-600">
                        <div>Start: {formatDateTime(item.startAt)}</div>
                        <div className="mt-1">End: {formatDateTime(item.endAt)}</div>
                      </td>

                      <td className="px-4 py-4 text-gray-700">{usageText}</td>

                      <td className="px-4 py-4">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold",
                            getStatusBadgeClass(item.computedStatus)
                          )}
                        >
                          {item.computedStatus}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex justify-end gap-2">
                          <button
                            type="button"
                            title="Edit"
                            onClick={() => openEdit(item)}
                            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pencil size={18} />
                          </button>

                          <button
                            type="button"
                            title={item.isActive ? "Deactivate" : "Activate"}
                            onClick={() =>
                              toggleMutation.mutate({
                                id: item._id,
                                isActive: !item.isActive,
                              })
                            }
                            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50"
                          >
                            <Power size={18} />
                          </button>

                          <button
                            type="button"
                            title="Delete"
                            onClick={() => deleteMutation.mutate(item._id)}
                            className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-3 py-2 text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PromotionModal
        open={modalOpen}
        initial={editing}
        mode={editing ? "edit" : "create"}
        onClose={() => {
          if (modalBusy) return;
          setModalOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
        busy={modalBusy}
      />
    </div>
  );
}