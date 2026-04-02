import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Loader2,
  ShoppingBag,
  ShieldCheck,
  LayoutTemplate,
  Filter,
  Layers3,
  Upload,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";

const ICON_KEYS = ["ShoppingBag", "Shirt", "Watch", "Gem", "Baby", "Gift"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "priceLow", label: "Price: Low to High" },
  { value: "priceHigh", label: "Price: High to Low" },
];

function uniqNormalized(list) {
  const seen = new Set();
  const out = [];
  for (const raw of list || []) {
    const value = String(raw || "").trim();
    if (!value) continue;
    const key = value.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(value);
  }
  return out;
}

function parseBrands(text) {
  return uniqNormalized(
    String(text || "")
      .split(/\r?\n|,/g)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function clampNumber(value, min, max) {
  const parsed = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, parsed));
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeCategory(raw, index = 0) {
  const name = String(raw?.name || "").trim();
  const slug = String(raw?.slug || "").trim() || slugify(name);
  return {
    id:
      String(raw?.id || slug || `category-${index + 1}`).trim() ||
      `category-${index + 1}`,
    name,
    slug,
    iconKey: ICON_KEYS.includes(String(raw?.iconKey || ""))
      ? String(raw.iconKey)
      : "ShoppingBag",
    image: String(raw?.image || "").trim(),
    isActive: raw?.isActive !== false,
    featured:
      raw?.featured === true ||
      raw?.featured === "true" ||
      raw?.featured === 1 ||
      raw?.featured === "1",
    sortOrder: Number.isFinite(Number(raw?.sortOrder))
      ? Number(raw.sortOrder)
      : index + 1,
  };
}

function sanitizeCategories(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 40).map((item, index) => normalizeCategory(item, index));
}

function dedupeCategories(list) {
  const seenName = new Set();
  const seenId = new Set();
  const out = [];

  for (const item of sanitizeCategories(list)) {
    if (!item.name) continue;
    const nameKey = item.name.toLowerCase();
    const idKey = item.id.toLowerCase();
    if (seenName.has(nameKey) || seenId.has(idKey)) continue;
    seenName.add(nameKey);
    seenId.add(idKey);
    out.push(item);
  }

  return out
    .slice(0, 40)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function normalizeBadge(raw, index = 0) {
  return {
    id: String(raw?.id || `badge-${index + 1}`).trim() || `badge-${index + 1}`,
    label: String(raw?.label || "").trim(),
  };
}

function sanitizeTrustBadges(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 6).map(normalizeBadge);
}

function dedupeTrustBadges(list) {
  const seen = new Set();
  const out = [];

  for (const item of sanitizeTrustBadges(list)) {
    if (!item.label) continue;
    const key = item.label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

function normalizeCollection(raw, index = 0) {
  return {
    id:
      String(raw?.id || `collection-${index + 1}`).trim() ||
      `collection-${index + 1}`,
    title: String(raw?.title || "").trim(),
    description: String(raw?.description || "").trim(),
    href: String(raw?.href || "").trim(),
    image: String(raw?.image || "").trim(),
  };
}

function sanitizeFeaturedCollections(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 6).map(normalizeCollection);
}

async function uploadSingleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await api.post("/upload/local", formData);
  const data = response?.data || {};
  if (!String(data?.url || "").trim()) {
    throw new Error("Image upload failed.");
  }
  return String(data.url || "").trim();
}

function shallowSnapshot(state) {
  return JSON.stringify({
    heroEyebrow: String(state.heroEyebrow || ""),
    heroTitle: String(state.heroTitle || ""),
    heroSubtitle: String(state.heroSubtitle || ""),
    heroImage: String(state.heroImage || ""),
    promoTitle: String(state.promoTitle || ""),
    promoText: String(state.promoText || ""),
    defaultSort: String(state.defaultSort || "newest"),
    emptyStateTitle: String(state.emptyStateTitle || ""),
    emptyStateSubtitle: String(state.emptyStateSubtitle || ""),
    priceMax: clampNumber(state.priceMax, 1, 1000000),
    brandsText: String(state.brandsText || ""),
    categories: sanitizeCategories(state.categories),
    trustBadges: sanitizeTrustBadges(state.trustBadges),
    featuredCollections: sanitizeFeaturedCollections(state.featuredCollections),
  });
}

