import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";

const ICON_KEYS = ["ShoppingBag", "Shirt", "Watch", "Gem", "Baby", "Gift"];

function uniqNormalized(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list || []) {
    const v = String(raw || "").trim();
    if (!v) continue;
    const k = v.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(v);
  }
  return out;
}

function parseBrands(text) {
  const items = String(text || "")
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
  return uniqNormalized(items);
}

function clampNumber(n, min, max) {
  const x = Number.isFinite(Number(n)) ? Number(n) : min;
  return Math.max(min, Math.min(max, x));
}

function shallowSnapshot({ heroTitle, heroSubtitle, priceMax, brandsText, categories }) {
  return JSON.stringify({
    heroTitle: String(heroTitle || ""),
    heroSubtitle: String(heroSubtitle || ""),
    priceMax: clampNumber(priceMax, 1, 1_000_000),
    brandsText: String(brandsText || ""),
    categories: Array.isArray(categories) ? categories : [],
  });
}

export default function AdminShopControlPage() {
  const qc = useQueryClient();
  const didInit = useRef(false);

  const { data, isPending, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60_000,
    retry: 1,
  });

  const config = data?.data;

  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [priceMax, setPriceMax] = useState(5000);
  const [brandsText, setBrandsText] = useState("");
  const [categories, setCategories] = useState([]);

  // Enterprise UX: track dirty state + allow reset
  const initialSnapshotRef = useRef(null);
  const initialStateRef = useRef(null);

  useEffect(() => {
    if (didInit.current) return;
    if (!config) return;

    didInit.current = true;

    const next = {
      heroTitle: String(config.heroTitle || ""),
      heroSubtitle: String(config.heroSubtitle || ""),
      priceMax: clampNumber(config.priceMax ?? 5000, 1, 1_000_000),
      brandsText: (Array.isArray(config.brands) ? config.brands : []).join("\n"),
      categories: Array.isArray(config.categories) ? config.categories : [],
    };

    setHeroTitle(next.heroTitle);
    setHeroSubtitle(next.heroSubtitle);
    setPriceMax(next.priceMax);
    setBrandsText(next.brandsText);
    setCategories(next.categories);

    initialStateRef.current = next;
    initialSnapshotRef.current = shallowSnapshot(next);
  }, [config]);

  const categoriesSafe = useMemo(() => {
    const list = Array.isArray(categories) ? categories : [];
    return list.slice(0, 40).map((c) => ({
      name: String(c?.name || "").trim(),
      iconKey: ICON_KEYS.includes(String(c?.iconKey || "")) ? String(c.iconKey) : "ShoppingBag",
    }));
  }, [categories]);

  const brandsSafe = useMemo(() => parseBrands(brandsText), [brandsText]);

  const isDirty = useMemo(() => {
    const snap = initialSnapshotRef.current;
    if (!snap) return false;

    const now = shallowSnapshot({ heroTitle, heroSubtitle, priceMax, brandsText, categories });
    return now !== snap;
  }, [heroTitle, heroSubtitle, priceMax, brandsText, categories]);

  // Warn before closing tab if unsaved changes exist
  useEffect(() => {
    function onBeforeUnload(e) {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const mutation = useMutation({
    mutationFn: async (payload) => (await api.put("/page-config/shop", payload)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-config", "shop"] });

      // Update dirty snapshot to current state (now saved)
      const snap = shallowSnapshot({ heroTitle, heroSubtitle, priceMax, brandsText, categories });
      initialSnapshotRef.current = snap;
      initialStateRef.current = { heroTitle, heroSubtitle, priceMax, brandsText, categories };

      toast.success("Saved successfully", {
        description: "Your shop configuration has been updated.",
      });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed. Please try again.";
      toast.error("Could not save changes", { description: String(msg) });
    },
  });

  function addCategory() {
    setCategories((prev) => [...(prev || []), { name: "", iconKey: "ShoppingBag" }]);
  }

  function updateCategory(idx, patch) {
    setCategories((prev) => {
      const next = [...(prev || [])];
      next[idx] = { ...(next[idx] || {}), ...patch };
      return next;
    });
  }

  function removeCategory(idx) {
    setCategories((prev) => (prev || []).filter((_, i) => i !== idx));
  }

  function validateAndBuildPayload() {
    const cleanHeroTitle = String(heroTitle || "").trim();
    const cleanHeroSubtitle = String(heroSubtitle || "").trim();
    const cleanPriceMax = clampNumber(priceMax, 1, 1_000_000);

    // categories: trim, unique by name (case-insensitive), max 40
    const catList = (categoriesSafe || []).filter((c) => c.name);
    const seen = new Set();
    const uniqueCats = [];
    for (const c of catList) {
      const key = c.name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      uniqueCats.push(c);
    }

    if (!cleanHeroTitle) return { ok: false, message: "Hero title is required." };
    if (uniqueCats.length > 40) return { ok: false, message: "Maximum 40 categories are allowed." };

    return {
      ok: true,
      payload: {
        heroTitle: cleanHeroTitle,
        heroSubtitle: cleanHeroSubtitle,
        priceMax: cleanPriceMax,
        brands: brandsSafe,
        categories: uniqueCats,
      },
    };
  }

  function handleSave() {
    const res = validateAndBuildPayload();
    if (!res.ok) {
      toast.error("Validation failed", { description: res.message });
      return;
    }
    mutation.mutate(res.payload);
  }

  function handleReset() {
    const base = initialStateRef.current;
    if (!base) return;
    setHeroTitle(base.heroTitle);
    setHeroSubtitle(base.heroSubtitle);
    setPriceMax(base.priceMax);
    setBrandsText(base.brandsText);
    setCategories(base.categories);
    toast.message("Changes reverted", { description: "Restored last saved configuration." });
  }

  if (isPending) {
    return (
      <div className="bg-white border rounded-3xl p-6 shadow-sm">
        <div className="skeleton h-7 w-56 rounded-xl" />
        <div className="mt-4 skeleton h-4 w-full rounded-xl" />
        <div className="mt-2 skeleton h-4 w-5/6 rounded-xl" />
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="skeleton h-28 w-full rounded-2xl" />
          <div className="skeleton h-28 w-full rounded-2xl" />
        </div>
        <div className="mt-6 skeleton h-12 w-36 rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white border rounded-3xl p-6 shadow-sm">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">Couldn’t load shop config</div>
          <div className="mt-1 opacity-90">
            {error?.response?.data?.message || error?.message || "Failed to load shop configuration."}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const saveDisabled = mutation.isPending || !isDirty;

  return (
    <div className="bg-white border rounded-3xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold">Shop Control</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage shop hero copy, category pills, brand allowlist, and price slider cap.
          </p>

          {isDirty ? (
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Unsaved changes
            </div>
          ) : (
            <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-500">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              Up to date
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className={[
              "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition border",
              !isDirty ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            ].join(" ")}
            disabled={!isDirty || mutation.isPending}
            title="Revert to last saved"
          >
            <RotateCcw size={18} />
            Reset
          </button>

          <button
            type="button"
            onClick={handleSave}
            className={[
              "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
              saveDisabled
                ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                : "bg-black text-white hover:bg-gray-900",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
            ].join(" ")}
            disabled={saveDisabled}
          >
            <Save size={18} />
            {mutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* subtle network state */}
      {isFetching ? (
        <div className="mt-3 text-xs text-gray-500">Updating data…</div>
      ) : null}

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hero */}
        <div className="rounded-3xl border p-5">
          <h2 className="font-semibold">Hero</h2>

          <label className="block w-full mt-4">
            <div className="text-sm font-medium text-gray-800">Hero title</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Shop all products"
            />
          </label>

          <label className="block w-full mt-4">
            <div className="text-sm font-medium text-gray-800">Hero subtitle</div>
            <textarea
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm min-h-[110px]
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Short description..."
            />
          </label>
        </div>

        {/* Filters */}
        <div className="rounded-3xl border p-5">
          <h2 className="font-semibold">Shop filters</h2>

          <label className="block w-full mt-4">
            <div className="text-sm font-medium text-gray-800">Price slider cap (max)</div>
            <input
              type="number"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value || 0))}
              min={1}
            />
            <div className="mt-2 text-xs text-gray-500">
              Used as the maximum range of the client price slider.
            </div>
          </label>

          <label className="block w-full mt-4">
            <div className="text-sm font-medium text-gray-800">Brand allowlist (optional)</div>
            <textarea
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm min-h-[150px]
                         focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              placeholder={"Nike\nApple\nChanel"}
            />
            <div className="mt-2 text-xs text-gray-500">
              Leave empty to allow all brands. One brand per line.
            </div>

            {brandsSafe.length > 0 ? (
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-semibold">{brandsSafe.length}</span> unique brand(s) detected.
              </div>
            ) : null}
          </label>
        </div>
      </div>

      {/* Categories */}
      <div className="mt-6 rounded-3xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Category pills</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure the quick category pills shown at the top of the Shop page.
            </p>
          </div>

          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            disabled={categoriesSafe.length >= 40}
          >
            <Plus size={18} /> Add category
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {categoriesSafe.length === 0 ? (
            <div className="text-sm text-gray-500">No categories yet. Add a category.</div>
          ) : null}

          {categoriesSafe.map((c, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-6">
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                             focus:ring-2 focus:ring-black focus:ring-offset-2"
                  placeholder="Category name (e.g. Men)"
                  value={c.name}
                  onChange={(e) => updateCategory(idx, { name: e.target.value })}
                />
              </div>

              <div className="md:col-span-4">
                <select
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none shadow-sm
                             focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={c.iconKey}
                  onChange={(e) => updateCategory(idx, { iconKey: e.target.value })}
                >
                  {ICON_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 flex md:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Remove this category?")) removeCategory(idx);
                  }}
                  className="inline-flex items-center justify-center rounded-2xl border px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {categoriesSafe.length >= 40 ? (
            <div className="text-xs text-gray-500">Maximum limit reached: 40 categories.</div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            saveDisabled
              ? "bg-gray-200 text-gray-600 cursor-not-allowed"
              : "bg-black text-white hover:bg-gray-900",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          ].join(" ")}
          disabled={saveDisabled}
        >
          <Save size={18} />
          {mutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </div>
  );
}
