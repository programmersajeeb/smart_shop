import React, { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Save,
  Trash2,
  RotateCcw,
  Loader2,
  Layers3,
  LayoutTemplate,
  Upload,
  ShieldCheck,
  Truck,
  RefreshCcw,
  CheckCircle2,
  Search,
  ListFilter,
  PanelTop,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";

const COLLECTION_ICON_KEYS = ["ShoppingBag", "Shirt", "Watch", "Gem", "Baby", "Gift"];
const HIGHLIGHT_ICON_KEYS = ["ShieldCheck", "Truck", "RefreshCcw", "CheckCircle2"];

const HIGHLIGHT_ICON_MAP = {
  ShieldCheck,
  Truck,
  RefreshCcw,
  CheckCircle2,
};

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

function normalizeStatItem(raw, index = 0) {
  return {
    id: String(raw?.id || `stat-${index + 1}`).trim() || `stat-${index + 1}`,
    label: String(raw?.label || "").trim(),
    value: String(raw?.value || "").trim(),
    hint: String(raw?.hint || "").trim(),
  };
}

function sanitizeStatItems(list, maxItems = 6) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, maxItems).map((item, index) => normalizeStatItem(item, index));
}

function normalizeHighlightItem(raw, index = 0) {
  const iconKey = HIGHLIGHT_ICON_KEYS.includes(String(raw?.iconKey || ""))
    ? String(raw.iconKey)
    : "ShieldCheck";

  return {
    id: String(raw?.id || `highlight-${index + 1}`).trim() || `highlight-${index + 1}`,
    title: String(raw?.title || "").trim(),
    description: String(raw?.description || "").trim(),
    iconKey,
  };
}

function sanitizeHighlightItems(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 4).map((item, index) => normalizeHighlightItem(item, index));
}

function normalizeCollectionCard(raw, index = 0) {
  const title = String(raw?.title || "").trim();
  const slug = String(raw?.slug || "").trim() || slugify(title);

  const highlights = Array.isArray(raw?.highlights)
    ? raw.highlights
        .map((entry) => String(entry || "").trim())
        .filter(Boolean)
        .slice(0, 6)
    : [];

  return {
    id:
      String(raw?.id || slug || `collection-${index + 1}`).trim() ||
      `collection-${index + 1}`,
    title,
    slug,
    tag: String(raw?.tag || "").trim(),
    badge: String(raw?.badge || "").trim(),
    description: String(raw?.description || "").trim(),
    image: String(raw?.image || "").trim(),
    href: String(raw?.href || "").trim(),
    iconKey: COLLECTION_ICON_KEYS.includes(String(raw?.iconKey || ""))
      ? String(raw.iconKey)
      : "ShoppingBag",
    count: clampNumber(raw?.count, 0, 999999),
    isActive: raw?.isActive !== false,
    featured:
      raw?.featured === true ||
      raw?.featured === "true" ||
      raw?.featured === 1 ||
      raw?.featured === "1",
    sortOrder: Number.isFinite(Number(raw?.sortOrder)) ? Number(raw.sortOrder) : index + 1,
    highlights,
  };
}

function sanitizeCollectionCards(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 24).map((item, index) => normalizeCollectionCard(item, index));
}

function dedupeCollectionCards(list) {
  const seenIds = new Set();
  const out = [];

  for (const item of sanitizeCollectionCards(list)) {
    const key = String(item.id || "").toLowerCase();
    if (!item.title || seenIds.has(key)) continue;
    seenIds.add(key);
    out.push(item);
  }

  return out
    .slice(0, 24)
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));
}

function normalizeWhyItem(raw, index = 0) {
  return {
    id: String(raw?.id || `why-${index + 1}`).trim() || `why-${index + 1}`,
    text: String(raw?.text || "").trim(),
  };
}

function sanitizeWhyItems(list) {
  const rawList = Array.isArray(list) ? list : [];
  return rawList.slice(0, 6).map((item, index) => normalizeWhyItem(item, index));
}

