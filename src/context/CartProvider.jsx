import React, { createContext, useEffect, useMemo, useState } from "react";

export const CartContext = createContext(null);

const CART_KEY = "ss_cart_v1";

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function safeRead() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const data = safeParse(raw, []);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function safeWrite(items) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function normalizeItem(input) {
  const id = input?.id || input?._id;
  if (!id) return null;

  const title = String(input?.title || input?.name || "Untitled Product");
  const price = Number(input?.price ?? 0);
  const image = input?.image || input?.images?.[0] || "";

  return {
    id: String(id),
    title,
    price: Number.isFinite(price) ? price : 0,
    image: String(image || ""),
    qty: Math.max(1, Number(input?.qty ?? 1) || 1),
  };
}

export default function CartProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState([]);

  // Hydrate once
  useEffect(() => {
    const initial = safeRead();
    setItems(initial);
    setHydrated(true);
  }, []);

  // Persist
  useEffect(() => {
    if (!hydrated) return;
    safeWrite(items);
  }, [items, hydrated]);

  const api = useMemo(() => {
    function addItem(product, qty = 1) {
      const base = normalizeItem({ ...product, qty });
      if (!base) return;

      setItems((prev) => {
        const next = [...prev];
        const idx = next.findIndex((x) => x.id === base.id);
        if (idx >= 0) {
          next[idx] = { ...next[idx], qty: next[idx].qty + base.qty };
          return next;
        }
        next.push(base);
        return next;
      });
    }

    function removeItem(id) {
      setItems((prev) => prev.filter((x) => x.id !== String(id)));
    }

    function setQty(id, qty) {
      const q = Number(qty);
      if (!Number.isFinite(q)) return;

      setItems((prev) => {
        if (q <= 0) return prev.filter((x) => x.id !== String(id));
        return prev.map((x) => (x.id === String(id) ? { ...x, qty: q } : x));
      });
    }

    function clearCart() {
      setItems([]);
    }

    const count = items.reduce((a, x) => a + (Number(x.qty) || 0), 0);
    const subtotal = items.reduce((a, x) => a + (Number(x.price) || 0) * (Number(x.qty) || 0), 0);

    return {
      hydrated,
      items,
      count,
      subtotal,
      addItem,
      removeItem,
      setQty,
      clearCart,
    };
  }, [items, hydrated]);

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>;
}
