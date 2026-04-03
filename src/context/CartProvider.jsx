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
    if (typeof window === "undefined") return [];
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
    if (typeof window === "undefined") return;
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

function extractImageUrl(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = extractImageUrl(item);
      if (url) return url;
    }
    return "";
  }

  if (typeof value === "object") {
    const directUrl = String(value.url || "").trim();
    if (directUrl) return directUrl;

    const nestedImage = extractImageUrl(value.image);
    if (nestedImage) return nestedImage;

    const nestedImages = extractImageUrl(value.images);
    if (nestedImages) return nestedImages;
  }

  return "";
}

function normalizeItem(input) {
  const id = input?.id || input?._id;
  if (!id) return null;

  const title = String(input?.title || input?.name || "Untitled Product");
  const price = Number(input?.price ?? 0);
  const image = extractImageUrl(input?.image) || extractImageUrl(input?.images);

  return {
    id: String(id),
    title,
    price: Number.isFinite(price) ? price : 0,
    image,
    qty: Math.max(1, Number(input?.qty ?? 1) || 1),
    cartItemId: input?.cartItemId ? String(input.cartItemId) : undefined,
  };
}

function mapServerCartItems(cart) {
  const items = Array.isArray(cart?.items) ? cart.items : [];

  return items
    .map((it) => {
      const productId = it?.product?._id || it?.product;
      if (!productId) return null;

      return {
        id: String(productId),
        cartItemId: String(it._id),
        title: String(it.titleSnapshot || "Untitled Product"),
        price: Number(it.priceSnapshot || 0),
        image: extractImageUrl(it.imageSnapshot),
        qty: Math.max(1, Number(it.qty || 1)),
      };
    })
    .filter(Boolean);
}

async function runWithConcurrency(tasks, limit = 3) {
  const results = [];
  const queue = [...tasks];

  const workers = Array.from({ length: Math.max(1, limit) }, async () => {
    while (queue.length) {
      const fn = queue.shift();
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

  const syncingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const initial = safeRead();
    const normalized = Array.isArray(initial)
      ? initial.map(normalizeItem).filter(Boolean)
      : [];

    setItems(normalized);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    safeWrite(items);
  }, [items, hydrated]);

  const refresh = useCallback(async () => {
    if (!isAuthed) return;

    try {
      const { data } = await api.get("/cart");
      const mapped = mapServerCartItems(data);

      if (mountedRef.current) {
        setItems(mapped);
      }
    } catch {
      // silent fail
    }
  }, [isAuthed]);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthed) return;
    if (syncingRef.current) return;

    let cancelled = false;

    (async () => {
      syncingRef.current = true;

      try {
        const res = await api.get("/cart");
        let cart = res.data;

        const local = safeRead();
        const unsynced = (Array.isArray(local) ? local : [])
          .map(normalizeItem)
          .filter((x) => x && x.id && !x.cartItemId);

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

          await runWithConcurrency(tasks, 3);
        }

        const mapped = mapServerCartItems(cart);

        if (!cancelled && mountedRef.current) {
          setItems(mapped);
          safeWrite(mapped);
        }
      } catch {
        // keep local fallback
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

      setItems((prev) => {
        const next = [...prev];
        const idx = next.findIndex((x) => x.id === base.id);

        if (idx >= 0) {
          next[idx] = {
            ...next[idx],
            qty: next[idx].qty + base.qty,
            image: next[idx].image || base.image,
          };
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
          const next = items.filter((x) => String(x.id) !== id);
          setItems(next);
          safeWrite(next);
          toast.success("Removed from cart");
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

      const next = items.filter((x) => String(x.id) !== id);
      setItems(next);
      safeWrite(next);
      toast.success("Removed from cart");
    }

    async function setQty(productId, qty) {
      const id = String(productId);
      const q = Number(qty);

      if (!Number.isFinite(q)) return;

      if (q <= 0) {
        await removeItem(id);
        return;
      }

      if (isAuthed) {
        const it = items.find((x) => String(x.id) === id);
        const cartItemId = it?.cartItemId;

        if (!cartItemId) {
          if (!it) return;

          await addItem(
            {
              _id: id,
              title: it.title,
              price: it.price,
              images: it.image ? [{ url: it.image }] : [],
            },
            q
          );
          return;
        }

        try {
          const { data } = await api.patch(`/cart/items/${cartItemId}`, {
            qty: q,
          });
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

      const next = items.map((x) =>
        String(x.id) === id ? { ...x, qty: q } : x
      );
      setItems(next);
      safeWrite(next);
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
      toast.success("Cart cleared");
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
      refresh,
    };
  }, [items, hydrated, isAuthed, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}