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
  Truck,
  CalendarRange,
  Sparkles,
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
      productIds: Array.isArray(item?.target?.productIds)
        ? item.target.productIds.map((x) => String(x))
        : [],
      categories: Array.isArray(item?.target?.categories)
        ? item.target.categories
        : [],
      brands: Array.isArray(item?.target?.brands) ? item.target.brands : [],
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

function parseCsvLines(value) {
  return String(value || "")
    .split(",")
    .map((x) => normalizeText(x))
    .filter(Boolean);
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

  useEffect(() => {
    if (!open) return;
    setForm(initial ? normalizeFormFromPromotion(initial) : defaultForm());
  }, [open, initial]);

  if (!open) return null;

  const isCoupon = form.type === "coupon";
  const isFlashSale = form.type === "flash_sale";
  const usesValue = form.discountType !== "free_shipping";
  const appliesToProducts = form.appliesTo === "specific_products";
  const appliesToCategories = form.appliesTo === "categories";
  const appliesToBrands = form.appliesTo === "brands";

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateAndSubmit() {
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
        productIds: appliesToProducts ? parseCsvLines(form.target.productIds.join(",")) : [],
        categories: appliesToCategories ? parseCsvLines(form.target.categories.join(",")) : [],
        brands: appliesToBrands ? parseCsvLines(form.target.brands.join(",")) : [],
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

    if (payload.endAt && payload.startAt && new Date(payload.endAt) < new Date(payload.startAt)) {
      return toast.error("End date must be after start date");
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
        <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-2xl">
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

              {appliesToProducts ? (
                <label className="block lg:col-span-2">
                  <div className="text-sm font-medium text-gray-800">Product IDs</div>
                  <textarea
                    value={form.target.productIds.join(", ")}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        target: {
                          ...prev.target,
                          productIds: parseCsvLines(e.target.value),
                        },
                      }))
                    }
                    placeholder="Comma separated product IDs"
                    className="mt-2 min-h-[88px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              ) : null}

              {appliesToCategories ? (
                <label className="block lg:col-span-2">
                  <div className="text-sm font-medium text-gray-800">Categories</div>
                  <textarea
                    value={form.target.categories.join(", ")}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        target: {
                          ...prev.target,
                          categories: parseCsvLines(e.target.value),
                        },
                      }))
                    }
                    placeholder="Comma separated category names"
                    className="mt-2 min-h-[88px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              ) : null}

              {appliesToBrands ? (
                <label className="block lg:col-span-2">
                  <div className="text-sm font-medium text-gray-800">Brands</div>
                  <textarea
                    value={form.target.brands.join(", ")}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        target: {
                          ...prev.target,
                          brands: parseCsvLines(e.target.value),
                        },
                      }))
                    }
                    placeholder="Comma separated brand names"
                    className="mt-2 min-h-[88px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
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
          <table className="w-full min-w-[1120px]">
            <thead className="border-b border-gray-100 bg-gray-50/80">
              <tr className="text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                <th className="px-4 py-4 font-semibold">Promotion</th>
                <th className="px-4 py-4 font-semibold">Type</th>
                <th className="px-4 py-4 font-semibold">Discount</th>
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
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 size={18} className="animate-spin" />
                      Loading promotions...
                    </span>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
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
                        <div className="max-w-[260px]">
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