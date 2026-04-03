import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Home,
  Image as ImageIcon,
  Sparkles,
  Layers3,
  Tag,
  Star,
  MessageSquareQuote,
  Newspaper,
  Save,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ExternalLink,
  ShieldAlert,
  ListChecks,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../services/apiClient";
import { useAuth } from "../../shared/hooks/useAuth";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage ? String(serverMessage) : "Something went wrong.";
}

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function isSafeUrl(url) {
  const value = String(url || "").trim();
  if (!value) return false;
  if (value.startsWith("/")) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizeUrl(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  const cleaned = value.replace(/\s+/g, "").replace(/\/$/, "");
  return isSafeUrl(cleaned) ? cleaned : "";
}

function sanitizeText(value, max = 200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function clampInt(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  return Math.min(max, Math.max(min, rounded));
}

function stableStringify(obj) {
  const seen = new WeakSet();

  const sorter = (value) => {
    if (value && typeof value === "object") {
      if (seen.has(value)) return null;
      seen.add(value);

      if (Array.isArray(value)) return value.map(sorter);

      const out = {};
      Object.keys(value)
        .sort((a, b) => a.localeCompare(b))
        .forEach((key) => {
          out[key] = sorter(value[key]);
        });

      return out;
    }

    return value;
  };

  try {
    return JSON.stringify(sorter(obj));
  } catch {
    return "";
  }
}

function setDeep(prev, path, value) {
  const next = { ...(prev || {}) };
  let current = next;

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const base =
      current[key] && typeof current[key] === "object" ? current[key] : {};
    current[key] = { ...base };
    current = current[key];
  }

  current[path[path.length - 1]] = value;
  return next;
}

function normalizeStats(stats) {
  const input = Array.isArray(stats) ? stats : [];
  const normalized = input
    .map((item) => ({
      label: sanitizeText(item?.label, 40),
      value: sanitizeText(item?.value, 40),
    }))
    .filter((item) => item.label || item.value)
    .slice(0, 6);

  return normalized.length
    ? normalized
    : [
        { label: "Active products", value: "" },
        { label: "Collections", value: "" },
        { label: "Brands", value: "" },
      ];
}

function normalizeFeatureItems(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      id: sanitizeText(item?.id, 60) || `feature-${index + 1}`,
      title: sanitizeText(item?.title, 80) || "Feature",
      description: sanitizeText(item?.description, 220),
    }))
    .slice(0, 6);

  return normalized.length
    ? normalized
    : [
        {
          id: "quality",
          title: "Premium quality",
          description:
            "Thoughtfully selected products with dependable quality and presentation.",
        },
        {
          id: "fast",
          title: "Fast fulfillment",
          description:
            "Operationally ready catalog with inventory-aware shopping experience.",
        },
        {
          id: "secure",
          title: "Secure checkout",
          description:
            "Built for smooth customer journeys across discovery, cart, and purchase.",
        },
      ];
}

function normalizeTestimonials(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      id: sanitizeText(item?.id, 60) || `testimonial-${index + 1}`,
      name: sanitizeText(item?.name, 60) || "Customer",
      quote: sanitizeText(item?.quote, 220),
      rating: clampInt(item?.rating, 1, 5, 5),
    }))
    .slice(0, 10);

  return normalized.length
    ? normalized
    : [
        {
          id: "t1",
          name: "Ava Rahman",
          quote:
            "The storefront feels premium and the product selection is genuinely useful.",
          rating: 5,
        },
        {
          id: "t2",
          name: "Nabil Hasan",
          quote:
            "Clean shopping flow, quality products, and a much more polished browsing experience.",
          rating: 5,
        },
        {
          id: "t3",
          name: "Sarah Ahmed",
          quote:
            "I found what I needed quickly, and the catalog felt modern and trustworthy.",
          rating: 5,
        },
      ];
}

function normalizePriceItems(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      id: sanitizeText(item?.id, 60) || `price-${index + 1}`,
      label: sanitizeText(item?.label, 80) || `Price range ${index + 1}`,
      href: normalizeUrl(item?.href),
      img: normalizeUrl(item?.img || item?.image || ""),
      eyebrow: sanitizeText(item?.eyebrow, 40),
      description: sanitizeText(item?.description, 180),
    }))
    .slice(0, 3);

  return normalized.length
    ? normalized
    : [
        {
          id: "under-budget",
          label: "Under Budget",
          href: "/shop?priceMax=50",
          img: "",
          eyebrow: "Accessible picks",
          description: "Curated essentials for smart everyday shopping.",
        },
        {
          id: "mid-range",
          label: "Mid Range",
          href: "/shop?priceMax=100",
          img: "",
          eyebrow: "Balanced value",
          description: "Well-crafted options that balance quality and price.",
        },
        {
          id: "premium-picks",
          label: "Premium Picks",
          href: "/shop?priceMin=100",
          img: "",
          eyebrow: "Elevated selection",
          description: "Statement pieces for a more refined wardrobe.",
        },
      ];
}

function normalizeStyleItems(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      id: sanitizeText(item?.id, 60) || `style-${index + 1}`,
      label: sanitizeText(item?.label, 80) || `Style ${index + 1}`,
      href: normalizeUrl(item?.href || "/shop"),
      img: normalizeUrl(item?.img || item?.image || ""),
      type: sanitizeText(item?.type, 30).toLowerCase() || "style",
      eyebrow: sanitizeText(item?.eyebrow, 40),
      description: sanitizeText(item?.description, 200),
    }))
    .slice(0, 3);

  return normalized.length
    ? normalized
    : [
        {
          id: "women",
          label: "Women",
          href: "/shop?category=Women",
          img: "",
          type: "category",
          eyebrow: "Everyday edit",
          description:
            "Style and sophistication for every occasion with elevated wardrobe essentials.",
        },
        {
          id: "accessories",
          label: "Accessories",
          href: "/shop?category=Accessories",
          img: "",
          type: "category",
          eyebrow: "Tailored focus",
          description:
            "Premium finishing pieces that bring polish, depth, and signature detail.",
        },
        {
          id: "jewelry",
          label: "Jewelry",
          href: "/shop?category=Jewelry",
          img: "",
          type: "category",
          eyebrow: "Refined accents",
          description:
            "Refined accents crafted to add confidence, elegance, and distinction.",
        },
      ];
}

function normalizeFeedItems(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      id: sanitizeText(item?.id, 60) || `feed-${index + 1}`,
      title: sanitizeText(item?.title, 90) || "Shop the look",
      href: normalizeUrl(item?.href || "/shop"),
      image: normalizeUrl(item?.image || item?.img || ""),
      eyebrow: sanitizeText(item?.eyebrow, 40),
      description: sanitizeText(item?.description, 180),
    }))
    .slice(0, 5);

  return normalized.length
    ? normalized
    : [
        {
          id: "feed-1",
          title: "Shop the look",
          href: "/shop",
          image: "",
          eyebrow: "Inspired edit",
          description:
            "Discover a curated visual story built around standout catalog moments and elevated styling.",
        },
        {
          id: "feed-2",
          title: "Shop the look",
          href: "/shop",
          image: "",
          eyebrow: "Inspired edit",
          description:
            "A refined inspiration point designed to guide faster product discovery.",
        },
        {
          id: "feed-3",
          title: "Shop the look",
          href: "/shop",
          image: "",
          eyebrow: "Inspired edit",
          description:
            "A refined inspiration point designed to guide faster product discovery.",
        },
        {
          id: "feed-4",
          title: "Shop the look",
          href: "/shop",
          image: "",
          eyebrow: "Inspired edit",
          description:
            "A refined inspiration point designed to guide faster product discovery.",
        },
        {
          id: "feed-5",
          title: "Shop the look",
          href: "/shop",
          image: "",
          eyebrow: "Inspired edit",
          description:
            "A refined inspiration point designed to guide faster product discovery.",
        },
      ];
}

function normalizeHighlights(items, fallback = []) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item) =>
      sanitizeText(typeof item === "string" ? item : item?.label, 40)
    )
    .filter(Boolean)
    .slice(0, 6);

  return normalized.length ? normalized : fallback;
}

function normalizeStoryStats(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item) => ({
      label: sanitizeText(item?.label, 40),
      value: sanitizeText(item?.value, 40),
    }))
    .filter((item) => item.label || item.value)
    .slice(0, 4);

  return normalized.length
    ? normalized
    : [
        { label: "Curated catalog", value: "Live" },
        { label: "Storefront", value: "Premium" },
        { label: "Experience", value: "Responsive" },
      ];
}

