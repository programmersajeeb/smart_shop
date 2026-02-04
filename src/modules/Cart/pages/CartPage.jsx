import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Plus, Minus } from "lucide-react";

import { useCart } from "../../../shared/hooks/useCart";
import CartPageSkeleton from "../../../shared/components/ui/skeletons/CartPageSkeleton";

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

export default function CartPage() {
  const { hydrated, items, count, subtotal, setQty, removeItem, clearCart } = useCart();

  if (!hydrated) return <CartPageSkeleton />;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      <div className="container mx-auto px-6 py-8 space-y-6">
        <div className="rounded-2xl border bg-white p-6 shadow-sm flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Shopping cart</div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
              Your Cart ({count})
            </h1>
          </div>

          <Link
            to="/shop"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
          >
            <ArrowLeft size={16} /> Continue shopping
          </Link>
        </div>

        {items.length === 0 ? (
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
            {/* Items */}
            <div className="lg:col-span-8 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 rounded-2xl border p-4">
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
                      Price: <span className="font-medium text-gray-900">{formatMoney(it.price)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                      onClick={() => setQty(it.id, (it.qty || 1) - 1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus size={16} />
                    </button>

                    <div className="min-w-[42px] text-center font-semibold">{it.qty}</div>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                      onClick={() => setQty(it.id, (it.qty || 1) + 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="text-right font-bold text-gray-900 min-w-[90px]">
                    {formatMoney((it.price || 0) * (it.qty || 0))}
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-ghost text-red-600"
                    onClick={() => removeItem(it.id)}
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200 text-red-600"
                  onClick={clearCart}
                >
                  Clear cart
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-4 rounded-2xl border bg-white p-6 shadow-sm space-y-4">
              <div className="text-lg font-semibold text-gray-900">Order summary</div>

              <div className="text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">{formatMoney(0)}</span>
                </div>
                <div className="h-px bg-gray-100" />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900">{formatMoney(subtotal)}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn w-full rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
                disabled
              >
                Checkout (Coming soon)
              </button>

              <div className="text-xs text-gray-500">
                Tip: Cart is stored locally for now. You can connect it to the backend later.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
