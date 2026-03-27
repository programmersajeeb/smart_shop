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
  const items = String(text || "")
    .split(/\r?\n|,/g)
    .map((item) => item.trim())
    .filter(Boolean);

  return uniqNormalized(items);
}

function clampNumber(value, min, max) {
  const parsed = Number.isFinite(Number(value)) ? Number(value) : min;
  return Math.max(min, Math.min(max, parsed));
}

function normalizeCategory(raw) {
  return {
    name: String(raw?.name || "").trim(),
    iconKey: ICON_KEYS.includes(String(raw?.iconKey || ""))
      ? String(raw.iconKey)
      : "ShoppingBag",
  };
}

function sanitizeCategories(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 40).map(normalizeCategory);
}

function dedupeCategories(list) {
  const seen = new Set();
  const out = [];

  for (const item of sanitizeCategories(list)) {
    if (!item.name) continue;

    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    out.push(item);
  }

  return out;
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

function shallowSnapshot({
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
}) {
  return JSON.stringify({
    heroEyebrow: String(heroEyebrow || ""),
    heroTitle: String(heroTitle || ""),
    heroSubtitle: String(heroSubtitle || ""),
    heroImage: String(heroImage || ""),
    promoTitle: String(promoTitle || ""),
    promoText: String(promoText || ""),
    defaultSort: String(defaultSort || "newest"),
    emptyStateTitle: String(emptyStateTitle || ""),
    emptyStateSubtitle: String(emptyStateSubtitle || ""),
    priceMax: clampNumber(priceMax, 1, 1_000_000),
    brandsText: String(brandsText || ""),
    categories: sanitizeCategories(categories),
    trustBadges: sanitizeTrustBadges(trustBadges),
    featuredCollections: sanitizeFeaturedCollections(featuredCollections),
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

    priceMax: clampNumber(config?.priceMax ?? 5000, 1, 1_000_000),
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
    staleTime: 60_000,
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
  const trustBadgesSafe = useMemo(
    () => sanitizeTrustBadges(trustBadges),
    [trustBadges]
  );
  const featuredCollectionsSafe = useMemo(
    () => sanitizeFeaturedCollections(featuredCollections),
    [featuredCollections]
  );
  const brandsSafe = useMemo(() => parseBrands(brandsText), [brandsText]);

  const isDirty = useMemo(() => {
    const snapshot = initialSnapshotRef.current;
    if (!snapshot) return false;

    const current = shallowSnapshot({
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
    });

    return current !== snapshot;
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
      version: Number(next.version || 0),

      heroEyebrow: next.heroEyebrow,
      heroTitle: next.heroTitle,
      heroSubtitle: next.heroSubtitle,
      heroImage: next.heroImage,

      promoTitle: next.promoTitle,
      promoText: next.promoText,
      defaultSort: next.defaultSort,

      emptyStateTitle: next.emptyStateTitle,
      emptyStateSubtitle: next.emptyStateSubtitle,

      priceMax: next.priceMax,
      brandsText: next.brandsText,

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

      const nextConfig = response
        ? buildFormState(response)
        : {
            version: Number(initialStateRef.current?.version || 0),

            heroEyebrow,
            heroTitle,
            heroSubtitle,
            heroImage,

            promoTitle,
            promoText,
            defaultSort,

            emptyStateTitle,
            emptyStateSubtitle,

            priceMax: clampNumber(priceMax, 1, 1_000_000),
            brandsText,

            categories: sanitizeCategories(categories),
            trustBadges: sanitizeTrustBadges(trustBadges),
            featuredCollections: sanitizeFeaturedCollections(featuredCollections),
          };

      applyFormState(nextConfig);

      toast.success("Saved successfully", {
        description: "Your shop configuration has been updated.",
      });
    },
    onError: (err) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Update failed. Please try again.";

      toast.error("Could not save changes", {
        description: String(message),
      });
    },
  });

  function addCategory() {
    setCategories((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { name: "", iconKey: "ShoppingBag" },
    ]);
  }

  function updateCategory(index, patch) {
    setCategories((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[index] = normalizeCategory({ ...(next[index] || {}), ...patch });
      return next;
    });
  }

  function removeCategory(index) {
    setCategories((prev) =>
      (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index)
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
      next[index] = normalizeCollection(
        { ...(next[index] || {}), ...patch },
        index
      );
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

    const cleanPriceMax = clampNumber(priceMax, 1, 1_000_000);
    const uniqueCategories = dedupeCategories(categoriesSafe);
    const uniqueTrustBadges = dedupeTrustBadges(trustBadgesSafe);
    const cleanCollections = featuredCollectionsSafe
      .map((item, index) => normalizeCollection(item, index))
      .filter((item) => item.title);

    if (!cleanHeroTitle) {
      return { ok: false, message: "Hero title is required." };
    }

    if (cleanHeroEyebrow.length > 40) {
      return { ok: false, message: "Hero eyebrow must be within 40 characters." };
    }

    if (cleanHeroTitle.length > 90) {
      return { ok: false, message: "Hero title must be within 90 characters." };
    }

    if (cleanHeroSubtitle.length > 320) {
      return { ok: false, message: "Hero subtitle must be within 320 characters." };
    }

    if (cleanHeroImage.length > 500) {
      return { ok: false, message: "Hero image URL is too long." };
    }

    if (cleanPromoTitle.length > 80) {
      return { ok: false, message: "Promo title must be within 80 characters." };
    }

    if (cleanPromoText.length > 220) {
      return { ok: false, message: "Promo text must be within 220 characters." };
    }

    if (
      cleanDefaultSort !== "newest" &&
      cleanDefaultSort !== "priceLow" &&
      cleanDefaultSort !== "priceHigh"
    ) {
      return { ok: false, message: "Invalid default sort value." };
    }

    if (cleanEmptyStateTitle.length > 80) {
      return {
        ok: false,
        message: "Empty state title must be within 80 characters.",
      };
    }

    if (cleanEmptyStateSubtitle.length > 220) {
      return {
        ok: false,
        message: "Empty state subtitle must be within 220 characters.",
      };
    }

    if (uniqueCategories.some((category) => category.name.length > 40)) {
      return {
        ok: false,
        message: "Each category name must be within 40 characters.",
      };
    }

    if (uniqueCategories.length > 40) {
      return { ok: false, message: "Maximum 40 categories are allowed." };
    }

    if (uniqueTrustBadges.some((badge) => badge.label.length > 40)) {
      return {
        ok: false,
        message: "Each trust badge label must be within 40 characters.",
      };
    }

    if (uniqueTrustBadges.length > 6) {
      return { ok: false, message: "Maximum 6 trust badges are allowed." };
    }

    if (cleanCollections.length > 6) {
      return { ok: false, message: "Maximum 6 featured collections are allowed." };
    }

    if (
      cleanCollections.some(
        (item) =>
          item.title.length > 80 ||
          item.description.length > 220 ||
          item.href.length > 500 ||
          item.image.length > 500
      )
    ) {
      return {
        ok: false,
        message: "One or more featured collection fields are too long.",
      };
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

    return {
      ok: true,
      payload,
    };
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

    setHeroEyebrow(base.heroEyebrow);
    setHeroTitle(base.heroTitle);
    setHeroSubtitle(base.heroSubtitle);
    setHeroImage(base.heroImage);

    setPromoTitle(base.promoTitle);
    setPromoText(base.promoText);
    setDefaultSort(base.defaultSort);

    setEmptyStateTitle(base.emptyStateTitle);
    setEmptyStateSubtitle(base.emptyStateSubtitle);

    setPriceMax(base.priceMax);
    setBrandsText(base.brandsText);

    setCategories(sanitizeCategories(base.categories));
    setTrustBadges(sanitizeTrustBadges(base.trustBadges));
    setFeaturedCollections(sanitizeFeaturedCollections(base.featuredCollections));

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

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="h-72 rounded-3xl bg-gray-100" />
            <div className="h-72 rounded-3xl bg-gray-100" />
          </div>

          <div className="mt-6 h-56 rounded-3xl bg-gray-100" />
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
              Manage hero content, promo copy, discovery controls, quick filters and
              curated collection blocks for the shop page.
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
        <SummaryCard
          label="Hero title"
          value={heroTitle.trim() || "—"}
          hint="Main shop heading"
        />
        <SummaryCard
          label="Allowed brands"
          value={brandsSafe.length || 0}
          hint="Unique brand entries"
        />
        <SummaryCard
          label="Category pills"
          value={normalizedPreviewCategories.length || 0}
          hint="Quick filters shown on top"
        />
        <SummaryCard
          label="Trust badges"
          value={normalizedPreviewTrustBadges.length || 0}
          hint="Discovery support chips"
        />
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
              placeholder="Premium catalog"
              maxLength={40}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Hero title</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              placeholder="Shop all products"
              maxLength={90}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Hero subtitle</div>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroSubtitle}
              onChange={(e) => setHeroSubtitle(e.target.value)}
              placeholder="Short description..."
              maxLength={320}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Hero image URL</div>
            <input
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              placeholder="https://example.com/shop-hero.jpg"
              maxLength={500}
            />
            <div className="mt-2 text-xs text-gray-500">
              Optional. Use a relative path or a full http/https URL.
            </div>
          </label>
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
              placeholder="Curated storefront experience"
              maxLength={80}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Promo text</div>
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="Short supporting copy..."
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
              placeholder="No products found"
              maxLength={80}
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Empty state subtitle</div>
            <textarea
              className="mt-2 min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={emptyStateSubtitle}
              onChange={(e) => setEmptyStateSubtitle(e.target.value)}
              placeholder="Help the user recover from an empty result."
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
            <div className="text-sm font-medium text-gray-800">
              Price slider cap (max)
            </div>
            <input
              type="number"
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value || 0))}
              min={1}
              max={1000000}
            />
            <div className="mt-2 text-xs text-gray-500">
              Used as the maximum range of the client-side price slider.
            </div>
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">
              Brand allowlist (optional)
            </div>
            <textarea
              className="mt-2 min-h-[160px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={brandsText}
              onChange={(e) => setBrandsText(e.target.value)}
              placeholder={"Nike\nApple\nChanel"}
            />
            <div className="mt-2 text-xs text-gray-500">
              Leave empty to allow all brands. Use one brand per line or comma-separated values.
            </div>

            {brandsSafe.length > 0 ? (
              <div className="mt-3 text-xs text-gray-600">
                <span className="font-semibold">{brandsSafe.length}</span> unique brand(s)
                detected.
              </div>
            ) : null}
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
            {trustBadgesSafe.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
                No trust badges yet. Add a badge to get started.
              </div>
            ) : null}

            {trustBadgesSafe.map((badge, index) => (
              <div
                key={badge.id || index}
                className="grid grid-cols-1 gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-4 md:grid-cols-12 md:items-center"
              >
                <div className="md:col-span-10">
                  <label className="block text-sm font-medium text-gray-800">
                    Badge label
                  </label>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    placeholder="Secure checkout"
                    value={badge.label}
                    onChange={(e) =>
                      updateTrustBadge(index, { label: e.target.value })
                    }
                    maxLength={40}
                  />
                </div>

                <div className="flex md:col-span-2 md:justify-end">
                  <button
                    type="button"
                    onClick={() => removeTrustBadge(index)}
                    className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    title="Remove"
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
        description="Optional editorial-style cards shown to guide customers into curated shop paths."
        icon={Layers3}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Add up to 6 collection cards with title, description, link and optional image.
          </div>

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
          {featuredCollectionsSafe.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
              No featured collections yet. Add a collection card to get started.
            </div>
          ) : null}

          {featuredCollectionsSafe.map((item, index) => (
            <div
              key={item.id || index}
              className="rounded-[24px] border border-gray-200 bg-gray-50 p-4"
            >
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Title</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    placeholder="Latest arrivals"
                    value={item.title}
                    onChange={(e) =>
                      updateFeaturedCollection(index, { title: e.target.value })
                    }
                    maxLength={80}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Href</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    placeholder="/shop?sort=latest"
                    value={item.href}
                    onChange={(e) =>
                      updateFeaturedCollection(index, { href: e.target.value })
                    }
                    maxLength={500}
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <div className="text-sm font-medium text-gray-800">Description</div>
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  placeholder="Explore newly updated products from the live catalog."
                  value={item.description}
                  onChange={(e) =>
                    updateFeaturedCollection(index, {
                      description: e.target.value,
                    })
                  }
                  maxLength={220}
                />
              </label>

              <label className="mt-4 block">
                <div className="text-sm font-medium text-gray-800">Image URL</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  placeholder="https://example.com/collection.jpg"
                  value={item.image}
                  onChange={(e) =>
                    updateFeaturedCollection(index, { image: e.target.value })
                  }
                  maxLength={500}
                />
              </label>

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
        title="Category pills"
        description="Configure the quick category pills shown at the top of the shop page."
        icon={ShoppingBag}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            Duplicate names are automatically merged on save. Maximum 40 categories.
          </div>

          <button
            type="button"
            onClick={addCategory}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            disabled={categoriesSafe.length >= 40}
          >
            <Plus size={18} />
            Add category
          </button>
        </div>

        <div className="mt-5 space-y-3">
          {categoriesSafe.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-sm text-gray-500">
              No categories yet. Add a category to get started.
            </div>
          ) : null}

          {categoriesSafe.map((category, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-3 rounded-[24px] border border-gray-200 bg-gray-50 p-4 md:grid-cols-12 md:items-center"
            >
              <div className="md:col-span-6">
                <label className="block text-sm font-medium text-gray-800">
                  Category name
                </label>
                <input
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  placeholder="Category name (e.g. Men)"
                  value={category.name}
                  onChange={(e) => updateCategory(index, { name: e.target.value })}
                  maxLength={40}
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-800">Icon</label>
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
              </div>

              <div className="flex md:col-span-2 md:justify-end">
                <button
                  type="button"
                  onClick={() => removeCategory(index)}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  title="Remove"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {categoriesSafe.length >= 40 ? (
            <div className="text-xs text-gray-500">
              Maximum limit reached: 40 categories.
            </div>
          ) : null}
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