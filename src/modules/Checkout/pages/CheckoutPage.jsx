import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  TicketPercent,
  MapPin,
  Phone,
  User,
  CreditCard,
  PackageCheck,
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

function FieldLabel({ icon: Icon, children, required = false }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
      {Icon ? <Icon size={15} className="text-gray-500" /> : null}
      <span>
        {children} {required ? <span className="text-red-600">*</span> : null}
      </span>
    </span>
  );
}

function FieldError({ children }) {
  if (!children) return null;
  return <div className="pt-1 text-xs font-medium text-red-600">{children}</div>;
}

function inputClass(hasError = false) {
  return [
    "input input-bordered h-12 w-full rounded-2xl bg-white px-4",
    "border-gray-200 shadow-none transition",
    "focus:border-gray-300",
    hasError ? "border-red-300" : "",
  ].join(" ");
}

function textareaClass(hasError = false) {
  return [
    "textarea textarea-bordered min-h-[110px] w-full rounded-2xl bg-white px-4 py-3",
    "border-gray-200 shadow-none transition",
    "focus:border-gray-300",
    hasError ? "border-red-300" : "",
  ].join(" ");
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

      <div className="site-shell space-y-5 py-5 sm:space-y-6 sm:py-6 md:py-8">
        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between lg:p-7">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                <span>Checkout</span>

                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                  <ShieldCheck size={14} /> Secure
                </span>

                {!isAuthed ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                    {settingsLoading
                      ? "Checking store policy..."
                      : guestAllowed
                        ? "Guest checkout enabled"
                        : "Sign in required"}
                  </span>
                ) : null}

                {syncing ? (
                  <span className="inline-flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 size={14} className="animate-spin" />
                    Syncing cart...
                  </span>
                ) : null}
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 sm:text-[30px]">
                Shipping & Payment
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                Complete your shipping information and review your order before placing it.
              </p>
            </div>

            <Link
              to="/cart"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              <ArrowLeft size={16} />
              Back to cart
            </Link>
          </div>
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
          <div className="rounded-[28px] border border-black/5 bg-white p-8 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-3 w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm font-medium text-gray-700">
              Empty cart
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Add items to your cart before checkout.
            </p>
            <Link
              to="/shop"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-900"
            >
              Go to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-6 xl:col-span-8">
              <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <div className="flex flex-col gap-2 border-b border-gray-100 pb-5">
                  <div className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <MapPin size={18} />
                    Shipping details
                  </div>
                  <div className="text-sm text-gray-500">
                    Please provide your delivery information.
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="block">
                    <FieldLabel icon={User} required>
                      Full name
                    </FieldLabel>
                    <input
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      className={inputClass(!!errors.name)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                    <FieldError>{errors.name}</FieldError>
                  </label>

                  <label className="block">
                    <FieldLabel icon={Phone} required>
                      Phone
                    </FieldLabel>
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={onChange}
                      className={inputClass(!!errors.phone)}
                      placeholder="01XXXXXXXXX"
                      autoComplete="tel"
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </label>

                  <label className="block md:col-span-2">
                    <FieldLabel icon={MapPin} required>
                      Address
                    </FieldLabel>
                    <input
                      name="addressLine"
                      value={form.addressLine}
                      onChange={onChange}
                      className={inputClass(!!errors.addressLine)}
                      placeholder="House, Road, Area"
                      autoComplete="street-address"
                    />
                    <FieldError>{errors.addressLine}</FieldError>
                  </label>

                  <label className="block">
                    <FieldLabel required>City</FieldLabel>
                    <input
                      name="city"
                      value={form.city}
                      onChange={onChange}
                      className={inputClass(!!errors.city)}
                      placeholder="Dhaka"
                      autoComplete="address-level2"
                    />
                    <FieldError>{errors.city}</FieldError>
                  </label>

                  <label className="block">
                    <FieldLabel>Postal code</FieldLabel>
                    <input
                      name="postalCode"
                      value={form.postalCode}
                      onChange={onChange}
                      className={inputClass(false)}
                      placeholder="1207"
                      autoComplete="postal-code"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <FieldLabel>Country</FieldLabel>
                    <input
                      name="country"
                      value={form.country}
                      onChange={onChange}
                      className={inputClass(false)}
                      placeholder="Bangladesh"
                      autoComplete="country-name"
                    />
                  </label>

                  <label className="block md:col-span-2">
                    <FieldLabel>Order note (optional)</FieldLabel>
                    <textarea
                      name="note"
                      value={form.note}
                      onChange={onChange}
                      className={textareaClass(false)}
                      placeholder="Delivery instructions (optional)"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
                <div className="flex flex-col gap-2 border-b border-gray-100 pb-5">
                  <div className="inline-flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <CreditCard size={18} />
                    Payment method
                  </div>
                  <div className="text-sm text-gray-500">
                    Currently available payment option.
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={form.paymentMethod === "cod"}
                      onChange={onChange}
                      className="radio mt-0.5"
                    />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        Cash on delivery (COD)
                      </div>
                      <div className="mt-1 text-xs leading-5 text-gray-500">
                        Pay when you receive your order.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="xl:col-span-4">
              <div className="space-y-4 xl:sticky xl:top-24">
                <div className="rounded-[28px] border border-black/5 bg-white p-5 shadow-sm sm:p-6">
                  <div className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <PackageCheck size={18} />
                    Order summary
                  </div>

                  {cartCouponCode ? (
                    <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        <TicketPercent size={16} />
                        Coupon applied
                      </div>
                      <div className="mt-2 text-sm font-medium text-emerald-700">
                        {cartAppliedCoupon?.promotion?.code || cartCouponCode}
                      </div>
                      <div className="mt-1 text-xs leading-5 text-emerald-700">
                        {cartAppliedCoupon?.promotion?.name ||
                          "Discount will be revalidated during checkout."}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-5 space-y-3">
                    {items.map((it) => (
                      <div
                        key={`${it.id}${it.cartItemId ? `-${it.cartItemId}` : ""}`}
                        className="flex items-center gap-3 rounded-2xl border border-gray-200 p-3"
                      >
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
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

                  <div className="my-5 h-px bg-gray-100" />

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

                    <div className="my-3 h-px bg-gray-100" />

                    <div className="flex items-center justify-between text-base">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="font-bold text-gray-900">
                        {formatMoney(total)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-70"
                    onClick={() => setConfirm(true)}
                    disabled={busy || settingsLoading || (!isAuthed && !guestAllowed)}
                  >
                    {busy ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin" />
                        Placing order...
                      </span>
                    ) : (
                      "Place order"
                    )}
                  </button>

                  <div className="mt-4 text-xs leading-5 text-gray-500">
                    Your order will be placed securely via backend with stock validation and
                    coupon re-check at submit time.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}