import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  RefreshCw,
} from "lucide-react";

import api from "../../../services/apiClient";
import OrdersTableSkeleton from "../../../shared/components/ui/skeletons/OrdersTableSkeleton";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function formatDate(d) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return "";
  }
}

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "delivered") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (s === "processing") return "border-blue-200 bg-blue-50 text-blue-700";
  if (s === "shipped") return "border-indigo-200 bg-indigo-50 text-indigo-700";
  if (s === "cancelled") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage ? String(serverMessage) : "Something went wrong.";
}

export default function OrderHistoryPage() {
  const [sp, setSp] = useSearchParams();

  const page = Math.max(1, parseInt(sp.get("page") || "1", 10));
  const limit = 10;

  const q = useQuery({
    queryKey: ["my-orders", { page, limit }],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/orders", {
        params: { page, limit },
        signal,
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 10_000,
    retry: 1,
  });

  const orders = q.data?.orders || [];
  const pages = q.data?.pages || 1;
  const total = q.data?.total || 0;

  const canPrev = page > 1;
  const canNext = page < pages;
  const pageLabel = useMemo(() => `${page} / ${pages}`, [page, pages]);

  const isInitialLoading = q.isPending && !q.data;
  const isUpdating = q.isFetching && !!q.data;

  const goToPage = (nextPage) => {
    setSp((prev) => {
      const n = new URLSearchParams(prev);
      n.set("page", String(nextPage));
      return n;
    });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-gray-500">My account</div>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Orders
              </h2>

              {isUpdating ? (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block h-3 w-16 animate-pulse rounded-md bg-gray-200" />
                  Updating...
                </span>
              ) : null}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Total orders: <span className="font-semibold text-gray-900">{total}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => q.refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <Link
              to="/account"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ClipboardList size={18} />
            Order history
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canPrev || isInitialLoading || q.isFetching}
              onClick={() => {
                if (!canPrev) return;
                goToPage(page - 1);
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="min-w-[72px] text-center text-sm font-semibold text-gray-700">
              {pageLabel}
            </div>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!canNext || isInitialLoading || q.isFetching}
              onClick={() => {
                if (!canNext) return;
                goToPage(page + 1);
              }}
              aria-label="Next page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {isInitialLoading ? (
          <OrdersTableSkeleton rows={limit} />
        ) : q.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="font-semibold">Failed to load orders.</div>
              <div className="mt-1">{getErrorMessage(q.error)}</div>
              <button
                type="button"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
                onClick={() => q.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6">
            <div className="rounded-2xl border bg-gray-50 p-5">
              <div className="font-semibold text-gray-900">No orders found</div>
              <div className="mt-1 text-sm text-gray-600">
                You don’t have any orders yet.
              </div>
              <Link
                to="/shop"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Go to shop
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto p-6">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                    <th className="pb-4 pr-4 font-semibold">Order</th>
                    <th className="px-4 pb-4 font-semibold">Date</th>
                    <th className="px-4 pb-4 font-semibold">Items</th>
                    <th className="px-4 pb-4 font-semibold">Status</th>
                    <th className="px-4 pb-4 text-right font-semibold">Total</th>
                    <th className="pl-4 pb-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className={isUpdating ? "opacity-60" : ""}>
                  {orders.map((o) => (
                    <tr key={o._id} className="border-b border-gray-100 last:border-b-0">
                      <td className="py-4 pr-4">
                        <div className="font-medium text-gray-900">
                          #{String(o._id).slice(-6).toUpperCase()}
                        </div>
                        <div className="mt-1 truncate text-xs text-gray-500">
                          {String(o._id)}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-700">{formatDate(o.createdAt)}</td>
                      <td className="px-4 py-4 text-gray-700">{o.items?.length || 0}</td>
                      <td className="px-4 py-4">
                        <span
                          className={cx(
                            "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                            statusBadgeClass(o.status)
                          )}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right font-semibold text-gray-900">
                        {formatMoney(o.total)}
                      </td>
                      <td className="pl-4 py-4 text-right">
                        <Link
                          to={`/account/orders/${o._id}`}
                          className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 text-xs text-gray-500">
              Showing {orders.length} orders • page {page} of {pages}
            </div>
          </>
        )}
      </div>
    </div>
  );
}