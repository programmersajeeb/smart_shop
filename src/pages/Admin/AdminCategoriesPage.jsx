import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Boxes,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  ArrowRight,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../services/apiClient";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
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

function Badge({ children, tone = "gray" }) {
  const className =
    tone === "green"
      ? "bg-green-50 text-green-700 border-green-200"
      : tone === "red"
      ? "bg-red-50 text-red-700 border-red-200"
      : tone === "amber"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span className={`rounded-full border px-2 py-1 text-[11px] ${className}`}>
      {children}
    </span>
  );
}

function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-gray-100 ${className}`} />;
}

function normalizeMasterCategories(input) {
  const list = Array.isArray(input) ? input : [];
  return list
    .map((item) => ({
      id: String(item?.id || "").trim(),
      name: String(item?.name || "").trim(),
      slug: String(item?.slug || "").trim(),
      image: String(item?.image || "").trim(),
      isActive: item?.isActive !== false,
      featured: Boolean(item?.featured),
      sortOrder: Number.isFinite(Number(item?.sortOrder))
        ? Number(item.sortOrder)
        : 0,
      iconKey: String(item?.iconKey || "").trim(),
    }))
    .filter((item) => item.name)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();

  const [q, setQ] = useState("");
  const debouncedQuery = useDebouncedValue(q, 350);

  const [renameModal, setRenameModal] = useState({
    open: false,
    from: "",
    to: "",
  });

  const [confirm, setConfirm] = useState({
    open: false,
    category: "",
  });

  const [working, setWorking] = useState({
    type: null,
    category: "",
  });

  const isAnyWorking = Boolean(working.type);
  const modalPanelRef = useRef(null);

  const listQuery = useQuery({
    queryKey: ["admin-categories", { q: debouncedQuery?.trim() || "" }],
    queryFn: async ({ signal }) => {
      const response = await api.get("/products/admin/categories", {
        params: { q: debouncedQuery?.trim() || undefined },
        signal,
      });
      return response.data;
    },
    staleTime: 20000,
    placeholderData: (prev) => prev,
    refetchOnWindowFocus: false,
  });

  const shopCfgQuery = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60000,
  });

  const usageRows = Array.isArray(listQuery.data?.categories)
    ? listQuery.data.categories
    : [];

  const registryRows = useMemo(
    () => normalizeMasterCategories(shopCfgQuery.data?.data?.categories),
    [shopCfgQuery.data?.data?.categories]
  );

  const rows = useMemo(() => {
    const usageMap = new Map(
      usageRows.map((row) => [
        String(row?.name || row?._id || "").trim().toLowerCase(),
        row,
      ])
    );

    const merged = registryRows.map((item) => {
      const usage = usageMap.get(item.name.toLowerCase()) || null;

      return {
        id: item.id,
        name: item.name,
        slug: item.slug,
        image: item.image,
        isActive: item.isActive,
        featured: item.featured,
        sortOrder: item.sortOrder,
        count: Number(usage?.count || 0),
        activeCount: Number(usage?.activeCount || 0),
        inStockCount: Number(usage?.inStockCount || 0),
        lowStockCount: Number(usage?.lowStockCount || 0),
        outOfStockCount: Number(usage?.outOfStockCount || 0),
        totalStock: Number(usage?.totalStock || 0),
      };
    });

    const query = String(debouncedQuery || "").trim().toLowerCase();
    if (!query) return merged;

    return merged.filter((row) => {
      return (
        row.name.toLowerCase().includes(query) ||
        row.slug.toLowerCase().includes(query)
      );
    });
  }, [registryRows, usageRows, debouncedQuery]);

  const totals = useMemo(() => {
    return {
      totalCategories: rows.length,
      totalProducts: rows.reduce((sum, row) => sum + Number(row.count || 0), 0),
      totalStock: rows.reduce((sum, row) => sum + Number(row.totalStock || 0), 0),
      lowStock: rows.reduce((sum, row) => sum + Number(row.lowStockCount || 0), 0),
    };
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
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Rename failed");
    },
    onSettled: () => {
      setWorking({ type: null, category: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ category }) =>
      (await api.post("/products/admin/categories/delete", { category })).data,
    onMutate: async ({ category }) => {
      setWorking({ type: "delete", category: String(category || "") });
    },
    onSuccess: async () => {
      toast.success("Category removed from products");

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
      ]);
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || "Delete failed");
    },
    onSettled: () => {
      setWorking({ type: null, category: "" });
    },
  });

  function openRename(category) {
    setRenameModal({
      open: true,
      from: category,
      to: category,
    });
  }

  function closeRename() {
    setRenameModal({
      open: false,
      from: "",
      to: "",
    });
  }

  async function submitRename() {
    const from = String(renameModal.from || "").trim();
    const to = String(renameModal.to || "").trim();

    if (!from) return toast.error("Missing category");
    if (!to) return toast.error("New name required");
    if (from === to) {
      return toast.message("No change", {
        description: "Category name is unchanged.",
      });
    }

    const currentShop = shopCfgQuery.data?.data || {};
    const currentCategories = normalizeMasterCategories(currentShop.categories);

    const nextCategories = currentCategories.map((item) =>
      item.name === from
        ? {
            ...item,
            name: to,
            slug: String(item.slug || "").trim() || slugify(to),
          }
        : item
    );

    closeRename();

    await api.put("/page-config/shop", {
      ...currentShop,
      categories: nextCategories,
      version: Number(shopCfgQuery.data?.version || 0),
    });

    await renameMutation.mutateAsync({ from, to });
    await queryClient.invalidateQueries({ queryKey: ["page-config", "shop"] });
  }

  async function handleRegistryDelete(name) {
    const currentShop = shopCfgQuery.data?.data || {};
    const currentCategories = normalizeMasterCategories(currentShop.categories);
    const nextCategories = currentCategories.filter((item) => item.name !== name);

    await api.put("/page-config/shop", {
      ...currentShop,
      categories: nextCategories,
      version: Number(shopCfgQuery.data?.version || 0),
    });

    await deleteMutation.mutateAsync({ category: name });
    await queryClient.invalidateQueries({ queryKey: ["page-config", "shop"] });
  }

  function resetFilters() {
    setQ("");
  }

  useEffect(() => {
    if (!renameModal.open) return;

    lockBodyScroll(true);

    function onKeyDown(event) {
      if (event.key === "Escape") closeRename();
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      lockBodyScroll(false);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [renameModal.open]);

  useEffect(() => {
    if (!renameModal.open) return;

    function onClickOutside(event) {
      if (!modalPanelRef.current) return;
      if (!modalPanelRef.current.contains(event.target)) {
        closeRename();
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("touchstart", onClickOutside);

    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("touchstart", onClickOutside);
    };
  }, [renameModal.open]);

  return (
    <div className="rounded-[30px] border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 p-4 shadow-sm sm:p-5 lg:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
            <Boxes size={14} />
            Category Management
          </div>

          <h1 className="mt-3 text-xl font-semibold tracking-tight text-gray-950 sm:text-2xl">
            Categories
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Categories now come from the master registry in Shop Control. Usage stats below are calculated from products.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              listQuery.refetch();
              shopCfgQuery.refetch();
            }}
            disabled={listQuery.isFetching || shopCfgQuery.isFetching}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {listQuery.isFetching || shopCfgQuery.isFetching ? (
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

          <Link
            to="/admin/shop-control"
            className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Shop Control
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {listQuery.isPending || shopCfgQuery.isPending ? (
          <>
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
            <Skeleton className="h-[92px]" />
          </>
        ) : (
          <>
            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Categories</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {totals.totalCategories}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Products mapped</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {totals.totalProducts}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Total stock</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {totals.totalStock}
              </div>
            </div>

            <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
              <div className="text-xs text-gray-500">Low-stock items</div>
              <div className="mt-1 text-2xl font-semibold text-gray-950">
                {totals.lowStock}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mt-5 rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <label className="block text-sm font-semibold text-gray-800">Search</label>

        <div className="relative mt-2">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search category name"
            className="w-full rounded-2xl border border-gray-200 px-10 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 bg-gray-50 px-5 py-4">
          <div className="text-sm font-semibold text-gray-900">Category list</div>
          <div className="text-xs text-gray-500">
            {listQuery.isFetching || shopCfgQuery.isFetching
              ? "Updating..."
              : `${rows.length} item(s)`}
          </div>
        </div>

        {listQuery.isPending || shopCfgQuery.isPending ? (
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
                className="ml-3 font-semibold text-gray-900 underline"
                onClick={resetFilters}
              >
                Clear search
              </button>
            ) : null}
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">State</th>
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
                {rows.map((row) => {
                  const name = row.name;
                  const isRowWorking =
                    (working.type === "rename" || working.type === "delete") &&
                    String(working.category || "") === String(name || "");

                  return (
                    <tr
                      key={row.id || name}
                      className="border-b border-gray-100 last:border-b-0"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 overflow-hidden rounded-2xl border border-gray-200 bg-gray-50">
                            {row.image ? (
                              <img
                                src={row.image}
                                alt={row.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <ImageIcon size={16} />
                              </div>
                            )}
                          </div>

                          <div>
                            <div className="font-semibold text-gray-900">{name}</div>
                            <div className="mt-1 text-xs text-gray-500">
                              /{row.slug}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={row.isActive ? "green" : "gray"}>
                            {row.isActive ? "Active" : "Hidden"}
                          </Badge>
                          {row.featured ? <Badge tone="amber">Featured</Badge> : null}
                          <Badge tone="gray">Order {row.sortOrder}</Badge>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-gray-900">{row.count}</td>

                      <td className="px-5 py-4">
                        <Badge tone={row.activeCount ? "green" : "gray"}>
                          {row.activeCount}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={row.inStockCount ? "green" : "gray"}>
                          {row.inStockCount}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={row.lowStockCount ? "amber" : "gray"}>
                          {row.lowStockCount}
                        </Badge>
                      </td>

                      <td className="px-5 py-4">
                        <Badge tone={row.outOfStockCount ? "red" : "gray"}>
                          {row.outOfStockCount}
                        </Badge>
                      </td>

                      <td className="px-5 py-4 text-gray-900">{row.totalStock}</td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openRename(name)}
                            disabled={isAnyWorking || isRowWorking}
                            className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
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
                            disabled={isAnyWorking || isRowWorking}
                            className="rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
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

      {renameModal.open ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 p-4">
          <div
            ref={modalPanelRef}
            className="w-full max-w-lg rounded-[28px] border border-gray-200 bg-white shadow-lg"
          >
            <div className="border-b border-gray-100 p-5">
              <div className="text-lg font-semibold text-gray-950">Rename category</div>
              <div className="mt-1 text-sm text-gray-600">
                This updates the master registry and all matching products.
              </div>
            </div>

            <div className="p-5">
              <label className="block text-sm font-semibold text-gray-800">
                New name
              </label>
              <input
                value={renameModal.to}
                onChange={(e) =>
                  setRenameModal((prev) => ({ ...prev, to: e.target.value }))
                }
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                autoFocus
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  onClick={closeRename}
                  disabled={renameMutation.isPending}
                >
                  Cancel
                </button>

                <button
                  className="rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
                  onClick={submitRename}
                  disabled={renameMutation.isPending}
                >
                  {renameMutation.isPending ? "Working..." : "Rename"}
                </button>
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
            ? `This removes the category from the master registry and clears it from products currently in "${confirm.category}".`
            : ""
        }
        confirmText="Remove"
        cancelText="Cancel"
        tone="danger"
        busy={deleteMutation.isPending}
        onConfirm={async () => {
          const category = confirm.category;
          setConfirm({ open: false, category: "" });
          if (!category) return;
          await handleRegistryDelete(category);
        }}
        onClose={() => setConfirm({ open: false, category: "" })}
      />
    </div>
  );
}