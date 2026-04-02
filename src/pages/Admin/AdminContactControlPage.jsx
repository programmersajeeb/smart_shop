import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  LifeBuoy,
  Save,
  RotateCcw,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ExternalLink,
  MessageSquare,
  Building2,
  HelpCircle,
  Share2,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../services/apiClient";
import { useAuth } from "../../shared/hooks/useAuth";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "Something went wrong."
  );
}

function deepClone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function sanitizeText(value, max = 200) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function normalizePhone(value) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, 30);
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
    const base = current[key] && typeof current[key] === "object" ? current[key] : {};
    current[key] = { ...base };
    current = current[key];
  }

  current[path[path.length - 1]] = value;
  return next;
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

function defaultContactConfig() {
  return {
    hero: {
      eyebrow: "Contact us",
      title: "Need help? We are here to make things easier.",
      description:
        "Whether you have a question about an order, need support, or want to reach the right team, you can contact Smart Shop in the way that works best for you.",
      image:
        "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
      primaryLabel: "Email support",
      primaryHref: "mailto:support@smartshop.com",
      secondaryLabel: "Call us",
      secondaryHref: "tel:+8801234567890",
    },

    infoCards: {
      title: "Quick ways to reach us",
      subtitle:
        "Use any of these contact options if you want a faster way to get in touch.",
      items: [
        {
          title: "Email us",
          text: "support@smartshop.com",
          icon: "mail",
        },
        {
          title: "Call support",
          text: "+880 1234-567890",
          icon: "phone",
        },
        {
          title: "Office location",
          text: "Dhaka, Bangladesh",
          icon: "mapPin",
        },
        {
          title: "Support hours",
          text: "Sat–Thu: 9:00 AM – 10:00 PM",
          icon: "clock",
        },
      ],
    },

    supportCategories: {
      title: "Choose the right team",
      subtitle:
        "Reaching the right team first usually means a faster and more helpful reply.",
      items: [
        {
          title: "Customer support",
          description:
            "For help with orders, refunds, payments, returns, or delivery updates.",
          label: "Contact support",
          href: "mailto:support@smartshop.com",
        },
        {
          title: "Business inquiries",
          description:
            "For partnerships, collaborations, bulk purchases, or other business requests.",
          label: "Contact business team",
          href: "mailto:business@smartshop.com",
        },
        {
          title: "Media and press",
          description:
            "For interviews, brand-related questions, or press communication.",
          label: "Contact press team",
          href: "mailto:press@smartshop.com",
        },
      ],
      resourceButtonLabel: "View help resources",
      resourceButtonHref: "/faq",
    },

    faq: {
      title: "Frequently asked questions",
      subtitle: "A few common questions customers usually ask before reaching out.",
      items: [
        {
          q: "How can I track my order?",
          a: "Once your order is shipped, we send a tracking update by email or SMS. You can also check your order status from your account.",
        },
        {
          q: "What is your return policy?",
          a: "Unused items in their original condition can usually be returned within 7 days. Refund timing may vary depending on the payment method.",
        },
        {
          q: "How do I contact customer support?",
          a: "You can email us at support@smartshop.com or call +880 1234-567890 during support hours.",
        },
        {
          q: "Do you offer international shipping?",
          a: "Yes, international shipping is available in selected cases. Delivery time depends on the destination and shipping option.",
        },
        {
          q: "Can I modify or cancel my order?",
          a: "If your order has not moved into processing yet, our team may still be able to help. Contact support as soon as possible.",
        },
      ],
    },

    location: {
      title: "Visit our office",
      subtitle:
        "If you need in-person assistance or want to reach the team directly, here is our office information.",
      officeName: "Smart Shop Office",
      address: "12 Gulshan Avenue, Dhaka 1212, Bangladesh",
      officeHours: "Saturday to Thursday, 10:00 AM to 6:00 PM",
      mapEmbedUrl:
        "https://www.google.com/maps?q=Gulshan%20Avenue%20Dhaka&z=14&output=embed",
    },

    finalCta: {
      eyebrow: "Need more help?",
      title: "We are ready to help you with the next step.",
      description:
        "Reach out if you still need support, have a question about your order, or want help from the team directly.",
      primaryLabel: "Live chat support",
      primaryHref: "",
      secondaryLabel: "Email us",
      secondaryHref: "mailto:support@smartshop.com",
    },

    social: {
      title: "Connect with us",
      subtitle: "Follow Smart Shop for updates, new arrivals, and brand news.",
      items: [
        { label: "Facebook", href: "https://facebook.com" },
        { label: "Instagram", href: "https://instagram.com" },
        { label: "YouTube", href: "https://youtube.com" },
        { label: "LinkedIn", href: "https://linkedin.com" },
        { label: "WhatsApp", href: "https://wa.me/+8801234567890" },
      ],
    },
  };
}

