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
  const value = Number(n || 0);
  if (Number.isNaN(value)) return "৳0";
  return `৳${value.toFixed(0)}`;
}

function formatDate(iso) {
  try {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
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
  const message =
    err?.response?.data?.message || err?.response?.data?.error || err?.message;
  return message ? String(message) : "Something went wrong.";
}

function statusBadgeClass(status) {
  const value = String(status || "").toLowerCase();

  if (value === "pending") return "bg-amber-50 border-amber-200 text-amber-800";
  if (value === "paid") return "bg-emerald-50 border-emerald-200 text-emerald-800";
  if (value === "processing") return "bg-blue-50 border-blue-200 text-blue-800";
  if (value === "shipped") return "bg-indigo-50 border-indigo-200 text-indigo-800";
  if (value === "delivered") return "bg-green-50 border-green-200 text-green-800";
  if (value === "cancelled") return "bg-rose-50 border-rose-200 text-rose-800";

  return "bg-gray-50 border-gray-200 text-gray-700";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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

      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-auto border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Order details
            </div>
            <div className="mt-1 truncate text-lg font-semibold text-gray-900">
              #{String(order?._id || "").slice(-10).toUpperCase()}
            </div>

            <div className="mt-2 inline-flex flex-wrap items-center gap-2">
              <span
                className={[
                  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                  statusBadgeClass(order?.status),
                ].join(" ")}
              >
                {String(order?.status || "").toUpperCase()}
              </span>

              <span className="text-xs text-gray-500">{formatDate(order?.createdAt)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-2xl p-2 transition hover:bg-gray-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Customer</div>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              <div className="font-medium text-gray-900">{order?.user?.displayName || "—"}</div>
              <div className="text-gray-600">{order?.user?.email || "—"}</div>
              <div className="text-gray-600">{order?.user?.phone || "—"}</div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Shipping</div>
            <div className="mt-2 space-y-1 text-sm text-gray-700">
              <div className="font-medium text-gray-900">
                {order?.shippingAddress?.name || "—"}
              </div>
              <div className="text-gray-600">{order?.shippingAddress?.phone || "—"}</div>
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

          <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <div className="text-sm font-semibold text-gray-900">Items</div>
              <div className="mt-1 text-xs text-gray-500">
                {(order?.items || []).length} item(s)
              </div>
            </div>

            <div className="space-y-4 p-5">
              {(order?.items || []).map((item, idx) => (
                <div
                  key={`${item.product}-${idx}`}
                  className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4"
                >
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-gray-900">{item.title}</div>
                    <div className="text-sm text-gray-500">
                      Qty: {item.qty} • Price: {formatMoney(item.price)}
                    </div>
                  </div>

                  <div className="text-right font-bold text-gray-900">
                    {formatMoney((item.price || 0) * (item.qty || 0))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 bg-gray-50 p-5">
              <div className="space-y-2 text-sm text-gray-600">
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
                  <span className="font-bold text-gray-900">{formatMoney(order?.total)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5 text-xs text-gray-600">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <ShieldCheck size={14} />
              Order operations
            </div>
            <div className="mt-1 leading-6">
              Search, filters and status changes are active. Delivery tracking, invoice flow
              and refund workflow can be added next.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const deferredQuery = useDeferredValue(q);
  const [drawerOrder, setDrawerOrder] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    id: null,
    nextStatus: null,
    title: "",
    description: "",
  });

  const queryKey = useMemo(
    () => ["admin-orders", page, limit, status, String(deferredQuery || ""), dateFrom, dateTo],
    [page, limit, status, deferredQuery, dateFrom, dateTo]
  );

  const badRange = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const listQuery = useQuery({
    queryKey,
    enabled: !badRange,
    queryFn: async ({ signal }) => {
      const params = { page, limit };

      if (status) params.status = status;
      if (String(deferredQuery || "").trim()) params.q = String(deferredQuery || "").trim();
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const { data } = await api.get("/orders/admin/list", { params, signal });
      return data;
    },
    staleTime: 8_000,
    keepPreviousData: true,
    retry: 1,
  });

  const orders = listQuery.data?.orders || [];
  const total = listQuery.data?.total || 0;
  const pages = listQuery.data?.pages || 1;

  const filteredOrders = useMemo(() => {
    const term = String(deferredQuery || "").trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((order) => {
      const id = String(order?._id || "").toLowerCase();
      const email = String(order?.user?.email || "").toLowerCase();
      const phone = String(order?.user?.phone || "").toLowerCase();
      const name = String(order?.user?.displayName || "").toLowerCase();

      return (
        id.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        name.includes(term)
      );
    });
  }, [orders, deferredQuery]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, nextStatus }) => {
      const { data } = await api.patch(`/orders/admin/${id}/status`, {
        status: nextStatus,
      });
      return data;
    },
    onMutate: async ({ id, nextStatus }) => {
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => {
        if (!old?.orders) return old;
        return {
          ...old,
          orders: old.orders.map((order) =>
            order._id === id ? { ...order, status: nextStatus } : order
          ),
        };
      });

      return { previous };
    },
    onError: (err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      toast.error(getErrorMessage(err));
    },
    onSuccess: () => {
      toast.success("Order status updated");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    },
  });

  function goPage(nextPage) {
    setPage(clamp(Number(nextPage || 1), 1, Math.max(1, pages)));
  }

  function requestStatusChange(order, nextStatus) {
    const id = order?._id;
    if (!id) return;

    const normalizedStatus = String(nextStatus || "").trim();
    if (!UPDATE_STATUS_OPTIONS.includes(normalizedStatus)) {
      toast.error("Invalid status");
      return;
    }

    if (normalizedStatus === "cancelled") {
      setConfirm({
        open: true,
        id,
        nextStatus: normalizedStatus,
        title: "Cancel this order?",
        description: "This will mark the order as cancelled. Continue?",
      });
      return;
    }

    updateStatusMutation.mutate({ id, nextStatus: normalizedStatus });
  }

  function onConfirmCancel() {
    if (!confirm?.id || !confirm?.nextStatus) return;

    updateStatusMutation.mutate({
      id: confirm.id,
      nextStatus: confirm.nextStatus,
    });

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
    <div className="space-y-5">
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

      <Drawer
        open={!!drawerOrder}
        order={drawerOrder}
        onClose={() => setDrawerOrder(null)}
      />

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <ClipboardList size={14} />
              Orders
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              Orders management
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Total orders:{" "}
              <span className="font-semibold text-gray-900">{total}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching || badRange}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
      </div>

      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="relative mt-2">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by order id, email, phone, customer or item"
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2 focus:ring-black focus:ring-offset-2"
              />

              {q ? (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 transition hover:bg-gray-50"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Search runs on the server. Local filtering is kept as an extra layer for the
              current page view.
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="text-sm font-semibold text-gray-900">Status</div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Per page</div>
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value || 20));
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
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
                onClick={() => goPage(page - 1)}
                disabled={page <= 1 || listQuery.isFetching || badRange}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Prev
              </button>

              <div className="min-w-[90px] text-center text-sm font-semibold text-gray-900">
                {page} / {pages}
              </div>

              <button
                type="button"
                onClick={() => goPage(page + 1)}
                disabled={page >= pages || listQuery.isFetching || badRange}
                className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">Date from</div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-gray-900">Date to</div>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </div>
        </div>

        {badRange ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            Invalid date range. “Date from” must be earlier than “Date to”.
          </div>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        {listQuery.isPending ? (
          <OrdersTableSkeleton rows={10} />
        ) : listQuery.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-semibold">Failed to load orders</div>
              <div className="mt-1">{getErrorMessage(listQuery.error)}</div>

              <button
                type="button"
                onClick={() => listQuery.refetch()}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Try again
              </button>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
              No orders
            </div>
            <div className="text-2xl font-bold text-gray-900">No results found</div>
            <div className="mt-2 text-gray-600">
              Try changing the status, search term or date range.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                  <th className="px-4 py-4 font-semibold">Order</th>
                  <th className="px-4 py-4 font-semibold">Customer</th>
                  <th className="px-4 py-4 font-semibold">Date</th>
                  <th className="px-4 py-4 font-semibold">Items</th>
                  <th className="px-4 py-4 text-right font-semibold">Total</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredOrders.map((order) => {
                  const id = order?._id;
                  const busy =
                    updateStatusMutation.isPending &&
                    updateStatusMutation.variables?.id === id;

                  return (
                    <tr
                      key={id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/70 last:border-b-0"
                    >
                      <td className="px-4 py-4">
                        <div className="font-semibold text-gray-900">
                          #{String(id || "").slice(-8).toUpperCase()}
                        </div>
                        <div className="font-mono text-xs text-gray-500">
                          {String(id || "")}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="max-w-[220px] truncate font-semibold text-gray-900">
                          {order?.user?.displayName || "—"}
                        </div>
                        <div className="max-w-[220px] truncate text-sm text-gray-500">
                          {order?.user?.email || "—"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700">
                          {formatDate(order?.createdAt)}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-gray-900">
                          {(order?.items || []).length}
                        </div>
                        <div className="text-xs text-gray-500">
                          {String(order?.status || "").toUpperCase()}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right font-bold text-gray-900">
                        {formatMoney(order?.total)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                              statusBadgeClass(order?.status),
                            ].join(" ")}
                          >
                            {String(order?.status || "").toUpperCase()}
                          </span>

                          <select
                            value={String(order?.status || "pending")}
                            disabled={busy}
                            onChange={(e) => requestStatusChange(order, e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                          >
                            {UPDATE_STATUS_OPTIONS.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>

                          {busy ? (
                            <Loader2 size={16} className="animate-spin text-gray-500" />
                          ) : null}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setDrawerOrder(order)}
                          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                        >
                          <Eye size={16} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4 text-xs text-gray-500">
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
                    <Loader2 size={14} className="animate-spin" />
                    Updating...
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