function buildFormState(shopDoc) {
  const config = shopDoc?.data || {};
  return {
    version: Number(shopDoc?.version || 0),
    heroEyebrow: String(config?.heroEyebrow || ""),
    heroTitle: String(config?.heroTitle || ""),
    heroSubtitle: String(config?.heroSubtitle || ""),
    heroImage: String(config?.heroImage || ""),
    promoTitle: String(config?.promoTitle || ""),
    promoText: String(config?.promoText || ""),
    defaultSort: String(config?.defaultSort || "newest"),
    emptyStateTitle: String(config?.emptyStateTitle || ""),
    emptyStateSubtitle: String(config?.emptyStateSubtitle || ""),
    priceMax: clampNumber(config?.priceMax ?? 5000, 1, 1000000),
    brandsText: (Array.isArray(config?.brands) ? config.brands : []).join("\n"),
    categories: sanitizeCategories(config?.categories),
    trustBadges: sanitizeTrustBadges(config?.trustBadges),
    featuredCollections: sanitizeFeaturedCollections(config?.featuredCollections),
  };
}

function SummaryCard({ label, value, hint }) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-gray-950">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

function SectionCard({ title, description, icon: Icon, children }) {
  return (
    <section className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700">
            <Icon size={18} />
          </div>
        ) : null}
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-gray-600">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function UploadField({ label, value, onChange, hint }) {
  const [busy, setBusy] = useState(false);

  async function onPickFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setBusy(true);
      const url = await uploadSingleImage(file);
      onChange(url);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error("Upload failed", {
        description:
          error?.response?.data?.message ||
          error?.message ||
          "Could not upload image.",
      });
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium text-gray-800">{label}</div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.webp"
          maxLength={500}
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
        />

        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
          Upload
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onPickFile}
            disabled={busy}
          />
        </label>
      </div>

      {value ? (
        <div className="overflow-hidden rounded-[22px] border border-gray-200 bg-gray-50">
          <img
            src={value}
            alt={label}
            className="h-44 w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      ) : null}

      <div className="text-xs text-gray-500">
        {hint || "Use a relative path or a full http/https URL."}
      </div>
    </div>
  );
}

