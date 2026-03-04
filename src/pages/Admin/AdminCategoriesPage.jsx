import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Search, RefreshCw, Pencil, Trash2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import api from "../../services/apiClient";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";

/* ----------------------------- helpers ----------------------------- */

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function lockBodyScroll(lock) {
  const body = document.body;
  if (!body) return;
  if (lock) {
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
  } else {
    body.style.overflow = "";
    body.style.touchAction = "";
  }
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />;
}

function Badge({ children, tone = "gray" }) {
  const cls =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return <span className={`text-[11px] px-2 py-1 rounded-full border ${cls}`}>{children}</span>;
}

/* ----------------------------- page ----------------------------- */

export default function AdminCategoriesPage() {
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const qDebounced = useDebouncedValue(q, 350);

  const [renameModal, setRenameModal] = useState({ open: false, from: "", to: "" });
  const [confirm, setConfirm] = useState({ open: false, category: "" });

  // track per-row busy state (enterprise UX)
  const [working, setWorking] = useState({ type: null, category: "" }); // type: "rename" | "delete" | null
  const isAnyWorking = Boolean(working.type);

  const listQuery = useQuery({
    queryKey: ["admin-categories", { q: qDebounced?.trim() || "" }],
    queryFn: async ({ signal }) => {
      const res = await api.get("/products/admin/categories", {
        params: { q: qDebounced?.trim() || undefined },
        signal,
      });
      return res.data;
    },
    staleTime: 20_000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false, // ✅ smooth: avoid sudden refetch + layout jump
  });

  const rows = listQuery.data?.categories || [];

  const totals = useMemo(() => {
    const totalCategories = rows.length;
    const totalProducts = rows.reduce((a, r) => a + Number(r.count || 0), 0);
    const totalStock = rows.reduce((a, r) => a + Number(r.totalStock || 0), 0);
    const lowStock = rows.reduce((a, r) => a + Number(r.lowStockCount || 0), 0);
    return { totalCategories, totalProducts, totalStock, lowStock };
  }, [rows]);

  const renameMutation = useMutation({
    mutationFn: async ({ from, to }) =>
      (await api.post("/products/admin/categories/rename", { from, to })).data,
    onMutate: async ({ from }) => {
      setWorking({ type: "rename", category: String(from || "") });
    },
    onSuccess: async () => {
      toast.success("Category renamed");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-categories"] }),
        qc.invalidateQueries({ queryKey: ["admin-products"] }),
        qc.invalidateQueries({ queryKey: ["admin-inventory"] }),
        qc.invalidateQueries({ queryKey: ["admin-inventory-summary"] }),
      ]);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Rename failed"),
    onSettled: () => setWorking({ type: null, category: "" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ category }) =>
      (await api.post("/products/admin/categories/delete", { category })).data,
    onMutate: async ({ category }) => {
      setWorking({ type: "delete", category: String(category || "") });
    },
    onSuccess: async () => {
      toast.success("Category removed");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["admin-categories"] }),
        qc.invalidateQueries({ queryKey: ["admin-products"] }),
        qc.invalidateQueries({ queryKey: ["admin-inventory"] }),
        qc.invalidateQueries({ queryKey: ["admin-inventory-summary"] }),
      ]);
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Delete failed"),
    onSettled: () => setWorking({ type: null, category: "" }),
  });

  function openRename(cat) {
    setRenameModal({ open: true, from: cat, to: cat });
  }

  function closeRename() {
    setRenameModal({ open: false, from: "", to: "" });
  }

  async function submitRename() {
    const from = String(renameModal.from || "").trim();
    const to = String(renameModal.to || "").trim();

    if (!from) return toast.error("Missing category");
    if (!to) return toast.error("New name required");
    if (from === to) return toast.message("No change", { description: "Category name is unchanged." });

    closeRename();
    await renameMutation.mutateAsync({ from, to });
  }

  function resetFilters() {
    setQ("");
  }

  // modal UX: ESC close + body lock
  useEffect(() => {
    if (!renameModal.open) return;

    lockBodyScroll(true);
    function onKey(e) {
      if (e.key === "Escape") closeRename();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      lockBodyScroll(false);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renameModal.open]);

  const modalPanelRef = useRef(null);
  useEffect(() => {
    if (!renameModal.open) return;
    function onClick(e) {
      if (!modalPanelRef.current) return;
      if (!modalPanelRef.current.contains(e.target)) closeRename();
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("touchstart", onClick);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("touchstart", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renameModal.open]);

  return (
    <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Admin</div>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="opacity-70" size={22} /> Categories
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Categories are derived from Products (no separate category table). Rename/Remove updates all matching products.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => listQuery.refetch()}
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60"
            disabled={listQuery.isFetching}
          >
            {listQuery.isFetching ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Reset
          </button>

          <Link
            to="/admin/inventory"
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white hover:bg-gray-900 transition"
          >
            Inventory <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      {/* Top cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {listQuery.isPending ? (
          <>
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
          </>
        ) : (
          <>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Categories</div>
              <div className="mt-1 text-2xl font-bold">{totals.totalCategories}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Products mapped</div>
              <div className="mt-1 text-2xl font-bold">{totals.totalProducts}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total stock</div>
              <div className="mt-1 text-2xl font-bold">{totals.totalStock}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Low-stock items</div>
              <div className="mt-1 text-2xl font-bold">{totals.lowStock}</div>
            </div>
          </>
        )}
      </div>

      {/* Search */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-gray-800">Search</label>
        <div className="mt-2 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search category name (debounced)"
            className="w-full rounded-2xl border px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 rounded-3xl border overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3 bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Category list</div>
          <div className="text-xs text-gray-500">
            {listQuery.isFetching ? "Updating…" : `${rows.length} items`}
          </div>
        </div>

        {listQuery.isPending ? (
          <div className="p-8">
            <Skeleton className="h-10 w-full" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-sm text-gray-600">
            No categories found.
            {q.trim() ? (
              <button
                type="button"
                className="ml-3 underline font-semibold text-gray-900"
                onClick={resetFilters}
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Products</th>
                  <th className="px-5 py-3">Active</th>
                  <th className="px-5 py-3">In stock</th>
                  <th className="px-5 py-3">Low stock</th>
                  <th className="px-5 py-3">Out of stock</th>
                  <th className="px-5 py-3">Total stock</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((r) => {
                  const name = r?.name || r?._id || "";
                  const count = Number(r?.count || 0);
                  const activeCount = Number(r?.activeCount || 0);
                  const inStock = Number(r?.inStockCount || 0);
                  const lowStock = Number(r?.lowStockCount || 0);
                  const out = Number(r?.outOfStockCount || 0);
                  const totalStock = Number(r?.totalStock || 0);

                  const isRowWorking =
                    (working.type === "rename" || working.type === "delete") &&
                    String(working.category || "") === String(name || "");

                  return (
                    <tr key={name} className="border-b last:border-b-0">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{name}</div>
                        <div className="mt-1 text-xs text-gray-500">
                          <Link className="underline" to={`/admin/inventory?category=${encodeURIComponent(name)}`}>
                            View in inventory
                          </Link>
                        </div>
                      </td>

                      <td className="px-5 py-4">{count}</td>

                      <td className="px-5 py-4">
                        <Badge tone={activeCount ? "green" : "gray"}>{activeCount}</Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={inStock ? "green" : "gray"}>{inStock}</Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={lowStock ? "amber" : "gray"}>{lowStock}</Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={out ? "red" : "gray"}>{out}</Badge>
                      </td>

                      <td className="px-5 py-4">{totalStock}</td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openRename(name)}
                            className="rounded-2xl border px-3 py-2 text-xs font-semibold hover:bg-gray-50 transition disabled:opacity-60"
                            disabled={isAnyWorking || isRowWorking}
                          >
                            <span className="inline-flex items-center gap-2">
                              {isRowWorking && working.type === "rename" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Pencil size={14} />
                              )}
                              Rename
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setConfirm({ open: true, category: name })}
                            className="rounded-2xl border px-3 py-2 text-xs font-semibold hover:bg-red-50 transition text-red-700 border-red-200 disabled:opacity-60"
                            disabled={isAnyWorking || isRowWorking}
                          >
                            <span className="inline-flex items-center gap-2">
                              {isRowWorking && working.type === "delete" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                              Remove
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rename modal (simple but enterprise UX) */}
      {renameModal.open ? (
        <div className="fixed inset-0 z-[9998] bg-black/40 flex items-center justify-center p-4">
          <div ref={modalPanelRef} className="w-full max-w-lg bg-white rounded-3xl border shadow-lg">
            <div className="p-5 border-b">
              <div className="text-lg font-semibold">Rename category</div>
              <div className="text-sm text-gray-600 mt-1">
                This updates all products with category{" "}
                <span className="font-semibold">{renameModal.from}</span>.
              </div>
            </div>

            <div className="p-5">
              <label className="block text-sm font-semibold text-gray-800">New name</label>
              <input
                value={renameModal.to}
                onChange={(e) => setRenameModal((s) => ({ ...s, to: e.target.value }))}
                className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                placeholder="e.g. Accessories"
                autoFocus
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-60"
                  onClick={closeRename}
                  disabled={renameMutation.isPending}
                >
                  Cancel
                </button>

                <button
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
                  onClick={submitRename}
                  disabled={renameMutation.isPending}
                >
                  {renameMutation.isPending ? "Working…" : "Rename"}
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Tip: Press <span className="font-semibold">Esc</span> to close.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Remove category?"
        description={
          confirm.category
            ? `This will remove the category from all products currently in "${confirm.category}".`
            : ""
        }
        confirmText="Remove"
        cancelText="Cancel"
        tone="danger"
        busy={deleteMutation.isPending}
        onConfirm={async () => {
          const cat = confirm.category;
          setConfirm({ open: false, category: "" });
          if (!cat) return;
          await deleteMutation.mutateAsync({ category: cat });
        }}
        onClose={() => setConfirm({ open: false, category: "" })}
      />
    </div>
  );
}
