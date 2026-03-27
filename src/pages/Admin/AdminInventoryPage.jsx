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
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />;
}

function Badge({ children, tone = "gray" }) {
  const className =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] ${className}`}>
      {children}
    </span>
  );
}

function statusOf(product) {
  const stock = Number(product?.stock || 0);
  const threshold = Number(product?.lowStockThreshold ?? 5);

  if (stock <= 0) return { label: "Out of stock", tone: "red" };
  if (stock <= threshold) return { label: "Low stock", tone: "amber" };
  return { label: "OK", tone: "green" };
}

function safeNum(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/* ----------------------------- page ----------------------------- */

export default function AdminInventoryPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  const [q, setQ] = useState("");
  const debouncedQ = useDebouncedValue(q, 350);

  const [category, setCategory] = useState("");
  const [stock, setStock] = useState("");
  const [isActive, setIsActive] = useState("");
  const [sort, setSort] = useState("stock_asc");

  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const categoryFromUrl = searchParams.get("category");
    if (categoryFromUrl) setCategory(categoryFromUrl);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, category, stock, isActive, sort]);

  const params = useMemo(() => {
    const next = { page, limit, sort };

    if (debouncedQ.trim()) next.q = debouncedQ.trim();
    if (category) next.category = category;
    if (stock) next.stock = stock;
    if (isActive !== "") next.isActive = isActive;

    return next;
  }, [page, limit, debouncedQ, category, stock, isActive, sort]);

  /* -------- categories dropdown -------- */

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-lite"],
    queryFn: async ({ signal }) =>
      (await api.get("/products/admin/categories", { signal })).data,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });

  const categoryOptions = useMemo(() => {
    const rows = categoriesQuery.data?.categories || [];
    return rows
      .map((row) => String(row?.name || row?._id || "").trim())
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [categoriesQuery.data]);

  /* -------- summary cards -------- */

  const summaryQuery = useQuery({
    queryKey: ["admin-inventory-summary", { q: debouncedQ, category, isActive }],
    queryFn: async ({ signal }) => {
      const response = await api.get("/products/admin/inventory-summary", {
        params: {
          q: debouncedQ.trim() || undefined,
          category: category || undefined,
          isActive: isActive !== "" ? isActive : undefined,
        },
        signal,
      });
      return response.data;
    },
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  /* -------- list -------- */

  const listQuery = useQuery({
    queryKey: ["admin-inventory", params],
    queryFn: async ({ signal }) =>
      (await api.get("/products/admin", { params, signal })).data,
    staleTime: 20_000,
    placeholderData: (prev) => prev,
  });

  const items = listQuery.data?.products || [];
  const total = Number(listQuery.data?.total || 0);
  const pages = Math.max(1, Number(listQuery.data?.pages || 1));

  /* -------- row edits -------- */

  const [edits, setEdits] = useState({});

  useEffect(() => {
    setEdits((prev) => {
      const next = { ...prev };

      for (const product of items) {
        if (!product?._id) continue;

        if (!next[product._id]) {
          next[product._id] = {
            stock: String(product.stock ?? 0),
            lowStockThreshold: String(product.lowStockThreshold ?? 5),
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
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage(checked) {
    setSelected((prev) => {
      const next = new Set(prev);

      for (const product of items) {
        if (!product?._id) continue;
        if (checked) next.add(product._id);
        else next.delete(product._id);
      }

      return next;
    });
  }

  const idsOnPage = useMemo(() => items.map((p) => p?._id).filter(Boolean), [items]);

  const allSelectedOnPage =
    idsOnPage.length > 0 && idsOnPage.every((id) => selected.has(id));

  const someSelectedOnPage =
    idsOnPage.some((id) => selected.has(id)) && !allSelectedOnPage;

  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = someSelectedOnPage;
    }
  }, [someSelectedOnPage]);

  /* -------- mutations -------- */

  const [savingId, setSavingId] = useState(null);

  const updateOneMutation = useMutation({
    mutationFn: async ({ id, payload }) =>
      (await api.patch(`/products/${id}`, payload)).data,
    onSuccess: async () => {
      toast.success("Inventory updated");
      await queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-inventory-summary"] });
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Update failed"),
    onSettled: () => setSavingId(null),
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, stock: nextStock, lowStockThreshold }) =>
      (
        await api.patch("/products/admin/bulk-stock", {
          ids,
          stock: nextStock,
          lowStockThreshold,
        })
      ).data,
    onSuccess: async (data) => {
      toast.success("Bulk update completed", {
        description: `${data?.modified || 0} item(s) updated`,
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-inventory-summary"] });
      setSelected(new Set());
      setBulkStock("");
      setBulkThr("");
    },
    onError: (error) =>
      toast.error(error?.response?.data?.message || "Bulk update failed"),
  });

  async function saveRow(product) {
    const id = product?._id;
    if (!id) return;

    const stockValue = edits?.[id]?.stock;
    const thresholdValue = edits?.[id]?.lowStockThreshold;

    const stockNum = safeNum(stockValue);
    const thresholdNum = safeNum(thresholdValue);

    if (stockNum == null || stockNum < 0) {
      return toast.error("Stock must be 0 or greater");
    }

    if (thresholdNum == null || thresholdNum < 0) {
      return toast.error("Low-stock threshold must be 0 or greater");
    }

    setSavingId(id);

    await updateOneMutation.mutateAsync({
      id,
      payload: {
        stock: stockNum,
        lowStockThreshold: thresholdNum,
      },
    });
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
  const selectedCount = selected.size;
  const isRefreshing = listQuery.isFetching || summaryQuery.isFetching;

  return (
    <div className="rounded-[30px] border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 p-4 shadow-sm sm:p-5 lg:p-6">
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
            const value = safeNum(bulkStock);
            if (value == null || value < 0) {
              return toast.error("Bulk stock must be 0 or greater");
            }
            payload.stock = value;
          }

          if (bulkThr !== "") {
            const value = safeNum(bulkThr);
            if (value == null || value < 0) {
              return toast.error("Bulk threshold must be 0 or greater");
            }
            payload.lowStockThreshold = value;
          }

          if (payload.stock == null && payload.lowStockThreshold == null) {
            return toast.error("Set stock or threshold first.");
          }

          await bulkMutation.mutateAsync(payload);
        }}
        onClose={() => setConfirmBulk({ open: false })}
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <Boxes size={14} />
            Inventory Management
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
            Inventory
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Monitor stock, thresholds and product availability with filters, bulk updates
            and fast inline editing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              summaryQuery.refetch();
              listQuery.refetch();
            }}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isRefreshing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCw size={16} />
            )}
            Refresh
          </button>

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {summaryQuery.isPending ? (
          <>
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
          </>
        ) : (
          <>
            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total products</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {summary.total ?? "—"}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Active</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {summary.active ?? "—"}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Out of stock</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {summary.outOfStock ?? "—"}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Low stock</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {summary.lowStock ?? "—"}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total stock</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {summary.totalStock ?? "—"}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div className="md:col-span-5">
            <label className="block text-sm font-semibold text-gray-800">Search</label>
            <div className="relative mt-2">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search inventory"
                className="w-full rounded-2xl border border-gray-200 px-10 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-sm font-semibold text-gray-800">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <option value="">All</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800">Stock state</label>
            <select
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
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
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
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
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              <option value="stock_asc">Stock (low to high)</option>
              <option value="stock_desc">Stock (high to low)</option>
              <option value="updated_desc">Recently updated</option>
            </select>
          </div>
        </div>
      </div>

      {selectedCount > 0 ? (
        <div className="mt-5 rounded-[28px] border border-gray-200 bg-gray-50 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="text-sm font-semibold text-gray-900">
              Selected: <span>{selectedCount}</span>
            </div>

            <div className="flex flex-wrap gap-2 lg:ml-auto">
              <input
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
                placeholder="Set stock (optional)"
                type="number"
                min={0}
                className="w-[170px] rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />

              <input
                value={bulkThr}
                onChange={(e) => setBulkThr(e.target.value)}
                placeholder="Set threshold (optional)"
                type="number"
                min={0}
                className="w-[190px] rounded-2xl border border-gray-200 px-4 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />

              <button
                type="button"
                onClick={() => setConfirmBulk({ open: true })}
                disabled={bulkMutation.isPending}
                className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
              >
                {bulkMutation.isPending ? "Applying..." : "Apply bulk update"}
              </button>

              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={bulkMutation.isPending}
                className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:opacity-60"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 bg-gray-50 px-5 py-4">
          <div className="text-sm font-semibold text-gray-900">Products</div>
          <div className="text-xs text-gray-500">
            {listQuery.isFetching ? "Updating..." : `${total} total`}
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
              className="ml-3 font-semibold text-gray-900 underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
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
                {items.map((product) => {
                  const id = product._id;
                  const currentStatus = statusOf(product);
                  const editState = edits[id] || {
                    stock: String(product.stock ?? 0),
                    lowStockThreshold: String(product.lowStockThreshold ?? 5),
                  };

                  const isRowSaving = savingId === id && updateOneMutation.isPending;

                  return (
                    <tr key={id} className="border-b border-gray-100 last:border-b-0">
                      <td className="px-5 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-black"
                          checked={selected.has(id)}
                          onChange={() => toggleSelect(id)}
                        />
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900">{product.title}</div>
                        <div className="text-xs text-gray-500">ID: {id}</div>
                      </td>

                      <td className="px-5 py-4 text-gray-700">{product.category || "—"}</td>
                      <td className="px-5 py-4 text-gray-900">{Number(product.price || 0)}</td>

                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={editState.stock}
                          onChange={(event) =>
                            setEdits((prev) => ({
                              ...prev,
                              [id]: {
                                ...prev[id],
                                stock: event.target.value,
                              },
                            }))
                          }
                          className="w-[120px] rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <input
                          type="number"
                          min={0}
                          value={editState.lowStockThreshold}
                          onChange={(event) =>
                            setEdits((prev) => ({
                              ...prev,
                              [id]: {
                                ...prev[id],
                                lowStockThreshold: event.target.value,
                              },
                            }))
                          }
                          className="w-[140px] rounded-2xl border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                        />
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={currentStatus.tone}>{currentStatus.label}</Badge>
                        {!product.isActive ? (
                          <span className="ml-2">
                            <Badge tone="gray">Inactive</Badge>
                          </span>
                        ) : null}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => saveRow(product)}
                          disabled={isRowSaving || bulkMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-2xl bg-black px-3 py-2 text-xs font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
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

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold text-gray-900">{page}</span> of{" "}
          <span className="font-semibold text-gray-900">{pages}</span>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Prev
          </button>

          <button
            type="button"
            disabled={page >= pages}
            onClick={() => setPage((prev) => Math.min(pages, prev + 1))}
            className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}