function defaultHomeConfig() {
  return {
    hero: {
      eyebrow: "New arrivals",
      title: "Elevate your everyday wardrobe with refined essentials",
      description:
        "Discover premium pieces curated from your live catalog, designed for comfort, confidence, and modern style.",
      image: "",
      primaryCtaLabel: "Shop collection",
      primaryCtaHref: "",
      secondaryCtaLabel: "Explore latest",
      secondaryCtaHref: "/shop?sort=latest",
      featureBadge: "Featured selection",
      featureText:
        "A premium first impression built around strong presentation and cleaner discovery.",
      highlights: ["Fresh arrivals", "Thoughtful edits", "Reliable delivery"],
      stats: [
        { label: "Active products", value: "" },
        { label: "Collections", value: "" },
        { label: "Brands", value: "" },
      ],
    },

    collections: {
      title: "Explore Our Collections",
      subtitle:
        "Curated categories from your live catalog to help customers discover products faster.",
    },

    trending: {
      title: "Trending Now",
      subtitle: "Fresh picks from your most recently updated in-stock catalog.",
      ctaLabel: "View all products",
      ctaHref: "/shop",
      enabled: true,
      hideWhenEmpty: true,
      maxItems: 4,
      minItems: 1,
      excludeDuplicates: true,
      requireInStock: true,
    },

    bestSellers: {
      title: "Best Sellers",
      subtitle: "Top-selling products ranked from completed commerce activity.",
      ctaLabel: "Browse best picks",
      ctaHref: "/shop?sort=latest",
      enabled: true,
      hideWhenEmpty: true,
      maxItems: 8,
      minItems: 1,
      excludeDuplicates: true,
      requireInStock: true,
    },

    flashSale: {
      title: "Flash Sale",
      subtitle: "Live discounted products with real compare-at pricing.",
      ctaLabel: "Shop deals",
      ctaHref: "",
      enabled: true,
      hideWhenEmpty: true,
      maxItems: 4,
      minItems: 1,
      excludeDuplicates: true,
      requireInStock: true,
      requireDiscount: true,
    },

    whyChooseUs: {
      title: "Why Choose Us",
      items: normalizeFeatureItems([]),
    },

    testimonials: {
      title: "What Customers Say",
      items: normalizeTestimonials([]),
    },

    seasonalBanner: {
      eyebrow: "Seasonal edit",
      title: "Refresh your wardrobe with the latest curated arrivals",
      description:
        "Explore timely essentials and standout pieces crafted to keep your catalog feeling current.",
      image: "",
      ctaLabel: "Shop seasonal picks",
      ctaHref: "/shop?sort=latest",
      secondaryCtaLabel: "Explore latest",
      secondaryCtaHref: "/shop?sort=latest",
      featureBadge: "Seasonal spotlight",
      featureText:
        "A campaign-led section that keeps the homepage feeling current and elevated.",
      highlights: ["Limited edit", "Premium textures", "Modern silhouettes"],
    },

    shopByPrice: {
      title: "Shop by Price",
      subtitle:
        "Budget-aware shopping paths that help customers discover the right products faster.",
      items: normalizePriceItems([]),
    },

    shopByStyle: {
      title: "Shop by Style",
      subtitle:
        "Fast discovery paths based on category and brand-led shopping intent.",
      items: normalizeStyleItems([]),
    },

    instagramFeed: {
      title: "Inspired by the Feed",
      subtitle: "Editorial-style product inspiration built from your live catalog.",
      items: normalizeFeedItems([]),
    },

    brandStory: {
      eyebrow: "Our story",
      title: "Built for a cleaner, smarter modern shopping experience",
      description:
        "This storefront blends structured catalog data, strong merchandising foundations, and scalable customer journeys to create a more premium digital retail experience.",
      image: "",
      ctaLabel: "Explore the catalog",
      ctaHref: "/shop",
      secondaryCtaLabel: "View latest arrivals",
      secondaryCtaHref: "/shop?sort=latest",
      featureBadge: "Brand story",
      featureText:
        "A stronger brand section helps the storefront feel more trustworthy, premium, and memorable.",
      highlights: ["Curated catalog", "Cleaner discovery", "Premium storefront"],
      stats: normalizeStoryStats([]),
    },

    newsletter: {
      title: "Join our newsletter",
      description:
        "Get product highlights, new arrivals, and curated seasonal picks delivered to your inbox.",
      placeholder: "Enter your email",
      buttonLabel: "Subscribe",
    },
  };
}

function normalizeHomeConfig(input) {
  const data = deepClone(input || {});
  const base = defaultHomeConfig();

  data.hero = data.hero || {};
  data.collections = data.collections || {};
  data.trending = data.trending || {};
  data.bestSellers = data.bestSellers || {};
  data.flashSale = data.flashSale || {};
  data.whyChooseUs = data.whyChooseUs || {};
  data.testimonials = data.testimonials || {};
  data.seasonalBanner = data.seasonalBanner || {};
  data.shopByPrice = data.shopByPrice || {};
  data.shopByStyle = data.shopByStyle || {};
  data.instagramFeed = data.instagramFeed || {};
  data.brandStory = data.brandStory || {};
  data.newsletter = data.newsletter || {};

  data.hero.eyebrow = sanitizeText(data.hero.eyebrow || base.hero.eyebrow, 40);
  data.hero.title = sanitizeText(data.hero.title || base.hero.title, 140);
  data.hero.description = sanitizeText(
    data.hero.description || base.hero.description,
    320
  );
  data.hero.image = normalizeUrl(data.hero.image);
  data.hero.primaryCtaLabel = sanitizeText(
    data.hero.primaryCtaLabel || base.hero.primaryCtaLabel,
    40
  );
  data.hero.primaryCtaHref = normalizeUrl(data.hero.primaryCtaHref);
  data.hero.secondaryCtaLabel = sanitizeText(
    data.hero.secondaryCtaLabel || base.hero.secondaryCtaLabel,
    40
  );
  data.hero.secondaryCtaHref = normalizeUrl(
    data.hero.secondaryCtaHref || base.hero.secondaryCtaHref
  );
  data.hero.featureBadge = sanitizeText(
    data.hero.featureBadge || base.hero.featureBadge,
    40
  );
  data.hero.featureText = sanitizeText(
    data.hero.featureText || base.hero.featureText,
    180
  );
  data.hero.highlights = normalizeHighlights(
    data.hero.highlights,
    base.hero.highlights
  );
  data.hero.stats = normalizeStats(data.hero.stats);

  data.collections.title = sanitizeText(
    data.collections.title || base.collections.title,
    80
  );
  data.collections.subtitle = sanitizeText(
    data.collections.subtitle || base.collections.subtitle,
    220
  );

  data.trending.title = sanitizeText(data.trending.title || base.trending.title, 80);
  data.trending.subtitle = sanitizeText(
    data.trending.subtitle || base.trending.subtitle,
    220
  );
  data.trending.ctaLabel = sanitizeText(
    data.trending.ctaLabel || base.trending.ctaLabel,
    40
  );
  data.trending.ctaHref = normalizeUrl(
    data.trending.ctaHref || base.trending.ctaHref
  );
  data.trending.enabled = data.trending.enabled !== false;
  data.trending.hideWhenEmpty = data.trending.hideWhenEmpty !== false;
  data.trending.maxItems = clampInt(
    data.trending.maxItems,
    1,
    12,
    base.trending.maxItems
  );
  data.trending.minItems = clampInt(
    data.trending.minItems,
    0,
    12,
    base.trending.minItems
  );
  data.trending.excludeDuplicates = data.trending.excludeDuplicates !== false;
  data.trending.requireInStock = data.trending.requireInStock !== false;

  data.bestSellers.title = sanitizeText(
    data.bestSellers.title || base.bestSellers.title,
    80
  );
  data.bestSellers.subtitle = sanitizeText(
    data.bestSellers.subtitle || base.bestSellers.subtitle,
    220
  );
  data.bestSellers.ctaLabel = sanitizeText(
    data.bestSellers.ctaLabel || base.bestSellers.ctaLabel,
    40
  );
  data.bestSellers.ctaHref = normalizeUrl(
    data.bestSellers.ctaHref || base.bestSellers.ctaHref
  );
  data.bestSellers.enabled = data.bestSellers.enabled !== false;
  data.bestSellers.hideWhenEmpty = data.bestSellers.hideWhenEmpty !== false;
  data.bestSellers.maxItems = clampInt(
    data.bestSellers.maxItems,
    1,
    12,
    base.bestSellers.maxItems
  );
  data.bestSellers.minItems = clampInt(
    data.bestSellers.minItems,
    0,
    12,
    base.bestSellers.minItems
  );
  data.bestSellers.excludeDuplicates =
    data.bestSellers.excludeDuplicates !== false;
  data.bestSellers.requireInStock = data.bestSellers.requireInStock !== false;

  data.flashSale.title = sanitizeText(
    data.flashSale.title || base.flashSale.title,
    80
  );
  data.flashSale.subtitle = sanitizeText(
    data.flashSale.subtitle || base.flashSale.subtitle,
    220
  );
  data.flashSale.ctaLabel = sanitizeText(
    data.flashSale.ctaLabel || base.flashSale.ctaLabel,
    40
  );
  data.flashSale.ctaHref = normalizeUrl(data.flashSale.ctaHref);
  data.flashSale.enabled = data.flashSale.enabled !== false;
  data.flashSale.hideWhenEmpty = data.flashSale.hideWhenEmpty !== false;
  data.flashSale.maxItems = clampInt(
    data.flashSale.maxItems,
    1,
    12,
    base.flashSale.maxItems
  );
  data.flashSale.minItems = clampInt(
    data.flashSale.minItems,
    0,
    12,
    base.flashSale.minItems
  );
  data.flashSale.excludeDuplicates = data.flashSale.excludeDuplicates !== false;
  data.flashSale.requireInStock = data.flashSale.requireInStock !== false;
  data.flashSale.requireDiscount = data.flashSale.requireDiscount !== false;

  data.whyChooseUs.title = sanitizeText(
    data.whyChooseUs.title || base.whyChooseUs.title,
    80
  );
  data.whyChooseUs.items = normalizeFeatureItems(data.whyChooseUs.items);

  data.testimonials.title = sanitizeText(
    data.testimonials.title || base.testimonials.title,
    80
  );
  data.testimonials.items = normalizeTestimonials(data.testimonials.items);

  data.seasonalBanner.eyebrow = sanitizeText(
    data.seasonalBanner.eyebrow || base.seasonalBanner.eyebrow,
    40
  );
  data.seasonalBanner.title = sanitizeText(
    data.seasonalBanner.title || base.seasonalBanner.title,
    120
  );
  data.seasonalBanner.description = sanitizeText(
    data.seasonalBanner.description || base.seasonalBanner.description,
    260
  );
  data.seasonalBanner.image = normalizeUrl(data.seasonalBanner.image);
  data.seasonalBanner.ctaLabel = sanitizeText(
    data.seasonalBanner.ctaLabel || base.seasonalBanner.ctaLabel,
    40
  );
  data.seasonalBanner.ctaHref = normalizeUrl(
    data.seasonalBanner.ctaHref || base.seasonalBanner.ctaHref
  );
  data.seasonalBanner.secondaryCtaLabel = sanitizeText(
    data.seasonalBanner.secondaryCtaLabel ||
      base.seasonalBanner.secondaryCtaLabel,
    40
  );
  data.seasonalBanner.secondaryCtaHref = normalizeUrl(
    data.seasonalBanner.secondaryCtaHref ||
      base.seasonalBanner.secondaryCtaHref
  );
  data.seasonalBanner.featureBadge = sanitizeText(
    data.seasonalBanner.featureBadge || base.seasonalBanner.featureBadge,
    40
  );
  data.seasonalBanner.featureText = sanitizeText(
    data.seasonalBanner.featureText || base.seasonalBanner.featureText,
    180
  );
  data.seasonalBanner.highlights = normalizeHighlights(
    data.seasonalBanner.highlights,
    base.seasonalBanner.highlights
  );

  data.shopByPrice.title = sanitizeText(
    data.shopByPrice.title || base.shopByPrice.title,
    80
  );
  data.shopByPrice.subtitle = sanitizeText(
    data.shopByPrice.subtitle || base.shopByPrice.subtitle,
    220
  );
  data.shopByPrice.items = normalizePriceItems(data.shopByPrice.items);

  data.shopByStyle.title = sanitizeText(
    data.shopByStyle.title || base.shopByStyle.title,
    80
  );
  data.shopByStyle.subtitle = sanitizeText(
    data.shopByStyle.subtitle || base.shopByStyle.subtitle,
    220
  );
  data.shopByStyle.items = normalizeStyleItems(data.shopByStyle.items);

  data.instagramFeed.title = sanitizeText(
    data.instagramFeed.title || base.instagramFeed.title,
    80
  );
  data.instagramFeed.subtitle = sanitizeText(
    data.instagramFeed.subtitle || base.instagramFeed.subtitle,
    220
  );
  data.instagramFeed.items = normalizeFeedItems(data.instagramFeed.items);

  data.brandStory.eyebrow = sanitizeText(
    data.brandStory.eyebrow || base.brandStory.eyebrow,
    40
  );
  data.brandStory.title = sanitizeText(
    data.brandStory.title || base.brandStory.title,
    140
  );
  data.brandStory.description = sanitizeText(
    data.brandStory.description || base.brandStory.description,
    320
  );
  data.brandStory.image = normalizeUrl(data.brandStory.image);
  data.brandStory.ctaLabel = sanitizeText(
    data.brandStory.ctaLabel || base.brandStory.ctaLabel,
    40
  );
  data.brandStory.ctaHref = normalizeUrl(
    data.brandStory.ctaHref || base.brandStory.ctaHref
  );
  data.brandStory.secondaryCtaLabel = sanitizeText(
    data.brandStory.secondaryCtaLabel || base.brandStory.secondaryCtaLabel,
    40
  );
  data.brandStory.secondaryCtaHref = normalizeUrl(
    data.brandStory.secondaryCtaHref || base.brandStory.secondaryCtaHref
  );
  data.brandStory.featureBadge = sanitizeText(
    data.brandStory.featureBadge || base.brandStory.featureBadge,
    40
  );
  data.brandStory.featureText = sanitizeText(
    data.brandStory.featureText || base.brandStory.featureText,
    180
  );
  data.brandStory.highlights = normalizeHighlights(
    data.brandStory.highlights,
    base.brandStory.highlights
  );
  data.brandStory.stats = normalizeStoryStats(data.brandStory.stats);

  data.newsletter.title = sanitizeText(
    data.newsletter.title || base.newsletter.title,
    80
  );
  data.newsletter.description = sanitizeText(
    data.newsletter.description || base.newsletter.description,
    220
  );
  data.newsletter.placeholder = sanitizeText(
    data.newsletter.placeholder || base.newsletter.placeholder,
    80
  );
  data.newsletter.buttonLabel = sanitizeText(
    data.newsletter.buttonLabel || base.newsletter.buttonLabel,
    40
  );

  return data;
}

