import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ClipboardList,
  Loader2,
  RefreshCcw,
  Search,
  Eye,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import OrdersTableSkeleton from "../../shared/components/ui/skeletons/OrdersTableSkeleton";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "paid", label: "Paid" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const UPDATE_STATUS_OPTIONS = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function getErrorMessage(err) {
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message;
  return msg ? String(msg) : "Something went wrong.";
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "bg-amber-50 border-amber-200 text-amber-800";
  if (s === "paid") return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (s === "processing") return "bg-blue-50 border-blue-200 text-blue-800";
  if (s === "shipped") return "bg-indigo-50 border-indigo-200 text-indigo-800";
  if (s === "delivered") return "bg-green-50 border-green-200 text-green-800";
  if (s === "cancelled") return "bg-rose-50 border-rose-200 text-rose-800";
  return "bg-gray-50 border-gray-200 text-gray-700";
}

function Drawer({ open, onClose, order }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close details overlay"
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l shadow-2xl overflow-auto">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              Order details
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900 truncate">
              #{String(order?._id || "").slice(-10).toUpperCase()}
            </div>
            <div className="mt-2 inline-flex items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  statusBadgeClass(order?.status),
                ].join(" ")}
              >
                {String(order?.status || "").toUpperCase()}
              </span>
              <span className="text-xs text-gray-500">
                {formatDate(order?.createdAt)}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="p-2 rounded-2xl hover:bg-gray-50 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Customer */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Customer</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="font-medium text-gray-900">
                {order?.user?.displayName || "—"}
              </div>
              <div className="text-gray-600">{order?.user?.email || "—"}</div>
              <div className="text-gray-600">{order?.user?.phone || "—"}</div>
            </div>
          </div>

          {/* Shipping */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Shipping</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="font-medium text-gray-900">
                {order?.shippingAddress?.name || "—"}
              </div>
              <div className="text-gray-600">
                {order?.shippingAddress?.phone || "—"}
              </div>
              <div className="text-gray-600">
                {order?.shippingAddress?.addressLine || "—"}
              </div>
              <div className="text-gray-600">
                {[order?.shippingAddress?.city, order?.shippingAddress?.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
                {order?.shippingAddress?.postalCode
                  ? ` - ${order.shippingAddress.postalCode}`
                  : ""}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b">
              <div className="text-sm font-semibold text-gray-900">Items</div>
              <div className="text-xs text-gray-500 mt-1">
                {(order?.items || []).length} item(s)
              </div>
            </div>

            <div className="p-5 space-y-4">
              {(order?.items || []).map((it, idx) => (
                <div
                  key={`${it.product}-${idx}`}
                  className="flex items-center gap-4 rounded-2xl border p-4"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 border overflow-hidden flex-shrink-0">
                    {it.image ? (
                      <img
                        src={it.image}
                        alt={it.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 truncate">
                      {it.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      Qty: {it.qty} • Price: {formatMoney(it.price)}
                    </div>
                  </div>

                  <div className="text-right font-bold text-gray-900">
                    {formatMoney((it.price || 0) * (it.qty || 0))}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t bg-gray-50">
              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(order?.subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(order?.shipping)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-gray-900">
                    - {formatMoney(order?.discount)}
                  </span>
                </div>
                <div className="h-px bg-gray-200" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    {formatMoney(order?.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border bg-gray-50 p-5 text-xs text-gray-600">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck size={14} /> Enterprise note
            </div>
            <div className="mt-1">
              ✅ Server-side search + date filters + audit logging are now enabled for orders. Next step:
              delivery tracking + invoice + refund workflow.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");

  // ✅ NEW: date range filters (YYYY-MM-DD)
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const dq = useDeferredValue(q);

  const [drawerOrder, setDrawerOrder] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    id: null,
    nextStatus: null,
    title: "",
    description: "",
  });

  // ✅ UPDATED: queryKey includes q + date filters (enterprise caching)
  const queryKey = useMemo(
    () => ["admin-orders", page, limit, status, String(dq || ""), dateFrom, dateTo],
    [page, limit, status, dq, dateFrom, dateTo]
  );

  const badRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const listQuery = useQuery({
    queryKey,
    enabled: !badRange, // ✅ avoid invalid range fetch
    queryFn: async ({ signal }) => {
      const params = { page, limit };
      if (status) params.status = status;

      // ✅ NEW: server-side search
      if (String(dq || "").trim()) params.q = String(dq || "").trim();

      // ✅ NEW: date range
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await api.get("/orders/admin/list", { params, signal });
      return data; // { orders, total, page, pages, ... }
    },
    staleTime: 8_000,
    keepPreviousData: true,
    retry: 1,
  });

  const orders = listQuery.data?.orders || [];
  const total = listQuery.data?.total || 0;
  const pages = listQuery.data?.pages || 1;

  // ✅ Keep your local filter logic as-is (now it works as extra filtering on top)
  const filteredOrders = useMemo(() => {
    const term = String(dq || "").trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((o) => {
      const id = String(o?._id || "").toLowerCase();
      const email = String(o?.user?.email || "").toLowerCase();
      const phone = String(o?.user?.phone || "").toLowerCase();
      const name = String(o?.user?.displayName || "").toLowerCase();

      return (
        id.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        name.includes(term)
      );
    });
  }, [orders, dq]);

  const updatingId = useMemo(() => confirm?.id, [confirm]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }) => {
      const { data } = await api.patch(`/orders/admin/${id}/status`, {
        status: nextStatus,
      });
      return data;
    },
    onMutate: async ({ id, nextStatus }) => {
      await qc.cancelQueries({ queryKey });

      const prev = qc.getQueryData(queryKey);

      // optimistic update (only current page cache)
      qc.setQueryData(queryKey, (old) => {
        if (!old?.orders) return old;
        return {
          ...old,
          orders: old.orders.map((o) =>
            o._id === id ? { ...o, status: nextStatus } : o
          ),
        };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(queryKey, ctx.prev);
      toast.error(getErrorMessage(err));
    },
    onSuccess: () => {
      toast.success("Order status updated");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function goPage(p) {
    const next = clamp(Number(p || 1), 1, Math.max(1, pages));
    setPage(next);
  }

  function requestStatusChange(order, nextStatus) {
    const id = order?._id;
    if (!id) return;

    const ns = String(nextStatus || "").trim();
    if (!UPDATE_STATUS_OPTIONS.includes(ns)) {
      toast.error("Invalid status");
      return;
    }

    // confirm only for cancellation (safer)
    if (ns === "cancelled") {
      setConfirm({
        open: true,
        id,
        nextStatus: ns,
        title: "Cancel this order?",
        description: "This will mark the order as CANCELLED. Continue?",
      });
      return;
    }

    updateStatusMutation.mutate({ id, nextStatus: ns });
  }

  function onConfirmCancel() {
    if (!confirm?.id || !confirm?.nextStatus) return;
    updateStatusMutation.mutate({ id: confirm.id, nextStatus: confirm.nextStatus });
    setConfirm({
      open: false,
      id: null,
      nextStatus: null,
      title: "",
      description: "",
    });
  }

  function onCloseConfirm() {
    if (updateStatusMutation.isPending) return;
    setConfirm({
      open: false,
      id: null,
      nextStatus: null,
      title: "",
      description: "",
    });
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText="Yes, cancel"
        cancelText="No"
        tone="danger"
        busy={updateStatusMutation.isPending}
        onConfirm={onConfirmCancel}
        onClose={onCloseConfirm}
      />

      <Drawer open={!!drawerOrder} order={drawerOrder} onClose={() => setDrawerOrder(null)} />

      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <ClipboardList size={16} />
            <span>Admin • Orders</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Orders Management
          </h1>
          <div className="text-sm text-gray-600 mt-2">
            Total orders: <span className="font-semibold text-gray-900">{total}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching || badRange}
          >
            {listQuery.isFetching ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <RefreshCcw size={16} />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-5">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="mt-2 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input input-bordered w-full rounded-2xl bg-white border-gray-200 pl-11 pr-11"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search (server) by order id / email / phone / name / item"
              />
              {q ? (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl hover:bg-gray-50"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>
            <div className="mt-2 text-xs text-gray-500">
              ✅ Search is now server-side (fast + scalable). Local filter still applies as extra safety.
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="text-sm font-semibold text-gray-900">Status</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Per page</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value || 20));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Page</div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || listQuery.isFetching || badRange}
              >
                Prev
              </button>
              <div className="min-w-[90px] text-center text-sm font-semibold">
                {page} / {pages}
              </div>
              <button
                type="button"
                className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
                onClick={() => goPage(page + 1)}
                disabled={page >= pages || listQuery.isFetching || badRange}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ✅ NEW: Date Range row (minimal change, keeps your grid intact) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-semibold text-gray-900">Date from</div>
            <input
              type="date"
              className="input input-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900">Date to</div>
            <input
              type="date"
              className="input input-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {badRange ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Invalid date range: Date from must be earlier than Date to.
          </div>
        ) : null}
      </div>

      {/* Table */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        {listQuery.isPending ? (
          <OrdersTableSkeleton rows={10} />
        ) : listQuery.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-semibold">Failed to load orders</div>
              <div className="mt-1">{getErrorMessage(listQuery.error)}</div>
              <button
                type="button"
                className="btn btn-sm mt-4 rounded-xl bg-black text-white hover:bg-gray-900 border-0"
                onClick={() => listQuery.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border px-3 py-1 text-sm bg-gray-50">
              No orders
            </div>
            <div className="text-2xl font-bold text-gray-900">No results found</div>
            <div className="mt-2 text-gray-600">
              Try changing status filter, search, or date range.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th className="text-right">Total</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((o) => {
                  const id = o?._id;
                  const busy =
                    updateStatusMutation.isPending &&
                    updateStatusMutation.variables?.id === id;

                  return (
                    <tr key={id}>
                      <td>
                        <div className="font-semibold text-gray-900">
                          #{String(id || "").slice(-8).toUpperCase()}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {String(id || "")}
                        </div>
                      </td>

                      <td>
                        <div className="font-semibold text-gray-900 truncate max-w-[220px]">
                          {o?.user?.displayName || "—"}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-[220px]">
                          {o?.user?.email || "—"}
                        </div>
                      </td>

                      <td>
                        <div className="text-sm text-gray-700">
                          {formatDate(o?.createdAt)}
                        </div>
                      </td>

                      <td>
                        <div className="text-sm font-semibold">
                          {(o?.items || []).length}
                        </div>
                        <div className="text-xs text-gray-500">
                          {String(o?.status || "").toUpperCase()}
                        </div>
                      </td>

                      <td className="text-right font-bold text-gray-900">
                        {formatMoney(o?.total)}
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              statusBadgeClass(o?.status),
                            ].join(" ")}
                          >
                            {String(o?.status || "").toUpperCase()}
                          </span>

                          <select
                            className="select select-sm select-bordered rounded-xl bg-white border-gray-200"
                            value={String(o?.status || "pending")}
                            disabled={busy}
                            onChange={(e) => requestStatusChange(o, e.target.value)}
                          >
                            {UPDATE_STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>

                          {busy ? (
                            <Loader2 size={16} className="animate-spin text-gray-500" />
                          ) : null}
                        </div>
                      </td>

                      <td className="text-right">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                          onClick={() => setDrawerOrder(o)}
                        >
                          <Eye size={16} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="p-4 border-t text-xs text-gray-500 flex flex-wrap items-center justify-between gap-3">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredOrders.length}
                </span>{" "}
                order(s) on this page • Total:{" "}
                <span className="font-semibold text-gray-900">{total}</span>
              </div>

              <div className="inline-flex items-center gap-2">
                {listQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Updating...
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
