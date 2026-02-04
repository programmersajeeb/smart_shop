import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import api from "../../../services/apiClient";
import OrderDetailsSkeleton from "../../../shared/components/ui/skeletons/OrderDetailsSkeleton";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function formatDate(d) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
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

export default function OrderDetailsPage() {
  const { id } = useParams();

  const q = useQuery({
    queryKey: ["order", id],
    enabled: !!id,
    queryFn: async ({ signal }) => {
      const { data } = await api.get(`/orders/${id}`, { signal });
      return data;
    },
    staleTime: 10_000,
    retry: 1,
  });

  const order = q.data;

  const isInitialLoading = q.isPending && !q.data;
  const isUpdating = q.isFetching && !!q.data;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-gray-500">Order details</div>

            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-bold text-gray-900">
                #{String(id || "").slice(-6).toUpperCase()}
              </h2>

              {isUpdating ? (
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="h-3 w-16 skeleton rounded-md" />
                  Updating...
                </span>
              ) : null}
            </div>
          </div>

          <Link
            to="/account/orders"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
          >
            <ArrowLeft size={16} /> Back to orders
          </Link>
        </div>
      </div>

      {!id ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            Invalid order ID.
          </div>
        </div>
      ) : isInitialLoading ? (
        <OrderDetailsSkeleton items={3} />
      ) : q.isError ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-semibold">Failed to load order.</div>
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
      ) : !order ? (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="rounded-2xl border bg-gray-50 p-5">
            <div className="font-semibold text-gray-900">Order not found</div>
            <div className="text-sm text-gray-600 mt-1">
              This order may have been removed or the ID is incorrect.
            </div>
            <Link
              to="/account/orders"
              className="btn mt-4 rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
            >
              Back to orders
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Summary */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Summary</div>
                <span className={cx("badge", statusBadge(order.status))}>
                  {order.status}
                </span>
              </div>

              <div className="text-sm text-gray-600">
                <div className="flex justify-between gap-3">
                  <span>Placed</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(order.createdAt)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex justify-between gap-3">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">
                    {formatMoney(order.shipping)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Discount</span>
                  <span className="font-medium text-gray-900">
                    - {formatMoney(order.discount)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex justify-between gap-3">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="font-bold text-gray-900">
                  {formatMoney(order.total)}
                </span>
              </div>

              {/* Shipping */}
              <div className="mt-2 rounded-2xl border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  Shipping address
                </div>
                <div className="mt-2 text-sm text-gray-700 space-y-1">
                  <div>{order.shippingAddress?.name || "—"}</div>
                  <div className="text-gray-600">
                    {order.shippingAddress?.phone || "—"}
                  </div>
                  <div className="text-gray-600">
                    {order.shippingAddress?.addressLine || "—"}
                  </div>
                  <div className="text-gray-600">
                    {[order.shippingAddress?.city, order.shippingAddress?.country]
                      .filter(Boolean)
                      .join(", ") || "—"}
                    {order.shippingAddress?.postalCode
                      ? ` - ${order.shippingAddress.postalCode}`
                      : ""}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
              <div className="p-6 border-b">
                <div className="text-sm font-semibold text-gray-900">Items</div>
                <div className="text-xs text-gray-500 mt-1">
                  {order.items?.length || 0} item(s)
                </div>
              </div>

              <div className="p-6 space-y-4">
                {(order.items || []).map((it, idx) => (
                  <div
                    key={`${it.product}-${idx}`}
                    className="flex items-center gap-4 rounded-2xl border p-4"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-100 border overflow-hidden flex-shrink-0">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