function normalizeInfoCards(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      title: sanitizeText(item?.title, 60) || `Card ${index + 1}`,
      text: sanitizeText(item?.text, 120),
      icon: sanitizeText(item?.icon, 30) || "mail",
    }))
    .slice(0, 4);

  return normalized.length ? normalized : defaultContactConfig().infoCards.items;
}

function normalizeSupportCategories(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      title: sanitizeText(item?.title, 80) || `Category ${index + 1}`,
      description: sanitizeText(item?.description, 220),
      label: sanitizeText(item?.label, 50) || "Open",
      href: normalizeUrl(item?.href),
    }))
    .slice(0, 3);

  return normalized.length ? normalized : defaultContactConfig().supportCategories.items;
}

function normalizeFaqItems(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item) => ({
      q: sanitizeText(item?.q, 180),
      a: sanitizeText(item?.a, 420),
    }))
    .filter((item) => item.q || item.a)
    .slice(0, 8);

  return normalized.length ? normalized : defaultContactConfig().faq.items;
}

function normalizeSocialItems(items) {
  const input = Array.isArray(items) ? items : [];
  const normalized = input
    .map((item, index) => ({
      label: sanitizeText(item?.label, 50) || `Social ${index + 1}`,
      href: normalizeUrl(item?.href),
    }))
    .slice(0, 6);

  return normalized.length ? normalized : defaultContactConfig().social.items;
}