function normalizePermissions(user) {
  const list = Array.isArray(user?.permissions) ? user.permissions : [];
  const out = [];
  const seen = new Set();

  for (const raw of list) {
    const permission = String(raw || "").trim();
    if (!permission) continue;
    const normalized = permission.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
  }

  return out;
}

function makeApiPath(path) {
  const base = String(api?.defaults?.baseURL || "");
  const hasV1 = base.includes("/api/v1");
  const prefix = hasV1 ? "" : "/api/v1";
  return `${prefix}${path}`;
}

function extractHomeConfigPayload(payload) {
  if (!payload || typeof payload !== "object") return {};

  if (payload?.data?.data && typeof payload.data.data === "object") {
    return payload.data.data;
  }

  if (payload?.data && typeof payload.data === "object") {
    const hasKnownTopLevelKey =
      "hero" in payload.data ||
      "collections" in payload.data ||
      "seasonalBanner" in payload.data ||
      "brandStory" in payload.data ||
      "newsletter" in payload.data;

    if (hasKnownTopLevelKey) {
      return payload.data;
    }
  }

  if (payload?.config && typeof payload.config === "object") {
    return payload.config;
  }

  const hasKnownRootKey =
    "hero" in payload ||
    "collections" in payload ||
    "seasonalBanner" in payload ||
    "brandStory" in payload ||
    "newsletter" in payload;

  if (hasKnownRootKey) {
    return payload;
  }

  return {};
}

function extractVersionValue(payload) {
  const candidates = [
    payload?.version,
    payload?.data?.version,
    payload?.meta?.version,
  ];

  for (const value of candidates) {
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }

  return null;
}

async function uploadSingleImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  try {
    const response = await api.post(makeApiPath("/upload/local"), formData);
    const data = response?.data || {};

    if (!String(data?.url || "").trim()) {
      throw new Error("Image upload failed.");
    }

    return {
      fileId: data?.fileId ? String(data.fileId).trim() : null,
      url: String(data.url || "").trim(),
      filename: data?.filename ? String(data.filename).trim() : null,
      mimetype: data?.mimetype ? String(data.mimetype).trim() : null,
      size: Number.isFinite(Number(data?.size)) ? Number(data.size) : 0,
      width: Number.isFinite(Number(data?.width)) ? Number(data.width) : null,
      height: Number.isFinite(Number(data?.height)) ? Number(data.height) : null,
      format: data?.format ? String(data.format).trim() : null,
    };
  } catch (err) {
    throw new Error(
      err?.response?.data?.message ||
        err?.message ||
        "Failed to upload image."
    );
  }
}

function collectValidationIssues(config) {
  const issues = [];

  const addUrlIssue = (label, value) => {
    const raw = String(value || "").trim();
    if (raw && !isSafeUrl(raw)) {
      issues.push(`${label} must be a valid relative path or http/https URL.`);
    }
  };

  const addRequiredIssue = (label, value) => {
    if (!String(value || "").trim()) {
      issues.push(`${label} is required.`);
    }
  };

  addRequiredIssue("Hero title", config?.hero?.title);
  addRequiredIssue("Hero description", config?.hero?.description);
  addRequiredIssue("Collections title", config?.collections?.title);
  addRequiredIssue("Why Choose Us title", config?.whyChooseUs?.title);
  addRequiredIssue("Testimonials title", config?.testimonials?.title);
  addRequiredIssue("Seasonal banner title", config?.seasonalBanner?.title);
  addRequiredIssue("Brand story title", config?.brandStory?.title);
  addRequiredIssue("Newsletter title", config?.newsletter?.title);

  if (config?.trending?.enabled !== false) {
    addRequiredIssue("Trending title", config?.trending?.title);
  }

  if (config?.bestSellers?.enabled !== false) {
    addRequiredIssue("Best Sellers title", config?.bestSellers?.title);
  }

  if (config?.flashSale?.enabled !== false) {
    addRequiredIssue("Flash Sale title", config?.flashSale?.title);
  }

  addUrlIssue("Hero image URL", config?.hero?.image);
  addUrlIssue("Hero primary CTA href", config?.hero?.primaryCtaHref);
  addUrlIssue("Hero secondary CTA href", config?.hero?.secondaryCtaHref);
  addUrlIssue("Trending CTA href", config?.trending?.ctaHref);
  addUrlIssue("Best Sellers CTA href", config?.bestSellers?.ctaHref);
  addUrlIssue("Flash Sale CTA href", config?.flashSale?.ctaHref);
  addUrlIssue("Seasonal banner image URL", config?.seasonalBanner?.image);
  addUrlIssue("Seasonal banner CTA href", config?.seasonalBanner?.ctaHref);
  addUrlIssue(
    "Seasonal banner secondary CTA href",
    config?.seasonalBanner?.secondaryCtaHref
  );
  addUrlIssue("Brand story image URL", config?.brandStory?.image);
  addUrlIssue("Brand story CTA href", config?.brandStory?.ctaHref);
  addUrlIssue(
    "Brand story secondary CTA href",
    config?.brandStory?.secondaryCtaHref
  );

  const merchSections = [
    { key: "trending", label: "Trending" },
    { key: "bestSellers", label: "Best Sellers" },
    { key: "flashSale", label: "Flash Sale" },
  ];

  for (const section of merchSections) {
    const current = config?.[section.key] || {};
    const minItems = Number(current?.minItems);
    const maxItems = Number(current?.maxItems);

    if (!Number.isFinite(minItems) || minItems < 0 || minItems > 12) {
      issues.push(`${section.label} minimum items must be between 0 and 12.`);
    }

    if (!Number.isFinite(maxItems) || maxItems < 1 || maxItems > 12) {
      issues.push(`${section.label} max items must be between 1 and 12.`);
    }

    if (
      Number.isFinite(minItems) &&
      Number.isFinite(maxItems) &&
      minItems > maxItems
    ) {
      issues.push(
        `${section.label} minimum items cannot be greater than max items.`
      );
    }
  }

  for (const [index, item] of (config?.hero?.stats || []).entries()) {
    if (!String(item?.label || "").trim()) {
      issues.push(`Hero stat ${index + 1} label is required.`);
    }
  }

  for (const [index, item] of (config?.hero?.highlights || [])
    .slice(0, 3)
    .entries()) {
    if (!String(item || "").trim()) {
      issues.push(`Hero highlight ${index + 1} cannot be empty.`);
    }
  }

  for (const [index, item] of (config?.whyChooseUs?.items || [])
    .slice(0, 3)
    .entries()) {
    if (!String(item?.title || "").trim()) {
      issues.push(`Why Choose Us item ${index + 1} title is required.`);
    }
  }

  for (const [index, item] of (config?.testimonials?.items || [])
    .slice(0, 3)
    .entries()) {
    if (!String(item?.name || "").trim()) {
      issues.push(`Testimonial ${index + 1} name is required.`);
    }
    if (!String(item?.quote || "").trim()) {
      issues.push(`Testimonial ${index + 1} quote is required.`);
    }
    const rating = Number(item?.rating);
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      issues.push(`Testimonial ${index + 1} rating must be between 1 and 5.`);
    }
  }

  for (const [index, item] of (config?.shopByPrice?.items || [])
    .slice(0, 3)
    .entries()) {
    if (!String(item?.label || "").trim()) {
      issues.push(`Shop by Price item ${index + 1} label is required.`);
    }
    addUrlIssue(`Shop by Price item ${index + 1} href`, item?.href);
    addUrlIssue(`Shop by Price item ${index + 1} image`, item?.img);
  }

  for (const [index, item] of (config?.shopByStyle?.items || [])
    .slice(0, 3)
    .entries()) {
    if (!String(item?.label || "").trim()) {
      issues.push(`Shop by Style item ${index + 1} label is required.`);
    }
    addUrlIssue(`Shop by Style item ${index + 1} href`, item?.href);
    addUrlIssue(`Shop by Style item ${index + 1} image`, item?.img);
  }

  for (const [index, item] of (config?.instagramFeed?.items || [])
    .slice(0, 5)
    .entries()) {
    if (!String(item?.title || "").trim()) {
      issues.push(`Inspired by the Feed item ${index + 1} title is required.`);
    }
    addUrlIssue(`Inspired by the Feed item ${index + 1} href`, item?.href);
    addUrlIssue(`Inspired by the Feed item ${index + 1} image`, item?.image);
  }

  for (const [index, item] of (config?.brandStory?.stats || [])
    .slice(0, 3)
    .entries()) {
    if (!String(item?.label || "").trim()) {
      issues.push(`Brand story stat ${index + 1} label is required.`);
    }
  }

  return Array.from(new Set(issues));
}

