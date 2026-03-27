import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Store,
  Palette,
  ShoppingCart,
  Bell,
  Shield,
  Database,
  Save,
  RotateCcw,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Eye,
  ShieldAlert,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import api from "../../services/apiClient";
import AdminSettingsSkeleton from "../../shared/components/ui/skeletons/AdminSettingsSkeleton";
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

function isSafeUrl(raw) {
  const value = String(raw || "").trim();
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

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(String(email || "").trim());
}

function normalizeEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  return isValidEmail(value) ? value : "";
}

function normalizeEmails(list) {
  const input = Array.isArray(list) ? list : [];
  const output = [];
  const seen = new Set();

  for (const raw of input) {
    const email = normalizeEmail(raw);
    if (!email) continue;
    if (seen.has(email)) continue;
    seen.add(email);
    output.push(email);
  }

  return output.slice(0, 25);
}

function clampInt(value, min, max, fallback) {
  const num = Number(value);
  if (!Number.isFinite(num)) return fallback;
  const rounded = Math.round(num);
  return Math.min(max, Math.max(min, rounded));
}

const DEFAULTS = {
  storeName: "",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  primaryColor: "#000000",
  allowGuestCheckout: false,
  lowStockThreshold: 5,
  autoCancelUnpaidMinutes: 30,
  sessionMaxAgeDays: 30,
  auditLogRetentionDays: 90,
  maintenanceMessage: "We are performing scheduled maintenance. Please try again soon.",
};

function defaultSettings() {
  return {
    store: {
      name: DEFAULTS.storeName,
      supportEmail: "",
      supportPhone: "",
      address: "",
      currency: DEFAULTS.currency,
      timezone: DEFAULTS.timezone,
    },
    branding: {
      logoUrl: "",
      faviconUrl: "",
      primaryColor: DEFAULTS.primaryColor,
      enableDarkMode: false,
    },
    commerce: {
      lowStockThreshold: DEFAULTS.lowStockThreshold,
      allowBackorders: false,
      allowGuestCheckout: DEFAULTS.allowGuestCheckout,
      autoCancelUnpaidMinutes: DEFAULTS.autoCancelUnpaidMinutes,
    },
    notifications: {
      notifyNewOrder: false,
      notifyLowStock: false,
      emails: [],
    },
    security: {
      require2FAForAdmins: false,
      sessionMaxAgeDays: DEFAULTS.sessionMaxAgeDays,
      ipAllowlist: "",
    },
    data: {
      auditLogRetentionDays: DEFAULTS.auditLogRetentionDays,
    },
    site: {
      maintenanceMode: false,
      maintenanceMessage: DEFAULTS.maintenanceMessage,
    },
  };
}

