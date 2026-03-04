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
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function normalizeImages(text) {
  const raw = String(text || "")
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set();
  const out = [];
  for (const u of raw) {
    const k = u.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(u);
  }
  return out.slice(0, 20);
}

function money(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return "0";
  return String(Math.round(x));
}

function ConfirmModal({
  open,
  title = "Confirm",
  description,
  confirmText = "Confirm",
  tone = "danger",
  onClose,
  onConfirm,
  busy,
}) {
  if (!open) return null;

  const btn =
    tone === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-black text-white hover:bg-gray-900";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border shadow-xl">
        <div className="p-5 border-b flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-lg font-semibold">{title}</div>
            {description ? (
              <div className="mt-1 text-sm text-gray-600">{description}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="Close"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={[
              "rounded-2xl px-4 py-2 text-sm font-semibold transition",
              btn,
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              busy ? "opacity-70 cursor-not-allowed" : "",
            ].join(" ")}
            disabled={busy}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={16} /> Working...
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({ open, mode, initial, onClose, onSubmit, busy }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [imagesText, setImagesText] = useState("");

  useEffect(() => {
    if (!open) return;
    const p = initial || {};
    setTitle(p.title || "");
    setDescription(p.description || "");
    setPrice(Number(p.price || 0));
    setStock(Number(p.stock || 0));
    setCategory(p.category || "");
    setBrand(p.brand || "");
    setImagesText(Array.isArray(p.images) ? p.images.join("\n") : "");
  }, [open, initial]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isCreate = mode === "create";

  function validateAndSubmit() {
    const t = String(title || "").trim();
    const p = Number(price || 0);
    const s = Number(stock || 0);

    if (!t) return toast.error("Title is required.");
    if (!Number.isFinite(p) || p < 0) return toast.error("Price must be 0 or greater.");
    if (!Number.isFinite(s) || s < 0) return toast.error("Stock must be 0 or greater.");

    onSubmit({
      title: t,
      description: String(description || ""),
      price: p,
      stock: s,
      category: String(category || "").trim() || null,
      brand: String(brand || "").trim() || null,
      images: normalizeImages(imagesText),
    });
  }

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl border shadow-xl">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold">
              {isCreate ? "Create product" : "Edit product"}
            </h3>
            <p className="text-sm text-gray-500">
              Manage products shown on the Shop page.
            </p>
          </div>
          <button
            type="button"
            className="p-2 rounded-2xl hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            onClick={onClose}
            aria-label="Close"
            disabled={busy}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block w-full md:col-span-2">
            <div className="text-sm font-medium text-gray-800">Title *</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product title"
            />
          </label>

          <label className="block w-full md:col-span-2">
            <div className="text-sm font-medium text-gray-800">Description</div>
            <textarea
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm min-h-[110px]
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
            />
          </label>

          <label className="block w-full">
            <div className="text-sm font-medium text-gray-800">Price *</div>
            <input
              type="number"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value || 0))}
              min={0}
            />
          </label>

          <label className="block w-full">
            <div className="text-sm font-medium text-gray-800">Stock</div>
            <input
              type="number"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={stock}
              onChange={(e) => setStock(Number(e.target.value || 0))}
              min={0}
            />
          </label>

          <label className="block w-full">
            <div className="text-sm font-medium text-gray-800">Category</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Men / Women / Accessories..."
            />
          </label>

          <label className="block w-full">
            <div className="text-sm font-medium text-gray-800">Brand</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Nike / Apple..."
            />
          </label>

          <label className="block w-full md:col-span-2">
            <div className="text-sm font-medium text-gray-800">Images (URLs)</div>
            <textarea
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm min-h-[110px]
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={imagesText}
              onChange={(e) => setImagesText(e.target.value)}
              placeholder={"https://...\nhttps://..."}
            />
            <div className="mt-2 text-xs text-gray-500">
              Use comma or new line to separate URLs. (Max 20)
            </div>
          </label>
        </div>

        <div className="p-5 border-t flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>

          <button
            type="button"
            className={[
              "rounded-2xl px-4 py-3 text-sm font-semibold transition",
              busy
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-900",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            ].join(" ")}
            onClick={validateAndSubmit}
            disabled={busy}
          >
            {busy ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} /> Saving...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Save size={18} /> Save
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 8 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b last:border-b-0">
          <td className="py-4">
            <div className="skeleton h-4 w-56 rounded-lg" />
            <div className="mt-2 skeleton h-3 w-20 rounded-lg" />
          </td>
          <td className="py-4"><div className="skeleton h-4 w-16 rounded-lg" /></td>
          <td className="py-4"><div className="skeleton h-4 w-14 rounded-lg" /></td>
          <td className="py-4"><div className="skeleton h-4 w-24 rounded-lg" /></td>
          <td className="py-4"><div className="skeleton h-4 w-24 rounded-lg" /></td>
          <td className="py-4"><div className="skeleton h-6 w-20 rounded-full" /></td>
          <td className="py-4 text-right">
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

export default function AdminProductsPage() {
  const qc = useQueryClient();

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

  useEffect(() => setPage(1), [q, isActive]);

  const params = useMemo(() => {
    const p = { page, limit };
    if (q) p.q = q;
    if (isActive !== "") p.isActive = isActive;
    return p;
  }, [page, limit, q, isActive]);

  const { data, isPending, isFetching, isError, error } = useQuery({
    queryKey: ["admin-products", params],
    queryFn: async ({ signal }) =>
      (await api.get("/products/admin", { params, signal })).data,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const items = data?.products || [];
  const total = data?.total || 0;
  const pages = Math.max(1, data?.pages || 1);

  // Prefetch next page (smooth pagination)
  useEffect(() => {
    const nextPage = page + 1;
    if (nextPage > pages) return;

    const nextParams = { ...params, page: nextPage };
    qc.prefetchQuery({
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

  function openEdit(p) {
    setModalMode("edit");
    setEditing(p);
    setModalOpen(true);
  }

  function patchAdminProductsCache(updater) {
    qc.setQueriesData({ queryKey: ["admin-products"] }, (old) => {
      if (!old) return old;
      try {
        return updater(old);
      } catch {
        return old;
      }
    });
  }

  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post("/products", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setModalOpen(false);
      toast.success("Product created");
    },
    onError: (e) => {
      toast.error("Create failed", {
        description: e?.response?.data?.message || e?.message || "Failed to create product.",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) =>
      (await api.patch(`/products/${id}`, payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setModalOpen(false);
      toast.success("Product updated");
    },
    onError: (e) => {
      toast.error("Update failed", {
        description: e?.response?.data?.message || e?.message || "Failed to update product.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/products/${id}`)).data,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-products"] });
      const snapshot = qc.getQueriesData({ queryKey: ["admin-products"] });

      patchAdminProductsCache((old) => ({
        ...old,
        products: Array.isArray(old.products)
          ? old.products.filter((p) => p._id !== id)
          : old.products,
        total:
          Number(old.total || 0) > 0 ? Number(old.total || 0) - 1 : old.total,
      }));

      return { snapshot };
    },
    onError: (e, _id, ctx) => {
      if (ctx?.snapshot) {
        for (const [key, value] of ctx.snapshot) qc.setQueryData(key, value);
      }
      toast.error("Delete failed", {
        description: e?.response?.data?.message || e?.message || "Delete failed.",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Product deleted");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) =>
      (await api.patch(`/products/${id}`, { isActive })).data,
    onMutate: async ({ id, isActive }) => {
      await qc.cancelQueries({ queryKey: ["admin-products"] });
      const snapshot = qc.getQueriesData({ queryKey: ["admin-products"] });

      patchAdminProductsCache((old) => ({
        ...old,
        products: Array.isArray(old.products)
          ? old.products.map((p) => (p._id === id ? { ...p, isActive } : p))
          : old.products,
      }));

      return { snapshot };
    },
    onError: (e, _vars, ctx) => {
      if (ctx?.snapshot) {
        for (const [key, value] of ctx.snapshot) qc.setQueryData(key, value);
      }
      toast.error("Status update failed", {
        description: e?.response?.data?.message || e?.message || "Update failed.",
      });
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.message("Status updated", {
        description: vars?.isActive ? "Product is now Active." : "Product is now Inactive.",
      });
    },
  });

  function submitModal(payload) {
    const t = String(payload?.title || "").trim();
    if (!t) return toast.error("Title is required.");

    if (modalMode === "create") createMutation.mutate(payload);
    else updateMutation.mutate({ id: editing?._id, payload });
  }

  const busy =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    toggleActiveMutation.isPending;

  return (
    <div className="bg-white border rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Create, edit, activate/deactivate, and manage products shown on the Shop page.
          </p>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          onClick={openCreate}
        >
          <Plus size={18} /> Create product
        </button>
      </div>

      <div className="mt-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="w-full md:max-w-md">
          <div
            className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm
                       focus-within:ring-2 focus-within:ring-black focus-within:ring-offset-2"
          >
            <Search size={18} className="opacity-60" />
            <input
              className="w-full outline-none text-gray-900"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title..."
              aria-label="Search products"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="p-2 rounded-xl hover:bg-gray-50 transition"
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </div>
        </div>

        <select
          className="w-full md:w-52 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm outline-none
                     focus:ring-2 focus:ring-black focus:ring-offset-2"
          value={isActive}
          onChange={(e) => setIsActive(e.target.value)}
          aria-label="Filter status"
        >
          <option value="">All status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>

        <div className="md:ml-auto text-sm text-gray-500">
          {isFetching ? "Updating..." : `Total: ${total}`}
        </div>
      </div>

      {isError ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">Couldn’t load products</div>
          <div className="mt-1 opacity-90">
            {error?.response?.data?.message || error?.message || "Failed to load products."}
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-x-auto border rounded-3xl">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Brand</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {isPending && items.length === 0 ? <TableSkeleton rows={8} /> : null}

            {!isPending && items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            ) : null}

            {items.map((p) => {
              const label = p?.title || p?.name || "Untitled";
              return (
                <tr key={p._id} className="border-b last:border-b-0">
                  <td className="px-4 py-4 max-w-[420px]">
                    <div className="font-medium text-gray-900 line-clamp-2">{label}</div>
                    <div className="text-xs text-gray-500">#{String(p._id).slice(-6)}</div>
                  </td>

                  <td className="px-4 py-4 text-gray-900">{money(p.price)}</td>
                  <td className="px-4 py-4 text-gray-900">{money(p.stock)}</td>
                  <td className="px-4 py-4 text-gray-700">{p.category || "-"}</td>
                  <td className="px-4 py-4 text-gray-700">{p.brand || "-"}</td>

                  <td className="px-4 py-4">
                    <button
                      type="button"
                      className={[
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold transition border",
                        p.isActive
                          ? "bg-green-50 text-green-800 border-green-200 hover:bg-green-100"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                      ].join(" ")}
                      onClick={() =>
                        toggleActiveMutation.mutate({ id: p._id, isActive: !p.isActive })
                      }
                      disabled={busy}
                      title="Toggle status"
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <div className="inline-flex justify-end gap-2">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-2xl border px-3 py-2 hover:bg-gray-50 transition
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        onClick={() => openEdit(p)}
                        title="Edit"
                        disabled={busy}
                      >
                        <Pencil size={18} />
                      </button>

                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-2xl border px-3 py-2 text-red-600 hover:bg-red-50 transition
                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        onClick={() => {
                          setConfirmTarget(p);
                          setConfirmOpen(true);
                        }}
                        title="Delete"
                        disabled={busy}
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

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-500">
          Page {page} / {pages}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            onClick={() => setPage((p) => clamp(p - 1, 1, pages))}
            disabled={page <= 1}
          >
            Prev
          </button>

          <button
            type="button"
            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            onClick={() => setPage((p) => clamp(p + 1, 1, pages))}
            disabled={page >= pages}
          >
            Next
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
        title="Delete product?"
        description={
          confirmTarget
            ? `This will delete "${confirmTarget.title || confirmTarget.name || "this product"}".`
            : "This action cannot be undone."
        }
        confirmText="Delete"
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
