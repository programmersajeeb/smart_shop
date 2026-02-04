import React, { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";

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

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "delivered") return "badge-success";
  if (s === "processing") return "badge-info";
  if (s === "shipped") return "badge-primary";
  if (s === "cancelled") return "badge-error";
  return "badge-warning";
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
    placeholderData: (prev) => prev, // Keeps previous page data while fetching next page
    staleTime: 10_000,
    retry: 1,
  });

  const orders = q.data?.orders || [];
  const pages = q.data?.pages || 1;

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
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">My account</div>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>

              {isUpdating ? (
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="h-3 w-16 skeleton rounded-md" />
                  Updating...
                </span>
              ) : null}
            </div>
          </div>

          <Link
            to="/account"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
          >
            <ArrowLeft size={16} /> Back
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-gray-900">Order history</div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
              disabled={!canPrev || isInitialLoading || q.isFetching}
              onClick={() => {
                if (!canPrev) return;
                goToPage(page - 1);
              }}
              aria-label="Previous page"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="text-sm text-gray-700 min-w-[70px] text-center">
              {pageLabel}
            </div>

            <button
              type="button"
              className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
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
                className="btn btn-sm mt-4 rounded-xl bg-black text-white hover:bg-gray-900 border-0"
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
              <div className="text-sm text-gray-600 mt-1">
                You don’t have any orders yet.
              </div>
              <Link
                to="/shop"
                className="btn mt-4 rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
              >
                Go to shop
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>

              <tbody className={isUpdating ? "opacity-60" : ""}>
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-medium">
                      #{String(o._id).slice(-6).toUpperCase()}
                      <div className="text-xs text-gray-500 truncate">
                        {String(o._id)}
                      </div>
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.items?.length || 0}</td>
                    <td>
                      <span className={cx("badge", statusBadge(o.status))}>
                        {o.status}
                      </span>
                    </td>
                    <td className="text-right font-semibold">
                      {formatMoney(o.total)}
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/account/orders/${o._id}`}
                        className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-xs text-gray-500">
              Showing {orders.length} orders • page {page} of {pages}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
