import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Search, RefreshCw, Save, Loader2 } from "lucide-react";
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
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-700 border-gray-200";
  return <span className={`text-[11px] px-2 py-1 rounded-full border ${cls}`}>{children}</span>;
}

function statusOf(p) {
  const stock = Number(p?.stock || 0);
  const thr = Number(p?.lowStockThreshold ?? 5);
  if (stock <= 0) return { label: "Out of stock", tone: "red" };
  if (stock <= thr) return { label: "Low stock", tone: "amber" };
  return { label: "OK", tone: "green" };
}

function safeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/* ----------------------------- page ----------------------------- */

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const [sp] = useSearchParams();

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const [category, setCategory] = useState("");
  const [stock, setStock] = useState(""); // out | low | ok | ""
  const [isActive, setIsActive] = useState(""); // "" | "true" | "false"
  const [sort, setSort] = useState("stock_asc"); // stock_asc | stock_desc | updated_desc

  const [page, setPage] = useState(1);
  const limit = 20;

  // prefill from /admin/categories "View in inventory"
  useEffect(() => {
    const cat = sp.get("category");
    if (cat) setCategory(cat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset page when filters change (use debouncedQ)
  useEffect(() => setPage(1), [debouncedQ, category, stock, isActive, sort]);

  const params = useMemo(() => {
    const p = { page, limit, sort };
    if (debouncedQ.trim()) p.q = debouncedQ.trim();
    if (category) p.category = category;
    if (stock) p.stock = stock;
    if (isActive !== "") p.isActive = isActive;
    return p;
  }, [page, limit, debouncedQ, category, stock, isActive, sort]);

  /* -------- categories dropdown -------- */

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: async ({ signal }) => (await api.get("/products/admin/categories", { signal })).data,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const categoryOptions = useMemo(() => {
    const rows = categoriesQuery.data?.categories || [];
    return rows
      .map((r) => String(r?.name || r?._id || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categoriesQuery.data]);

  /* -------- summary cards -------- */

  const summaryQuery = useQuery({
    queryKey: ["admin-inventory-summary", { q: debouncedQ, category, isActive }],
    queryFn: async ({ signal }) => {
      const res = await api.get("/products/admin/inventory-summary", {
        params: {
          q: debouncedQ.trim() || undefined,
          category: category || undefined,
          isActive: isActive !== "" ? isActive : undefined,
        },
        signal,
      });
      return res.data;
    },
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  /* -------- list -------- */

  const listQuery = useQuery({
    queryKey: ["admin-inventory", params],
    queryFn: async ({ signal }) => (await api.get("/products/admin", { params, signal })).data,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  const items = listQuery.data?.products || [];
  const total = Number(listQuery.data?.total || 0);
  const pages = Math.max(1, Number(listQuery.data?.pages || 1));

  /* -------- row edits -------- */

  const [edits, setEdits] = useState({});

  useEffect(() => {
    // ensure defaults for new rows (don’t override existing edits)
    setEdits((prev) => {
      const next = { ...prev };
      for (const p of items) {
        if (!p?._id) continue;
        if (!next[p._id]) {
          next[p._id] = {
            stock: String(p.stock ?? 0),
            lowStockThreshold: String(p.lowStockThreshold ?? 5),
          };
        }
      }
      return next;
    });
  }, [items]);

  /* -------- selection (bulk) -------- */

  const [selected, setSelected] = useState(() => new Set());
  const [bulkStock, setBulkStock] = useState("");
  const [bulkThr, setBulkThr] = useState("");
  const [confirmBulk, setConfirmBulk] = useState({ open: false });

  function toggleSelect(id) {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  }

  function toggleSelectAllOnPage(checked) {
    setSelected((prev) => {
      const s = new Set(prev);
      for (const p of items) {
        if (!p?._id) continue;
        if (checked) s.add(p._id);
        else s.delete(p._id);
      }
      return s;
    });
  }

  const idsOnPage = useMemo(
    () => items.map((p) => p?._id).filter(Boolean),
    [items]
  );

  const allSelectedOnPage = idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id));
  const someSelectedOnPage = idsOnPage.some((id) => selected.has(id)) && !allSelectedOnPage;

  const selectAllRef = useRef(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelectedOnPage;
    }
  }, [someSelectedOnPage]);

  /* -------- mutations -------- */

  const [savingId, setSavingId] = useState(null);

  const updateOneMutation = useMutation({
    mutationFn: async ({ id, payload }) => (await api.patch(`/products/${id}`, payload)).data,
    onSuccess: async () => {
      toast.success("Inventory updated");
      await qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      await qc.invalidateQueries({ queryKey: ["admin-inventory-summary"] });
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Update failed"),
    onSettled: () => setSavingId(null),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, stock, lowStockThreshold }) =>
      (await api.patch("/products/admin/bulk-stock", { ids, stock, lowStockThreshold })).data,
    onSuccess: async (d) => {
      toast.success("Bulk update done", { description: `${d?.modified || 0} updated` });
      await qc.invalidateQueries({ queryKey: ["admin-inventory"] });
      await qc.invalidateQueries({ queryKey: ["admin-products"] });
      await qc.invalidateQueries({ queryKey: ["admin-inventory-summary"] });
      setSelected(new Set());
      setBulkStock("");
      setBulkThr("");
    },
    onError: (e) => toast.error(e?.response?.data?.message || "Bulk update failed"),
  });

  async function saveRow(p) {
    const id = p?._id;
    if (!id) return;

    const st = edits?.[id]?.stock;
    const thr = edits?.[id]?.lowStockThreshold;

    const stockNum = safeNum(st);
    const thrNum = safeNum(thr);

    if (stockNum == null || stockNum < 0) return toast.error("Stock must be 0 or greater");
    if (thrNum == null || thrNum < 0) return toast.error("Low-stock threshold must be 0 or greater");

    setSavingId(id);
    await updateOneMutation.mutateAsync({ id, payload: { stock: stockNum, lowStockThreshold: thrNum } });
  }

  function resetFilters() {
    setQ("");
    setCategory("");
    setStock("");
    setIsActive("");
    setSort("stock_asc");
    setPage(1);
  }

  const summary = summaryQuery.data?.summary || {};
  const selCount = selected.size;

  const isRefreshing = listQuery.isFetching || summaryQuery.isFetching;

  return (
    <div className="bg-white border rounded-3xl p-6 md:p-8 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">Admin</div>
          <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            <Boxes className="opacity-70" size={22} /> Inventory
          </h1>
          <p className="mt-2 text-gray-600 max-w-2xl">
            Monitor stock, thresholds, and do bulk inventory updates with smooth pagination & filters.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              summaryQuery.refetch();
              listQuery.refetch();
            }}
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60"
            disabled={isRefreshing}
          >
            {isRefreshing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-3">
        {summaryQuery.isPending ? (
          <>
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
            <Skeleton className="h-[86px]" />
          </>
        ) : (
          <>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total</div>
              <div className="mt-1 text-2xl font-bold">{summary.total ?? "—"}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Active</div>
              <div className="mt-1 text-2xl font-bold">{summary.active ?? "—"}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Out of stock</div>
              <div className="mt-1 text-2xl font-bold">{summary.outOfStock ?? "—"}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Low stock</div>
              <div className="mt-1 text-2xl font-bold">{summary.lowStock ?? "—"}</div>
            </div>
            <div className="rounded-3xl border p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wide">Total stock</div>
              <div className="mt-1 text-2xl font-bold">{summary.totalStock ?? "—"}</div>
            </div>
          </>
        )}
      </div>

      {/* Filters */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5">
          <label className="block text-sm font-semibold text-gray-800">Search</label>
          <div className="mt-2 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (debounced)"
              className="w-full rounded-2xl border px-10 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        <div className="md:col-span-3">
          <label className="block text-sm font-semibold text-gray-800">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800">Stock</label>
          <select
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All</option>
            <option value="out">Out</option>
            <option value="low">Low</option>
            <option value="ok">OK</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold text-gray-800">Status</label>
          <select
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>

        <div className="md:col-span-12">
          <label className="block text-sm font-semibold text-gray-800">Sort</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="mt-2 w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
          >
            <option value="stock_asc">Stock (low → high)</option>
            <option value="stock_desc">Stock (high → low)</option>
            <option value="updated_desc">Recently updated</option>
          </select>
        </div>
      </div>

      {/* Bulk bar */}
      {selCount > 0 ? (
        <div className="mt-6 rounded-3xl border bg-gray-50 p-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="text-sm font-semibold">
            Selected: <span className="text-gray-900">{selCount}</span>
          </div>

          <div className="flex flex-wrap gap-2 md:ml-auto">
            <input
              value={bulkStock}
              onChange={(e) => setBulkStock(e.target.value)}
              placeholder="Set stock (optional)"
              type="number"
              min={0}
              className="rounded-2xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black w-[170px]"
            />
            <input
              value={bulkThr}
              onChange={(e) => setBulkThr(e.target.value)}
              placeholder="Set threshold (optional)"
              type="number"
              min={0}
              className="rounded-2xl border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black w-[190px]"
            />

            <button
              type="button"
              onClick={() => setConfirmBulk({ open: true })}
              className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
              disabled={bulkMutation.isPending}
            >
              {bulkMutation.isPending ? "Applying…" : "Apply bulk update"}
            </button>

            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-white disabled:opacity-60"
              disabled={bulkMutation.isPending}
            >
              Clear
            </button>
          </div>
        </div>
      ) : null}

      {/* Table */}
      <div className="mt-6 rounded-3xl border overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between gap-3 bg-gray-50">
          <div className="text-sm font-semibold text-gray-900">Products</div>
          <div className="text-xs text-gray-500">
            {listQuery.isFetching ? "Updating…" : `${total} total`}
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
        ) : items.length === 0 ? (
          <div className="p-8 text-sm text-gray-600">
            No products found.
            <button
              type="button"
              onClick={resetFilters}
              className="ml-3 underline font-semibold text-gray-900"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-500 border-b">
                  <th className="px-5 py-3">
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      className="h-4 w-4 accent-black"
                      onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                      checked={allSelectedOnPage}
                    />
                  </th>
                  <th className="px-5 py-3">Product</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Price</th>
                  <th className="px-5 py-3">Stock</th>
                  <th className="px-5 py-3">Threshold</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Save</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => {
                  const id = p._id;
                  const st = statusOf(p);
                  const e = edits[id] || {
                    stock: String(p.stock ?? 0),
                    lowStockThreshold: String(p.lowStockThreshold ?? 5),
                  };

                  const isRowSaving = savingId === id && updateOneMutation.isPending;

                  return (
                    <tr key={id} className="border-b last:border-b-0">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-black"
                          checked={selected.has(id)}
                          onChange={() => toggleSelect(id)}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{p.title}</div>
                        <div className="text-xs text-gray-500">ID: {id}</div>
                      </td>

                      <td className="px-5 py-4">{p.category || "—"}</td>
                      <td className="px-5 py-4">{Number(p.price || 0)}</td>

                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={e.stock}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [id]: { ...prev[id], stock: ev.target.value },
                            }))
                          }
                          className="w-[120px] rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={e.lowStockThreshold}
                          onChange={(ev) =>
                            setEdits((prev) => ({
                              ...prev,
                              [id]: { ...prev[id], lowStockThreshold: ev.target.value },
                            }))
                          }
                          className="w-[140px] rounded-2xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={st.tone}>{st.label}</Badge>
                        {!p.isActive ? (
                          <span className="ml-2">
                            <Badge tone="gray">Inactive</Badge>
                          </span>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => saveRow(p)}
                          className="inline-flex items-center gap-2 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-900 disabled:opacity-60"
                          disabled={isRowSaving || bulkMutation.isPending}
                        >
                          {isRowSaving ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Save size={14} />
                          )}
                          Save
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
          <span className="font-semibold text-gray-900">{pages}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Prev
          </button>
          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Confirm Bulk */}
      <ConfirmDialog
        open={confirmBulk.open}
        title="Apply bulk update?"
        description="This will update stock and/or threshold for all selected products."
        confirmText="Apply"
        cancelText="Cancel"
        tone="neutral"
        busy={bulkMutation.isPending}
        onConfirm={async () => {
          setConfirmBulk({ open: false });

          const ids = Array.from(selected);
          if (ids.length === 0) return;

          const payload = { ids };

          if (bulkStock !== "") {
            const n = safeNum(bulkStock);
            if (n == null || n < 0) return toast.error("Bulk stock must be 0 or greater");
            payload.stock = n;
          }

          if (bulkThr !== "") {
            const n = safeNum(bulkThr);
            if (n == null || n < 0) return toast.error("Bulk threshold must be 0 or greater");
            payload.lowStockThreshold = n;
          }

          if (payload.stock == null && payload.lowStockThreshold == null) {
            return toast.error("Set stock or threshold first.");
          }

          await bulkMutation.mutateAsync(payload);
        }}
        onClose={() => setConfirmBulk({ open: false })}
      />
    </div>
  );
}
