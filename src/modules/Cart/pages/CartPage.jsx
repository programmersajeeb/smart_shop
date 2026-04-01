import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  TicketPercent,
  X,
  ShoppingBag,
} from "lucide-react";
import { toast } from "sonner";

import { useCart } from "../../../shared/hooks/useCart";
import { useAuth } from "../../../shared/hooks/useAuth";
import CartPageSkeleton from "../../../shared/components/ui/skeletons/CartPageSkeleton";
import ConfirmDialog from "../../../shared/ui/ConfirmDialog";
import { raw } from "../../../services/apiClient";

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function SectionBadge({ children }) {
  return (
    <div className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
      {children}
    </div>
  );
}

export default function CartPage() {
  const nav = useNavigate();
  const { isAuthed, user } = useAuth();

  const {
    hydrated,
    items,
    count,
    subtotal,
    setQty,
    removeItem,
    clearCart,
    refresh,
  } = useCart();

  const [busyQty, setBusyQty] = useState({});
  const [busyRemove, setBusyRemove] = useState({});
  const [busyClear, setBusyClear] = useState(false);
  const [busyRefresh, setBusyRefresh] = useState(false);

  const [commerceFlags, setCommerceFlags] = useState({
    allowGuestCheckout: false,
  });

  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  useEffect(() => {
    let alive = true;

    async function loadPublicSettings() {
      try {
        const res = await raw.get("/settings/public");
        const payload = res?.data;
        const d = payload?.data || payload || {};
        const allowGuestCheckout = Boolean(d?.commerce?.allowGuestCheckout);

        if (alive) {
          setCommerceFlags({ allowGuestCheckout });
        }
      } catch {
        // ignore
      }
    }

    loadPublicSettings();
    return () => {
      alive = false;
    };
  }, []);

  const [confirm, setConfirm] = useState({
    open: false,
    mode: null,
    id: null,
    title: "",
    description: "",
  });

  const isEmpty = items.length === 0;

  const discountAmount = useMemo(() => {
    return Number(appliedCoupon?.discountAmount || 0);
  }, [appliedCoupon]);

  const total = useMemo(() => {
    return Math.max(0, Number(subtotal || 0) - discountAmount);
  }, [subtotal, discountAmount]);

  useEffect(() => {
    if (isEmpty && appliedCoupon) {
      setAppliedCoupon(null);
      setCouponCode("");
    }
  }, [isEmpty, appliedCoupon]);

  if (!hydrated) return <CartPageSkeleton />;

  async function handleDec(it) {
    const id = it.id;
    if (busyQty[id]) return;
    setBusyQty((s) => ({ ...s, [id]: true }));
    try {
      await setQty(id, (it.qty || 1) - 1);
      if (appliedCoupon) {
        setAppliedCoupon(null);
        toast.message("Coupon removed", {
          description: "Cart changed. Please re-apply the coupon.",
        });
      }
    } finally {
      setBusyQty((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  }

  async function handleInc(it) {
    const id = it.id;
    if (busyQty[id]) return;
    setBusyQty((s) => ({ ...s, [id]: true }));
    try {
      await setQty(id, (it.qty || 1) + 1);
      if (appliedCoupon) {
        setAppliedCoupon(null);
        toast.message("Coupon removed", {
          description: "Cart changed. Please re-apply the coupon.",
        });
      }
    } finally {
      setBusyQty((s) => {
        const n = { ...s };
        delete n[id];
        return n;
      });
    }
  }

  function askRemove(it) {
    setConfirm({
      open: true,
      mode: "remove",
      id: it.id,
      title: "Remove item?",
      description: `Remove “${it.title}” from your cart?`,
    });
  }

  function askClear() {
    setConfirm({
      open: true,
      mode: "clear",
      id: null,
      title: "Clear cart?",
      description: "This will remove all items from your cart.",
    });
  }

  async function onConfirm() {
    if (confirm.mode === "remove") {
      const id = confirm.id;
      if (!id) return;

      if (busyRemove[id]) return;
      setBusyRemove((s) => ({ ...s, [id]: true }));

      try {
        await removeItem(id);
        if (appliedCoupon) {
          setAppliedCoupon(null);
          toast.message("Coupon removed", {
            description: "Cart changed. Please re-apply the coupon.",
          });
        }
      } finally {
        setBusyRemove((s) => {
          const n = { ...s };
          delete n[id];
          return n;
        });
        setConfirm((c) => ({ ...c, open: false }));
      }
      return;
    }

    if (confirm.mode === "clear") {
      if (busyClear) return;
      setBusyClear(true);

      try {
        await clearCart();
        setAppliedCoupon(null);
        setCouponCode("");
      } finally {
        setBusyClear(false);
        setConfirm((c) => ({ ...c, open: false }));
      }
    }
  }

  function closeConfirm() {
    if (busyClear) return;
    setConfirm((c) => ({ ...c, open: false }));
  }

  async function handleRefresh() {
    if (!isAuthed) return;
    if (typeof refresh !== "function") return;

    if (busyRefresh) return;
    setBusyRefresh(true);
    try {
      await refresh();
      if (appliedCoupon) {
        setAppliedCoupon(null);
      }
      toast.success("Cart refreshed");
    } catch {
      toast.error("Failed to refresh cart");
    } finally {
      setBusyRefresh(false);
    }
  }

  async function handleApplyCoupon() {
    const code = normalizeText(couponCode).toUpperCase();
    if (!code) {
      return toast.error("Enter a coupon code");
    }

    if (isEmpty) {
      return toast.error("Your cart is empty");
    }

    setCouponBusy(true);

    try {
      const productIds = items
        .map((it) => String(it.id || "").trim())
        .filter(Boolean);

      const res = await raw.post("/orders/validate-coupon", {
        code,
        subtotal,
        productIds,
        phone: user?.phone || null,
      });

      const payload = res?.data || {};
      setAppliedCoupon({
        code,
        discountAmount: Number(payload?.discountAmount || 0),
        shippingDiscount: Number(payload?.shippingDiscount || 0),
        promotion: payload?.promotion || null,
      });

      setCouponCode(code);
      toast.success("Coupon applied");
    } catch (error) {
      setAppliedCoupon(null);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          error?.message ||
          "Failed to apply coupon"
      );
    } finally {
      setCouponBusy(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.message("Coupon removed");
  }

  function handleCheckout() {
    if (isEmpty) return;

    const guestAllowed = Boolean(commerceFlags.allowGuestCheckout);

    if (!isAuthed && !guestAllowed) {
      toast.message("Please sign in to checkout", {
        description: "Your cart will sync to your account after login.",
      });
      nav("/signin", { state: { from: "/checkout" } });
      return;
    }

    nav("/checkout", {
      state: {
        guest: !isAuthed,
        couponCode: appliedCoupon?.code || "",
        appliedCoupon: appliedCoupon || null,
      },
    });
  }

  const guestAllowed = Boolean(commerceFlags.allowGuestCheckout);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText={confirm.mode === "clear" ? "Clear" : "Remove"}
        cancelText="Cancel"
        tone="danger"
        busy={confirm.mode === "clear" ? busyClear : false}
        onConfirm={onConfirm}
        onClose={closeConfirm}
      />

      <div className="site-shell py-6 sm:py-8">
        <div className="space-y-6">
          <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <SectionBadge>Shopping cart</SectionBadge>

                <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
                  Your cart
                  <span className="ml-2 text-gray-400">({count})</span>
                </h1>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                  {isAuthed ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      <ShieldCheck size={14} />
                      Synced to account
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-700">
                      {guestAllowed ? "Guest checkout enabled" : "Guest cart only"}
                    </span>
                  )}

                  <span className="text-sm text-gray-500">
                    Review items before checkout.
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {isAuthed && typeof refresh === "function" ? (
                  <button
                    type="button"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    onClick={handleRefresh}
                    disabled={busyRefresh}
                  >
                    {busyRefresh ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <RefreshCcw size={16} />
                    )}
                    Refresh
                  </button>
                ) : null}

                {!isAuthed && !guestAllowed ? (
                  <Link
                    to="/signin"
                    state={{ from: "/cart" }}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  >
                    Sign in
                  </Link>
                ) : null}

                <Link
                  to="/shop"
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <ArrowLeft size={16} />
                  Continue shopping
                </Link>
              </div>
            </div>
          </section>

          {isEmpty ? (
            <section className="rounded-[30px] border border-black/5 bg-white p-8 text-center shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-10 md:p-12">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-gray-50 text-gray-900">
                <ShoppingBag size={22} />
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
                Your cart is empty
              </h2>

              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-600 sm:text-[15px]">
                Looks like you have not added anything yet. Browse the shop and add
                products to continue.
              </p>

              <Link
                to="/shop"
                className="mt-7 inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Go to shop
              </Link>
            </section>
          ) : (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <section className="space-y-4 rounded-[30px] border border-black/5 bg-white p-4 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-5 lg:col-span-8 lg:p-6">
                {items.map((it) => {
                  const qtyBusy = !!busyQty[it.id];
                  const rmBusy = !!busyRemove[it.id];

                  return (
                    <div
                      key={`${it.id}${it.cartItemId ? `-${it.cartItemId}` : ""}`}
                      className="rounded-[26px] border border-black/5 bg-gray-50 p-4 shadow-[0_8px_20px_rgba(15,23,42,0.03)] sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-black/5 bg-white">
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
                          <h3 className="truncate text-base font-semibold text-gray-950 sm:text-lg">
                            {it.title}
                          </h3>

                          <div className="mt-1 text-sm text-gray-500">
                            Price:{" "}
                            <span className="font-semibold text-gray-900">
                              {formatMoney(it.price)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-4 sm:justify-end">
                          <div className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-white p-1.5">
                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-800 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                              onClick={() => handleDec(it)}
                              aria-label="Decrease quantity"
                              disabled={qtyBusy}
                            >
                              {qtyBusy ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Minus size={16} />
                              )}
                            </button>

                            <div className="min-w-[34px] text-center text-sm font-semibold text-gray-900">
                              {it.qty}
                            </div>

                            <button
                              type="button"
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-gray-800 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                              onClick={() => handleInc(it)}
                              aria-label="Increase quantity"
                              disabled={qtyBusy}
                            >
                              {qtyBusy ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Plus size={16} />
                              )}
                            </button>
                          </div>

                          <div className="min-w-[88px] text-right">
                            <div className="text-sm text-gray-500">Total</div>
                            <div className="text-base font-bold text-gray-950">
                              {formatMoney((it.price || 0) * (it.qty || 0))}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                            onClick={() => askRemove(it)}
                            aria-label="Remove item"
                            disabled={rmBusy}
                          >
                            {rmBusy ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-red-600 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                    onClick={askClear}
                    disabled={busyClear}
                  >
                    {busyClear ? <Loader2 size={16} className="animate-spin" /> : null}
                    Clear cart
                  </button>
                </div>
              </section>

              <aside className="space-y-5 xl:col-span-4">
                <section className="rounded-[30px] border border-black/5 bg-white p-5 shadow-[0_14px_36px_rgba(15,23,42,0.05)] sm:p-6">
                  <div className="text-lg font-semibold text-gray-950">
                    Order summary
                  </div>

                  <div className="mt-5 rounded-[24px] border border-black/5 bg-gray-50 p-4 sm:p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                      <TicketPercent size={16} />
                      Apply coupon
                    </div>

                    {!appliedCoupon ? (
                      <>
                        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                          <input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="Enter coupon code"
                            className="input input-bordered min-h-[50px] w-full rounded-2xl border-gray-200 bg-white text-gray-800"
                          />
                          <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponBusy}
                            className="inline-flex min-h-[50px] items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
                          >
                            {couponBusy ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </button>
                        </div>

                        <p className="mt-3 text-xs leading-6 text-gray-500">
                          Enter a valid promo code to preview the discount before checkout.
                        </p>
                      </>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-emerald-800">
                              {appliedCoupon?.promotion?.code || appliedCoupon?.code}
                            </div>
                            <div className="mt-1 text-xs text-emerald-700">
                              {appliedCoupon?.promotion?.name || "Coupon applied"}
                            </div>
                            <div className="mt-1 text-xs font-medium text-emerald-700">
                              Discount: {formatMoney(appliedCoupon?.discountAmount || 0)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-emerald-700 transition hover:bg-white/70"
                            aria-label="Remove coupon"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 space-y-3 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-950">
                        {formatMoney(subtotal)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Shipping</span>
                      <span className="font-semibold text-gray-950">
                        {formatMoney(0)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span>Discount</span>
                      <span className="font-semibold text-emerald-700">
                        -{formatMoney(discountAmount)}
                      </span>
                    </div>

                    <div className="h-px bg-gray-100" />

                    <div className="flex items-center justify-between">
                      <span className="text-base font-semibold text-gray-950">Total</span>
                      <span className="text-lg font-bold text-gray-950">
                        {formatMoney(total)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-6 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    onClick={handleCheckout}
                    disabled={isEmpty}
                  >
                    {isAuthed
                      ? "Checkout"
                      : guestAllowed
                        ? "Checkout as guest"
                        : "Sign in to checkout"}
                  </button>

                  <p className="mt-4 text-xs leading-6 text-gray-500">
                    {isAuthed ? (
                      <>
                        Your cart is linked to your account. Checkout will create your
                        order securely from the backend.
                      </>
                    ) : guestAllowed ? (
                      <>
                        Guest checkout is currently enabled, so you can continue without
                        signing in.
                      </>
                    ) : (
                      <>
                        Guest cart is saved locally. Sign in to sync your cart and continue
                        securely.
                      </>
                    )}
                  </p>
                </section>
              </aside>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}