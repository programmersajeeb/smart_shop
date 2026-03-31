import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  TicketPercent,
} from "lucide-react";
import { toast } from "sonner";

import api, { raw } from "../../../services/apiClient";
import { useCart } from "../../../shared/hooks/useCart";
import { useAuth } from "../../../shared/hooks/useAuth";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import CartPageSkeleton from "../../../shared/components/ui/skeletons/CartPageSkeleton";

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage ? String(serverMessage) : "Something went wrong.";
}

const CHECKOUT_ADDR_KEY = "ss_checkout_addr_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function safeLoadAddress() {
  try {
    if (typeof window === "undefined") return null;
    const rawValue = localStorage.getItem(CHECKOUT_ADDR_KEY);
    if (!rawValue) return null;
    const obj = safeParse(rawValue, null);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function safeSaveAddress(addr) {
  try {
    if (typeof window === "undefined") return;
    localStorage.setItem(CHECKOUT_ADDR_KEY, JSON.stringify(addr || {}));
  } catch {
    // ignore
  }
}

function normalizeText(value) {
  return String(value || "").trim();
}

function isPhoneValid(value) {
  const phone = normalizeText(value).replace(/\s+/g, "");
  return /^(\+?\d{10,15})$/.test(phone);
}

export default function CheckoutPage() {
  const nav = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const isAuthed = !!user;

  const { hydrated, items, subtotal, refresh, clearCart } = useCart();

  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const [commerceFlags, setCommerceFlags] = useState({
    allowGuestCheckout: false,
    allowBackorders: false,
  });

  const [settingsLoading, setSettingsLoading] = useState(true);

  const saved = useMemo(() => safeLoadAddress(), []);
  const cartCouponCode = normalizeText(location?.state?.couponCode || "");
  const cartAppliedCoupon = location?.state?.appliedCoupon || null;

  const [form, setForm] = useState(() => ({
    name: saved?.name || user?.displayName || "",
    phone: saved?.phone || user?.phone || "",
    addressLine: saved?.addressLine || "",
    city: saved?.city || "",
    postalCode: saved?.postalCode || "",
    country: saved?.country || "Bangladesh",
    note: saved?.note || "",
    paymentMethod: saved?.paymentMethod || "cod",
  }));

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await raw.get("/page-config/admin-settings/public");
        const payload = res?.data;
        const d = payload?.data || {};

        if (alive) {
          setCommerceFlags({
            allowGuestCheckout: Boolean(d?.commerce?.allowGuestCheckout),
            allowBackorders: Boolean(d?.commerce?.allowBackorders),
          });
        }
      } catch {
        if (alive) {
          setCommerceFlags({
            allowGuestCheckout: false,
            allowBackorders: false,
          });
        }
      } finally {
        if (alive) setSettingsLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const cartEmpty = items.length === 0;

  const previewDiscount = useMemo(() => {
    return Number(cartAppliedCoupon?.discountAmount || 0);
  }, [cartAppliedCoupon]);

  const total = useMemo(() => {
    return Math.max(0, Number(subtotal || 0) - previewDiscount);
  }, [subtotal, previewDiscount]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (typeof refresh !== "function") return;

      setSyncing(true);
      try {
        await refresh();
      } catch {
        // keep current
      } finally {
        if (active) setSyncing(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [refresh]);

  if (!hydrated) return <CartPageSkeleton />;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  function validate() {
    const next = {};

    if (normalizeText(form.name).length < 2) {
      next.name = "Full name is required";
    }

    if (!isPhoneValid(form.phone)) {
      next.phone = "Enter a valid phone number";
    }

    if (!normalizeText(form.addressLine)) {
      next.addressLine = "Address is required";
    }

    if (normalizeText(form.city).length < 2) {
      next.city = "City is required";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function placeOrderNow() {
    if (busy) return;

    if (cartEmpty) {
      toast.message("Your cart is empty", {
        description: "Please add items before checkout.",
      });
      nav("/shop");
      return;
    }

    if (!validate()) {
      toast.message("Please fix the form", {
        description: "Some required fields are missing or invalid.",
      });
      return;
    }

    const guestAllowed = Boolean(commerceFlags.allowGuestCheckout);

    if (!isAuthed && !guestAllowed) {
      toast.message("Please sign in to checkout", {
        description: "Guest checkout is disabled by store settings.",
      });
      nav("/signin", { state: { from: "/checkout" } });
      return;
    }

    setBusy(true);

    try {
      const shippingAddress = {
        name: normalizeText(form.name),
        phone: normalizeText(form.phone),
        addressLine: normalizeText(form.addressLine),
        city: normalizeText(form.city),
        country: normalizeText(form.country) || "Bangladesh",
        postalCode: normalizeText(form.postalCode) || null,
        note: normalizeText(form.note) || null,
        paymentMethod: normalizeText(form.paymentMethod || "cod") || "cod",
      };

      safeSaveAddress({
        ...form,
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        addressLine: shippingAddress.addressLine,
        city: shippingAddress.city,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
        note: shippingAddress.note,
        paymentMethod: shippingAddress.paymentMethod,
      });

      let data = null;

      if (isAuthed) {
        const res = await api.post("/orders/checkout", {
          shippingAddress,
          couponCode: cartCouponCode || null,
        });
        data = res?.data;
      } else {
        const lineItems = (items || [])
          .map((it) => ({
            product: String(it.id || "").trim(),
            qty: Number(it.qty || 1),
          }))
          .filter((x) => x.product && Number.isFinite(x.qty) && x.qty > 0);

        if (!lineItems.length) {
          throw new Error("No valid cart items found for checkout.");
        }

        const res = await raw.post("/orders/checkout/guest", {
          items: lineItems,
          shippingAddress,
          couponCode: cartCouponCode || null,
        });

        data = res?.data;

        try {
          if (typeof clearCart === "function") {
            await clearCart();
          }
        } catch {
          // ignore
        }
      }

      const orderId = String(data?._id || "").trim();
      if (!orderId) {
        throw new Error("Order created but no order id was returned.");
      }

      toast.success("Order placed successfully");

      try {
        if (typeof refresh === "function" && isAuthed) {
          await refresh();
        }
      } catch {
        // ignore
      }

      const phoneQuery = !isAuthed
        ? `?phone=${encodeURIComponent(shippingAddress.phone)}`
        : "";

      nav(`/order-confirmation/${orderId}${phoneQuery}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  const guestAllowed = Boolean(commerceFlags.allowGuestCheckout);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <ConfirmDialog
        open={confirm}
        title="Place order?"
        description="We’ll place your order now using the items in your cart."
        confirmText="Place order"
        cancelText="Review again"
        tone="neutral"
        busy={busy}
        onConfirm={placeOrderNow}
        onClose={() => (busy ? null : setConfirm(false))}
      />

      <div className="site-shell space-y-6 py-8">
        <div className="flex flex-col gap-4 rounded-2xl border bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>Checkout</span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                <ShieldCheck size={14} /> Secure
              </span>

              {!isAuthed ? (
                <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  {settingsLoading
                    ? "Checking store policy..."
                    : guestAllowed
                    ? "Guest checkout enabled"
                    : "Sign in required"}
                </span>
              ) : null}

              {syncing ? (
                <span className="flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Syncing cart...
                </span>
              ) : null}
            </div>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">
              Shipping & Payment
            </h1>
          </div>

          <Link
            to="/cart"
            className="btn btn-outline rounded-2xl border-gray-200 bg-white hover:bg-gray-50"
          >
            <ArrowLeft size={16} /> Back to cart
          </Link>
        </div>

        {!isAuthed && !settingsLoading && !guestAllowed ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <div className="flex items-start gap-2">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <div>
                Guest checkout is currently disabled. Please sign in to continue.
              </div>
            </div>
          </div>
        ) : null}

        {cartEmpty ? (
          <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
            <div className="mx-auto mb-3 w-fit rounded-full border bg-gray-50 px-3 py-1 text-sm">
              Empty cart
            </div>
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">
              Add items to your cart before checkout.
            </p>
            <Link
              to="/shop"
              className="btn mt-6 rounded-2xl border-0 bg-black text-white hover:bg-gray-900"
            >
              Go to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="space-y-6 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-8">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Shipping details
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  Please provide your delivery information.
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Full name <span className="text-red-600">*</span>
                  </span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={onChange}
                    className={[
                      "input input-bordered w-full rounded-2xl bg-white",
                      errors.name ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                    placeholder="Your name"
                    autoComplete="name"
                  />
                  {errors.name ? (
                    <div className="text-xs text-red-600">{errors.name}</div>
                  ) : null}
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Phone <span className="text-red-600">*</span>
                  </span>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    className={[
                      "input input-bordered w-full rounded-2xl bg-white",
                      errors.phone ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                    placeholder="01XXXXXXXXX"
                    autoComplete="tel"
                  />
                  {errors.phone ? (
                    <div className="text-xs text-red-600">{errors.phone}</div>
                  ) : null}
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">
                    Address <span className="text-red-600">*</span>
                  </span>
                  <input
                    name="addressLine"
                    value={form.addressLine}
                    onChange={onChange}
                    className={[
                      "input input-bordered w-full rounded-2xl bg-white",
                      errors.addressLine ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                    placeholder="House, Road, Area"
                    autoComplete="street-address"
                  />
                  {errors.addressLine ? (
                    <div className="text-xs text-red-600">
                      {errors.addressLine}
                    </div>
                  ) : null}
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    City <span className="text-red-600">*</span>
                  </span>
                  <input
                    name="city"
                    value={form.city}
                    onChange={onChange}
                    className={[
                      "input input-bordered w-full rounded-2xl bg-white",
                      errors.city ? "border-red-300" : "border-gray-200",
                    ].join(" ")}
                    placeholder="Dhaka"
                    autoComplete="address-level2"
                  />
                  {errors.city ? (
                    <div className="text-xs text-red-600">{errors.city}</div>
                  ) : null}
                </label>

                <label className="space-y-1">
                  <span className="text-sm font-medium text-gray-700">
                    Postal code
                  </span>
                  <input
                    name="postalCode"
                    value={form.postalCode}
                    onChange={onChange}
                    className="input input-bordered w-full rounded-2xl border-gray-200 bg-white"
                    placeholder="1207"
                    autoComplete="postal-code"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">
                    Country
                  </span>
                  <input
                    name="country"
                    value={form.country}
                    onChange={onChange}
                    className="input input-bordered w-full rounded-2xl border-gray-200 bg-white"
                    placeholder="Bangladesh"
                    autoComplete="country-name"
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className="text-sm font-medium text-gray-700">
                    Order note (optional)
                  </span>
                  <textarea
                    name="note"
                    value={form.note}
                    onChange={onChange}
                    className="textarea textarea-bordered min-h-[90px] w-full rounded-2xl border-gray-200 bg-white"
                    placeholder="Delivery instructions (optional)"
                  />
                </label>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-5">
                <div className="text-sm font-semibold text-gray-900">
                  Payment method
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Currently available:
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={form.paymentMethod === "cod"}
                    onChange={onChange}
                    className="radio"
                  />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      Cash on delivery (COD)
                    </div>
                    <div className="text-xs text-gray-500">
                      Pay when you receive your order.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-4">
              <div className="text-lg font-semibold text-gray-900">
                Order summary
              </div>

              {cartCouponCode ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <TicketPercent size={16} />
                    Coupon applied
                  </div>
                  <div className="mt-2 text-sm text-emerald-700">
                    {cartAppliedCoupon?.promotion?.code || cartCouponCode}
                  </div>
                  <div className="mt-1 text-xs text-emerald-700">
                    {cartAppliedCoupon?.promotion?.name || "Discount will be revalidated during checkout."}
                  </div>
                </div>
              ) : null}

              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={`${it.id}${it.cartItemId ? `-${it.cartItemId}` : ""}`}
                    className="flex items-center gap-3 rounded-2xl border p-3"
                  >
                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border bg-gray-100">
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
                      <div className="truncate text-sm font-semibold text-gray-900">
                        {it.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        Qty: {it.qty} • {formatMoney(it.price)}
                      </div>
                    </div>

                    <div className="text-sm font-bold text-gray-900">
                      {formatMoney((it.price || 0) * (it.qty || 0))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-px bg-gray-100" />

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(subtotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">
                    {formatMoney(0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-emerald-700">
                    -{formatMoney(previewDiscount)}
                  </span>
                </div>

                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">
                    {formatMoney(total)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="btn w-full rounded-2xl border-0 bg-black text-white hover:bg-gray-900"
                onClick={() => setConfirm(true)}
                disabled={busy || settingsLoading || (!isAuthed && !guestAllowed)}
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Placing order...
                  </span>
                ) : (
                  "Place order"
                )}
              </button>

              <div className="text-xs text-gray-500">
                Your order will be placed securely via backend with stock validation and coupon re-check at submit time.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}