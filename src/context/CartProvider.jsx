import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import api from "../services/apiClient";
import { useAuth } from "../shared/hooks/useAuth";
import { toast } from "sonner";

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

/**
 * Normalize any product-like input into our cart item shape
 * (guest/local mode)
 */
function normalizeItem(input) {
  const id = input?.id || input?._id;
  if (!id) return null;

  const title = String(input?.title || input?.name || "Untitled Product");
  const price = Number(input?.price ?? 0);
  const image = input?.image || input?.images?.[0] || "";

  return {
    id: String(id), // productId
    title,
    price: Number.isFinite(price) ? price : 0,
    image: String(image || ""),
    qty: Math.max(1, Number(input?.qty ?? 1) || 1),

    // server-mode extra (optional)
    cartItemId: input?.cartItemId ? String(input.cartItemId) : undefined,
  };
}

/**
 * Server cart -> UI cart items
 */
function mapServerCartItems(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];
  return items
    .map((it) => {
      const productId = it?.product?._id || it?.product;
      if (!productId) return null;

      return {
        id: String(productId), // productId
        cartItemId: String(it._id), // cart subdoc id (needed for PATCH/DELETE)
        title: String(it.titleSnapshot || "Untitled Product"),
        price: Number(it.priceSnapshot || 0),
        image: String(it.imageSnapshot || ""),
        qty: Math.max(1, Number(it.qty || 1)),
      };
    })
    .filter(Boolean);
}

/**
 * Simple concurrency limiter (enterprise safe)
 */
async function runWithConcurrency(tasks, limit = 3) {
  const results = [];
  const queue = [...tasks];

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const fn = queue.shift();
      // eslint-disable-next-line no-await-in-loop
      results.push(await fn());
    }
  });

  await Promise.all(workers);
  return results;
}

export default function CartProvider({ children }) {
  const { isAuthed } = useAuth();

  const [hydrated, setHydrated] = useState(false);
  const [items, setItems] = useState([]);

  // prevent overlapping sync calls
  const syncingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Initial hydrate from local (fast UI)
  useEffect(() => {
    const initial = safeRead();
    setItems(Array.isArray(initial) ? initial : []);
    setHydrated(true);
  }, []);

  // Persist current items to local storage (guest + quick restore UX)
  useEffect(() => {
    if (!hydrated) return;
    safeWrite(items);
  }, [items, hydrated]);

  const refresh = useCallback(async () => {
    if (!isAuthed) return;

    try {
      const { data } = await api.get("/cart");
      const mapped = mapServerCartItems(data);
      if (mountedRef.current) setItems(mapped);
    } catch (e) {
      // silent fail: keep local snapshot
    }
  }, [isAuthed]);

  /**
   * When user becomes authed:
   * - Load server cart
   * - Merge guest/local items (only those WITHOUT cartItemId)
   * - Replace UI with final server cart
   */
  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthed) return;
    if (syncingRef.current) return;

    let cancelled = false;

    (async () => {
      syncingRef.current = true;

      try {
        // 1) get server cart
        const res = await api.get("/cart");
        let cart = res.data;

        // 2) merge local guest items (only unsynced ones)
        const local = safeRead();
        const unsynced = (Array.isArray(local) ? local : []).filter(
          (x) => x && x.id && !x.cartItemId
        );

        if (unsynced.length) {
          const tasks = unsynced.map((it) => async () => {
            try {
              const r = await api.post("/cart/items", {
                productId: String(it.id),
                qty: Number(it.qty || 1),
              });
              cart = r.data;
              return true;
            } catch {
              return false;
            }
          });

          // enterprise: limit concurrency
          await runWithConcurrency(tasks, 3);

          // after merge, read final cart from last response state
        }

        const mapped = mapServerCartItems(cart);
        if (!cancelled && mountedRef.current) {
          setItems(mapped);
          safeWrite(mapped);
        }
      } catch (e) {
        // keep local cart as fallback
        // optional toast only when real failure
        // toast.error("Failed to sync cart. Using local cart temporarily.");
      } finally {
        syncingRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, isAuthed]);

  const value = useMemo(() => {
    const count = items.reduce((a, x) => a + (Number(x.qty) || 0), 0);
    const subtotal = items.reduce(
      (a, x) => a + (Number(x.price) || 0) * (Number(x.qty) || 0),
      0
    );

    async function addItem(product, qty = 1) {
      const base = normalizeItem({ ...product, qty });
      if (!base) return;

      // Auth mode → server cart
      if (isAuthed) {
        try {
          const productId = String(product?._id || product?.id || base.id);
          const { data } = await api.post("/cart/items", {
            productId,
            qty: base.qty,
          });
          const mapped = mapServerCartItems(data);
          setItems(mapped);
          safeWrite(mapped);
          toast.success("Added to cart");
          return;
        } catch (e) {
          toast.error(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              "Failed to add item"
          );
          return;
        }
      }

      // Guest mode → local
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
      toast.success("Added to cart");
    }

    async function removeItem(productId) {
      const id = String(productId);

      if (isAuthed) {
        const it = items.find((x) => String(x.id) === id);
        const cartItemId = it?.cartItemId;

        if (!cartItemId) {
          // fallback: remove locally
          setItems((prev) => prev.filter((x) => String(x.id) !== id));
          return;
        }

        try {
          const { data } = await api.delete(`/cart/items/${cartItemId}`);
          const mapped = mapServerCartItems(data);
          setItems(mapped);
          safeWrite(mapped);
          toast.success("Removed from cart");
          return;
        } catch (e) {
          toast.error(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              "Failed to remove item"
          );
          return;
        }
      }

      setItems((prev) => prev.filter((x) => String(x.id) !== id));
    }

    async function setQty(productId, qty) {
      const id = String(productId);
      const q = Number(qty);
      if (!Number.isFinite(q)) return;

      // remove if qty <= 0
      if (q <= 0) {
        await removeItem(id);
        return;
      }

      if (isAuthed) {
        const it = items.find((x) => String(x.id) === id);
        const cartItemId = it?.cartItemId;

        if (!cartItemId) {
          // if missing, fallback to add
          await addItem({ _id: id, title: it?.title, price: it?.price, images: [it?.image] }, q);
          return;
        }

        try {
          const { data } = await api.patch(`/cart/items/${cartItemId}`, { qty: q });
          const mapped = mapServerCartItems(data);
          setItems(mapped);
          safeWrite(mapped);
          return;
        } catch (e) {
          toast.error(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              "Failed to update quantity"
          );
          return;
        }
      }

      // guest local update
      setItems((prev) =>
        prev.map((x) => (String(x.id) === id ? { ...x, qty: q } : x))
      );
    }

    async function clearCart() {
      if (isAuthed) {
        try {
          await api.post("/cart/clear");
          setItems([]);
          safeWrite([]);
          toast.success("Cart cleared");
          return;
        } catch (e) {
          toast.error(
            e?.response?.data?.message ||
              e?.response?.data?.error ||
              "Failed to clear cart"
          );
          return;
        }
      }

      setItems([]);
      safeWrite([]);
    }

    return {
      hydrated,
      items,
      count,
      subtotal,

      addItem,
      removeItem,
      setQty,
      clearCart,

      // optional enterprise helper
      refresh,
    };
  }, [items, hydrated, isAuthed, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