export default function AdminShopControlPage() {
  const queryClient = useQueryClient();
  const hasHydratedRef = useRef(false);

  const {
    data: shopDoc,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["page-config", "shop"],
    queryFn: async () => (await api.get("/page-config/shop")).data,
    staleTime: 60000,
    retry: 1,
  });

  const [heroEyebrow, setHeroEyebrow] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroSubtitle, setHeroSubtitle] = useState("");
  const [heroImage, setHeroImage] = useState("");

  const [promoTitle, setPromoTitle] = useState("");
  const [promoText, setPromoText] = useState("");
  const [defaultSort, setDefaultSort] = useState("newest");

  const [emptyStateTitle, setEmptyStateTitle] = useState("");
  const [emptyStateSubtitle, setEmptyStateSubtitle] = useState("");

  const [priceMax, setPriceMax] = useState(5000);
  const [brandsText, setBrandsText] = useState("");

  const [categories, setCategories] = useState([]);
  const [trustBadges, setTrustBadges] = useState([]);
  const [featuredCollections, setFeaturedCollections] = useState([]);

  const initialSnapshotRef = useRef(null);
  const initialStateRef = useRef(null);

  const categoriesSafe = useMemo(() => sanitizeCategories(categories), [categories]);
  const trustBadgesSafe = useMemo(() => sanitizeTrustBadges(trustBadges), [trustBadges]);
  const featuredCollectionsSafe = useMemo(
    () => sanitizeFeaturedCollections(featuredCollections),
    [featuredCollections]
  );
  const brandsSafe = useMemo(() => parseBrands(brandsText), [brandsText]);

  const isDirty = useMemo(() => {
    const snapshot = initialSnapshotRef.current;
    if (!snapshot) return false;
    return (
      shallowSnapshot({
        heroEyebrow,
        heroTitle,
        heroSubtitle,
        heroImage,
        promoTitle,
        promoText,
        defaultSort,
        emptyStateTitle,
        emptyStateSubtitle,
        priceMax,
        brandsText,
        categories,
        trustBadges,
        featuredCollections,
      }) !== snapshot
    );
  }, [
    heroEyebrow,
    heroTitle,
    heroSubtitle,
    heroImage,
    promoTitle,
    promoText,
    defaultSort,
    emptyStateTitle,
    emptyStateSubtitle,
    priceMax,
    brandsText,
    categories,
    trustBadges,
    featuredCollections,
  ]);

  function applyFormState(next) {
    setHeroEyebrow(next.heroEyebrow);
    setHeroTitle(next.heroTitle);
    setHeroSubtitle(next.heroSubtitle);
    setHeroImage(next.heroImage);

    setPromoTitle(next.promoTitle);
    setPromoText(next.promoText);
    setDefaultSort(next.defaultSort);

    setEmptyStateTitle(next.emptyStateTitle);
    setEmptyStateSubtitle(next.emptyStateSubtitle);

    setPriceMax(next.priceMax);
    setBrandsText(next.brandsText);

    setCategories(sanitizeCategories(next.categories));
    setTrustBadges(sanitizeTrustBadges(next.trustBadges));
    setFeaturedCollections(sanitizeFeaturedCollections(next.featuredCollections));

    initialStateRef.current = {
      ...next,
      categories: sanitizeCategories(next.categories),
      trustBadges: sanitizeTrustBadges(next.trustBadges),
      featuredCollections: sanitizeFeaturedCollections(next.featuredCollections),
    };

    initialSnapshotRef.current = shallowSnapshot(initialStateRef.current);
  }

  useEffect(() => {
    if (!shopDoc) return;
    const next = buildFormState(shopDoc);

    if (!hasHydratedRef.current) {
      applyFormState(next);
      hasHydratedRef.current = true;
      return;
    }

    if (!isDirty) {
      applyFormState(next);
    }
  }, [shopDoc, isDirty]);

  useEffect(() => {
    function onBeforeUnload(event) {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const mutation = useMutation({
    mutationFn: async (payload) => (await api.put("/page-config/shop", payload)).data,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["page-config", "shop"] });
      applyFormState(buildFormState(response));
      toast.success("Saved successfully", {
        description: "Your shop configuration has been updated.",
      });
    },
    onError: (err) => {
      toast.error("Could not save changes", {
        description:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Update failed. Please try again.",
      });
    },
  });

  function addCategory() {
    setCategories((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      normalizeCategory(
        {
          name: "",
          slug: "",
          iconKey: "ShoppingBag",
          image: "",
          isActive: true,
          featured: false,
        },
        prev.length
      ),
    ]);
  }

  function updateCategory(index, patch) {
    setCategories((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const merged = normalizeCategory({ ...(next[index] || {}), ...patch }, index);
      if (patch.name != null && !patch.slug) {
        merged.slug = slugify(merged.name);
      }
      next[index] = merged;
      return next;
    });
  }

  function moveCategory(index, direction) {
    setCategories((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;

      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;

      return next.map((item, idx) =>
        normalizeCategory({ ...item, sortOrder: idx + 1 }, idx)
      );
    });
  }

  function removeCategory(index) {
    setCategories((prev) =>
      (Array.isArray(prev) ? prev : [])
        .filter((_, i) => i !== index)
        .map((item, idx) => normalizeCategory({ ...item, sortOrder: idx + 1 }, idx))
    );
  }

  function addTrustBadge() {
    setTrustBadges((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: `badge-${Date.now()}`, label: "" },
    ]);
  }

  function updateTrustBadge(index, patch) {
    setTrustBadges((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[index] = normalizeBadge({ ...(next[index] || {}), ...patch }, index);
      return next;
    });
  }

  function removeTrustBadge(index) {
    setTrustBadges((prev) =>
      (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index)
    );
  }

  function addFeaturedCollection() {
    setFeaturedCollections((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        id: `collection-${Date.now()}`,
        title: "",
        description: "",
        href: "/shop",
        image: "",
      },
    ]);
  }

  function updateFeaturedCollection(index, patch) {
    setFeaturedCollections((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[index] = normalizeCollection({ ...(next[index] || {}), ...patch }, index);
      return next;
    });
  }

  function removeFeaturedCollection(index) {
    setFeaturedCollections((prev) =>
      (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index)
    );
  }

  function validateAndBuildPayload() {
    const cleanHeroEyebrow = String(heroEyebrow || "").trim();
    const cleanHeroTitle = String(heroTitle || "").trim();
    const cleanHeroSubtitle = String(heroSubtitle || "").trim();
    const cleanHeroImage = String(heroImage || "").trim();

    const cleanPromoTitle = String(promoTitle || "").trim();
    const cleanPromoText = String(promoText || "").trim();
    const cleanDefaultSort = String(defaultSort || "newest").trim();

    const cleanEmptyStateTitle = String(emptyStateTitle || "").trim();
    const cleanEmptyStateSubtitle = String(emptyStateSubtitle || "").trim();

    const cleanPriceMax = clampNumber(priceMax, 1, 1000000);
    const uniqueCategories = dedupeCategories(
      categoriesSafe.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
        slug: item.slug || slugify(item.name),
      }))
    );

    const uniqueTrustBadges = dedupeTrustBadges(trustBadgesSafe);
    const cleanCollections = featuredCollectionsSafe
      .map((item, index) => normalizeCollection(item, index))
      .filter((item) => item.title);

    if (!cleanHeroTitle) return { ok: false, message: "Hero title is required." };
    if (uniqueCategories.some((category) => !category.slug)) {
      return { ok: false, message: "Each category must have a valid slug." };
    }

    const payload = {
      heroEyebrow: cleanHeroEyebrow,
      heroTitle: cleanHeroTitle,
      heroSubtitle: cleanHeroSubtitle,
      heroImage: cleanHeroImage,

      promoTitle: cleanPromoTitle,
      promoText: cleanPromoText,
      defaultSort: cleanDefaultSort,

      emptyStateTitle: cleanEmptyStateTitle,
      emptyStateSubtitle: cleanEmptyStateSubtitle,

      priceMax: cleanPriceMax,
      brands: brandsSafe,
      categories: uniqueCategories,
      trustBadges: uniqueTrustBadges,
      featuredCollections: cleanCollections,
    };

    const version = Number(initialStateRef.current?.version || 0);
    if (Number.isFinite(version) && version > 0) {
      payload.version = version;
    }

    return { ok: true, payload };
  }

  function handleSave() {
    const result = validateAndBuildPayload();
    if (!result.ok) {
      toast.error("Validation failed", { description: result.message });
      return;
    }
    mutation.mutate(result.payload);
  }

  function handleReset() {
    const base = initialStateRef.current;
    if (!base) return;
    applyFormState(base);
    toast.message("Changes reverted", {
      description: "Restored last saved configuration.",
    });
  }

  if (isPending) {
    return (
      <div className="rounded-[30px] border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="animate-pulse">
          <div className="h-7 w-56 rounded-xl bg-gray-100" />
          <div className="mt-4 h-4 w-full rounded-xl bg-gray-100" />
          <div className="mt-2 h-4 w-5/6 rounded-xl bg-gray-100" />
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
            <div className="h-24 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">Couldn’t load shop configuration</div>
          <div className="mt-1 opacity-90">
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load shop configuration."}
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const saveDisabled = mutation.isPending || !isDirty;
  const normalizedPreviewCategories = dedupeCategories(categoriesSafe);
  const normalizedPreviewTrustBadges = dedupeTrustBadges(trustBadgesSafe);

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <ShoppingBag size={14} />
              Shop Control
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
              Shop Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Manage hero content, collections, filters, and the master category registry used across shop pages.
            </p>

            {isDirty ? (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-600">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Unsaved changes
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-2 text-xs text-gray-500">
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
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                !isDirty ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              ].join(" ")}
              disabled={!isDirty || mutation.isPending}
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
                  ? "cursor-not-allowed bg-gray-200 text-gray-600"
                  : "bg-black text-white hover:bg-gray-900",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              ].join(" ")}
              disabled={saveDisabled}
            >
              {mutation.isPending ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save changes
                </>
              )}
            </button>
          </div>
        </div>

        {isFetching ? (
          <div className="mt-3 text-xs text-gray-500">Updating data...</div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard label="Hero title" value={heroTitle.trim() || "—"} hint="Main shop heading" />
        <SummaryCard label="Allowed brands" value={brandsSafe.length || 0} hint="Unique brand entries" />
        <SummaryCard
          label="Active categories"
          value={normalizedPreviewCategories.filter((c) => c.isActive).length || 0}
          hint="Visible in storefront"
        />
        <SummaryCard label="Trust badges" value={normalizedPreviewTrustBadges.length || 0} hint="Discovery support chips" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Hero"
          description="Control the main hero zone shown at the top of the shop page."
          icon={LayoutTemplate}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Hero eyebrow</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroEyebrow}
              onChange={(e) => setHeroEyebrow(e.target.value)}
              maxLength={40}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Hero title</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              maxLength={90}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Hero subtitle</div>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              maxLength={320}
            />
          </label>

          <div className="mt-4">
            <UploadField
              label="Hero image"
              value={heroImage}
              onChange={setHeroImage}
              hint="Upload or paste the hero image URL."
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Shop experience"
          description="Control promo copy, default sort behavior and no-results messaging."
          icon={Filter}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Promo title</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={promoTitle}
              onChange={(e) => setPromoTitle(e.target.value)}
              maxLength={80}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Promo text</div>
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              maxLength={220}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Default sort</div>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={defaultSort}
              onChange={(e) => setDefaultSort(e.target.value)}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Empty state title</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={emptyStateTitle}
              onChange={(e) => setEmptyStateTitle(e.target.value)}
              maxLength={80}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Empty state subtitle</div>
            <textarea
              className="mt-2 min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={emptyStateSubtitle}
              onChange={(e) => setEmptyStateSubtitle(e.target.value)}
              maxLength={220}
            />
          </label>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Shop filters"
          description="Set global defaults for brand filtering and price range controls."
          icon={Filter}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Price slider cap (max)</div>
            <input
              type="number"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value || 0))}
              min={1}
              max={1000000}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Brand allowlist</div>
            <textarea
              className="mt-2 min-h-[160px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              placeholder={"Nike\nApple\nChanel"}
            />
          </label>
        </SectionCard>

        <SectionCard
          title="Trust badges"
          description="Short supporting badges shown to strengthen the shopping experience."
          icon={ShieldCheck}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs text-gray-500">
              Maximum 6 badges. Duplicate labels are removed on save.
            </div>

            <button
              type="button"
              onClick={addTrustBadge}
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              disabled={trustBadgesSafe.length >= 6}
            >
              <Plus size={18} />
              Add badge
            </button>
          </div>

          <div className="mt-5 space-y-3">
            {trustBadgesSafe.map((badge, index) => (
              <div
                key={badge.id || index}
                className="grid grid-cols-1 gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-4 md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-10">
                  <label className="block text-sm font-medium text-gray-800">Badge label</label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={badge.label}
                    onChange={(e) => updateTrustBadge(index, { label: e.target.value })}
                    maxLength={40}
                  />
                </div>

                <div className="flex md:col-span-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => removeTrustBadge(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title="Featured collections"
        description="Curated cards shown under the hero section."
        icon={Layers3}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">Add up to 6 collection cards.</div>

          <button
            type="button"
            onClick={addFeaturedCollection}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            disabled={featuredCollectionsSafe.length >= 6}
          >
            <Plus size={18} />
            Add collection
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {featuredCollectionsSafe.map((item, index) => (
            <div key={item.id || index} className="rounded-[24px] border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Title</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={item.title}
                    onChange={(e) => updateFeaturedCollection(index, { title: e.target.value })}
                    maxLength={80}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Href</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={item.href}
                    onChange={(e) => updateFeaturedCollection(index, { href: e.target.value })}
                    maxLength={500}
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <div className="text-sm font-medium text-gray-800">Description</div>
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={item.description}
                  onChange={(e) => updateFeaturedCollection(index, { description: e.target.value })}
                  maxLength={220}
                />
              </label>

              <div className="mt-4">
                <UploadField
                  label="Collection image"
                  value={item.image}
                  onChange={(value) => updateFeaturedCollection(index, { image: value })}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeFeaturedCollection(index)}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Master categories"
        description="These categories drive the shop pills, products selector, and storefront collection discovery."
        icon={ShoppingBag}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Maximum 40 categories. Order here controls storefront order.
          </div>

          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            disabled={categoriesSafe.length >= 40}
          >
            <Plus size={18} />
            Add category
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {categoriesSafe.map((category, index) => (
            <div
              key={category.id || index}
              className="rounded-[24px] border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                  <GripVertical size={14} />
                  Position {index + 1}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveCategory(index, -1)}
                    disabled={index === 0}
                    className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCategory(index, 1)}
                    disabled={index === categoriesSafe.length - 1}
                    className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCategory(index)}
                    className="rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Category name</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={category.name}
                    onChange={(e) => updateCategory(index, { name: e.target.value })}
                    maxLength={40}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Slug</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={category.slug}
                    onChange={(e) => updateCategory(index, { slug: slugify(e.target.value) })}
                    maxLength={60}
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Icon</div>
                  <select
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={category.iconKey}
                    onChange={(e) => updateCategory(index, { iconKey: e.target.value })}
                  >
                    {ICON_KEYS.map((iconKey) => (
                      <option key={iconKey} value={iconKey}>
                        {iconKey}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={category.isActive}
                    onChange={(e) => updateCategory(index, { isActive: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-800">Active in storefront</span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={category.featured}
                    onChange={(e) => updateCategory(index, { featured: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-800">Featured collection</span>
                </label>
              </div>

              <div className="mt-4">
                <UploadField
                  label="Category image"
                  value={category.image}
                  onChange={(value) => updateCategory(index, { image: value })}
                  hint="Used in collections and category-driven discovery sections."
                />
              </div>

              <div className="mt-4 rounded-[20px] border border-dashed border-gray-300 bg-white px-4 py-3 text-xs text-gray-500">
                <span className="font-semibold text-gray-700">Preview:</span>{" "}
                id=<span className="font-mono">{category.id}</span>, slug=
                <span className="font-mono">{category.slug || "auto-generated"}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            saveDisabled
              ? "cursor-not-allowed bg-gray-200 text-gray-600"
              : "bg-black text-white hover:bg-gray-900",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          ].join(" ")}
          disabled={saveDisabled}
        >
          {mutation.isPending ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}