function normalizeContactConfig(input) {
  const data = deepClone(input || {});
  const base = defaultContactConfig();

  data.hero = data.hero || {};
  data.infoCards = data.infoCards || {};
  data.supportCategories = data.supportCategories || {};
  data.faq = data.faq || {};
  data.location = data.location || {};
  data.finalCta = data.finalCta || {};
  data.social = data.social || {};

  data.hero.eyebrow = sanitizeText(data.hero.eyebrow || base.hero.eyebrow, 40);
  data.hero.title = sanitizeText(data.hero.title || base.hero.title, 140);
  data.hero.description = sanitizeText(
    data.hero.description || base.hero.description,
    320
  );
  data.hero.image = normalizeUrl(data.hero.image || base.hero.image);
  data.hero.primaryLabel = sanitizeText(
    data.hero.primaryLabel || base.hero.primaryLabel,
    40
  );
  data.hero.primaryHref = normalizeUrl(data.hero.primaryHref || base.hero.primaryHref);
  data.hero.secondaryLabel = sanitizeText(
    data.hero.secondaryLabel || base.hero.secondaryLabel,
    40
  );
  data.hero.secondaryHref = normalizeUrl(
    data.hero.secondaryHref || base.hero.secondaryHref
  );

  data.infoCards.title = sanitizeText(data.infoCards.title || base.infoCards.title, 80);
  data.infoCards.subtitle = sanitizeText(
    data.infoCards.subtitle || base.infoCards.subtitle,
    220
  );
  data.infoCards.items = normalizeInfoCards(data.infoCards.items);

  data.supportCategories.title = sanitizeText(
    data.supportCategories.title || base.supportCategories.title,
    80
  );
  data.supportCategories.subtitle = sanitizeText(
    data.supportCategories.subtitle || base.supportCategories.subtitle,
    220
  );
  data.supportCategories.items = normalizeSupportCategories(
    data.supportCategories.items
  );
  data.supportCategories.resourceButtonLabel = sanitizeText(
    data.supportCategories.resourceButtonLabel ||
      base.supportCategories.resourceButtonLabel,
    50
  );
  data.supportCategories.resourceButtonHref = normalizeUrl(
    data.supportCategories.resourceButtonHref ||
      base.supportCategories.resourceButtonHref
  );

  data.faq.title = sanitizeText(data.faq.title || base.faq.title, 80);
  data.faq.subtitle = sanitizeText(data.faq.subtitle || base.faq.subtitle, 220);
  data.faq.items = normalizeFaqItems(data.faq.items);

  data.location.title = sanitizeText(data.location.title || base.location.title, 80);
  data.location.subtitle = sanitizeText(
    data.location.subtitle || base.location.subtitle,
    220
  );
  data.location.officeName = sanitizeText(
    data.location.officeName || base.location.officeName,
    80
  );
  data.location.address = sanitizeText(
    data.location.address || base.location.address,
    220
  );
  data.location.officeHours = sanitizeText(
    data.location.officeHours || base.location.officeHours,
    120
  );
  data.location.mapEmbedUrl = normalizeUrl(
    data.location.mapEmbedUrl || base.location.mapEmbedUrl
  );

  data.finalCta.eyebrow = sanitizeText(
    data.finalCta.eyebrow || base.finalCta.eyebrow,
    40
  );
  data.finalCta.title = sanitizeText(data.finalCta.title || base.finalCta.title, 140);
  data.finalCta.description = sanitizeText(
    data.finalCta.description || base.finalCta.description,
    280
  );
  data.finalCta.primaryLabel = sanitizeText(
    data.finalCta.primaryLabel || base.finalCta.primaryLabel,
    50
  );
  data.finalCta.primaryHref = normalizeUrl(
    data.finalCta.primaryHref || base.finalCta.primaryHref
  );
  data.finalCta.secondaryLabel = sanitizeText(
    data.finalCta.secondaryLabel || base.finalCta.secondaryLabel,
    50
  );
  data.finalCta.secondaryHref = normalizeUrl(
    data.finalCta.secondaryHref || base.finalCta.secondaryHref
  );

  data.social.title = sanitizeText(data.social.title || base.social.title, 80);
  data.social.subtitle = sanitizeText(
    data.social.subtitle || base.social.subtitle,
    220
  );
  data.social.items = normalizeSocialItems(data.social.items);

  return data;
}

function collectValidationIssues(config) {
  const issues = [];

  const addRequiredIssue = (label, value) => {
    if (!String(value || "").trim()) {
      issues.push(`${label} is required.`);
    }
  };

  const addUrlIssue = (label, value) => {
    const raw = String(value || "").trim();
    if (raw && !isSafeUrl(raw)) {
      issues.push(`${label} must be a valid relative path or http/https URL.`);
    }
  };

  addRequiredIssue("Hero title", config?.hero?.title);
  addRequiredIssue("Hero description", config?.hero?.description);
  addRequiredIssue("Info cards title", config?.infoCards?.title);
  addRequiredIssue("Support categories title", config?.supportCategories?.title);
  addRequiredIssue("FAQ title", config?.faq?.title);
  addRequiredIssue("Location title", config?.location?.title);
  addRequiredIssue("Final CTA title", config?.finalCta?.title);
  addRequiredIssue("Social title", config?.social?.title);

  addUrlIssue("Hero image", config?.hero?.image);
  addUrlIssue("Hero primary action", config?.hero?.primaryHref);
  addUrlIssue("Hero secondary action", config?.hero?.secondaryHref);
  addUrlIssue(
    "Support resources button",
    config?.supportCategories?.resourceButtonHref
  );
  addUrlIssue("Map embed URL", config?.location?.mapEmbedUrl);
  addUrlIssue("Final CTA primary action", config?.finalCta?.primaryHref);
  addUrlIssue("Final CTA secondary action", config?.finalCta?.secondaryHref);

  for (const [index, item] of (config?.infoCards?.items || []).entries()) {
    if (!String(item?.title || "").trim()) {
      issues.push(`Info card ${index + 1} title is required.`);
    }
    if (!String(item?.text || "").trim()) {
      issues.push(`Info card ${index + 1} text is required.`);
    }
  }

  for (const [index, item] of (config?.supportCategories?.items || []).entries()) {
    if (!String(item?.title || "").trim()) {
      issues.push(`Support category ${index + 1} title is required.`);
    }
    if (!String(item?.description || "").trim()) {
      issues.push(`Support category ${index + 1} description is required.`);
    }
    if (!String(item?.label || "").trim()) {
      issues.push(`Support category ${index + 1} button label is required.`);
    }
    addUrlIssue(`Support category ${index + 1} action`, item?.href);
  }

  for (const [index, item] of (config?.faq?.items || []).entries()) {
    if (!String(item?.q || "").trim()) {
      issues.push(`FAQ ${index + 1} question is required.`);
    }
    if (!String(item?.a || "").trim()) {
      issues.push(`FAQ ${index + 1} answer is required.`);
    }
  }

  for (const [index, item] of (config?.social?.items || []).entries()) {
    if (!String(item?.label || "").trim()) {
      issues.push(`Social link ${index + 1} label is required.`);
    }
    addUrlIssue(`Social link ${index + 1}`, item?.href);
  }

  return Array.from(new Set(issues));
}