function getDirtySections(initialString, currentString, normalizedForm) {
  if (!initialString || initialString === currentString) return [];

  const sections = [];
  const current = normalizedForm || {};

  if (current.hero) sections.push("Hero");
  if (current.collections) sections.push("Collections");
  if (
    current.trending ||
    current.bestSellers ||
    current.flashSale ||
    current.shopByPrice ||
    current.shopByStyle ||
    current.instagramFeed
  ) {
    sections.push("Merchandising");
  }
  if (current.whyChooseUs || current.testimonials) {
    sections.push("Trust & testimonials");
  }
  if (current.seasonalBanner) sections.push("Campaign banner");
  if (current.brandStory) sections.push("Brand story");
  if (current.newsletter) sections.push("Newsletter");

  return sections;
}

function SectionCard({ id, icon: Icon, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100">
            <Icon size={18} className="text-gray-800" />
          </div>

          <div className="min-w-0">
            <div className="text-base font-semibold text-gray-900">{title}</div>
            {description ? (
              <div className="mt-1 text-sm text-gray-600">{description}</div>
            ) : null}
          </div>
        </div>

        <div className="mt-5">{children}</div>
      </div>
    </section>
  );
}

function NavButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl border px-4 py-3 text-left transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        active
          ? "border-black bg-black text-white"
          : "border-gray-200 bg-white hover:bg-gray-50"
      )}
    >
      <div className="truncate text-sm font-semibold">{children}</div>
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  invalid = false,
  helper,
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <input
        disabled={disabled}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        className={cx(
          "mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
          invalid ? "border border-rose-300" : "border border-gray-200"
        )}
      />
      {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  rows = 4,
  invalid = false,
  helper,
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-800">{label}</span>
      <textarea
        disabled={disabled}
        value={value || ""}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={cx(
          "mt-2 min-h-[96px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
          invalid ? "border border-rose-300" : "border border-gray-200"
        )}
      />
      {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
    </label>
  );
}

