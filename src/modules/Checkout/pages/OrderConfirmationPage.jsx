import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShoppingBag,
  Phone,
  MapPin,
  User,
  ReceiptText,
  ArrowLeft,
  PackageCheck,
} from "lucide-react";

import api, { raw } from "../../../services/apiClient";
import { useAuth } from "../../../shared/hooks/useAuth";

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

function normalizeOrderPayload(payload) {
  if (!payload) return null;

  const order =
    payload?.order ||
    payload?.data?.order ||
    payload?.data ||
    payload;

  return order && typeof order === "object" ? order : null;
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage ? String(serverMessage) : "Failed to load order.";
}

function sanitizePhone(value) {
  return String(value || "").trim();
}

function statusTone(status) {
  const s = String(status || "").toLowerCase();

  if (s === "delivered") {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }
  if (s === "cancelled" || s === "canceled") {
    return "bg-red-50 border-red-200 text-red-700";
  }
  if (s === "shipped") {
    return "bg-blue-50 border-blue-200 text-blue-700";
  }
  if (s === "processing") {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }
  if (s === "paid") {
    return "bg-green-50 border-green-200 text-green-700";
  }

  return "bg-gray-50 border-gray-200 text-gray-700";
}

function prettyStatus(status) {
  const s = String(status || "pending").toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function OrderSkeleton() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="site-shell space-y-6 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="skeleton h-4 w-40 rounded-lg" />
          <div className="mt-3 skeleton h-8 w-72 rounded-lg" />
          <div className="mt-4 flex gap-3">
            <div className="skeleton h-8 w-28 rounded-full" />
            <div className="skeleton h-8 w-36 rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border bg-white p-6 shadow-sm lg:col-span-8">
            <div className="skeleton h-5 w-36 rounded-lg" />
            <div className="mt-4 space-y-3">
              <div className="skeleton h-20 w-full rounded-2xl" />
              <div className="skeleton h-20 w-full rounded-2xl" />
              <div className="skeleton h-20 w-full rounded-2xl" />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-4">
            <div className="skeleton h-5 w-32 rounded-lg" />
            <div className="skeleton h-4 w-full rounded-lg" />
            <div className="skeleton h-4 w-5/6 rounded-lg" />
            <div className="skeleton h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyLookupCard({ phone, setPhone }) {
  return (
    <div className="rounded-2xl border bg-gray-50 p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 text-amber-600" size={18} />
        <div className="min-w-0 w-full">
          <div className="text-sm font-semibold text-gray-900">
            Guest order lookup
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Guest order দেখতে checkout এ দেয়া <span className="font-semibold">phone number</span>{" "}
            দিন।
          </p>

          <div className="mt-4 max-w-sm">
            <label className="text-sm font-medium text-gray-700">
              Phone number
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="input input-bordered mt-2 w-full rounded-2xl border-gray-200 bg-white"
              autoComplete="tel"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorCard({ message }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      <div className="font-semibold">Couldn’t load order</div>
      <div className="mt-1">{message}</div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  const Icon = icon;
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-xl border bg-gray-50 p-2 text-gray-600">
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-gray-500">
          {label}
        </div>
        <div className="mt-1 break-words text-sm font-medium text-gray-900">
          {value || "-"}
        </div>
      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const isAuthed = !!user;

  const [loading, setLoading] = useState(true);
  const [submittingLookup, setSubmittingLookup] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);

  const phoneFromQuery = useMemo(
    () => sanitizePhone(searchParams.get("phone")),
    [searchParams]
  );

  const [phoneInput, setPhoneInput] = useState(phoneFromQuery);

  useEffect(() => {
    setPhoneInput(phoneFromQuery);
  }, [phoneFromQuery]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");
      setOrder(null);

      try {
        if (!id) {
          throw new Error("Missing order id.");
        }

        if (isAuthed) {
          const res = await api.get(`/orders/${id}`);
          const nextOrder = normalizeOrderPayload(res?.data);

          if (!nextOrder) {
            throw new Error("Order not found.");
          }

          if (alive) {
            setOrder(nextOrder);
          }
          return;
        }

        if (!phoneFromQuery) {
          if (alive) {
            setLoading(false);
          }
          return;
        }

        const res = await raw.get(`/orders/public/${id}`, {
          params: { phone: phoneFromQuery },
        });

        const nextOrder = normalizeOrderPayload(res?.data);

        if (!nextOrder) {
          throw new Error("Order not found.");
        }

        if (alive) {
          setOrder(nextOrder);
        }
      } catch (e) {
        if (alive) {
          setError(getErrorMessage(e));
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [id, isAuthed, phoneFromQuery]);

  function submitGuestLookup(e) {
    e.preventDefault();

    const cleanPhone = sanitizePhone(phoneInput);
    if (!cleanPhone) return;

    setSubmittingLookup(true);

    const next = new URLSearchParams(searchParams);
    next.set("phone", cleanPhone);
    setSearchParams(next, { replace: true });

    setTimeout(() => {
      setSubmittingLookup(false);
    }, 150);
  }

  const status = prettyStatus(order?.status);
  const statusClass = statusTone(order?.status);

  const shipping = order?.shippingAddress || {};
  const items = Array.isArray(order?.items) ? order.items : [];

  const subtotal =
    Number(order?.subtotal) ||
    items.reduce(
      (sum, it) => sum + Number(it?.price || 0) * Number(it?.qty || 0),
      0
    );

  const shippingFee = Number(order?.shipping || 0);
  const discount = Number(order?.discount || 0);
  const total = Number(order?.total ?? subtotal + shippingFee - discount);

  if (loading) {
    return <OrderSkeleton />;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="site-shell space-y-6 py-8">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Order confirmation</span>
                <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  <ShieldCheck size={14} /> Secure
                </span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {order?._id
                  ? "Thank you! Your order has been placed."
                  : "Track your order"}
              </h1>

              <p className="mt-2 max-w-2xl text-gray-600">
                {order?._id
                  ? "Your order is recorded successfully. You can review item details, shipping information, and order summary below."
                  : "Use this page to review your order details after checkout."}
              </p>

              {order?._id ? (
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                    <ReceiptText size={14} />
                    Order ID: <span className="font-semibold">{order._id}</span>
                  </span>

                  <span
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      statusClass,
                    ].join(" ")}
                  >
                    Status: <span className="ml-1 font-semibold">{status}</span>
                  </span>
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/shop"
                className="btn btn-outline rounded-2xl border-gray-200 bg-white hover:bg-gray-50"
              >
                <ArrowLeft size={16} /> Continue shopping
              </Link>

              <Link
                to={isAuthed ? "/account/orders" : "/cart"}
                className="btn rounded-2xl border-0 bg-black text-white hover:bg-gray-900"
              >
                {isAuthed ? "My orders" : "View cart"}
              </Link>
            </div>
          </div>
        </div>

        {!isAuthed && !phoneFromQuery && !order ? (
          <form onSubmit={submitGuestLookup}>
            <EmptyLookupCard phone={phoneInput} setPhone={setPhoneInput} />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={!sanitizePhone(phoneInput) || submittingLookup}
                className="btn rounded-2xl border-0 bg-black text-white hover:bg-gray-900"
              >
                {submittingLookup ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Checking...
                  </span>
                ) : (
                  "Find my order"
                )}
              </button>

              <Link
                to="/signin"
                state={{ from: `/order-confirmation/${id}` }}
                className="btn btn-outline rounded-2xl border-gray-200 bg-white hover:bg-gray-50"
              >
                Sign in instead
              </Link>
            </div>
          </form>
        ) : null}

        {error && !order ? <ErrorCard message={error} /> : null}

        {order?._id ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 lg:col-span-8">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <ShoppingBag size={18} />
                  Ordered items
                </div>

                <div className="mt-5 space-y-3">
                  {items.length ? (
                    items.map((it, idx) => {
                      const title =
                        it?.title ||
                        it?.titleSnapshot ||
                        it?.product?.title ||
                        "Untitled Product";

                      const image =
                        it?.image ||
                        it?.imageSnapshot ||
                        it?.product?.images?.[0] ||
                        "";

                      const qty = Number(it?.qty || 0);
                      const price = Number(it?.price || it?.priceSnapshot || 0);

                      return (
                        <div
                          key={`${title}-${idx}`}
                          className="flex items-center gap-3 rounded-2xl border p-3"
                        >
                          <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border bg-gray-100">
                            {image ? (
                              <img
                                src={image}
                                alt={title}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : null}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-gray-900">
                              {title}
                            </div>
                            <div className="text-xs text-gray-500">
                              Qty: {qty} • {formatMoney(price)}
                            </div>
                          </div>

                          <div className="text-sm font-bold text-gray-900">
                            {formatMoney(price * qty)}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-2xl border bg-gray-50 p-5 text-sm text-gray-600">
                      No order items found.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <PackageCheck size={18} />
                  Shipping details
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <InfoRow icon={User} label="Recipient" value={shipping?.name} />
                  <InfoRow icon={Phone} label="Phone" value={shipping?.phone} />
                  <InfoRow
                    icon={MapPin}
                    label="Address"
                    value={shipping?.addressLine}
                  />
                  <InfoRow icon={MapPin} label="City" value={shipping?.city} />
                  <InfoRow
                    icon={MapPin}
                    label="Country"
                    value={shipping?.country}
                  />
                  <InfoRow
                    icon={MapPin}
                    label="Postal code"
                    value={shipping?.postalCode}
                  />
                </div>

                {shipping?.note ? (
                  <div className="mt-5 rounded-2xl border bg-gray-50 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Delivery note
                    </div>
                    <div className="mt-1 text-sm text-gray-800">
                      {shipping.note}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-2xl border bg-white p-6 shadow-sm">
                <div className="text-lg font-semibold text-gray-900">
                  Order summary
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-semibold text-gray-900">
                      {formatMoney(subtotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Shipping</span>
                    <span className="font-semibold text-gray-900">
                      {formatMoney(shippingFee)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Discount</span>
                    <span className="font-semibold text-gray-900">
                      {formatMoney(discount)}
                    </span>
                  </div>

                  <div className="h-px bg-gray-100" />

                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">
                      {formatMoney(total)}
                    </span>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <CheckCircle2 size={14} />
                    Order recorded successfully
                  </div>
                  <div className="mt-1">
                    We’ve saved your order and it is now in processing.
                  </div>
                </div>
              </div>

              {!isAuthed ? (
                <div className="rounded-2xl border bg-white p-6 shadow-sm">
                  <div className="text-sm font-semibold text-gray-900">
                    Guest order
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    Sign in later to manage future orders more easily and access
                    your full order history.
                  </p>

                  <Link
                    to="/signin"
                    state={{
                      from: `/order-confirmation/${id}${
                        shipping?.phone
                          ? `?phone=${encodeURIComponent(shipping.phone)}`
                          : ""
                      }`,
                    }}
                    className="btn mt-4 w-full rounded-2xl border-0 bg-black text-white hover:bg-gray-900"
                  >
                    Sign in now
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}