function getDirtySections(initialString, currentString, normalizedForm) {
  if (!initialString || initialString === currentString) return [];

  const sections = [];
  const current = normalizedForm || {};

  if (current.hero) sections.push("Hero");
  if (current.infoCards) sections.push("Contact cards");
  if (current.supportCategories) sections.push("Support categories");
  if (current.faq) sections.push("FAQ");
  if (current.location) sections.push("Location");
  if (current.finalCta) sections.push("Final CTA");
  if (current.social) sections.push("Social links");

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

export default function AdminContactControlPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [active, setActive] = useState("hero");
  const [form, setForm] = useState(() => normalizeContactConfig({}));

  const initialRef = useRef(stableStringify(normalizeContactConfig({})));
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
      { id: "hero", label: "Hero" },
      { id: "contact-cards", label: "Contact cards" },
      { id: "support-categories", label: "Support categories" },
      { id: "faq", label: "FAQ" },
      { id: "location", label: "Location" },
      { id: "final-cta", label: "Final CTA" },
      { id: "social", label: "Social links" },
    ],
    []
  );

  const configQuery = useQuery({
    queryKey: ["contactPageConfig"],
    enabled: Boolean(canRead),
    queryFn: async () => {
      const response = await api.get(makeApiPath("/page-config/contact"));
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!configQuery.data?.data) return;

    const normalized = normalizeContactConfig(configQuery.data.data);
    setForm(normalized);
    initialRef.current = stableStringify(normalized);

    if (typeof configQuery.data?.version === "number") {
      versionRef.current = configQuery.data.version;
    }
  }, [configQuery.data]);

  const normalizedForm = useMemo(() => normalizeContactConfig(form), [form]);
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
        makeApiPath("/page-config/contact"),
        payload,
        headers ? { headers } : undefined
      );

      return response.data;
    },
    onSuccess: (data) => {
      const normalized = normalizeContactConfig(data?.data || form);
      setForm(normalized);
      initialRef.current = stableStringify(normalized);
      queryClient.setQueryData(["contactPageConfig"], data);

      if (typeof data?.version === "number") {
        versionRef.current = data.version;
      }

      toast.success("Contact page settings saved", {
        description: "Contact page content and structure have been updated.",
      });
    },
    onError: async (error) => {
      const status = error?.response?.status;

      if (status === 409) {
        toast.error("Version conflict", {
          description:
            "Another admin updated the contact page settings. Reloading the latest version...",
        });
        await queryClient.invalidateQueries({ queryKey: ["contactPageConfig"] });
        await configQuery.refetch();
        return;
      }

      if (status === 403) {
        toast.error("Save not allowed", {
          description:
            "Your current role cannot publish contact page configuration changes.",
        });
        return;
      }

      toast.error("Save failed", { description: getErrorMessage(error) });
    },
  });

  const busy = saveMutation.isPending;
  const inputDisabled = busy || readOnly;

  function scrollTo(id) {
    setActive(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetToInitial() {
    const initial = configQuery.data?.data
      ? normalizeContactConfig(configQuery.data.data)
      : normalizeContactConfig({});
    setForm(initial);
  }

  function resetToDefaults() {
    setForm(normalizeContactConfig(defaultContactConfig()));
  }

  function onSave() {
    if (readOnly || busy || !isDirty) return;

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
          <AlertTriangle size={18} className="mt-0.5 text-rose-600" />
          <div className="min-w-0">
            <div className="text-lg font-semibold">Permission required</div>
            <div className="mt-1 text-sm text-gray-600">
              You do not have access to contact page configuration.
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
          Loading contact page settings...
        </div>
      </div>
    );
  }

  if (configQuery.isError) {
    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 text-rose-600" />
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
              <Phone size={14} />
              Contact Page CMS
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              Contact Page Control
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Manage contact page messaging, support paths, office details, FAQ items,
              and social links from one place.
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
                      You can review contact page settings, but only admin-level roles can publish updates.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/contact"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <ExternalLink size={16} />
              Preview page
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
                Jump between contact page blocks
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
            icon={Phone}
            title="Hero"
            description="Contact page heading, supporting text, image, and two primary actions."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Eyebrow"
                value={form?.hero?.eyebrow}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["hero", "eyebrow"], e.target.value))
                }
                placeholder="Contact us"
                disabled={inputDisabled}
              />

              <Input
                label="Image URL"
                value={form?.hero?.image}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["hero", "image"], e.target.value))
                }
                placeholder="https://..."
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.hero?.image || "").trim()) &&
                  !isSafeUrl(form?.hero?.image)
                }
              />

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
                label="Primary button label"
                value={form?.hero?.primaryLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "primaryLabel"], e.target.value)
                  )
                }
                placeholder="Email support"
                disabled={inputDisabled}
              />

              <Input
                label="Primary button href"
                value={form?.hero?.primaryHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "primaryHref"], e.target.value)
                  )
                }
                placeholder="mailto:support@smartshop.com"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.hero?.primaryHref || "").trim()) &&
                  !isSafeUrl(form?.hero?.primaryHref)
                }
              />

              <Input
                label="Secondary button label"
                value={form?.hero?.secondaryLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "secondaryLabel"], e.target.value)
                  )
                }
                placeholder="Call us"
                disabled={inputDisabled}
              />

              <Input
                label="Secondary button href"
                value={form?.hero?.secondaryHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["hero", "secondaryHref"], e.target.value)
                  )
                }
                placeholder="tel:+8801234567890"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.hero?.secondaryHref || "").trim()) &&
                  !isSafeUrl(form?.hero?.secondaryHref)
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="contact-cards"
            icon={Mail}
            title="Contact cards"
            description="Quick contact options shown beneath the hero."
          >
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Section title"
                value={form?.infoCards?.title}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["infoCards", "title"], e.target.value))
                }
                placeholder="Quick ways to reach us"
                disabled={inputDisabled}
                invalid={!String(form?.infoCards?.title || "").trim()}
              />

              <Textarea
                label="Section subtitle"
                value={form?.infoCards?.subtitle}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["infoCards", "subtitle"], e.target.value)
                  )
                }
                placeholder="Subtitle"
                disabled={inputDisabled}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(form?.infoCards?.items || []).slice(0, 4).map((item, index) => (
                  <div
                    key={`info-card-${index}`}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      Card {index + 1}
                    </div>

                    <div className="mt-4 space-y-4">
                      <Input
                        label="Title"
                        value={item?.title || ""}
                        onChange={(e) => {
                          const next = [...(form?.infoCards?.items || [])];
                          next[index] = { ...(next[index] || {}), title: e.target.value };
                          setForm((prev) => setDeep(prev, ["infoCards", "items"], next));
                        }}
                        placeholder="Email us"
                        disabled={inputDisabled}
                        invalid={!String(item?.title || "").trim()}
                      />

                      <Input
                        label="Text"
                        value={item?.text || ""}
                        onChange={(e) => {
                          const next = [...(form?.infoCards?.items || [])];
                          next[index] = { ...(next[index] || {}), text: e.target.value };
                          setForm((prev) => setDeep(prev, ["infoCards", "items"], next));
                        }}
                        placeholder="support@smartshop.com"
                        disabled={inputDisabled}
                        invalid={!String(item?.text || "").trim()}
                      />

                      <Input
                        label="Icon key"
                        value={item?.icon || ""}
                        onChange={(e) => {
                          const next = [...(form?.infoCards?.items || [])];
                          next[index] = { ...(next[index] || {}), icon: e.target.value };
                          setForm((prev) => setDeep(prev, ["infoCards", "items"], next));
                        }}
                        placeholder="mail / phone / mapPin / clock"
                        disabled={inputDisabled}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="support-categories"
            icon={LifeBuoy}
            title="Support categories"
            description="Cards that route visitors to the right team quickly."
          >
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Section title"
                value={form?.supportCategories?.title}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["supportCategories", "title"], e.target.value)
                  )
                }
                placeholder="Choose the right team"
                disabled={inputDisabled}
                invalid={!String(form?.supportCategories?.title || "").trim()}
              />

              <Textarea
                label="Section subtitle"
                value={form?.supportCategories?.subtitle}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["supportCategories", "subtitle"], e.target.value)
                  )
                }
                placeholder="Subtitle"
                disabled={inputDisabled}
              />

              <div className="grid grid-cols-1 gap-4">
                {(form?.supportCategories?.items || []).slice(0, 3).map((item, index) => (
                  <div
                    key={`category-${index}`}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      Category {index + 1}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Input
                        label="Title"
                        value={item?.title || ""}
                        onChange={(e) => {
                          const next = [...(form?.supportCategories?.items || [])];
                          next[index] = { ...(next[index] || {}), title: e.target.value };
                          setForm((prev) =>
                            setDeep(prev, ["supportCategories", "items"], next)
                          );
                        }}
                        placeholder="Customer support"
                        disabled={inputDisabled}
                        invalid={!String(item?.title || "").trim()}
                      />

                      <Input
                        label="Button label"
                        value={item?.label || ""}
                        onChange={(e) => {
                          const next = [...(form?.supportCategories?.items || [])];
                          next[index] = { ...(next[index] || {}), label: e.target.value };
                          setForm((prev) =>
                            setDeep(prev, ["supportCategories", "items"], next)
                          );
                        }}
                        placeholder="Contact support"
                        disabled={inputDisabled}
                        invalid={!String(item?.label || "").trim()}
                      />

                      <div className="md:col-span-2">
                        <Textarea
                          label="Description"
                          value={item?.description || ""}
                          onChange={(e) => {
                            const next = [...(form?.supportCategories?.items || [])];
                            next[index] = {
                              ...(next[index] || {}),
                              description: e.target.value,
                            };
                            setForm((prev) =>
                              setDeep(prev, ["supportCategories", "items"], next)
                            );
                          }}
                          placeholder="Description"
                          disabled={inputDisabled}
                          invalid={!String(item?.description || "").trim()}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <Input
                          label="Action href"
                          value={item?.href || ""}
                          onChange={(e) => {
                            const next = [...(form?.supportCategories?.items || [])];
                            next[index] = { ...(next[index] || {}), href: e.target.value };
                            setForm((prev) =>
                              setDeep(prev, ["supportCategories", "items"], next)
                            );
                          }}
                          placeholder="mailto:support@smartshop.com"
                          disabled={inputDisabled}
                          invalid={
                            Boolean(String(item?.href || "").trim()) &&
                            !isSafeUrl(item?.href)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Input
                  label="Resources button label"
                  value={form?.supportCategories?.resourceButtonLabel}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(
                        prev,
                        ["supportCategories", "resourceButtonLabel"],
                        e.target.value
                      )
                    )
                  }
                  placeholder="View help resources"
                  disabled={inputDisabled}
                />

                <Input
                  label="Resources button href"
                  value={form?.supportCategories?.resourceButtonHref}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(
                        prev,
                        ["supportCategories", "resourceButtonHref"],
                        e.target.value
                      )
                    )
                  }
                  placeholder="/faq"
                  disabled={inputDisabled}
                  invalid={
                    Boolean(String(form?.supportCategories?.resourceButtonHref || "").trim()) &&
                    !isSafeUrl(form?.supportCategories?.resourceButtonHref)
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="faq"
            icon={HelpCircle}
            title="FAQ"
            description="Common customer questions shown on the contact page."
          >
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Section title"
                value={form?.faq?.title}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["faq", "title"], e.target.value))
                }
                placeholder="Frequently asked questions"
                disabled={inputDisabled}
                invalid={!String(form?.faq?.title || "").trim()}
              />

              <Textarea
                label="Section subtitle"
                value={form?.faq?.subtitle}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["faq", "subtitle"], e.target.value))
                }
                placeholder="Subtitle"
                disabled={inputDisabled}
              />

              <div className="space-y-4">
                {(form?.faq?.items || []).slice(0, 5).map((item, index) => (
                  <div
                    key={`faq-${index}`}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      FAQ {index + 1}
                    </div>

                    <div className="mt-4 space-y-4">
                      <Input
                        label="Question"
                        value={item?.q || ""}
                        onChange={(e) => {
                          const next = [...(form?.faq?.items || [])];
                          next[index] = { ...(next[index] || {}), q: e.target.value };
                          setForm((prev) => setDeep(prev, ["faq", "items"], next));
                        }}
                        placeholder="Question"
                        disabled={inputDisabled}
                        invalid={!String(item?.q || "").trim()}
                      />

                      <Textarea
                        label="Answer"
                        value={item?.a || ""}
                        onChange={(e) => {
                          const next = [...(form?.faq?.items || [])];
                          next[index] = { ...(next[index] || {}), a: e.target.value };
                          setForm((prev) => setDeep(prev, ["faq", "items"], next));
                        }}
                        placeholder="Answer"
                        disabled={inputDisabled}
                        invalid={!String(item?.a || "").trim()}
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="location"
            icon={Building2}
            title="Location"
            description="Office details and embedded map section."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Section title"
                value={form?.location?.title}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["location", "title"], e.target.value))
                }
                placeholder="Visit our office"
                disabled={inputDisabled}
                invalid={!String(form?.location?.title || "").trim()}
              />

              <Input
                label="Office name"
                value={form?.location?.officeName}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["location", "officeName"], e.target.value)
                  )
                }
                placeholder="Smart Shop Office"
                disabled={inputDisabled}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Section subtitle"
                  value={form?.location?.subtitle}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["location", "subtitle"], e.target.value)
                    )
                  }
                  placeholder="Subtitle"
                  disabled={inputDisabled}
                  rows={3}
                />
              </div>

              <div className="md:col-span-2">
                <Textarea
                  label="Address"
                  value={form?.location?.address}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["location", "address"], e.target.value)
                    )
                  }
                  placeholder="Address"
                  disabled={inputDisabled}
                  invalid={!String(form?.location?.address || "").trim()}
                  rows={3}
                />
              </div>

              <Input
                label="Office hours"
                value={form?.location?.officeHours}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["location", "officeHours"], e.target.value)
                  )
                }
                placeholder="Saturday to Thursday, 10:00 AM to 6:00 PM"
                disabled={inputDisabled}
              />

              <Input
                label="Map embed URL"
                value={form?.location?.mapEmbedUrl}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["location", "mapEmbedUrl"], e.target.value)
                  )
                }
                placeholder="https://www.google.com/maps..."
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.location?.mapEmbedUrl || "").trim()) &&
                  !isSafeUrl(form?.location?.mapEmbedUrl)
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="final-cta"
            icon={MessageSquare}
            title="Final CTA"
            description="Bottom support call-to-action block."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Input
                label="Eyebrow"
                value={form?.finalCta?.eyebrow}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["finalCta", "eyebrow"], e.target.value)
                  )
                }
                placeholder="Need more help?"
                disabled={inputDisabled}
              />

              <Input
                label="Title"
                value={form?.finalCta?.title}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["finalCta", "title"], e.target.value)
                  )
                }
                placeholder="We are ready to help you with the next step."
                disabled={inputDisabled}
                invalid={!String(form?.finalCta?.title || "").trim()}
              />

              <div className="md:col-span-2">
                <Textarea
                  label="Description"
                  value={form?.finalCta?.description}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["finalCta", "description"], e.target.value)
                    )
                  }
                  placeholder="Description"
                  disabled={inputDisabled}
                  rows={3}
                />
              </div>

              <Input
                label="Primary button label"
                value={form?.finalCta?.primaryLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["finalCta", "primaryLabel"], e.target.value)
                  )
                }
                placeholder="Live chat support"
                disabled={inputDisabled}
              />

              <Input
                label="Primary button href"
                value={form?.finalCta?.primaryHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["finalCta", "primaryHref"], e.target.value)
                  )
                }
                placeholder="/support"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.finalCta?.primaryHref || "").trim()) &&
                  !isSafeUrl(form?.finalCta?.primaryHref)
                }
              />

              <Input
                label="Secondary button label"
                value={form?.finalCta?.secondaryLabel}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["finalCta", "secondaryLabel"], e.target.value)
                  )
                }
                placeholder="Email us"
                disabled={inputDisabled}
              />

              <Input
                label="Secondary button href"
                value={form?.finalCta?.secondaryHref}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["finalCta", "secondaryHref"], e.target.value)
                  )
                }
                placeholder="mailto:support@smartshop.com"
                disabled={inputDisabled}
                invalid={
                  Boolean(String(form?.finalCta?.secondaryHref || "").trim()) &&
                  !isSafeUrl(form?.finalCta?.secondaryHref)
                }
              />
            </div>
          </SectionCard>

          <SectionCard
            id="social"
            icon={Share2}
            title="Social links"
            description="Bottom social section heading and external links."
          >
            <div className="grid grid-cols-1 gap-4">
              <Input
                label="Section title"
                value={form?.social?.title}
                onChange={(e) =>
                  setForm((prev) => setDeep(prev, ["social", "title"], e.target.value))
                }
                placeholder="Connect with us"
                disabled={inputDisabled}
                invalid={!String(form?.social?.title || "").trim()}
              />

              <Textarea
                label="Section subtitle"
                value={form?.social?.subtitle}
                onChange={(e) =>
                  setForm((prev) =>
                    setDeep(prev, ["social", "subtitle"], e.target.value)
                  )
                }
                placeholder="Subtitle"
                disabled={inputDisabled}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(form?.social?.items || []).slice(0, 5).map((item, index) => (
                  <div
                    key={`social-${index}`}
                    className="rounded-2xl border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="text-sm font-semibold text-gray-900">
                      Link {index + 1}
                    </div>

                    <div className="mt-4 space-y-4">
                      <Input
                        label="Label"
                        value={item?.label || ""}
                        onChange={(e) => {
                          const next = [...(form?.social?.items || [])];
                          next[index] = { ...(next[index] || {}), label: e.target.value };
                          setForm((prev) => setDeep(prev, ["social", "items"], next));
                        }}
                        placeholder="Facebook"
                        disabled={inputDisabled}
                        invalid={!String(item?.label || "").trim()}
                      />

                      <Input
                        label="URL"
                        value={item?.href || ""}
                        onChange={(e) => {
                          const next = [...(form?.social?.items || [])];
                          next[index] = { ...(next[index] || {}), href: e.target.value };
                          setForm((prev) => setDeep(prev, ["social", "items"], next));
                        }}
                        placeholder="https://facebook.com"
                        disabled={inputDisabled}
                        invalid={
                          Boolean(String(item?.href || "").trim()) &&
                          !isSafeUrl(item?.href)
                        }
                      />
                    </div>
                  </div>
                ))}
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
                        <ShieldAlert size={18} className="text-gray-800" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Read-only</div>
                        <div className="text-xs text-gray-600">
                          Only admin-level roles can publish contact page changes.
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
                          Save to publish updated contact page content.
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
                          Contact page settings are up to date.
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
                      if (busy) return;
                      resetToInitial();
                      toast.info("Reverted", {
                        description: "Contact page changes have been discarded.",
                      });
                    }}
                    disabled={!isDirty || busy || readOnly}
                  >
                    Discard
                  </button>

                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                    onClick={() => {
                      if (busy || readOnly) return;
                      resetToDefaults();
                    }}
                    disabled={busy || readOnly}
                  >
                    <RotateCcw size={16} />
                    Reset form
                  </button>

                  <button
                    type="button"
                    className={cx(
                      "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold transition",
                      !readOnly && isDirty && !busy && !hasValidationIssues
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-gray-500"
                    )}
                    onClick={onSave}
                    disabled={readOnly || !isDirty || busy || hasValidationIssues}
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