function shallowSnapshot(state) {
  return JSON.stringify({
    hero: {
      eyebrow: String(state.heroEyebrow || ""),
      title: String(state.heroTitle || ""),
      description: String(state.heroDescription || ""),
      primaryCtaLabel: String(state.heroPrimaryCtaLabel || ""),
      primaryCtaHref: String(state.heroPrimaryCtaHref || ""),
      secondaryCtaLabel: String(state.heroSecondaryCtaLabel || ""),
      secondaryCtaHref: String(state.heroSecondaryCtaHref || ""),
      featuredImage: String(state.heroFeaturedImage || ""),
      featuredTag: String(state.heroFeaturedTag || ""),
      featuredBadge: String(state.heroFeaturedBadge || ""),
      statItems: sanitizeStatItems(state.heroStatItems, 3),
    },
    trustHighlights: sanitizeHighlightItems(state.trustHighlights),
    filterPanel: {
      eyebrow: String(state.filterEyebrow || ""),
      title: String(state.filterTitle || ""),
      searchPlaceholder: String(state.filterSearchPlaceholder || ""),
      emptyTitle: String(state.filterEmptyTitle || ""),
      emptyDescription: String(state.filterEmptyDescription || ""),
      resetLabel: String(state.filterResetLabel || ""),
      resultLabel: String(state.filterResultLabel || ""),
    },
    intro: {
      eyebrow: String(state.introEyebrow || ""),
      title: String(state.introTitle || ""),
      description: String(state.introDescription || ""),
    },
    collectionCards: sanitizeCollectionCards(state.collectionCards),
    whySection: {
      eyebrow: String(state.whyEyebrow || ""),
      title: String(state.whyTitle || ""),
      items: sanitizeWhyItems(state.whyItems),
    },
    finalCta: {
      eyebrow: String(state.finalEyebrow || ""),
      title: String(state.finalTitle || ""),
      description: String(state.finalDescription || ""),
      primaryLabel: String(state.finalPrimaryLabel || ""),
      primaryHref: String(state.finalPrimaryHref || ""),
      secondaryLabel: String(state.finalSecondaryLabel || ""),
      secondaryHref: String(state.finalSecondaryHref || ""),
      statItems: sanitizeStatItems(state.finalStatItems, 3),
    },
  });
}