function TextListEditor({
  title,
  helper,
  items,
  disabled,
  onChange,
  placeholders = [],
  maxItems = 3,
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const rows = Array.from({ length: maxItems }, (_, index) => safeItems[index] || "");

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {rows.map((item, index) => (
          <Input
            key={`${title}-${index}`}
            label={`${title} ${index + 1}`}
            value={item}
            onChange={(e) => {
              const next = [...rows];
              next[index] = e.target.value;
              onChange(next);
            }}
            placeholder={placeholders[index] || `Item ${index + 1}`}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function StatsEditor({
  title,
  helper,
  items,
  disabled,
  onChange,
  maxItems = 3,
  labelPlaceholder = "Label",
  valuePlaceholder = "Value",
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const rows = Array.from({ length: maxItems }, (_, index) => {
    return safeItems[index] || { label: "", value: "" };
  });

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="text-sm font-semibold text-gray-900">{title}</div>
      {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {rows.map((item, index) => (
          <div key={`${title}-${index}`} className="space-y-3">
            <Input
              label={`${title} ${index + 1} label`}
              value={item?.label || ""}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...(next[index] || {}), label: e.target.value };
                onChange(next);
              }}
              placeholder={labelPlaceholder}
              disabled={disabled}
            />
            <Input
              label={`${title} ${index + 1} value`}
              value={item?.value || ""}
              onChange={(e) => {
                const next = [...rows];
                next[index] = { ...(next[index] || {}), value: e.target.value };
                onChange(next);
              }}
              placeholder={valuePlaceholder}
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageUploadField({
  label,
  value,
  onChange,
  onUpload,
  uploading = false,
  disabled = false,
  helper,
  emptyHelper,
}) {
  const fileInputRef = useRef(null);
  const safeValue = String(value || "").trim();
  const hasImage = Boolean(safeValue);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-800">{label}</div>
          {helper ? <div className="mt-1 text-xs text-gray-500">{helper}</div> : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            await onUpload(file);

            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
          disabled={disabled || uploading}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload image
            </>
          )}
        </button>
      </div>

      <div className="mt-4">
        <Input
          label="Image URL"
          value={safeValue}
          onChange={onChange}
          placeholder="https://... or /path"
          disabled={disabled || uploading}
          invalid={Boolean(safeValue) && !isSafeUrl(safeValue)}
          helper={emptyHelper}
        />
      </div>

      <div className="mt-4">
        {hasImage && isSafeUrl(safeValue) ? (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
            <div className="aspect-[16/10] w-full bg-gray-100">
              <img
                src={safeValue}
                alt={label}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-3">
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-medium text-gray-700">
                  {safeValue}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onChange({ target: { value: "" } })}
                disabled={disabled || uploading}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
              >
                <X size={14} />
                Clear
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-4 py-8 text-center text-xs text-gray-500">
            No image selected yet.
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminHomeConfigPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [active, setActive] = useState("hero");
  const [form, setForm] = useState(() => normalizeHomeConfig({}));
  const [uploading, setUploading] = useState({
    hero: false,
    seasonalBanner: false,
    brandStory: false,
    shopByPrice0: false,
    shopByPrice1: false,
    shopByPrice2: false,
    shopByStyle0: false,
    shopByStyle1: false,
    shopByStyle2: false,
    instagramFeed0: false,
    instagramFeed1: false,
    instagramFeed2: false,
    instagramFeed3: false,
    instagramFeed4: false,
  });

  const initialRef = useRef(stableStringify(normalizeHomeConfig({})));
  const versionRef = useRef(null);

  const role = useMemo(() => String(user?.role || "").toLowerCase(), [user]);
  const roleLevel = useMemo(() => {
    const value = Number(user?.roleLevel || 0);
    return Number.isFinite(value) ? value : 0;
  }, [user]);
  const userPerms = useMemo(() => normalizePermissions(user), [user]);

  const isSuper =
    role === "admin" ||
    role === "superadmin" ||
    roleLevel >= 100 ||
    userPerms.includes("*");

  const canWrite = isSuper;
  const canRead =
    isSuper ||
    userPerms.includes("settings:read") ||
    userPerms.includes("settings:write");
  const readOnly = !canWrite;

  const sections = useMemo(
    () => [
      { id: "hero", label: "Hero", icon: Home },
      { id: "collections", label: "Collections", icon: Layers3 },
      { id: "merchandising", label: "Merchandising", icon: Tag },
      { id: "trust", label: "Trust & testimonials", icon: Star },
      { id: "campaign", label: "Campaign banner", icon: Sparkles },
      { id: "story", label: "Brand story", icon: ImageIcon },
      { id: "newsletter", label: "Newsletter", icon: Newspaper },
    ],
    []
  );

  function syncFormWithServerData(payload, fallback = {}) {
    const extracted = extractHomeConfigPayload(payload);
    const source =
      extracted && Object.keys(extracted).length > 0 ? extracted : fallback;

    const normalized = normalizeHomeConfig(source);
    const nextString = stableStringify(normalized);

    setForm(normalized);
    initialRef.current = nextString;

    const nextVersion = extractVersionValue(payload);
    if (nextVersion != null) {
      versionRef.current = nextVersion;
    }

    return normalized;
  }

  const configQuery = useQuery({
    queryKey: ["homeConfig"],
    enabled: Boolean(canRead),
    queryFn: async () => {
      const response = await api.get(makeApiPath("/page-config/home/admin"));
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!configQuery.data) return;
    syncFormWithServerData(configQuery.data, defaultHomeConfig());
  }, [configQuery.data]);

  const normalizedForm = useMemo(() => normalizeHomeConfig(form), [form]);

  const currentString = useMemo(
    () => stableStringify(normalizedForm),
    [normalizedForm]
  );

  const isDirty = useMemo(() => {
    return currentString !== initialRef.current;
  }, [currentString]);

  const validationIssues = useMemo(
    () => collectValidationIssues(normalizedForm),
    [normalizedForm]
  );
  const hasValidationIssues = validationIssues.length > 0;

  const dirtySections = useMemo(() => {
    return getDirtySections(initialRef.current, currentString, normalizedForm);
  }, [currentString, normalizedForm]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const version = versionRef.current;
      const headers = version != null ? { "If-Match": String(version) } : undefined;

      const response = await api.put(
        makeApiPath("/page-config/home"),
        payload,
        headers ? { headers } : undefined
      );

      return response.data;
    },
    onSuccess: async (data) => {
      const normalized = syncFormWithServerData(data, normalizedForm);

      queryClient.setQueryData(["homeConfig"], (prev) => {
        const previous = prev && typeof prev === "object" ? prev : {};
        return {
          ...previous,
          ...(data && typeof data === "object" ? data : {}),
          data: normalized,
          version:
            extractVersionValue(data) ??
            extractVersionValue(previous) ??
            versionRef.current,
          updatedAt:
            data?.updatedAt ||
            data?.data?.updatedAt ||
            previous?.updatedAt ||
            new Date().toISOString(),
        };
      });

      await queryClient.invalidateQueries({ queryKey: ["home-page"] });
      await queryClient.invalidateQueries({ queryKey: ["homeConfig"] });

      toast.success("Home page config saved", {
        description: "Homepage settings and merchandising rules have been updated.",
      });
    },
    onError: async (error) => {
      const status = error?.response?.status;

      if (status === 409) {
        toast.error("Version conflict", {
          description: "Another admin updated the home config. Reloading latest data...",
        });
        await queryClient.invalidateQueries({ queryKey: ["homeConfig"] });
        await configQuery.refetch();
        return;
      }

      if (status === 403) {
        toast.error("Save not allowed", {
          description: "Your current role cannot publish home page config changes.",
        });
        return;
      }

      toast.error("Save failed", { description: getErrorMessage(error) });
    },
  });

  const busy = saveMutation.isPending;
  const anyUploading = Object.values(uploading).some(Boolean);
  const inputDisabled = busy || readOnly || anyUploading;

  const meta = configQuery.data
    ? {
        updatedAt: configQuery.data.updatedAt,
        version:
          extractVersionValue(configQuery.data) ??
          versionRef.current,
      }
    : null;

  function scrollTo(id) {
    setActive(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetToInitial() {
    const initialPayload = extractHomeConfigPayload(configQuery.data);
    const initial =
      initialPayload && Object.keys(initialPayload).length > 0
        ? normalizeHomeConfig(initialPayload)
        : normalizeHomeConfig({});
    setForm(initial);
  }

  function resetToDefaults() {
    setForm(normalizeHomeConfig(defaultHomeConfig()));
  }

  async function handleImageUpload(sectionKey, path, file) {
    if (readOnly || !file) return;

    const isAllowedType = ["image/jpeg", "image/png", "image/webp"].includes(
      String(file?.type || "").toLowerCase()
    );

    if (!isAllowedType) {
      toast.error("Invalid image", {
        description: "Only JPG, PNG, and WEBP images are allowed.",
      });
      return;
    }

    setUploading((prev) => ({ ...prev, [sectionKey]: true }));

    try {
      const uploaded = await uploadSingleImage(file);
      setForm((prev) => setDeep(prev, path, uploaded.url));

      toast.success("Image uploaded", {
        description: "Image uploaded successfully. Save changes to publish it on homepage.",
      });
    } catch (error) {
      toast.error("Upload failed", {
        description: getErrorMessage(error),
      });
    } finally {
      setUploading((prev) => ({ ...prev, [sectionKey]: false }));
    }
  }

  function onSave() {
    if (readOnly || busy || !isDirty || anyUploading) return;

    if (hasValidationIssues) {
      toast.error("Fix validation issues first", {
        description: validationIssues[0],
      });
      return;
    }

    saveMutation.mutate(normalizedForm);
  }

  if (!canRead) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold">Permission required</div>
            <div className="mt-1 text-sm text-gray-600">
              You don’t have access to home page config. Ask an admin to grant
              the correct role or settings access.
            </div>

            <div className="mt-4">
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (configQuery.isLoading) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-center gap-3 text-gray-600">
          <Loader2 size={18} className="animate-spin" />
          Loading home page config...
        </div>
      </div>
    );
  }

  if (configQuery.isError) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold">Failed to load</div>
            <div className="mt-1 text-sm text-gray-600">
              {getErrorMessage(configQuery.error)}
            </div>

            <button
              type="button"
              className="mt-4 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
              onClick={() => configQuery.refetch()}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <Home size={14} />
              Homepage CMS
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              Home Page Config
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Manage homepage copy, CTAs, storytelling blocks, and merchandising
              rules from one place without touching storefront code.
            </p>

            {readOnly ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-200 bg-white">
                    <ShieldAlert size={18} className="text-amber-700" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      Read-only mode
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      You can review content settings, but only admin-level roles can publish updates.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {meta?.updatedAt ? (
              <div className="mt-3 text-xs text-gray-500">
                Last updated:{" "}
                <span className="font-medium text-gray-700">
                  {new Date(meta.updatedAt).toLocaleString()}
                </span>
                {typeof meta?.version === "number" ? (
                  <>
                    {" "}
                    • Version:{" "}
                    <span className="font-medium text-gray-700">{meta.version}</span>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ExternalLink size={16} />
              Preview home
            </a>
          </div>
        </div>
      </div>

      {(hasValidationIssues || (isDirty && dirtySections.length > 0)) && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {hasValidationIssues ? (
            <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-rose-200 bg-white">
                  <AlertTriangle size={18} className="text-rose-700" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    Validation issues
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Fix these before publishing changes.
                  </div>

                  <ul className="mt-3 space-y-2 text-sm text-rose-800">
                    {validationIssues.slice(0, 8).map((issue) => (
                      <li key={issue}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : null}

          {isDirty && dirtySections.length > 0 ? (
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                  <ListChecks size={18} className="text-gray-800" />
                </div>

                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    Pending changes
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Current form has unpublished updates.
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {dirtySections.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <aside className="hidden lg:col-span-4 lg:block">
          <div className="sticky top-6">
            <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Sections</div>
              <div className="mt-1 text-xs text-gray-500">
                Jump between content blocks
              </div>

              <div className="mt-4 space-y-2">
                {sections.map((section) => (
                  <NavButton
                    key={section.id}
                    active={active === section.id}
                    onClick={() => scrollTo(section.id)}
                  >
                    {section.label}
                  </NavButton>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <div className="space-y-5 lg:col-span-8">
          <div className="rounded-[28px] border border-gray-200 bg-white p-4 shadow-sm lg:hidden">
            <label className="text-xs text-gray-500">Jump to</label>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
              value={active}
              onChange={(e) => scrollTo(e.target.value)}
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.label}
                </option>
              ))}
            </select>
          </div>

          <SectionCard
            id="hero"
            icon={Home}
            title="Hero"
            description="Headline, CTA, image, highlights, feature card and optional stats shown above the fold."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Eyebrow"
                value={form?.hero?.eyebrow}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["hero", "eyebrow"], e.target.value))
                }
                placeholder="New arrivals"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <ImageUploadField
                  label="Hero image"
                  value={form?.hero?.image}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["hero", "image"], e.target.value))
                  }
                  onUpload={(file) => handleImageUpload("hero", ["hero", "image"], file)}
                  uploading={uploading.hero}
                  disabled={readOnly || busy}
                  helper="Upload a hero image or paste a valid URL."
                  emptyHelper="Leave empty to let the storefront use a dynamic catalog image."
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Title"
                  value={form?.hero?.title}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["hero", "title"], e.target.value))
                  }
                  placeholder="Hero title"
                  disabled={inputDisabled}
                  invalid={!String(form?.hero?.title || "").trim()}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={form?.hero?.description}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["hero", "description"], e.target.value)
                    )
                  }
                  placeholder="Hero description"
                  disabled={inputDisabled}
                  invalid={!String(form?.hero?.description || "").trim()}
                />
              </div>

              <Input
                label="Primary CTA label"
                value={form?.hero?.primaryCtaLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "primaryCtaLabel"], e.target.value)
                  )
                }
                placeholder="Shop collection"
                disabled={inputDisabled}
              />

              <Input
                label="Primary CTA href"
                value={form?.hero?.primaryCtaHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "primaryCtaHref"], e.target.value)
                  )
                }
                placeholder="/shop?category=Women"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.hero?.primaryCtaHref || "").trim()) &&
                  !isSafeUrl(form?.hero?.primaryCtaHref)
                }
              />

              <Input
                label="Secondary CTA label"
                value={form?.hero?.secondaryCtaLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "secondaryCtaLabel"], e.target.value)
                  )
                }
                placeholder="Explore latest"
                disabled={inputDisabled}
              />

              <Input
                label="Secondary CTA href"
                value={form?.hero?.secondaryCtaHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "secondaryCtaHref"], e.target.value)
                  )
                }
                placeholder="/shop?sort=latest"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.hero?.secondaryCtaHref || "").trim()) &&
                  !isSafeUrl(form?.hero?.secondaryCtaHref)
                }
              />

              <Input
                label="Feature badge"
                value={form?.hero?.featureBadge}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "featureBadge"], e.target.value)
                  )
                }
                placeholder="Featured selection"
                disabled={inputDisabled}
              />

              <Input
                label="Feature text"
                value={form?.hero?.featureText}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "featureText"], e.target.value)
                  )
                }
                placeholder="Short supporting text"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <TextListEditor
                  title="Hero highlights"
                  helper="Small premium chips shown under hero actions."
                  items={form?.hero?.highlights}
                  disabled={inputDisabled}
                  onChange={(next) =>
                    setForm((prev) => setDeep(prev, ["hero", "highlights"], next))
                  }
                  placeholders={[
                    "Fresh arrivals",
                    "Thoughtful edits",
                    "Reliable delivery",
                  ]}
                  maxItems={3}
                />
              </div>

              <div className="md:col-span-2">
                <StatsEditor
                  title="Hero stats"
                  helper="Leave values empty to let backend auto-fill catalog counts."
                  items={form?.hero?.stats}
                  disabled={inputDisabled}
                  onChange={(next) =>
                    setForm((prev) => setDeep(prev, ["hero", "stats"], next))
                  }
                  maxItems={3}
                  labelPlaceholder="Active products"
                  valuePlaceholder="Leave blank for auto"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="collections"
            icon={Layers3}
            title="Collections"
            description="Heading and supporting copy for collection discovery."
          >
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Section title"
                value={form?.collections?.title}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["collections", "title"], e.target.value))
                }
                placeholder="Explore Our Collections"
                disabled={inputDisabled}
                invalid={!String(form?.collections?.title || "").trim()}
              />

              <Textarea
                label="Section subtitle"
                value={form?.collections?.subtitle}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["collections", "subtitle"], e.target.value)
                  )
                }
                placeholder="Collections subtitle"
                disabled={inputDisabled}
              />
            </div>
          </SectionCard>

          <SectionCard
            id="merchandising"
            icon={Tag}
            title="Merchandising sections"
            description="Control section headings, CTA labels, visibility rules and merchandising behavior for product-led homepage blocks."
          >
            <div className="grid grid-cols-1 gap-6">
              {[
                { key: "trending", label: "Trending" },
                { key: "bestSellers", label: "Best Sellers" },
                { key: "flashSale", label: "Flash Sale" },
                { key: "shopByPrice", label: "Shop by Price" },
                { key: "shopByStyle", label: "Shop by Style" },
                { key: "instagramFeed", label: "Inspired by the Feed" },
              ].map((section) => {
                const isMerchSection =
                  section.key === "trending" ||
                  section.key === "bestSellers" ||
                  section.key === "flashSale";

                return (
                  <div
                    key={section.key}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      {section.label}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label="Title"
                        value={form?.[section.key]?.title}
                        onChange={(e) =>
                          setForm((prev) =>
                            setDeep(prev, [section.key, "title"], e.target.value)
                          )
                        }
                        placeholder={`${section.label} title`}
                        disabled={inputDisabled}
                        invalid={!String(form?.[section.key]?.title || "").trim()}
                      />

                      {"ctaLabel" in (form?.[section.key] || {}) ? (
                        <Input
                          label="CTA label"
                          value={form?.[section.key]?.ctaLabel}
                          onChange={(e) =>
                            setForm((prev) =>
                              setDeep(prev, [section.key, "ctaLabel"], e.target.value)
                            )
                          }
                          placeholder="View all"
                          disabled={inputDisabled}
                        />
                      ) : null}

                      <div className="md:col-span-2">
                        <Textarea
                          label="Subtitle"
                          value={form?.[section.key]?.subtitle}
                          onChange={(e) =>
                            setForm((prev) =>
                              setDeep(prev, [section.key, "subtitle"], e.target.value)
                            )
                          }
                          placeholder={`${section.label} subtitle`}
                          disabled={inputDisabled}
                          rows={3}
                        />
                      </div>

                      {"ctaHref" in (form?.[section.key] || {}) ? (
                        <div className="md:col-span-2">
                          <Input
                            label="CTA href"
                            value={form?.[section.key]?.ctaHref}
                            onChange={(e) =>
                              setForm((prev) =>
                                setDeep(prev, [section.key, "ctaHref"], e.target.value)
                              )
                            }
                            placeholder="/shop"
                            disabled={inputDisabled}
                            invalid={
                              Boolean(String(form?.[section.key]?.ctaHref || "").trim()) &&
                              !isSafeUrl(form?.[section.key]?.ctaHref)
                            }
                          />
                        </div>
                      ) : null}

                      {isMerchSection ? (
                        <>
                          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(form?.[section.key]?.enabled)}
                              onChange={(e) =>
                                setForm((prev) =>
                                  setDeep(prev, [section.key, "enabled"], e.target.checked)
                                )
                              }
                              disabled={inputDisabled}
                            />
                            <span className="text-sm font-medium text-gray-800">
                              Enabled
                            </span>
                          </label>

                          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(form?.[section.key]?.hideWhenEmpty)}
                              onChange={(e) =>
                                setForm((prev) =>
                                  setDeep(
                                    prev,
                                    [section.key, "hideWhenEmpty"],
                                    e.target.checked
                                  )
                                )
                              }
                              disabled={inputDisabled}
                            />
                            <span className="text-sm font-medium text-gray-800">
                              Hide when empty
                            </span>
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-gray-800">
                              Max items
                            </span>
                            <input
                              type="number"
                              min={1}
                              max={12}
                              value={String(form?.[section.key]?.maxItems ?? "")}
                              onChange={(e) =>
                                setForm((prev) =>
                                  setDeep(prev, [section.key, "maxItems"], e.target.value)
                                )
                              }
                              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                              disabled={inputDisabled}
                            />
                          </label>

                          <label className="block">
                            <span className="text-sm font-medium text-gray-800">
                              Minimum items
                            </span>
                            <input
                              type="number"
                              min={0}
                              max={12}
                              value={String(form?.[section.key]?.minItems ?? "")}
                              onChange={(e) =>
                                setForm((prev) =>
                                  setDeep(prev, [section.key, "minItems"], e.target.value)
                                )
                              }
                              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
                              disabled={inputDisabled}
                            />
                          </label>

                          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(form?.[section.key]?.excludeDuplicates)}
                              onChange={(e) =>
                                setForm((prev) =>
                                  setDeep(
                                    prev,
                                    [section.key, "excludeDuplicates"],
                                    e.target.checked
                                  )
                                )
                              }
                              disabled={inputDisabled}
                            />
                            <span className="text-sm font-medium text-gray-800">
                              Exclude duplicates
                            </span>
                          </label>

                          <label className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                            <input
                              type="checkbox"
                              checked={Boolean(form?.[section.key]?.requireInStock)}
                              onChange={(e) =>
                                setForm((prev) =>
                                  setDeep(
                                    prev,
                                    [section.key, "requireInStock"],
                                    e.target.checked
                                  )
                                )
                              }
                              disabled={inputDisabled}
                            />
                            <span className="text-sm font-medium text-gray-800">
                              Require in stock
                            </span>
                          </label>

                          {section.key === "flashSale" ? (
                            <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
                              <label className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={Boolean(form?.flashSale?.requireDiscount)}
                                  onChange={(e) =>
                                    setForm((prev) =>
                                      setDeep(
                                        prev,
                                        ["flashSale", "requireDiscount"],
                                        e.target.checked
                                      )
                                    )
                                  }
                                  disabled={inputDisabled}
                                />
                                <span className="text-sm font-medium text-gray-800">
                                  Require real discount
                                </span>
                              </label>
                              <div className="mt-2 text-xs text-gray-500">
                                This section will only use products where compare price is
                                greater than regular price.
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                );
              })}

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  Shop by Price items
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Control price cards with label, link, eyebrow, description and optional image.
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  {(form?.shopByPrice?.items || []).slice(0, 3).map((item, index) => (
                    <div
                      key={`price-item-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Label"
                          value={item?.label || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByPrice?.items || [])];
                            next[index] = { ...(next[index] || {}), label: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByPrice", "items"], next));
                          }}
                          placeholder="Under Budget"
                          disabled={inputDisabled}
                          invalid={!String(item?.label || "").trim()}
                        />

                        <Input
                          label="Href"
                          value={item?.href || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByPrice?.items || [])];
                            next[index] = { ...(next[index] || {}), href: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByPrice", "items"], next));
                          }}
                          placeholder="/shop?priceMax=50"
                          disabled={inputDisabled}
                          invalid={
                            Boolean(String(item?.href || "").trim()) &&
                            !isSafeUrl(item?.href)
                          }
                        />

                        <Input
                          label="Eyebrow"
                          value={item?.eyebrow || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByPrice?.items || [])];
                            next[index] = { ...(next[index] || {}), eyebrow: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByPrice", "items"], next));
                          }}
                          placeholder="Accessible picks"
                          disabled={inputDisabled}
                        />

                        <div className="md:col-span-2">
                          <Textarea
                            label="Description"
                            value={item?.description || ""}
                            onChange={(e) => {
                              const next = [...(form?.shopByPrice?.items || [])];
                              next[index] = {
                                ...(next[index] || {}),
                                description: e.target.value,
                              };
                              setForm((prev) => setDeep(prev, ["shopByPrice", "items"], next));
                            }}
                            placeholder="Short supporting text for this card"
                            disabled={inputDisabled}
                            rows={3}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <ImageUploadField
                            label={`Price card image ${index + 1}`}
                            value={item?.img || ""}
                            onChange={(e) => {
                              const next = [...(form?.shopByPrice?.items || [])];
                              next[index] = { ...(next[index] || {}), img: e.target.value };
                              setForm((prev) => setDeep(prev, ["shopByPrice", "items"], next));
                            }}
                            onUpload={(file) =>
                              handleImageUpload(
                                `shopByPrice${index}`,
                                ["shopByPrice", "items", index, "img"],
                                file
                              )
                            }
                            uploading={uploading[`shopByPrice${index}`]}
                            disabled={readOnly || busy}
                            helper="Optional custom card image."
                            emptyHelper="Leave empty to use storefront fallback imagery."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  Shop by Style items
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Manage the 3 style cards used in the premium editorial layout.
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  {(form?.shopByStyle?.items || []).slice(0, 3).map((item, index) => (
                    <div
                      key={`style-item-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Label"
                          value={item?.label || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByStyle?.items || [])];
                            next[index] = { ...(next[index] || {}), label: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByStyle", "items"], next));
                          }}
                          placeholder="Women"
                          disabled={inputDisabled}
                          invalid={!String(item?.label || "").trim()}
                        />

                        <Input
                          label="Href"
                          value={item?.href || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByStyle?.items || [])];
                            next[index] = { ...(next[index] || {}), href: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByStyle", "items"], next));
                          }}
                          placeholder="/shop?category=Women"
                          disabled={inputDisabled}
                          invalid={
                            Boolean(String(item?.href || "").trim()) &&
                            !isSafeUrl(item?.href)
                          }
                        />

                        <Input
                          label="Type"
                          value={item?.type || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByStyle?.items || [])];
                            next[index] = { ...(next[index] || {}), type: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByStyle", "items"], next));
                          }}
                          placeholder="category"
                          disabled={inputDisabled}
                          helper="Examples: category, brand, style, collection"
                        />

                        <Input
                          label="Eyebrow"
                          value={item?.eyebrow || ""}
                          onChange={(e) => {
                            const next = [...(form?.shopByStyle?.items || [])];
                            next[index] = { ...(next[index] || {}), eyebrow: e.target.value };
                            setForm((prev) => setDeep(prev, ["shopByStyle", "items"], next));
                          }}
                          placeholder="Everyday edit"
                          disabled={inputDisabled}
                        />

                        <div className="md:col-span-2">
                          <Textarea
                            label="Description"
                            value={item?.description || ""}
                            onChange={(e) => {
                              const next = [...(form?.shopByStyle?.items || [])];
                              next[index] = {
                                ...(next[index] || {}),
                                description: e.target.value,
                              };
                              setForm((prev) => setDeep(prev, ["shopByStyle", "items"], next));
                            }}
                            placeholder="Short supporting text for this style card"
                            disabled={inputDisabled}
                            rows={3}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <ImageUploadField
                            label={`Style card image ${index + 1}`}
                            value={item?.img || ""}
                            onChange={(e) => {
                              const next = [...(form?.shopByStyle?.items || [])];
                              next[index] = { ...(next[index] || {}), img: e.target.value };
                              setForm((prev) => setDeep(prev, ["shopByStyle", "items"], next));
                            }}
                            onUpload={(file) =>
                              handleImageUpload(
                                `shopByStyle${index}`,
                                ["shopByStyle", "items", index, "img"],
                                file
                              )
                            }
                            uploading={uploading[`shopByStyle${index}`]}
                            disabled={readOnly || busy}
                            helper="Recommended for premium visual consistency."
                            emptyHelper="Leave empty to let storefront use fallback imagery."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">
                  Inspired by the Feed items
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Control featured inspiration cards, editorial titles, image and mood copy.
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4">
                  {(form?.instagramFeed?.items || []).slice(0, 5).map((item, index) => (
                    <div
                      key={`feed-item-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Input
                          label="Title"
                          value={item?.title || ""}
                          onChange={(e) => {
                            const next = [...(form?.instagramFeed?.items || [])];
                            next[index] = { ...(next[index] || {}), title: e.target.value };
                            setForm((prev) => setDeep(prev, ["instagramFeed", "items"], next));
                          }}
                          placeholder="Shop the look"
                          disabled={inputDisabled}
                          invalid={!String(item?.title || "").trim()}
                        />

                        <Input
                          label="Href"
                          value={item?.href || ""}
                          onChange={(e) => {
                            const next = [...(form?.instagramFeed?.items || [])];
                            next[index] = { ...(next[index] || {}), href: e.target.value };
                            setForm((prev) => setDeep(prev, ["instagramFeed", "items"], next));
                          }}
                          placeholder="/shop"
                          disabled={inputDisabled}
                          invalid={
                            Boolean(String(item?.href || "").trim()) &&
                            !isSafeUrl(item?.href)
                          }
                        />

                        <Input
                          label="Eyebrow"
                          value={item?.eyebrow || ""}
                          onChange={(e) => {
                            const next = [...(form?.instagramFeed?.items || [])];
                            next[index] = { ...(next[index] || {}), eyebrow: e.target.value };
                            setForm((prev) => setDeep(prev, ["instagramFeed", "items"], next));
                          }}
                          placeholder="Inspired edit"
                          disabled={inputDisabled}
                        />

                        <div className="md:col-span-2">
                          <Textarea
                            label="Description"
                            value={item?.description || ""}
                            onChange={(e) => {
                              const next = [...(form?.instagramFeed?.items || [])];
                              next[index] = {
                                ...(next[index] || {}),
                                description: e.target.value,
                              };
                              setForm((prev) => setDeep(prev, ["instagramFeed", "items"], next));
                            }}
                            placeholder="Short supporting text for this inspiration card"
                            disabled={inputDisabled}
                            rows={3}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <ImageUploadField
                            label={`Feed image ${index + 1}`}
                            value={item?.image || ""}
                            onChange={(e) => {
                              const next = [...(form?.instagramFeed?.items || [])];
                              next[index] = { ...(next[index] || {}), image: e.target.value };
                              setForm((prev) => setDeep(prev, ["instagramFeed", "items"], next));
                            }}
                            onUpload={(file) =>
                              handleImageUpload(
                                `instagramFeed${index}`,
                                ["instagramFeed", "items", index, "image"],
                                file
                              )
                            }
                            uploading={uploading[`instagramFeed${index}`]}
                            disabled={readOnly || busy}
                            helper="Editorial card image."
                            emptyHelper="Leave empty to use storefront fallback imagery."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="trust"
            icon={MessageSquareQuote}
            title="Trust & testimonials"
            description="Manage reassurance copy and social proof."
          >
            <div className="grid grid-cols-1 gap-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <Input
                  label="Why Choose Us title"
                  value={form?.whyChooseUs?.title}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["whyChooseUs", "title"], e.target.value))
                  }
                  placeholder="Why Choose Us"
                  disabled={inputDisabled}
                  invalid={!String(form?.whyChooseUs?.title || "").trim()}
                />

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                  {(form?.whyChooseUs?.items || []).slice(0, 3).map((item, index) => (
                    <div
                      key={`feature-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <Input
                        label="Title"
                        value={item?.title || ""}
                        onChange={(e) => {
                          const next = [...(form?.whyChooseUs?.items || [])];
                          next[index] = { ...(next[index] || {}), title: e.target.value };
                          setForm((prev) => setDeep(prev, ["whyChooseUs", "items"], next));
                        }}
                        placeholder="Premium quality"
                        disabled={inputDisabled}
                        invalid={!String(item?.title || "").trim()}
                      />

                      <div className="mt-3">
                        <Textarea
                          label="Description"
                          value={item?.description || ""}
                          onChange={(e) => {
                            const next = [...(form?.whyChooseUs?.items || [])];
                            next[index] = {
                              ...(next[index] || {}),
                              description: e.target.value,
                            };
                            setForm((prev) => setDeep(prev, ["whyChooseUs", "items"], next));
                          }}
                          placeholder="Feature description"
                          disabled={inputDisabled}
                          rows={4}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <Input
                  label="Testimonials title"
                  value={form?.testimonials?.title}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["testimonials", "title"], e.target.value))
                  }
                  placeholder="What Customers Say"
                  disabled={inputDisabled}
                  invalid={!String(form?.testimonials?.title || "").trim()}
                />

                <div className="mt-4 grid grid-cols-1 gap-4">
                  {(form?.testimonials?.items || []).slice(0, 3).map((item, index) => (
                    <div
                      key={`testimonial-${index}`}
                      className="rounded-2xl border border-gray-200 bg-white p-4"
                    >
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Input
                          label="Name"
                          value={item?.name || ""}
                          onChange={(e) => {
                            const next = [...(form?.testimonials?.items || [])];
                            next[index] = { ...(next[index] || {}), name: e.target.value };
                            setForm((prev) => setDeep(prev, ["testimonials", "items"], next));
                          }}
                          placeholder="Customer name"
                          disabled={inputDisabled}
                          invalid={!String(item?.name || "").trim()}
                        />

                        <Input
                          label="Rating (1-5)"
                          value={String(item?.rating || 5)}
                          onChange={(e) => {
                            const next = [...(form?.testimonials?.items || [])];
                            next[index] = { ...(next[index] || {}), rating: e.target.value };
                            setForm((prev) => setDeep(prev, ["testimonials", "items"], next));
                          }}
                          placeholder="5"
                          disabled={inputDisabled}
                          invalid={
                            !Number.isFinite(Number(item?.rating)) ||
                            Number(item?.rating) < 1 ||
                            Number(item?.rating) > 5
                          }
                        />

                        <div className="md:col-span-1" />
                      </div>

                      <div className="mt-3">
                        <Textarea
                          label="Quote"
                          value={item?.quote || ""}
                          onChange={(e) => {
                            const next = [...(form?.testimonials?.items || [])];
                            next[index] = { ...(next[index] || {}), quote: e.target.value };
                            setForm((prev) => setDeep(prev, ["testimonials", "items"], next));
                          }}
                          placeholder="Customer quote"
                          disabled={inputDisabled}
                          rows={4}
                          invalid={!String(item?.quote || "").trim()}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="campaign"
            icon={Sparkles}
            title="Campaign banner"
            description="Seasonal banner content shown in the middle of the homepage."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Eyebrow"
                value={form?.seasonalBanner?.eyebrow}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["seasonalBanner", "eyebrow"], e.target.value)
                  )
                }
                placeholder="Seasonal edit"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <ImageUploadField
                  label="Campaign banner image"
                  value={form?.seasonalBanner?.image}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["seasonalBanner", "image"], e.target.value)
                    )
                  }
                  onUpload={(file) =>
                    handleImageUpload("seasonalBanner", ["seasonalBanner", "image"], file)
                  }
                  uploading={uploading.seasonalBanner}
                  disabled={readOnly || busy}
                  helper="Upload a campaign image or paste a valid URL."
                  emptyHelper="Leave empty to allow a dynamic product-driven banner image."
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Title"
                  value={form?.seasonalBanner?.title}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["seasonalBanner", "title"], e.target.value)
                    )
                  }
                  placeholder="Campaign title"
                  disabled={inputDisabled}
                  invalid={!String(form?.seasonalBanner?.title || "").trim()}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={form?.seasonalBanner?.description}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["seasonalBanner", "description"], e.target.value)
                    )
                  }
                  placeholder="Campaign description"
                  disabled={inputDisabled}
                />
              </div>

              <Input
                label="Primary CTA label"
                value={form?.seasonalBanner?.ctaLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["seasonalBanner", "ctaLabel"], e.target.value)
                  )
                }
                placeholder="Shop seasonal picks"
                disabled={inputDisabled}
              />

              <Input
                label="Primary CTA href"
                value={form?.seasonalBanner?.ctaHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["seasonalBanner", "ctaHref"], e.target.value)
                  )
                }
                placeholder="/shop?sort=latest"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.seasonalBanner?.ctaHref || "").trim()) &&
                  !isSafeUrl(form?.seasonalBanner?.ctaHref)
                }
              />

              <Input
                label="Secondary CTA label"
                value={form?.seasonalBanner?.secondaryCtaLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(
                      prev,
                      ["seasonalBanner", "secondaryCtaLabel"],
                      e.target.value
                    )
                  )
                }
                placeholder="Explore latest"
                disabled={inputDisabled}
              />

              <Input
                label="Secondary CTA href"
                value={form?.seasonalBanner?.secondaryCtaHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(
                      prev,
                      ["seasonalBanner", "secondaryCtaHref"],
                      e.target.value
                    )
                  )
                }
                placeholder="/shop?sort=latest"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.seasonalBanner?.secondaryCtaHref || "").trim()) &&
                  !isSafeUrl(form?.seasonalBanner?.secondaryCtaHref)
                }
              />

              <Input
                label="Feature badge"
                value={form?.seasonalBanner?.featureBadge}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["seasonalBanner", "featureBadge"], e.target.value)
                  )
                }
                placeholder="Seasonal spotlight"
                disabled={inputDisabled}
              />

              <Input
                label="Feature text"
                value={form?.seasonalBanner?.featureText}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["seasonalBanner", "featureText"], e.target.value)
                  )
                }
                placeholder="Short supporting text"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <TextListEditor
                  title="Seasonal highlights"
                  helper="Small chips for campaign mood, focus or benefits."
                  items={form?.seasonalBanner?.highlights}
                  disabled={inputDisabled}
                  onChange={(next) =>
                    setForm((prev) =>
                      setDeep(prev, ["seasonalBanner", "highlights"], next)
                    )
                  }
                  placeholders={[
                    "Limited edit",
                    "Premium textures",
                    "Modern silhouettes",
                  ]}
                  maxItems={3}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="story"
            icon={ImageIcon}
            title="Brand story"
            description="Control the brand storytelling block near the bottom of the homepage."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Eyebrow"
                value={form?.brandStory?.eyebrow}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["brandStory", "eyebrow"], e.target.value))
                }
                placeholder="Our story"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <ImageUploadField
                  label="Brand story image"
                  value={form?.brandStory?.image}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["brandStory", "image"], e.target.value))
                  }
                  onUpload={(file) =>
                    handleImageUpload("brandStory", ["brandStory", "image"], file)
                  }
                  uploading={uploading.brandStory}
                  disabled={readOnly || busy}
                  helper="Upload a story image or paste a valid URL."
                  emptyHelper="Leave empty to use a dynamic catalog image fallback."
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Title"
                  value={form?.brandStory?.title}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["brandStory", "title"], e.target.value))
                  }
                  placeholder="Brand story title"
                  disabled={inputDisabled}
                  invalid={!String(form?.brandStory?.title || "").trim()}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={form?.brandStory?.description}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["brandStory", "description"], e.target.value)
                    )
                  }
                  placeholder="Brand story description"
                  disabled={inputDisabled}
                />
              </div>

              <Input
                label="Primary CTA label"
                value={form?.brandStory?.ctaLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["brandStory", "ctaLabel"], e.target.value)
                  )
                }
                placeholder="Explore the catalog"
                disabled={inputDisabled}
              />

              <Input
                label="Primary CTA href"
                value={form?.brandStory?.ctaHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["brandStory", "ctaHref"], e.target.value)
                  )
                }
                placeholder="/shop"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.brandStory?.ctaHref || "").trim()) &&
                  !isSafeUrl(form?.brandStory?.ctaHref)
                }
              />

              <Input
                label="Secondary CTA label"
                value={form?.brandStory?.secondaryCtaLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(
                      prev,
                      ["brandStory", "secondaryCtaLabel"],
                      e.target.value
                    )
                  )
                }
                placeholder="View latest arrivals"
                disabled={inputDisabled}
              />

              <Input
                label="Secondary CTA href"
                value={form?.brandStory?.secondaryCtaHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(
                      prev,
                      ["brandStory", "secondaryCtaHref"],
                      e.target.value
                    )
                  )
                }
                placeholder="/shop?sort=latest"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.brandStory?.secondaryCtaHref || "").trim()) &&
                  !isSafeUrl(form?.brandStory?.secondaryCtaHref)
                }
              />

              <Input
                label="Feature badge"
                value={form?.brandStory?.featureBadge}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["brandStory", "featureBadge"], e.target.value)
                  )
                }
                placeholder="Brand story"
                disabled={inputDisabled}
              />

              <Input
                label="Feature text"
                value={form?.brandStory?.featureText}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["brandStory", "featureText"], e.target.value)
                  )
                }
                placeholder="Short supporting text"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <TextListEditor
                  title="Brand story highlights"
                  helper="Short chips to reinforce brand value and premium feel."
                  items={form?.brandStory?.highlights}
                  disabled={inputDisabled}
                  onChange={(next) =>
                    setForm((prev) =>
                      setDeep(prev, ["brandStory", "highlights"], next)
                    )
                  }
                  placeholders={[
                    "Curated catalog",
                    "Cleaner discovery",
                    "Premium storefront",
                  ]}
                  maxItems={3}
                />
              </div>

              <div className="md:col-span-2">
                <StatsEditor
                  title="Brand story stats"
                  helper="Small supporting stats or proof points shown with the story block."
                  items={form?.brandStory?.stats}
                  disabled={inputDisabled}
                  onChange={(next) =>
                    setForm((prev) => setDeep(prev, ["brandStory", "stats"], next))
                  }
                  maxItems={3}
                  labelPlaceholder="Curated catalog"
                  valuePlaceholder="Live"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="newsletter"
            icon={Newspaper}
            title="Newsletter"
            description="Final conversion block and subscription copy."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Title"
                value={form?.newsletter?.title}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["newsletter", "title"], e.target.value))
                }
                placeholder="Join our newsletter"
                disabled={inputDisabled}
                invalid={!String(form?.newsletter?.title || "").trim()}
              />

              <Input
                label="Button label"
                value={form?.newsletter?.buttonLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["newsletter", "buttonLabel"], e.target.value)
                  )
                }
                placeholder="Subscribe"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={form?.newsletter?.description}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["newsletter", "description"], e.target.value)
                    )
                  }
                  placeholder="Newsletter description"
                  disabled={inputDisabled}
                />
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Input placeholder"
                  value={form?.newsletter?.placeholder}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["newsletter", "placeholder"], e.target.value)
                    )
                  }
                  placeholder="Enter your email"
                  disabled={inputDisabled}
                />
              </div>
            </div>
          </SectionCard>

          <div className="sticky bottom-0 z-10">
            <div className="rounded-[28px] border border-gray-200 bg-white/90 p-4 shadow-sm backdrop-blur">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  {readOnly ? (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
                        <Eye size={18} className="text-gray-800" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Read-only</div>
                        <div className="text-xs text-gray-600">
                          Only admin-level roles can publish home config changes.
                        </div>
                      </div>
                    </>
                  ) : hasValidationIssues ? (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50">
                        <AlertTriangle size={18} className="text-rose-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Validation required
                        </div>
                        <div className="text-xs text-gray-600">
                          Resolve form issues before saving.
                        </div>
                      </div>
                    </>
                  ) : isDirty ? (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50">
                        <AlertTriangle size={18} className="text-amber-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Unsaved changes
                        </div>
                        <div className="text-xs text-gray-600">
                          Save to publish updated home page content settings.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
                        <CheckCircle2 size={18} className="text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          All changes saved
                        </div>
                        <div className="text-xs text-gray-600">
                          Home config is up to date.
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => {
                      if (busy || anyUploading) return;
                      resetToInitial();
                      toast.info("Reverted", {
                        description: "Home config changes have been discarded.",
                      });
                    }}
                    disabled={!isDirty || busy || readOnly || anyUploading}
                  >
                    Discard
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => {
                      if (busy || readOnly || anyUploading) return;
                      resetToDefaults();
                    }}
                    disabled={busy || readOnly || anyUploading}
                  >
                    <RotateCcw size={16} />
                    Reset form
                  </button>

                  <button
                    type="button"
                    className={cx(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                      !readOnly && isDirty && !busy && !hasValidationIssues && !anyUploading
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-gray-500"
                    )}
                    onClick={onSave}
                    disabled={readOnly || !isDirty || busy || hasValidationIssues || anyUploading}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Save changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}