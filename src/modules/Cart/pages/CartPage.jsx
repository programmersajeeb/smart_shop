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

      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <span>Shopping cart</span>

              {isAuthed ? (
                <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  <ShieldCheck size={14} /> Synced to account
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border bg-gray-50 px-3 py-1 text-xs text-gray-700">
                  {guestAllowed ? "Guest checkout enabled" : "Guest cart (local)"}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              Your Cart ({count})
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isAuthed && typeof refresh === "function" ? (
              <button
                type="button"
                className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
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
                className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
              >
                Sign in
              </Link>
            ) : null}

            <Link
              to="/shop"
              className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
            >
              <ArrowLeft size={16} /> Continue shopping
            </Link>
          </div>
        </div>

        {isEmpty ? (
          <div className="rounded-2xl border bg-white p-10 shadow-sm text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border px-3 py-1 text-sm bg-gray-50">
              Empty cart
            </div>
            <h2 className="text-2xl font-bold">Your cart is empty</h2>
            <p className="mt-2 text-gray-600">Browse products and add items to your cart.</p>
            <Link
              to="/shop"
              className="btn mt-6 rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
            >
              Go to shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              {items.map((it) => {
                const qtyBusy = !!busyQty[it.id];
                const rmBusy = !!busyRemove[it.id];

                return (
                  <div
                    key={`${it.id}${it.cartItemId ? `-${it.cartItemId}` : ""}`}
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
                      <div className="font-semibold text-gray-900 truncate">{it.title}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Price:{" "}
                        <span className="font-medium text-gray-900">
                          {formatMoney(it.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
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

                      <div className="min-w-[42px] text-center font-semibold">{it.qty}</div>

                      <button
                        type="button"
                        className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
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

                    <div className="text-right font-bold text-gray-900 min-w-[90px]">
                      {formatMoney((it.price || 0) * (it.qty || 0))}
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm btn-ghost text-red-600"
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
                );
              })}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200 text-red-600"
                  onClick={askClear}
                  disabled={busyClear}
                >
                  {busyClear ? <Loader2 size={16} className="animate-spin" /> : null}
                  Clear cart
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="text-lg font-semibold text-gray-900">Order summary</div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                  <TicketPercent size={16} />
                  Apply coupon
                </div>

                {!appliedCoupon ? (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        placeholder="Enter coupon code"
                        className="input input-bordered w-full rounded-2xl border-gray-200 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponBusy}
                        className="btn rounded-2xl border-0 bg-black text-white hover:bg-gray-900"
                      >
                        {couponBusy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>

                    <div className="text-xs text-gray-500">
                      Apply a valid promotion code to preview your discount before checkout.
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-emerald-800">
                          {appliedCoupon?.promotion?.code || appliedCoupon?.code}
                        </div>
                        <div className="mt-1 text-xs text-emerald-700">
                          {appliedCoupon?.promotion?.name || "Coupon applied"}
                        </div>
                        <div className="mt-1 text-xs text-emerald-700">
                          Discount: {formatMoney(appliedCoupon?.discountAmount || 0)}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="rounded-xl p-1.5 text-emerald-700 transition hover:bg-white/70"
                        aria-label="Remove coupon"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span className="font-semibold text-emerald-700">
                    -{formatMoney(discountAmount)}
                  </span>
                </div>

                <div className="h-px bg-gray-100" />

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatMoney(total)}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn w-full rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
                onClick={handleCheckout}
                disabled={isEmpty}
              >
                {isAuthed
                  ? "Checkout"
                  : guestAllowed
                  ? "Checkout as guest"
                  : "Sign in to checkout"}
              </button>

              <div className="text-xs text-gray-500">
                {isAuthed ? (
                  <>
                    Your cart syncs to your account. Checkout will create an order securely via backend.
                  </>
                ) : guestAllowed ? (
                  <>
                    Guest checkout is enabled by store settings. You can continue without signing in.
                  </>
                ) : (
                  <>
                    Guest cart is saved locally. Sign in to sync your cart and checkout securely.
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}