function normalizeSettings(input) {
  const data = deepClone(input || {});
  const base = defaultSettings();

  data.store = data.store || {};
  data.branding = data.branding || {};
  data.commerce = data.commerce || {};
  data.notifications = data.notifications || {};
  data.security = data.security || {};
  data.data = data.data || {};
  data.site = data.site || {};

  data.store.name = String(data.store.name || base.store.name)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  data.store.supportEmail = normalizeEmail(data.store.supportEmail).slice(0, 120);
  data.store.supportPhone = String(data.store.supportPhone || "").trim().slice(0, 40);

  data.store.address = String(data.store.address || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  data.store.currency =
    String(data.store.currency || base.store.currency)
      .trim()
      .toUpperCase()
      .slice(0, 8) || base.store.currency;

  data.store.timezone =
    String(data.store.timezone || base.store.timezone).trim().slice(0, 60) ||
    base.store.timezone;

  data.branding.logoUrl = normalizeUrl(data.branding.logoUrl).slice(0, 500);
  data.branding.faviconUrl = normalizeUrl(data.branding.faviconUrl).slice(0, 500);
  data.branding.primaryColor =
    String(data.branding.primaryColor || base.branding.primaryColor)
      .trim()
      .slice(0, 30) || base.branding.primaryColor;

  data.branding.enableDarkMode =
    typeof data.branding.enableDarkMode === "boolean"
      ? data.branding.enableDarkMode
      : false;

  data.commerce.lowStockThreshold = clampInt(
    data.commerce.lowStockThreshold,
    0,
    9999,
    base.commerce.lowStockThreshold
  );

  data.commerce.allowBackorders =
    typeof data.commerce.allowBackorders === "boolean"
      ? data.commerce.allowBackorders
      : false;

  data.commerce.allowGuestCheckout =
    typeof data.commerce.allowGuestCheckout === "boolean"
      ? data.commerce.allowGuestCheckout
      : base.commerce.allowGuestCheckout;

  data.commerce.autoCancelUnpaidMinutes = clampInt(
    data.commerce.autoCancelUnpaidMinutes,
    0,
    7 * 24 * 60,
    base.commerce.autoCancelUnpaidMinutes
  );

  data.notifications.notifyNewOrder =
    typeof data.notifications.notifyNewOrder === "boolean"
      ? data.notifications.notifyNewOrder
      : false;

  data.notifications.notifyLowStock =
    typeof data.notifications.notifyLowStock === "boolean"
      ? data.notifications.notifyLowStock
      : false;

  data.notifications.emails = normalizeEmails(data.notifications.emails);

  data.security.require2FAForAdmins =
    typeof data.security.require2FAForAdmins === "boolean"
      ? data.security.require2FAForAdmins
      : false;

  data.security.sessionMaxAgeDays = clampInt(
    data.security.sessionMaxAgeDays,
    1,
    365,
    base.security.sessionMaxAgeDays
  );

  data.security.ipAllowlist = String(data.security.ipAllowlist || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  data.data.auditLogRetentionDays = clampInt(
    data.data.auditLogRetentionDays,
    7,
    3650,
    base.data.auditLogRetentionDays
  );

  data.site.maintenanceMode =
    typeof data.site.maintenanceMode === "boolean"
      ? data.site.maintenanceMode
      : false;

  data.site.maintenanceMessage = String(
    data.site.maintenanceMessage || base.site.maintenanceMessage
  )
    .trim()
    .slice(0, 220);

  if (!data.site.maintenanceMessage) {
    data.site.maintenanceMessage = base.site.maintenanceMessage;
  }

  return data;
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

function collectValidationIssues(config) {
  const issues = [];

  if (config?.store?.supportEmail && !isValidEmail(config.store.supportEmail)) {
    issues.push("Support email must be a valid email address.");
  }

  if (config?.branding?.logoUrl && !isSafeUrl(config.branding.logoUrl)) {
    issues.push("Logo URL must be a valid relative path or http/https URL.");
  }

  if (config?.branding?.faviconUrl && !isSafeUrl(config.branding.faviconUrl)) {
    issues.push("Favicon URL must be a valid relative path or http/https URL.");
  }

  if (
    !/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
      String(config?.branding?.primaryColor || "").trim()
    )
  ) {
    issues.push("Primary color must be a valid hex color like #000000.");
  }

  const emails = Array.isArray(config?.notifications?.emails)
    ? config.notifications.emails
    : [];
  emails.forEach((email, index) => {
    if (!isValidEmail(email)) {
      issues.push(`Notification email ${index + 1} is invalid.`);
    }
  });

  if (!String(config?.site?.maintenanceMessage || "").trim()) {
    issues.push("Maintenance message is required.");
  }

  if (!String(config?.store?.currency || "").trim()) {
    issues.push("Currency is required.");
  }

  if (!String(config?.store?.timezone || "").trim()) {
    issues.push("Timezone is required.");
  }

  return Array.from(new Set(issues));
}

function getDirtySections(initialString, currentString) {
  if (!initialString || initialString === currentString) return [];
  return [
    "Store profile",
    "Branding & UI",
    "Commerce rules",
    "Notifications",
    "Security",
    "Site & maintenance",
    "Data & logs",
  ];
}

export default function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [active, setActive] = useState("store");
  const [form, setForm] = useState(() => normalizeSettings({}));

  const initialRef = useRef(stableStringify(normalizeSettings({})));
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

  const canWrite = isSuper || userPerms.includes("settings:write");
  const canRead = canWrite || userPerms.includes("settings:read");
  const readOnly = !canWrite;

  const sections = useMemo(
    () => [
      {
        id: "store",
        label: "Store profile",
        icon: Store,
      },
      {
        id: "branding",
        label: "Branding & UI",
        icon: Palette,
      },
      {
        id: "commerce",
        label: "Commerce rules",
        icon: ShoppingCart,
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
      },
      {
        id: "security",
        label: "Security",
        icon: Shield,
      },
      {
        id: "site",
        label: "Site & maintenance",
        icon: Eye,
      },
      {
        id: "data",
        label: "Data & logs",
        icon: Database,
      },
    ],
    []
  );

  const settingsQuery = useQuery({
    queryKey: ["adminSettings"],
    enabled: Boolean(canRead),
    queryFn: async () => {
      const response = await api.get(makeApiPath("/page-config/admin-settings"));
      return response.data;
    },
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!settingsQuery.data?.data) return;

    const normalized = normalizeSettings(settingsQuery.data.data);
    setForm(normalized);
    initialRef.current = stableStringify(normalized);

    if (typeof settingsQuery.data?.version === "number") {
      versionRef.current = settingsQuery.data.version;
    }
  }, [settingsQuery.data]);

  const normalizedForm = useMemo(() => normalizeSettings(form), [form]);
  const currentString = useMemo(() => stableStringify(normalizedForm), [normalizedForm]);

  const isDirty = useMemo(() => {
    return currentString !== initialRef.current;
  }, [currentString]);

  const validationIssues = useMemo(
    () => collectValidationIssues(normalizedForm),
    [normalizedForm]
  );
  const hasValidationIssues = validationIssues.length > 0;

  const dirtySections = useMemo(() => {
    return getDirtySections(initialRef.current, currentString);
  }, [currentString]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const version = versionRef.current;
      const headers = version != null ? { "If-Match": String(version) } : undefined;

      const response = await api.put(
        makeApiPath("/page-config/admin-settings"),
        payload,
        headers ? { headers } : undefined
      );

      return response.data;
    },
    onSuccess: (data) => {
      const normalized = normalizeSettings(data?.data || form);
      setForm(normalized);
      initialRef.current = stableStringify(normalized);
      queryClient.setQueryData(["adminSettings"], data);

      if (typeof data?.version === "number") {
        versionRef.current = data.version;
      }

      toast.success("Settings saved", {
        description: "Changes have been applied and audit logged.",
      });
    },
    onError: async (error) => {
      const status = error?.response?.status;

      if (status === 409) {
        toast.error("Version conflict", {
          description: "Another admin updated settings. Reloading the latest version...",
        });
        await queryClient.invalidateQueries({ queryKey: ["adminSettings"] });
        await settingsQuery.refetch();
        return;
      }

      toast.error("Save failed", { description: getErrorMessage(error) });
    },
  });

  const busy = saveMutation.isPending;
  const inputDisabled = busy || readOnly;

  const meta = settingsQuery.data
    ? {
        updatedAt: settingsQuery.data.updatedAt,
        version: settingsQuery.data.version,
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
    const initial = settingsQuery.data?.data
      ? normalizeSettings(settingsQuery.data.data)
      : normalizeSettings({});
    setForm(initial);
  }

  function resetToDefaults() {
    setForm(normalizeSettings(defaultSettings()));
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
          <div className="mt-0.5">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold">Permission required</div>
            <div className="mt-1 text-sm text-gray-600">
              You don’t have access to admin settings. Ask for{" "}
              <span className="font-medium">settings:read</span> or{" "}
              <span className="font-medium">settings:write</span>.
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

  if (settingsQuery.isLoading) return <AdminSettingsSkeleton />;

  if (settingsQuery.isError) {
    const status = settingsQuery.error?.response?.status;
    const title = status === 403 ? "Permission required" : "Failed to load";
    const description =
      status === 403
        ? "You don’t have access to admin settings. Ask for settings:read or settings:write."
        : getErrorMessage(settingsQuery.error);

    return (
      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold">{title}</div>
            <div className="mt-1 text-sm text-gray-600">{description}</div>

            <button
              type="button"
              className="mt-4 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
              onClick={() => settingsQuery.refetch()}
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
              <Store size={14} />
              Settings
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              Settings
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-gray-600">
              Configure store identity, commerce defaults and operational rules. All
              changes are validated and audit logged.
            </p>

            {readOnly ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-amber-200 bg-white">
                    <ShieldAlert size={18} className="text-amber-700" />
                  </div>

                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Read-only mode</div>
                    <div className="mt-1 text-xs text-gray-600">
                      You can review settings but cannot publish changes.
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
              View store
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
                  <div className="text-sm font-semibold text-gray-900">Validation issues</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Fix these before saving.
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
                  <div className="text-sm font-semibold text-gray-900">Pending changes</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Current settings form has unpublished updates.
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
              <div className="text-sm font-semibold text-gray-900">Configuration</div>
              <div className="mt-1 text-xs text-gray-500">Jump between sections</div>

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

              <div className="mt-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs text-gray-700">
                <div className="font-semibold">Note</div>
                <div className="mt-1">
                  Settings changes are validated on the server and recorded in audit logs
                  for traceability.
                </div>
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
            id="store"
            icon={Store}
            title="Store profile"
            description="Shown across the storefront and used for order communications."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Store name</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.store?.name || ""}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["store", "name"], e.target.value))
                  }
                  placeholder="Store name"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Support email</label>
                <input
                  disabled={inputDisabled}
                  className={cx(
                    "mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
                    form?.store?.supportEmail && !isValidEmail(form.store.supportEmail)
                      ? "border border-rose-300"
                      : "border border-gray-200"
                  )}
                  value={form?.store?.supportEmail || ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["store", "supportEmail"], e.target.value)
                    )
                  }
                  placeholder="support@yourstore.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Support phone</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.store?.supportPhone || ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["store", "supportPhone"], e.target.value)
                    )
                  }
                  placeholder="+8801XXXXXXXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Business address</label>
                <textarea
                  disabled={inputDisabled}
                  className="mt-2 min-h-[92px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.store?.address || ""}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["store", "address"], e.target.value))
                  }
                  placeholder="Street, city, country"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Currency</label>
                <select
                  disabled={inputDisabled}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.store?.currency || "BDT"}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["store", "currency"], e.target.value))
                  }
                >
                  <option value="BDT">BDT</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="SAR">SAR</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Timezone</label>
                <select
                  disabled={inputDisabled}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.store?.timezone || "Asia/Dhaka"}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["store", "timezone"], e.target.value))
                  }
                >
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>

                <div className="mt-2 text-xs text-gray-500">
                  Used for timestamps on admin logs and order events.
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="branding"
            icon={Palette}
            title="Branding & UI"
            description="Optional branding links. Leave empty to keep defaults."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Logo URL</label>
                <input
                  disabled={inputDisabled}
                  className={cx(
                    "mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
                    form?.branding?.logoUrl && !isSafeUrl(form.branding.logoUrl)
                      ? "border border-rose-300"
                      : "border border-gray-200"
                  )}
                  value={form?.branding?.logoUrl || ""}
                  onChange={(e) =>
                    setForm((prev) => setDeep(prev, ["branding", "logoUrl"], e.target.value))
                  }
                  placeholder="https://... or /path"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Favicon URL</label>
                <input
                  disabled={inputDisabled}
                  className={cx(
                    "mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
                    form?.branding?.faviconUrl && !isSafeUrl(form.branding.faviconUrl)
                      ? "border border-rose-300"
                      : "border border-gray-200"
                  )}
                  value={form?.branding?.faviconUrl || ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["branding", "faviconUrl"], e.target.value)
                    )
                  }
                  placeholder="https://... or /path"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Primary color</label>
                <input
                  disabled={inputDisabled}
                  className={cx(
                    "mt-2 w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
                    /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(
                      String(form?.branding?.primaryColor || "").trim()
                    )
                      ? "border border-gray-200"
                      : "border border-rose-300"
                  )}
                  value={form?.branding?.primaryColor || "#000000"}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["branding", "primaryColor"], e.target.value)
                    )
                  }
                  placeholder="#000000"
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Dark mode</div>
                  <div className="mt-1 text-xs text-gray-600">
                    Stores preference for future UI theme support.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.branding?.enableDarkMode)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["branding", "enableDarkMode"], e.target.checked)
                    )
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="commerce"
            icon={ShoppingCart}
            title="Commerce rules"
            description="Defaults used across checkout, inventory and order workflows."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-800">
                  Low stock threshold
                </label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.commerce?.lowStockThreshold ?? DEFAULTS.lowStockThreshold}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["commerce", "lowStockThreshold"], e.target.value)
                    )
                  }
                  min={0}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">
                  Auto-cancel unpaid orders (minutes)
                </label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={
                    form?.commerce?.autoCancelUnpaidMinutes ??
                    DEFAULTS.autoCancelUnpaidMinutes
                  }
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["commerce", "autoCancelUnpaidMinutes"], e.target.value)
                    )
                  }
                  min={0}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Allow guest checkout
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    If off, customers must sign in before ordering.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.commerce?.allowGuestCheckout)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["commerce", "allowGuestCheckout"], e.target.checked)
                    )
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Allow backorders
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    If enabled, orders can be placed when stock is 0.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.commerce?.allowBackorders)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["commerce", "allowBackorders"], e.target.checked)
                    )
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="notifications"
            icon={Bell}
            title="Notifications"
            description="Choose what triggers notifications and who receives them."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">
                  Notification emails
                </label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={
                    Array.isArray(form?.notifications?.emails)
                      ? form.notifications.emails.join(", ")
                      : ""
                  }
                  onChange={(e) => {
                    const raw = String(e.target.value || "");
                    const emails = raw
                      .split(/,|\n|\r/g)
                      .map((item) => item.trim())
                      .filter(Boolean);

                    setForm((prev) =>
                      setDeep(prev, ["notifications", "emails"], emails)
                    );
                  }}
                  placeholder="ops@yourstore.com, owner@yourstore.com"
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    New order alerts
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Notify when a new order is placed.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.notifications?.notifyNewOrder)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["notifications", "notifyNewOrder"], e.target.checked)
                    )
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Low stock alerts
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Notify when items fall below threshold.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.notifications?.notifyLowStock)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["notifications", "notifyLowStock"], e.target.checked)
                    )
                  }
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="security"
            icon={Shield}
            title="Security"
            description="Hardening options for admin accounts."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-800">
                  Admin session max age (days)
                </label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.security?.sessionMaxAgeDays ?? DEFAULTS.sessionMaxAgeDays}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["security", "sessionMaxAgeDays"], e.target.value)
                    )
                  }
                  min={1}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Require 2FA for admins
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Stored preference for rollout. Enforcement can be added later.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.security?.require2FAForAdmins)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["security", "require2FAForAdmins"], e.target.checked)
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">
                  IP allowlist (optional)
                </label>
                <textarea
                  disabled={inputDisabled}
                  className="mt-2 min-h-[92px] w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.security?.ipAllowlist || ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["security", "ipAllowlist"], e.target.value)
                    )
                  }
                  placeholder="Example: 203.0.113.10, 203.0.113.0/24"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="site"
            icon={Eye}
            title="Site & maintenance"
            description="Use maintenance mode to temporarily limit storefront activity and display a message."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex items-start justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    Maintenance mode
                  </div>
                  <div className="mt-1 text-xs text-gray-600">
                    Turn on to show a maintenance message across the storefront.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.site?.maintenanceMode)}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["site", "maintenanceMode"], e.target.checked)
                    )
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">
                  Maintenance message
                </label>
                <textarea
                  disabled={inputDisabled}
                  className={cx(
                    "mt-2 min-h-[92px] w-full rounded-2xl bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2",
                    String(form?.site?.maintenanceMessage || "").trim()
                      ? "border border-gray-200"
                      : "border border-rose-300"
                  )}
                  value={form?.site?.maintenanceMessage || ""}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["site", "maintenanceMessage"], e.target.value)
                    )
                  }
                  placeholder={DEFAULTS.maintenanceMessage}
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            id="data"
            icon={Database}
            title="Data & logs"
            description="Operational defaults for audit data retention."
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-800">
                  Audit log retention (days)
                </label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition disabled:opacity-60 focus:ring-2 focus:ring-black focus:ring-offset-2"
                  value={form?.data?.auditLogRetentionDays ?? DEFAULTS.auditLogRetentionDays}
                  onChange={(e) =>
                    setForm((prev) =>
                      setDeep(prev, ["data", "auditLogRetentionDays"], e.target.value)
                    )
                  }
                  min={7}
                />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Audit</div>
                <div className="mt-1 text-xs text-gray-600">
                  Settings changes are tracked in <span className="font-medium">Audit Logs</span>.
                </div>

                <div className="mt-3">
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:underline"
                    to="/admin/audit-logs"
                  >
                    <ExternalLink size={16} />
                    Open audit logs
                  </Link>
                </div>
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
                          You can’t edit settings without settings:write.
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
                          Save to apply changes and create an audit entry.
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
                        <div className="text-xs text-gray-600">You’re up to date.</div>
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
                        description: "Changes have been discarded.",
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
                    title="Restore defaults in the form"
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