function buildFormState(doc) {
  const config = doc?.data || {};

  return {
    version: Number(doc?.version || 0),

    heroEyebrow: String(config?.hero?.eyebrow || ""),
    heroTitle: String(config?.hero?.title || ""),
    heroDescription: String(config?.hero?.description || ""),
    heroPrimaryCtaLabel: String(config?.hero?.primaryCtaLabel || ""),
    heroPrimaryCtaHref: String(config?.hero?.primaryCtaHref || ""),
    heroSecondaryCtaLabel: String(config?.hero?.secondaryCtaLabel || ""),
    heroSecondaryCtaHref: String(config?.hero?.secondaryCtaHref || ""),
    heroFeaturedImage: String(config?.hero?.featuredImage || ""),
    heroFeaturedTag: String(config?.hero?.featuredTag || ""),
    heroFeaturedBadge: String(config?.hero?.featuredBadge || ""),
    heroStatItems: sanitizeStatItems(config?.hero?.statItems, 3),

    trustHighlights: sanitizeHighlightItems(config?.trustHighlights),

    filterEyebrow: String(config?.filterPanel?.eyebrow || ""),
    filterTitle: String(config?.filterPanel?.title || ""),
    filterSearchPlaceholder: String(config?.filterPanel?.searchPlaceholder || ""),
    filterEmptyTitle: String(config?.filterPanel?.emptyTitle || ""),
    filterEmptyDescription: String(config?.filterPanel?.emptyDescription || ""),
    filterResetLabel: String(config?.filterPanel?.resetLabel || ""),
    filterResultLabel: String(config?.filterPanel?.resultLabel || ""),

    introEyebrow: String(config?.intro?.eyebrow || ""),
    introTitle: String(config?.intro?.title || ""),
    introDescription: String(config?.intro?.description || ""),

    collectionCards: sanitizeCollectionCards(config?.collectionCards),

    whyEyebrow: String(config?.whySection?.eyebrow || ""),
    whyTitle: String(config?.whySection?.title || ""),
    whyItems: sanitizeWhyItems(config?.whySection?.items),

    finalEyebrow: String(config?.finalCta?.eyebrow || ""),
    finalTitle: String(config?.finalCta?.title || ""),
    finalDescription: String(config?.finalCta?.description || ""),
    finalPrimaryLabel: String(config?.finalCta?.primaryLabel || ""),
    finalPrimaryHref: String(config?.finalCta?.primaryHref || ""),
    finalSecondaryLabel: String(config?.finalCta?.secondaryLabel || ""),
    finalSecondaryHref: String(config?.finalCta?.secondaryHref || ""),
    finalStatItems: sanitizeStatItems(config?.finalCta?.statItems, 3),
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
          {description ? <p className="mt-1 text-sm text-gray-600">{description}</p> : null}
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

function StatItemsEditor({ items, setItems, maxItems = 3 }) {
  function addItem() {
    setItems((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: `stat-${Date.now()}`, label: "", value: "", hint: "" },
    ]);
  }

  function updateItem(index, patch) {
    setItems((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[index] = normalizeStatItem({ ...(next[index] || {}), ...patch }, index);
      return next;
    });
  }

  function removeItem(index) {
    setItems((prev) => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">Keep these short and easy to scan.</div>

        <button
          type="button"
          onClick={addItem}
          disabled={(items || []).length >= maxItems}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Add item
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {(items || []).map((item, index) => (
          <div
            key={item.id || index}
            className="rounded-[24px] border border-gray-200 bg-gray-50 p-4"
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <label className="block">
                <div className="text-sm font-medium text-gray-800">Label</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={item.label}
                  onChange={(e) => updateItem(index, { label: e.target.value })}
                  maxLength={40}
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Value</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={item.value}
                  onChange={(e) => updateItem(index, { value: e.target.value })}
                  maxLength={40}
                />
              </label>

              <label className="block">
                <div className="text-sm font-medium text-gray-800">Hint</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={item.hint}
                  onChange={(e) => updateItem(index, { hint: e.target.value })}
                  maxLength={80}
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightItemsEditor({ items, setItems }) {
  function addItem() {
    setItems((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        id: `highlight-${Date.now()}`,
        title: "",
        description: "",
        iconKey: "ShieldCheck",
      },
    ]);
  }

  function updateItem(index, patch) {
    setItems((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[index] = normalizeHighlightItem({ ...(next[index] || {}), ...patch }, index);
      return next;
    });
  }

  function removeItem(index) {
    setItems((prev) => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">These cards sit right under the hero area.</div>

        <button
          type="button"
          onClick={addItem}
          disabled={(items || []).length >= 4}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Add highlight
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {(items || []).map((item, index) => {
          const Icon = HIGHLIGHT_ICON_MAP[item.iconKey] || ShieldCheck;

          return (
            <div
              key={item.id || index}
              className="rounded-[24px] border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700">
                  <Icon size={18} />
                </div>
                <div className="text-sm font-semibold text-gray-900">Highlight card {index + 1}</div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Title</div>
                  <input
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={item.title}
                    onChange={(e) => updateItem(index, { title: e.target.value })}
                    maxLength={60}
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Icon</div>
                  <select
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                    value={item.iconKey}
                    onChange={(e) => updateItem(index, { iconKey: e.target.value })}
                  >
                    {HIGHLIGHT_ICON_KEYS.map((iconKey) => (
                      <option key={iconKey} value={iconKey}>
                        {iconKey}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <div className="text-sm font-medium text-gray-800">Description</div>
                <textarea
                  className="mt-2 min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={item.description}
                  onChange={(e) => updateItem(index, { description: e.target.value })}
                  maxLength={180}
                />
              </label>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function WhyItemsEditor({ items, setItems }) {
  function addItem() {
    setItems((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: `why-${Date.now()}`, text: "" },
    ]);
  }

  function updateItem(index, patch) {
    setItems((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      next[index] = normalizeWhyItem({ ...(next[index] || {}), ...patch }, index);
      return next;
    });
  }

  function removeItem(index) {
    setItems((prev) => (Array.isArray(prev) ? prev : []).filter((_, i) => i !== index));
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-gray-500">Short points work best in this section.</div>

        <button
          type="button"
          onClick={addItem}
          disabled={(items || []).length >= 6}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={18} />
          Add point
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {(items || []).map((item, index) => (
          <div
            key={item.id || index}
            className="rounded-[24px] border border-gray-200 bg-gray-50 p-4"
          >
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Point text</div>
              <textarea
                className="mt-2 min-h-[90px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                value={item.text}
                onChange={(e) => updateItem(index, { text: e.target.value })}
                maxLength={220}
              />
            </label>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminCollectionsControlPage() {
  const queryClient = useQueryClient();
  const hasHydratedRef = useRef(false);
  const initialSnapshotRef = useRef(null);
  const initialStateRef = useRef(null);

  const {
    data: collectionsDoc,
    isPending,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["page-config", "collections"],
    queryFn: async () => (await api.get("/page-config/collections")).data,
    staleTime: 60000,
    retry: 1,
  });

  const [heroEyebrow, setHeroEyebrow] = useState("");
  const [heroTitle, setHeroTitle] = useState("");
  const [heroDescription, setHeroDescription] = useState("");
  const [heroPrimaryCtaLabel, setHeroPrimaryCtaLabel] = useState("");
  const [heroPrimaryCtaHref, setHeroPrimaryCtaHref] = useState("");
  const [heroSecondaryCtaLabel, setHeroSecondaryCtaLabel] = useState("");
  const [heroSecondaryCtaHref, setHeroSecondaryCtaHref] = useState("");
  const [heroFeaturedImage, setHeroFeaturedImage] = useState("");
  const [heroFeaturedTag, setHeroFeaturedTag] = useState("");
  const [heroFeaturedBadge, setHeroFeaturedBadge] = useState("");
  const [heroStatItems, setHeroStatItems] = useState([]);

  const [trustHighlights, setTrustHighlights] = useState([]);

  const [filterEyebrow, setFilterEyebrow] = useState("");
  const [filterTitle, setFilterTitle] = useState("");
  const [filterSearchPlaceholder, setFilterSearchPlaceholder] = useState("");
  const [filterEmptyTitle, setFilterEmptyTitle] = useState("");
  const [filterEmptyDescription, setFilterEmptyDescription] = useState("");
  const [filterResetLabel, setFilterResetLabel] = useState("");
  const [filterResultLabel, setFilterResultLabel] = useState("");

  const [introEyebrow, setIntroEyebrow] = useState("");
  const [introTitle, setIntroTitle] = useState("");
  const [introDescription, setIntroDescription] = useState("");

  const [collectionCards, setCollectionCards] = useState([]);

  const [whyEyebrow, setWhyEyebrow] = useState("");
  const [whyTitle, setWhyTitle] = useState("");
  const [whyItems, setWhyItems] = useState([]);

  const [finalEyebrow, setFinalEyebrow] = useState("");
  const [finalTitle, setFinalTitle] = useState("");
  const [finalDescription, setFinalDescription] = useState("");
  const [finalPrimaryLabel, setFinalPrimaryLabel] = useState("");
  const [finalPrimaryHref, setFinalPrimaryHref] = useState("");
  const [finalSecondaryLabel, setFinalSecondaryLabel] = useState("");
  const [finalSecondaryHref, setFinalSecondaryHref] = useState("");
  const [finalStatItems, setFinalStatItems] = useState([]);

  const collectionCardsSafe = useMemo(
    () => sanitizeCollectionCards(collectionCards),
    [collectionCards]
  );

  const isDirty = useMemo(() => {
    const snapshot = initialSnapshotRef.current;
    if (!snapshot) return false;

    return (
      shallowSnapshot({
        heroEyebrow,
        heroTitle,
        heroDescription,
        heroPrimaryCtaLabel,
        heroPrimaryCtaHref,
        heroSecondaryCtaLabel,
        heroSecondaryCtaHref,
        heroFeaturedImage,
        heroFeaturedTag,
        heroFeaturedBadge,
        heroStatItems,

        trustHighlights,

        filterEyebrow,
        filterTitle,
        filterSearchPlaceholder,
        filterEmptyTitle,
        filterEmptyDescription,
        filterResetLabel,
        filterResultLabel,

        introEyebrow,
        introTitle,
        introDescription,

        collectionCards,

        whyEyebrow,
        whyTitle,
        whyItems,

        finalEyebrow,
        finalTitle,
        finalDescription,
        finalPrimaryLabel,
        finalPrimaryHref,
        finalSecondaryLabel,
        finalSecondaryHref,
        finalStatItems,
      }) !== snapshot
    );
  }, [
    heroEyebrow,
    heroTitle,
    heroDescription,
    heroPrimaryCtaLabel,
    heroPrimaryCtaHref,
    heroSecondaryCtaLabel,
    heroSecondaryCtaHref,
    heroFeaturedImage,
    heroFeaturedTag,
    heroFeaturedBadge,
    heroStatItems,
    trustHighlights,
    filterEyebrow,
    filterTitle,
    filterSearchPlaceholder,
    filterEmptyTitle,
    filterEmptyDescription,
    filterResetLabel,
    filterResultLabel,
    introEyebrow,
    introTitle,
    introDescription,
    collectionCards,
    whyEyebrow,
    whyTitle,
    whyItems,
    finalEyebrow,
    finalTitle,
    finalDescription,
    finalPrimaryLabel,
    finalPrimaryHref,
    finalSecondaryLabel,
    finalSecondaryHref,
    finalStatItems,
  ]);

  function applyFormState(next) {
    setHeroEyebrow(next.heroEyebrow);
    setHeroTitle(next.heroTitle);
    setHeroDescription(next.heroDescription);
    setHeroPrimaryCtaLabel(next.heroPrimaryCtaLabel);
    setHeroPrimaryCtaHref(next.heroPrimaryCtaHref);
    setHeroSecondaryCtaLabel(next.heroSecondaryCtaLabel);
    setHeroSecondaryCtaHref(next.heroSecondaryCtaHref);
    setHeroFeaturedImage(next.heroFeaturedImage);
    setHeroFeaturedTag(next.heroFeaturedTag);
    setHeroFeaturedBadge(next.heroFeaturedBadge);
    setHeroStatItems(sanitizeStatItems(next.heroStatItems, 3));

    setTrustHighlights(sanitizeHighlightItems(next.trustHighlights));

    setFilterEyebrow(next.filterEyebrow);
    setFilterTitle(next.filterTitle);
    setFilterSearchPlaceholder(next.filterSearchPlaceholder);
    setFilterEmptyTitle(next.filterEmptyTitle);
    setFilterEmptyDescription(next.filterEmptyDescription);
    setFilterResetLabel(next.filterResetLabel);
    setFilterResultLabel(next.filterResultLabel);

    setIntroEyebrow(next.introEyebrow);
    setIntroTitle(next.introTitle);
    setIntroDescription(next.introDescription);

    setCollectionCards(sanitizeCollectionCards(next.collectionCards));

    setWhyEyebrow(next.whyEyebrow);
    setWhyTitle(next.whyTitle);
    setWhyItems(sanitizeWhyItems(next.whyItems));

    setFinalEyebrow(next.finalEyebrow);
    setFinalTitle(next.finalTitle);
    setFinalDescription(next.finalDescription);
    setFinalPrimaryLabel(next.finalPrimaryLabel);
    setFinalPrimaryHref(next.finalPrimaryHref);
    setFinalSecondaryLabel(next.finalSecondaryLabel);
    setFinalSecondaryHref(next.finalSecondaryHref);
    setFinalStatItems(sanitizeStatItems(next.finalStatItems, 3));

    initialStateRef.current = {
      ...next,
      heroStatItems: sanitizeStatItems(next.heroStatItems, 3),
      trustHighlights: sanitizeHighlightItems(next.trustHighlights),
      collectionCards: sanitizeCollectionCards(next.collectionCards),
      whyItems: sanitizeWhyItems(next.whyItems),
      finalStatItems: sanitizeStatItems(next.finalStatItems, 3),
    };

    initialSnapshotRef.current = shallowSnapshot(initialStateRef.current);
  }

  useEffect(() => {
    if (!collectionsDoc) return;
    const next = buildFormState(collectionsDoc);

    if (!hasHydratedRef.current) {
      applyFormState(next);
      hasHydratedRef.current = true;
      return;
    }

    if (!isDirty) {
      applyFormState(next);
    }
  }, [collectionsDoc, isDirty]);

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
    mutationFn: async (payload) => (await api.put("/page-config/collections", payload)).data,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["page-config", "collections"] });
      applyFormState(buildFormState(response));
      toast.success("Saved successfully", {
        description: "Collections page settings have been updated.",
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

  function addCollectionCard() {
    setCollectionCards((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      {
        id: `collection-${Date.now()}`,
        title: "",
        slug: "",
        tag: "Collection",
        badge: "",
        description: "",
        image: "",
        href: "/shop",
        iconKey: "ShoppingBag",
        count: 0,
        isActive: true,
        featured: false,
        sortOrder: (prev?.length || 0) + 1,
        highlights: ["Live catalog", "Updated", "Category"],
      },
    ]);
  }

  function updateCollectionCard(index, patch) {
    setCollectionCards((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const merged = normalizeCollectionCard({ ...(next[index] || {}), ...patch }, index);

      if (patch.title != null && !patch.slug) {
        merged.slug = slugify(merged.title);
      }

      next[index] = merged;
      return next;
    });
  }

  function removeCollectionCard(index) {
    setCollectionCards((prev) =>
      (Array.isArray(prev) ? prev : [])
        .filter((_, i) => i !== index)
        .map((item, idx) => normalizeCollectionCard({ ...item, sortOrder: idx + 1 }, idx))
    );
  }

  function moveCollectionCard(index, direction) {
    setCollectionCards((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const target = index + direction;

      if (target < 0 || target >= next.length) return prev;

      const temp = next[index];
      next[index] = next[target];
      next[target] = temp;

      return next.map((item, idx) =>
        normalizeCollectionCard({ ...item, sortOrder: idx + 1 }, idx)
      );
    });
  }

  function updateCollectionHighlight(index, highlightIndex, value) {
    setCollectionCards((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const card = normalizeCollectionCard(next[index] || {}, index);
      const highlights = Array.isArray(card.highlights) ? [...card.highlights] : [];

      highlights[highlightIndex] = String(value || "").trim();

      next[index] = normalizeCollectionCard(
        {
          ...card,
          highlights: highlights.filter((entry) => String(entry || "").trim()),
        },
        index
      );

      return next;
    });
  }

  function addCollectionHighlight(index) {
    setCollectionCards((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const card = normalizeCollectionCard(next[index] || {}, index);
      const highlights = Array.isArray(card.highlights) ? [...card.highlights] : [];

      if (highlights.length >= 6) return prev;

      highlights.push("");

      next[index] = normalizeCollectionCard({ ...card, highlights }, index);
      return next;
    });
  }

  function removeCollectionHighlight(index, highlightIndex) {
    setCollectionCards((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      const card = normalizeCollectionCard(next[index] || {}, index);
      const highlights = Array.isArray(card.highlights) ? [...card.highlights] : [];

      next[index] = normalizeCollectionCard(
        {
          ...card,
          highlights: highlights.filter((_, i) => i !== highlightIndex),
        },
        index
      );

      return next;
    });
  }

  function validateAndBuildPayload() {
    const cards = dedupeCollectionCards(
      collectionCardsSafe.map((item, index) => ({
        ...item,
        sortOrder: index + 1,
        slug: item.slug || slugify(item.title),
        href: item.href || `/shop?category=${encodeURIComponent(item.title || "")}`,
      }))
    );

    if (!String(heroTitle || "").trim()) {
      return { ok: false, message: "Hero title is required." };
    }

    if (!String(introTitle || "").trim()) {
      return { ok: false, message: "Intro title is required." };
    }

    if (!String(finalTitle || "").trim()) {
      return { ok: false, message: "Final CTA title is required." };
    }

    if (cards.some((item) => !item.slug)) {
      return { ok: false, message: "Each collection card needs a valid slug." };
    }

    const payload = {
      hero: {
        eyebrow: String(heroEyebrow || "").trim(),
        title: String(heroTitle || "").trim(),
        description: String(heroDescription || "").trim(),
        primaryCtaLabel: String(heroPrimaryCtaLabel || "").trim(),
        primaryCtaHref: String(heroPrimaryCtaHref || "").trim(),
        secondaryCtaLabel: String(heroSecondaryCtaLabel || "").trim(),
        secondaryCtaHref: String(heroSecondaryCtaHref || "").trim(),
        featuredImage: String(heroFeaturedImage || "").trim(),
        featuredTag: String(heroFeaturedTag || "").trim(),
        featuredBadge: String(heroFeaturedBadge || "").trim(),
        statItems: sanitizeStatItems(heroStatItems, 3),
      },

      trustHighlights: sanitizeHighlightItems(trustHighlights),

      filterPanel: {
        eyebrow: String(filterEyebrow || "").trim(),
        title: String(filterTitle || "").trim(),
        searchPlaceholder: String(filterSearchPlaceholder || "").trim(),
        emptyTitle: String(filterEmptyTitle || "").trim(),
        emptyDescription: String(filterEmptyDescription || "").trim(),
        resetLabel: String(filterResetLabel || "").trim(),
        resultLabel: String(filterResultLabel || "").trim(),
      },

      intro: {
        eyebrow: String(introEyebrow || "").trim(),
        title: String(introTitle || "").trim(),
        description: String(introDescription || "").trim(),
      },

      collectionCards: cards,

      whySection: {
        eyebrow: String(whyEyebrow || "").trim(),
        title: String(whyTitle || "").trim(),
        items: sanitizeWhyItems(whyItems),
      },

      finalCta: {
        eyebrow: String(finalEyebrow || "").trim(),
        title: String(finalTitle || "").trim(),
        description: String(finalDescription || "").trim(),
        primaryLabel: String(finalPrimaryLabel || "").trim(),
        primaryHref: String(finalPrimaryHref || "").trim(),
        secondaryLabel: String(finalSecondaryLabel || "").trim(),
        secondaryHref: String(finalSecondaryHref || "").trim(),
        statItems: sanitizeStatItems(finalStatItems, 3),
      },
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
      toast.error("Validation failed", {
        description: result.message,
      });
      return;
    }

    mutation.mutate(result.payload);
  }

  function handleReset() {
    const base = initialStateRef.current;
    if (!base) return;
    applyFormState(base);

    toast.message("Changes reverted", {
      description: "Restored the last saved version.",
    });
  }

  if (isPending) {
    return (
      <div className="rounded-[30px] border border-gray-200 bg-gradient-to-b from-white to-gray-50/50 p-4 shadow-sm sm:p-5 lg:p-6">
        <div className="animate-pulse">
          <div className="h-7 w-64 rounded-xl bg-gray-100" />
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
          <div className="font-semibold">Couldn’t load collections settings</div>
          <div className="mt-1 opacity-90">
            {error?.response?.data?.message ||
              error?.message ||
              "Failed to load collections settings."}
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

  const activeCards = collectionCardsSafe.filter((item) => item.isActive);
  const featuredCards = collectionCardsSafe.filter((item) => item.featured);
  const saveDisabled = mutation.isPending || !isDirty;

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <Layers3 size={14} />
              Collections Control
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950">
              Collections Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Manage the collections page from top to bottom, including hero copy,
              highlight cards, collection blocks and the final call to action.
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
              disabled={!isDirty || mutation.isPending}
              className={[
                "inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                !isDirty ? "cursor-not-allowed opacity-50" : "hover:bg-gray-50",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              ].join(" ")}
            >
              <RotateCcw size={18} />
              Reset
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveDisabled}
              className={[
                "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
                saveDisabled
                  ? "cursor-not-allowed bg-gray-200 text-gray-600"
                  : "bg-black text-white hover:bg-gray-900",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
              ].join(" ")}
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

        {isFetching ? <div className="mt-3 text-xs text-gray-500">Updating data...</div> : null}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryCard
          label="Active cards"
          value={activeCards.length || 0}
          hint="Visible on the page"
        />
        <SummaryCard
          label="Featured cards"
          value={featuredCards.length || 0}
          hint="Marked as featured"
        />
        <SummaryCard
          label="Highlight cards"
          value={trustHighlights.length || 0}
          hint="Under the hero section"
        />
        <SummaryCard
          label="Bottom stats"
          value={finalStatItems.length || 0}
          hint="Final CTA support items"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Hero"
          description="Control the top section, the main copy and the featured visual area."
          icon={LayoutTemplate}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Eyebrow</div>
            <input
              value={heroEyebrow}
              onChange={(e) => setHeroEyebrow(e.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Title</div>
            <input
              value={heroTitle}
              onChange={(e) => setHeroTitle(e.target.value)}
              maxLength={140}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Description</div>
            <textarea
              value={heroDescription}
              onChange={(e) => setHeroDescription(e.target.value)}
              maxLength={320}
              className="mt-2 min-h-[120px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Primary button label</div>
              <input
                value={heroPrimaryCtaLabel}
                onChange={(e) => setHeroPrimaryCtaLabel(e.target.value)}
                maxLength={50}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-800">Primary button link</div>
              <input
                value={heroPrimaryCtaHref}
                onChange={(e) => setHeroPrimaryCtaHref(e.target.value)}
                maxLength={500}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Secondary button label</div>
              <input
                value={heroSecondaryCtaLabel}
                onChange={(e) => setHeroSecondaryCtaLabel(e.target.value)}
                maxLength={50}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-800">Secondary button link</div>
              <input
                value={heroSecondaryCtaHref}
                onChange={(e) => setHeroSecondaryCtaHref(e.target.value)}
                maxLength={500}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Featured tag</div>
              <input
                value={heroFeaturedTag}
                onChange={(e) => setHeroFeaturedTag(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-800">Featured badge</div>
              <input
                value={heroFeaturedBadge}
                onChange={(e) => setHeroFeaturedBadge(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>
          </div>

          <div className="mt-4">
            <UploadField
              label="Featured image"
              value={heroFeaturedImage}
              onChange={setHeroFeaturedImage}
              hint="Shown on the right side of the hero block."
            />
          </div>

          <div className="mt-5">
            <div className="mb-3 text-sm font-medium text-gray-800">Hero stats</div>
            <StatItemsEditor
              items={heroStatItems}
              setItems={setHeroStatItems}
              maxItems={3}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Filter section"
          description="Edit the search/filter block copy and the empty-state text."
          icon={Search}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Eyebrow</div>
            <input
              value={filterEyebrow}
              onChange={(e) => setFilterEyebrow(e.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Helper text</div>
            <textarea
              value={filterTitle}
              onChange={(e) => setFilterTitle(e.target.value)}
              maxLength={140}
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Search placeholder</div>
            <input
              value={filterSearchPlaceholder}
              onChange={(e) => setFilterSearchPlaceholder(e.target.value)}
              maxLength={80}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Reset button label</div>
              <input
                value={filterResetLabel}
                onChange={(e) => setFilterResetLabel(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-800">Result label</div>
              <input
                value={filterResultLabel}
                onChange={(e) => setFilterResultLabel(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>
          </div>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Empty-state title</div>
            <input
              value={filterEmptyTitle}
              onChange={(e) => setFilterEmptyTitle(e.target.value)}
              maxLength={80}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Empty-state description</div>
            <textarea
              value={filterEmptyDescription}
              onChange={(e) => setFilterEmptyDescription(e.target.value)}
              maxLength={220}
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>
        </SectionCard>
      </div>

      <SectionCard
        title="Highlight cards"
        description="These short support cards appear under the hero section."
        icon={Sparkles}
      >
        <HighlightItemsEditor
          items={trustHighlights}
          setItems={setTrustHighlights}
        />
      </SectionCard>

      <SectionCard
        title="Intro section"
        description="This heading appears just above the collection card grid."
        icon={PanelTop}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Eyebrow</div>
            <input
              value={introEyebrow}
              onChange={(e) => setIntroEyebrow(e.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="block lg:col-span-2">
            <div className="text-sm font-medium text-gray-800">Title</div>
            <input
              value={introTitle}
              onChange={(e) => setIntroTitle(e.target.value)}
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>
        </div>

        <label className="mt-4 block">
          <div className="text-sm font-medium text-gray-800">Description</div>
          <textarea
            value={introDescription}
            onChange={(e) => setIntroDescription(e.target.value)}
            maxLength={240}
            className="mt-2 min-h-[100px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
          />
        </label>
      </SectionCard>

      <SectionCard
        title="Collection cards"
        description="Add and manage the cards shown in the main collections grid."
        icon={Layers3}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-gray-500">
            You can add up to 24 cards. Order here controls display order.
          </div>

          <button
            type="button"
            onClick={addCollectionCard}
            disabled={collectionCardsSafe.length >= 24}
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} />
            Add card
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {collectionCardsSafe.map((item, index) => (
            <div
              key={item.id || index}
              className="rounded-[24px] border border-gray-200 bg-gray-50 p-4"
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">
                  Collection card {index + 1}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => moveCollectionCard(index, -1)}
                    disabled={index === 0}
                    className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveCollectionCard(index, 1)}
                    disabled={index === collectionCardsSafe.length - 1}
                    className="rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 disabled:opacity-50"
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCollectionCard(index)}
                    className="rounded-2xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Title</div>
                  <input
                    value={item.title}
                    onChange={(e) => updateCollectionCard(index, { title: e.target.value })}
                    maxLength={80}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Slug</div>
                  <input
                    value={item.slug}
                    onChange={(e) =>
                      updateCollectionCard(index, { slug: slugify(e.target.value) })
                    }
                    maxLength={60}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Tag</div>
                  <input
                    value={item.tag}
                    onChange={(e) => updateCollectionCard(index, { tag: e.target.value })}
                    maxLength={40}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Badge</div>
                  <input
                    value={item.badge}
                    onChange={(e) => updateCollectionCard(index, { badge: e.target.value })}
                    maxLength={40}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Icon</div>
                  <select
                    value={item.iconKey}
                    onChange={(e) => updateCollectionCard(index, { iconKey: e.target.value })}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  >
                    {COLLECTION_ICON_KEYS.map((iconKey) => (
                      <option key={iconKey} value={iconKey}>
                        {iconKey}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="mt-4 block">
                <div className="text-sm font-medium text-gray-800">Description</div>
                <textarea
                  value={item.description}
                  onChange={(e) =>
                    updateCollectionCard(index, { description: e.target.value })
                  }
                  maxLength={220}
                  className="mt-2 min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                />
              </label>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Card link</div>
                  <input
                    value={item.href}
                    onChange={(e) => updateCollectionCard(index, { href: e.target.value })}
                    maxLength={500}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>

                <label className="block">
                  <div className="text-sm font-medium text-gray-800">Item count</div>
                  <input
                    type="number"
                    value={item.count}
                    onChange={(e) => updateCollectionCard(index, { count: Number(e.target.value || 0) })}
                    min={0}
                    max={999999}
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                  />
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={item.isActive}
                    onChange={(e) => updateCollectionCard(index, { isActive: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-800">Show on collections page</span>
                </label>

                <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                  <input
                    type="checkbox"
                    checked={item.featured}
                    onChange={(e) => updateCollectionCard(index, { featured: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-800">Mark as featured</span>
                </label>
              </div>

              <div className="mt-4">
                <UploadField
                  label="Card image"
                  value={item.image}
                  onChange={(value) => updateCollectionCard(index, { image: value })}
                  hint="This image appears on the collection card and featured panel."
                />
              </div>

              <div className="mt-5 rounded-[22px] border border-gray-200 bg-white p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-gray-800">Highlights</div>

                  <button
                    type="button"
                    onClick={() => addCollectionHighlight(index)}
                    disabled={(item.highlights || []).length >= 6}
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={14} />
                    Add highlight
                  </button>
                </div>

                <div className="space-y-3">
                  {(item.highlights || []).map((highlight, highlightIndex) => (
                    <div
                      key={`${item.id || index}-highlight-${highlightIndex}`}
                      className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]"
                    >
                      <input
                        value={highlight}
                        onChange={(e) =>
                          updateCollectionHighlight(index, highlightIndex, e.target.value)
                        }
                        maxLength={40}
                        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                      />

                      <button
                        type="button"
                        onClick={() => removeCollectionHighlight(index, highlightIndex)}
                        className="inline-flex items-center justify-center rounded-2xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <SectionCard
          title="Why section"
          description="Short points that explain why browsing collections feels easier."
          icon={ListFilter}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Eyebrow</div>
            <input
              value={whyEyebrow}
              onChange={(e) => setWhyEyebrow(e.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Title</div>
            <input
              value={whyTitle}
              onChange={(e) => setWhyTitle(e.target.value)}
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <div className="mt-5">
            <WhyItemsEditor items={whyItems} setItems={setWhyItems} />
          </div>
        </SectionCard>

        <SectionCard
          title="Final CTA"
          description="Edit the closing section with action buttons and supporting stats."
          icon={ArrowRight}
        >
          <label className="block">
            <div className="text-sm font-medium text-gray-800">Eyebrow</div>
            <input
              value={finalEyebrow}
              onChange={(e) => setFinalEyebrow(e.target.value)}
              maxLength={40}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Title</div>
            <input
              value={finalTitle}
              onChange={(e) => setFinalTitle(e.target.value)}
              maxLength={120}
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <label className="mt-4 block">
            <div className="text-sm font-medium text-gray-800">Description</div>
            <textarea
              value={finalDescription}
              onChange={(e) => setFinalDescription(e.target.value)}
              maxLength={260}
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
            />
          </label>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Primary button label</div>
              <input
                value={finalPrimaryLabel}
                onChange={(e) => setFinalPrimaryLabel(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-800">Primary button link</div>
              <input
                value={finalPrimaryHref}
                onChange={(e) => setFinalPrimaryHref(e.target.value)}
                maxLength={500}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <label className="block">
              <div className="text-sm font-medium text-gray-800">Secondary button label</div>
              <input
                value={finalSecondaryLabel}
                onChange={(e) => setFinalSecondaryLabel(e.target.value)}
                maxLength={40}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>

            <label className="block">
              <div className="text-sm font-medium text-gray-800">Secondary button link</div>
              <input
                value={finalSecondaryHref}
                onChange={(e) => setFinalSecondaryHref(e.target.value)}
                maxLength={500}
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none shadow-sm transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              />
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-3 text-sm font-medium text-gray-800">Bottom stats</div>
            <StatItemsEditor
              items={finalStatItems}
              setItems={setFinalStatItems}
              maxItems={3}
            />
          </div>
        </SectionCard>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saveDisabled}
          className={[
            "inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition",
            saveDisabled
              ? "cursor-not-allowed bg-gray-200 text-gray-600"
              : "bg-black text-white hover:bg-gray-900",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          ].join(" ")}
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