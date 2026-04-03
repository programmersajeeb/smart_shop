import React from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ReceiptText,
  MapPin,
  Package2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

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
      <div className="rounded-[30px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              Order details
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 md:text-[30px]">
                #{String(id || "").slice(-6).toUpperCase()}
              </h2>

              {isUpdating ? (
                <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <span className="inline-block h-3 w-16 animate-pulse rounded-md bg-gray-200" />
                  Updating...
                </span>
              ) : null}
            </div>

            <div className="mt-2 text-sm text-gray-600">
              Review items, payment total, and shipping information in one place.
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <button
              type="button"
              onClick={() => q.refetch()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <RefreshCw size={16} />
              Refresh
            </button>

            <Link
              to="/account/orders"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back to orders
            </Link>
          </div>
        </div>
      </div>

      {!id ? (
        <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-900">
            Invalid order ID.
          </div>
        </div>
      ) : isInitialLoading ? (
        <OrderDetailsSkeleton items={3} />
      ) : q.isError ? (
        <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-semibold">Failed to load order.</div>
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
      ) : !order ? (
        <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="rounded-2xl border bg-gray-50 p-5">
            <div className="font-semibold text-gray-900">Order not found</div>
            <div className="mt-1 text-sm text-gray-600">
              This order may have been removed or the ID may be incorrect.
            </div>
            <Link
              to="/account/orders"
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Back to orders
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="space-y-5 xl:col-span-5">
            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <ReceiptText size={18} />
                  Order summary
                </div>

                <span
                  className={cx(
                    "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                    statusBadgeClass(order.status)
                  )}
                >
                  {order.status}
                </span>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Placed
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {formatDate(order.createdAt)}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                    Order ID
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    #{String(order._id || "").slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="my-5 h-px bg-gray-100" />

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-center justify-between gap-3">
                  <span>Subtotal</span>
                  <span className="font-medium text-gray-900">{formatMoney(order.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Shipping</span>
                  <span className="font-medium text-gray-900">{formatMoney(order.shipping)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>Discount</span>
                  <span className="font-medium text-gray-900">- {formatMoney(order.discount)}</span>
                </div>
              </div>

              <div className="my-5 h-px bg-gray-100" />

              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">{formatMoney(order.total)}</span>
              </div>

              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                <ShieldCheck size={14} />
                Secure order record
              </div>
            </div>

            <div className="rounded-[30px] border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <MapPin size={18} />
                Shipping address
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <div className="font-medium text-gray-900">
                  {order.shippingAddress?.name || "—"}
                </div>
                <div>{order.shippingAddress?.phone || "—"}</div>
                <div>{order.shippingAddress?.addressLine || "—"}</div>
                <div>
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

          <div className="xl:col-span-7">
            <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Package2 size={18} />
                  Items
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  {order.items?.length || 0} item(s) in this order
                </div>
              </div>

              <div className="space-y-4 p-4 md:p-6">
                {(order.items || []).map((it, idx) => (
                  <div
                    key={`${it.product}-${idx}`}
                    className="rounded-3xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.title}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-base font-semibold text-gray-900">
                          {it.title}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-3 sm:max-w-md">
                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Quantity
                            </div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">{it.qty}</div>
                          </div>

                          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                              Unit price
                            </div>
                            <div className="mt-1 text-sm font-semibold text-gray-900">
                              {formatMoney(it.price)}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                          Line total
                        </div>
                        <div className="mt-1 text-base font-bold text-gray-900">
                          {formatMoney((it.price || 0) * (it.qty || 0))}
                        </div>
                      </div>
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