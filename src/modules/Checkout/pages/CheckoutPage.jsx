import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import api, { raw } from "../../../services/apiClient"; // ✅ NEW: raw for guest
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
    const raw = localStorage.getItem(CHECKOUT_ADDR_KEY);
    if (!raw) return null;
    const obj = safeParse(raw, null);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

function safeSaveAddress(addr) {
  try {
    localStorage.setItem(CHECKOUT_ADDR_KEY, JSON.stringify(addr || {}));
  } catch {
    // ignore
  }
}

export default function CheckoutPage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const isAuthed = !!user;

  const { hydrated, items, subtotal, refresh, clearCart } = useCart(); // ✅ NEW: clearCart for guest success

  const [syncing, setSyncing] = useState(false);
  const [busy, setBusy] = useState(false);

  const [confirm, setConfirm] = useState(false);

  // ✅ NEW: public settings flags (safe: silent fail)
  const [commerceFlags, setCommerceFlags] = useState({
    allowGuestCheckout: false,
  });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await raw.get("/settings/public");
        const payload = res?.data;
        const d = payload?.data || payload || {};
        const allowGuestCheckout = Boolean(d?.commerce?.allowGuestCheckout);
        if (alive) setCommerceFlags({ allowGuestCheckout });
      } catch {
        // silent fallback: guest checkout OFF
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const saved = useMemo(() => safeLoadAddress(), []);
  const [form, setForm] = useState(() => ({
    name: saved?.name || user?.displayName || "",
    phone: saved?.phone || user?.phone || "",
    addressLine: saved?.addressLine || "",
    city: saved?.city || "",
    postalCode: saved?.postalCode || "",
    country: saved?.country || "Bangladesh",
    note: saved?.note || "",
    paymentMethod: saved?.paymentMethod || "cod", // UI-only; safe to store
  }));

  const [errors, setErrors] = useState({});

  const cartEmpty = items.length === 0;

  const total = useMemo(() => subtotal, [subtotal]);

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
    if (!String(form.name || "").trim()) next.name = "Full name is required";
    if (!String(form.phone || "").trim()) next.phone = "Phone is required";
    if (!String(form.addressLine || "").trim())
      next.addressLine = "Address is required";
    if (!String(form.city || "").trim()) next.city = "City is required";

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
        description: "Some required fields are missing.",
      });
      return;
    }

    const guestAllowed = Boolean(commerceFlags.allowGuestCheckout);

    // ✅ If not authed and guest checkout is disabled -> redirect to signin (no server 401)
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
        name: String(form.name || "").trim(),
        phone: String(form.phone || "").trim(),
        addressLine: String(form.addressLine || "").trim(),
        city: String(form.city || "").trim(),
        country: String(form.country || "").trim(),
        postalCode: String(form.postalCode || "").trim() || null,

        // extra (won't break server; mongoose will ignore unknown keys if not in schema)
        note: String(form.note || "").trim() || null,
        paymentMethod: String(form.paymentMethod || "cod"),
      };

      safeSaveAddress({
        ...form,
        name: shippingAddress.name,
        phone: shippingAddress.phone,
        addressLine: shippingAddress.addressLine,
        city: shippingAddress.city,
        country: shippingAddress.country,
        postalCode: shippingAddress.postalCode,
      });

      // ✅ Auth checkout vs Guest checkout
      let data = null;

      if (isAuthed) {
        const res = await api.post("/orders/checkout", { shippingAddress });
        data = res?.data;
      } else {
        // Guest: send cart items to backend
        const lineItems = (items || [])
          .map((it) => ({
            product: it.id, // productId
            qty: Number(it.qty || 1),
          }))
          .filter((x) => x.product && Number.isFinite(x.qty) && x.qty > 0);

        const res = await raw.post("/orders/checkout/guest", {
          items: lineItems,
          shippingAddress,
        });

        data = res?.data;

        // ✅ Clear local cart after successful guest order
        try {
          if (typeof clearCart === "function") await clearCart();
        } catch {
          // ignore
        }
      }

      toast.success("Order placed successfully");

      try {
        if (typeof refresh === "function") await refresh();
      } catch {
        // ignore
      }

      nav(`/order-confirmation/${data?._id || ""}`);
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

      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Checkout</span>
              <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                <ShieldCheck size={14} /> Secure
              </span>

              {!isAuthed ? (
                <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  {guestAllowed ? "Guest checkout enabled" : "Sign in required"}
                </span>
              ) : null}

              {syncing ? (
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Syncing cart...
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              Shipping & Payment
            </h1>
          </div>

          <Link
            to="/cart"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
          >
            <ArrowLeft size={16} /> Back to cart
          </Link>
        </div>

        {cartEmpty ? (
          <div className="rounded-2xl border bg-white p-10 shadow-sm text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border px-3 py-1 text-sm bg-gray-50">
              Empty cart
            </div>
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">
              Add items to your cart before checkout.
            </p>
            <Link
              to="/shop"
              className="btn mt-6 rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
            >
              Go to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <div className="lg:col-span-8 rounded-2xl border bg-white p-6 shadow-sm space-y-6">
              <div>
                <div className="text-lg font-semibold text-gray-900">
                  Shipping details
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Please provide your delivery information.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className="input input-bordered w-full rounded-2xl bg-white border-gray-200"
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
                    className="input input-bordered w-full rounded-2xl bg-white border-gray-200"
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
                    className="textarea textarea-bordered w-full rounded-2xl bg-white border-gray-200 min-h-[90px]"
                    placeholder="Delivery instructions (optional)"
                  />
                </label>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-5">
                <div className="text-sm font-semibold text-gray-900">
                  Payment method
                </div>
                <div className="text-sm text-gray-600 mt-1">
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

            {/* Summary */}
            <div className="lg:col-span-4 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="text-lg font-semibold text-gray-900">
                Order summary
              </div>

              <div className="space-y-3">
                {items.map((it) => (
                  <div
                    key={`${it.id}${it.cartItemId ? `-${it.cartItemId}` : ""}`}
                    className="flex items-center gap-3 rounded-2xl border p-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 border overflow-hidden flex-shrink-0">
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
                      <div className="text-sm font-semibold text-gray-900 truncate">
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

              <div className="text-sm text-gray-600 space-y-2">
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
                className="btn w-full rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
                onClick={() => setConfirm(true)}
                disabled={busy}
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
                Your order will be placed securely via backend (stock checked and cart cleared).
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
