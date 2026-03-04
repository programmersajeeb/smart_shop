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
} from "lucide-react";
import { toast } from "sonner";

import api from "../../services/apiClient";
import AdminSettingsSkeleton from "../../shared/components/ui/skeletons/AdminSettingsSkeleton";
import { useAuth } from "../../shared/hooks/useAuth";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;
  return serverMessage ? String(serverMessage) : "Something went wrong.";
}

function deepClone(v) {
  return v == null ? v : JSON.parse(JSON.stringify(v));
}

function normalizeUrl(u) {
  const v = String(u || "").trim();
  if (!v) return "";
  return v.replace(/\s+/g, "").replace(/\/$/, "");
}

function normalizeEmail(e) {
  const v = String(e || "").trim();
  if (!v) return "";
  return v.toLowerCase();
}

function normalizeEmails(list) {
  const inArr = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();
  for (const raw of inArr) {
    const e = normalizeEmail(raw);
    if (!e) continue;
    if (seen.has(e)) continue;
    seen.add(e);
    out.push(e);
  }
  return out.slice(0, 25);
}

function clampInt(n, min, max, fallback) {
  const x = Number(n);
  if (!Number.isFinite(x)) return fallback;
  const k = Math.round(x);
  return Math.min(max, Math.max(min, k));
}

const DEFAULTS = {
  storeName: "Smart Shop",
  currency: "BDT",
  timezone: "Asia/Dhaka",
  primaryColor: "#000000",
  allowGuestCheckout: true,
  lowStockThreshold: 5,
  autoCancelUnpaidMinutes: 30,
  sessionMaxAgeDays: 30,
  auditLogRetentionDays: 90,
};

function normalizeSettings(input) {
  const d = deepClone(input || {});

  d.store = d.store || {};
  d.branding = d.branding || {};
  d.commerce = d.commerce || {};
  d.notifications = d.notifications || {};
  d.security = d.security || {};
  d.data = d.data || {};
  d.site = d.site || {};

  d.store.name = String(d.store.name || DEFAULTS.storeName)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);

  d.store.supportEmail = normalizeEmail(d.store.supportEmail).slice(0, 120);

  d.store.supportPhone = String(d.store.supportPhone || "").trim().slice(0, 40);

  d.store.address = String(d.store.address || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);

  d.store.currency =
    String(d.store.currency || DEFAULTS.currency)
      .trim()
      .toUpperCase()
      .slice(0, 8) || DEFAULTS.currency;

  d.store.timezone =
    String(d.store.timezone || DEFAULTS.timezone).trim().slice(0, 60) ||
    DEFAULTS.timezone;

  d.branding.logoUrl = normalizeUrl(d.branding.logoUrl).slice(0, 500);
  d.branding.faviconUrl = normalizeUrl(d.branding.faviconUrl).slice(0, 500);

  d.branding.primaryColor =
    String(d.branding.primaryColor || DEFAULTS.primaryColor)
      .trim()
      .slice(0, 30) || DEFAULTS.primaryColor;

  d.branding.enableDarkMode =
    typeof d.branding.enableDarkMode === "boolean" ? d.branding.enableDarkMode : false;

  d.commerce.lowStockThreshold = clampInt(
    d.commerce.lowStockThreshold,
    0,
    9999,
    DEFAULTS.lowStockThreshold
  );

  d.commerce.allowBackorders =
    typeof d.commerce.allowBackorders === "boolean" ? d.commerce.allowBackorders : false;

  // ✅ IMPORTANT: boolean fallback should respect enterprise defaults
  d.commerce.allowGuestCheckout =
    typeof d.commerce.allowGuestCheckout === "boolean"
      ? d.commerce.allowGuestCheckout
      : DEFAULTS.allowGuestCheckout;

  d.commerce.autoCancelUnpaidMinutes = clampInt(
    d.commerce.autoCancelUnpaidMinutes,
    0,
    7 * 24 * 60,
    DEFAULTS.autoCancelUnpaidMinutes
  );

  d.notifications.notifyNewOrder =
    typeof d.notifications.notifyNewOrder === "boolean" ? d.notifications.notifyNewOrder : true;

  d.notifications.notifyLowStock =
    typeof d.notifications.notifyLowStock === "boolean" ? d.notifications.notifyLowStock : true;

  d.notifications.emails = normalizeEmails(d.notifications.emails);

  d.security.require2FAForAdmins =
    typeof d.security.require2FAForAdmins === "boolean" ? d.security.require2FAForAdmins : false;

  d.security.sessionMaxAgeDays = clampInt(
    d.security.sessionMaxAgeDays,
    1,
    365,
    DEFAULTS.sessionMaxAgeDays
  );

  d.security.ipAllowlist = String(d.security.ipAllowlist || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  d.data.auditLogRetentionDays = clampInt(
    d.data.auditLogRetentionDays,
    7,
    3650,
    DEFAULTS.auditLogRetentionDays
  );

  // ✅ Enterprise: maintenance flags (server supports in /settings/public + /settings/admin)
  d.site.maintenanceMode =
    typeof d.site.maintenanceMode === "boolean" ? d.site.maintenanceMode : false;

  d.site.maintenanceMessage = String(
    d.site.maintenanceMessage || "We are performing scheduled maintenance. Please try again soon."
  )
    .trim()
    .slice(0, 220);

  if (!d.site.maintenanceMessage) {
    d.site.maintenanceMessage = "We are performing scheduled maintenance. Please try again soon.";
  }

  return d;
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
        .forEach((k) => {
          out[k] = sorter(value[k]);
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
  let cur = next;
  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i];
    const base = cur[key] && typeof cur[key] === "object" ? cur[key] : {};
    cur[key] = { ...base };
    cur = cur[key];
  }
  cur[path[path.length - 1]] = value;
  return next;
}

function SectionCard({ id, icon: Icon, title, description, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="rounded-3xl border bg-white p-5 md:p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gray-100 border flex items-center justify-center shrink-0">
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
        "w-full text-left rounded-2xl px-4 py-3 border transition",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        active
          ? "bg-black text-white border-black"
          : "bg-white hover:bg-gray-50 border-gray-200"
      )}
    >
      <div className="text-sm font-semibold truncate">{children}</div>
    </button>
  );
}

/** ✅ Enterprise RBAC helper (same style as your AdminLayout) */
function normalizePermissions(u) {
  const list = Array.isArray(u?.permissions) ? u.permissions : [];
  const out = [];
  const seen = new Set();
  for (const raw of list) {
    const p = String(raw || "").trim();
    if (!p) continue;
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}

/** ✅ NEW: Enterprise-safe API path resolver (prevents /api/v1 mismatch 404) */
function makeApiPath(path) {
  const base = String(api?.defaults?.baseURL || "");
  const hasV1 = base.includes("/api/v1");
  const prefix = hasV1 ? "" : "/api/v1";
  return `${prefix}${path}`;
}

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const { user } = useAuth();

  const [active, setActive] = useState("store");
  const [form, setForm] = useState(() => normalizeSettings({}));

  const initialRef = useRef(stableStringify(normalizeSettings({})));
  const versionRef = useRef(null); // ✅ for If-Match

  const role = useMemo(() => String(user?.role || "").toLowerCase(), [user]);
  const roleLevel = useMemo(() => {
    const n = Number(user?.roleLevel || 0);
    return Number.isFinite(n) ? n : 0;
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
        title: "Store profile",
        description: "Basic store identity, contact details and localization.",
      },
      {
        id: "branding",
        label: "Branding & UI",
        icon: Palette,
        title: "Branding & UI",
        description: "Logo, favicon and UI preferences. (Safe defaults included.)",
      },
      {
        id: "commerce",
        label: "Commerce rules",
        icon: ShoppingCart,
        title: "Commerce rules",
        description: "Operational defaults that help prevent order/inventory mistakes.",
      },
      {
        id: "notifications",
        label: "Notifications",
        icon: Bell,
        title: "Notifications",
        description: "Who should receive system emails and what events trigger them.",
      },
      {
        id: "security",
        label: "Security",
        icon: Shield,
        title: "Security",
        description: "Admin session policies and basic hardening controls.",
      },
      {
        id: "site",
        label: "Site & maintenance",
        icon: Eye,
        title: "Site & maintenance",
        description: "Maintenance mode and storefront messaging controls.",
      },
      {
        id: "data",
        label: "Data & logs",
        icon: Database,
        title: "Data & logs",
        description: "Retention preferences for audit logs and operational data.",
      },
    ],
    []
  );

  const q = useQuery({
    queryKey: ["adminSettings"],
    enabled: Boolean(canRead),
    queryFn: async () => {
      // ✅ Enterprise single source of truth
      const res = await api.get(makeApiPath("/settings/admin"));
      return res.data; // { key, data, updatedAt, version }
    },
    staleTime: 30_000,
    retry: 1,
  });

  useEffect(() => {
    if (!q.data?.data) return;
    const normalized = normalizeSettings(q.data.data);
    setForm(normalized);
    initialRef.current = stableStringify(normalized);

    if (typeof q.data?.version === "number") {
      versionRef.current = q.data.version;
    }
  }, [q.data]);

  const normalizedForm = useMemo(() => normalizeSettings(form), [form]);

  const isDirty = useMemo(() => {
    return stableStringify(normalizedForm) !== initialRef.current;
  }, [normalizedForm]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const v = versionRef.current;
      const headers = v != null ? { "If-Match": String(v) } : undefined;
      const res = await api.put(
        makeApiPath("/settings/admin"),
        payload,
        headers ? { headers } : undefined
      );
      return res.data;
    },
    onSuccess: (data) => {
      const normalized = normalizeSettings(data?.data || form);
      setForm(normalized);
      initialRef.current = stableStringify(normalized);
      qc.setQueryData(["adminSettings"], data);

      if (typeof data?.version === "number") {
        versionRef.current = data.version;
      }

      toast.success("Settings saved", {
        description: "Your changes have been applied and audit logged.",
      });
    },
    onError: async (e) => {
      const status = e?.response?.status;

      if (status === 409) {
        toast.error("Version conflict", {
          description: "Another admin updated settings. Reloading the latest version…",
        });
        await qc.invalidateQueries({ queryKey: ["adminSettings"] });
        await q.refetch();
        return;
      }

      toast.error("Save failed", { description: getErrorMessage(e) });
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      const v = versionRef.current;
      const headers = v != null ? { "If-Match": String(v) } : undefined;
      const res = await api.post(
        makeApiPath("/settings/admin/reset"),
        null,
        headers ? { headers } : undefined
      );
      return res.data;
    },
    onSuccess: (data) => {
      const normalized = normalizeSettings(data?.data || {});
      setForm(normalized);
      initialRef.current = stableStringify(normalized);
      qc.setQueryData(["adminSettings"], data);

      if (typeof data?.version === "number") {
        versionRef.current = data.version;
      }

      toast.success("Settings reset", { description: "Defaults have been restored." });
    },
    onError: async (e) => {
      const status = e?.response?.status;

      if (status === 409) {
        toast.error("Version conflict", {
          description: "Another admin updated settings. Reloading the latest version…",
        });
        await qc.invalidateQueries({ queryKey: ["adminSettings"] });
        await q.refetch();
        return;
      }

      toast.error("Reset failed", { description: getErrorMessage(e) });
    },
  });

  const busy = saveMutation.isPending || resetMutation.isPending;
  const inputDisabled = busy || readOnly;

  const meta = q.data
    ? {
        updatedAt: q.data.updatedAt,
        version: q.data.version,
      }
    : null;

  function scrollTo(id) {
    setActive(id);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (!canRead) {
    return (
      <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold">Permission required</div>
            <div className="mt-1 text-sm text-gray-600">
              You don’t have access to admin settings. Ask a super admin to grant{" "}
              <span className="font-medium">settings:read</span> (or{" "}
              <span className="font-medium">settings:write</span>).
            </div>
            <div className="mt-4">
              <Link
                to="/admin"
                className="inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition"
              >
                Back to admin
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (q.isLoading) return <AdminSettingsSkeleton />;

  if (q.isError) {
    const status = q.error?.response?.status;
    const title = status === 403 ? "Permission required" : "Failed to load";
    const desc =
      status === 403
        ? "You don’t have access to admin settings. Ask a super admin to grant settings:read (or settings:write)."
        : getErrorMessage(q.error);

    return (
      <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="mt-0.5">
            <AlertTriangle size={18} className="text-rose-600" />
          </div>
          <div className="min-w-0">
            <div className="text-lg font-semibold">{title}</div>
            <div className="mt-1 text-sm text-gray-600">{desc}</div>

            <button
              type="button"
              className="mt-4 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition"
              onClick={() => q.refetch()}
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
      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-gray-500">Admin</div>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="mt-2 text-gray-600 max-w-2xl">
              Configure store identity, commerce defaults and operational rules. These settings are
              validated and audit-logged.
            </p>

            {readOnly ? (
              <div className="mt-4 rounded-2xl border bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-2xl border bg-white flex items-center justify-center">
                    <Eye size={18} className="text-gray-800" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Read-only mode</div>
                    <div className="mt-1 text-xs text-gray-600">
                      You can view settings but cannot edit. Ask for{" "}
                      <span className="font-medium">settings:write</span> permission to enable saving.
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
                    • Version: <span className="font-medium text-gray-700">{meta.version}</span>
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
              className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition inline-flex items-center gap-2"
            >
              <ExternalLink size={16} /> View store
            </a>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left nav (desktop) */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-6">
            <div className="rounded-3xl border bg-white p-5 shadow-sm">
              <div className="text-sm font-semibold text-gray-900">Configuration</div>
              <div className="mt-1 text-xs text-gray-500">Jump between sections</div>

              <div className="mt-4 space-y-2">
                {sections.map((s) => (
                  <NavButton key={s.id} active={active === s.id} onClick={() => scrollTo(s.id)}>
                    {s.label}
                  </NavButton>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-700">
                <div className="font-semibold">Enterprise note</div>
                <div className="mt-1">
                  Settings updates are validated on the server and written to audit logs for traceability.
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="lg:col-span-8 space-y-5">
          {/* Mobile section picker */}
          <div className="lg:hidden rounded-3xl border bg-white p-4 shadow-sm">
            <label className="text-xs text-gray-500">Jump to</label>
            <select
              className="mt-2 select select-bordered w-full rounded-2xl bg-white"
              value={active}
              onChange={(e) => scrollTo(e.target.value)}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Store */}
          <SectionCard
            id="store"
            icon={Store}
            title="Store profile"
            description="Shown across the storefront and used for order communications."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Store name</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.store?.name || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["store", "name"], e.target.value))}
                  placeholder="Smart Shop"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Support email</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.store?.supportEmail || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["store", "supportEmail"], e.target.value))}
                  placeholder="support@yourstore.com"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Support phone</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.store?.supportPhone || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["store", "supportPhone"], e.target.value))}
                  placeholder="+8801XXXXXXXXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Business address</label>
                <textarea
                  disabled={inputDisabled}
                  className="mt-2 textarea textarea-bordered w-full rounded-2xl bg-white min-h-[92px] disabled:opacity-60"
                  value={form?.store?.address || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["store", "address"], e.target.value))}
                  placeholder="Street, city, country"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Currency</label>
                <select
                  disabled={inputDisabled}
                  className="mt-2 select select-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.store?.currency || "BDT"}
                  onChange={(e) => setForm((p) => setDeep(p, ["store", "currency"], e.target.value))}
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
                  className="mt-2 select select-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.store?.timezone || "Asia/Dhaka"}
                  onChange={(e) => setForm((p) => setDeep(p, ["store", "timezone"], e.target.value))}
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

          {/* Branding */}
          <SectionCard
            id="branding"
            icon={Palette}
            title="Branding & UI"
            description="Optional branding links. Keep empty to use defaults."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Logo URL</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.branding?.logoUrl || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["branding", "logoUrl"], e.target.value))}
                  placeholder="https://..."
                />
                <div className="mt-2 text-xs text-gray-500">
                  Recommended: HTTPS image, square or wide logo.
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Favicon URL</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.branding?.faviconUrl || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["branding", "faviconUrl"], e.target.value))}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Primary color</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.branding?.primaryColor || "#000000"}
                  onChange={(e) => setForm((p) => setDeep(p, ["branding", "primaryColor"], e.target.value))}
                  placeholder="#000000"
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Dark mode</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Stores preference for future UI theme support.
                  </div>
                </div>

                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.branding?.enableDarkMode)}
                  onChange={(e) => setForm((p) => setDeep(p, ["branding", "enableDarkMode"], e.target.checked))}
                />
              </div>
            </div>
          </SectionCard>

          {/* Commerce */}
          <SectionCard
            id="commerce"
            icon={ShoppingCart}
            title="Commerce rules"
            description="Defaults used across checkout, inventory and order workflows."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-800">Low stock threshold</label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.commerce?.lowStockThreshold ?? DEFAULTS.lowStockThreshold}
                  onChange={(e) => setForm((p) => setDeep(p, ["commerce", "lowStockThreshold"], e.target.value))}
                  min={0}
                />
                <div className="mt-2 text-xs text-gray-500">Used for low-stock banners and alerts.</div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-800">Auto-cancel unpaid orders (minutes)</label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.commerce?.autoCancelUnpaidMinutes ?? DEFAULTS.autoCancelUnpaidMinutes}
                  onChange={(e) =>
                    setForm((p) => setDeep(p, ["commerce", "autoCancelUnpaidMinutes"], e.target.value))
                  }
                  min={0}
                />
                <div className="mt-2 text-xs text-gray-500">Set 0 to disable.</div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Allow guest checkout</div>
                  <div className="text-xs text-gray-600 mt-1">If off, customers must sign in to order.</div>
                </div>
                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.commerce?.allowGuestCheckout)}
                  onChange={(e) =>
                    setForm((p) => setDeep(p, ["commerce", "allowGuestCheckout"], e.target.checked))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Allow backorders</div>
                  <div className="text-xs text-gray-600 mt-1">If on, orders can be placed when stock is 0.</div>
                </div>
                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.commerce?.allowBackorders)}
                  onChange={(e) => setForm((p) => setDeep(p, ["commerce", "allowBackorders"], e.target.checked))}
                />
              </div>
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard
            id="notifications"
            icon={Bell}
            title="Notifications"
            description="Choose what triggers notifications and who receives them."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Notification emails</label>
                <input
                  disabled={inputDisabled}
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={Array.isArray(form?.notifications?.emails) ? form.notifications.emails.join(", ") : ""}
                  onChange={(e) => {
                    const raw = String(e.target.value || "");
                    const arr = raw
                      .split(/,|\n|\r/g)
                      .map((s) => s.trim())
                      .filter(Boolean);
                    setForm((p) => setDeep(p, ["notifications", "emails"], arr));
                  }}
                  placeholder="ops@yourstore.com, owner@yourstore.com"
                />
                <div className="mt-2 text-xs text-gray-500">Separate multiple emails with commas.</div>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">New order alerts</div>
                  <div className="text-xs text-gray-600 mt-1">Notify when a new order is placed.</div>
                </div>
                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.notifications?.notifyNewOrder)}
                  onChange={(e) =>
                    setForm((p) => setDeep(p, ["notifications", "notifyNewOrder"], e.target.checked))
                  }
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Low stock alerts</div>
                  <div className="text-xs text-gray-600 mt-1">Notify when items fall below threshold.</div>
                </div>
                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.notifications?.notifyLowStock)}
                  onChange={(e) =>
                    setForm((p) => setDeep(p, ["notifications", "notifyLowStock"], e.target.checked))
                  }
                />
              </div>
            </div>
          </SectionCard>

          {/* Security */}
          <SectionCard
            id="security"
            icon={Shield}
            title="Security"
            description="Hardening options for admin accounts."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-800">Admin session max age (days)</label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.security?.sessionMaxAgeDays ?? DEFAULTS.sessionMaxAgeDays}
                  onChange={(e) => setForm((p) => setDeep(p, ["security", "sessionMaxAgeDays"], e.target.value))}
                  min={1}
                />
              </div>

              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Require 2FA for admins</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Stored preference for rollout. (Implementation can be added next.)
                  </div>
                </div>
                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.security?.require2FAForAdmins)}
                  onChange={(e) =>
                    setForm((p) => setDeep(p, ["security", "require2FAForAdmins"], e.target.checked))
                  }
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">IP allowlist (optional)</label>
                <textarea
                  disabled={inputDisabled}
                  className="mt-2 textarea textarea-bordered w-full rounded-2xl bg-white min-h-[92px] disabled:opacity-60"
                  value={form?.security?.ipAllowlist || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["security", "ipAllowlist"], e.target.value))}
                  placeholder="Example: 203.0.113.10, 203.0.113.0/24"
                />
                <div className="mt-2 text-xs text-gray-500">Saved as reference for future enforcement.</div>
              </div>
            </div>
          </SectionCard>

          {/* Site & maintenance */}
          <SectionCard
            id="site"
            icon={Eye}
            title="Site & maintenance"
            description="Use maintenance mode to temporarily block storefront checkout and show a message."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-gray-50 p-4 md:col-span-2">
                <div>
                  <div className="text-sm font-semibold text-gray-900">Maintenance mode</div>
                  <div className="text-xs text-gray-600 mt-1">
                    Turn on to show a maintenance banner/message across the storefront.
                  </div>
                </div>
                <input
                  disabled={inputDisabled}
                  type="checkbox"
                  className="toggle toggle-sm disabled:opacity-60"
                  checked={Boolean(form?.site?.maintenanceMode)}
                  onChange={(e) => setForm((p) => setDeep(p, ["site", "maintenanceMode"], e.target.checked))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-800">Maintenance message</label>
                <textarea
                  disabled={inputDisabled}
                  className="mt-2 textarea textarea-bordered w-full rounded-2xl bg-white min-h-[92px] disabled:opacity-60"
                  value={form?.site?.maintenanceMessage || ""}
                  onChange={(e) => setForm((p) => setDeep(p, ["site", "maintenanceMessage"], e.target.value))}
                  placeholder="We are performing scheduled maintenance. Please try again soon."
                />
                <div className="mt-2 text-xs text-gray-500">Max 220 characters.</div>
              </div>
            </div>
          </SectionCard>

          {/* Data */}
          <SectionCard
            id="data"
            icon={Database}
            title="Data & logs"
            description="Operational defaults for audit data retention."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-800">Audit log retention (days)</label>
                <input
                  disabled={inputDisabled}
                  type="number"
                  className="mt-2 input input-bordered w-full rounded-2xl bg-white disabled:opacity-60"
                  value={form?.data?.auditLogRetentionDays ?? DEFAULTS.auditLogRetentionDays}
                  onChange={(e) =>
                    setForm((p) => setDeep(p, ["data", "auditLogRetentionDays"], e.target.value))
                  }
                  min={7}
                />
                <div className="mt-2 text-xs text-gray-500">Preference stored for a future retention job.</div>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-4">
                <div className="text-sm font-semibold text-gray-900">Audit</div>
                <div className="mt-1 text-xs text-gray-600">
                  Settings updates are tracked in <span className="font-medium">Audit Logs</span>.
                </div>
                <div className="mt-3">
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-black hover:underline"
                    to="/admin/audit-logs"
                  >
                    <ExternalLink size={16} /> Open audit logs
                  </Link>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Sticky save bar */}
          <div className="sticky bottom-0 z-10">
            <div className="mt-5 rounded-3xl border bg-white/90 backdrop-blur p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex items-center gap-3">
                  {readOnly ? (
                    <>
                      <div className="h-9 w-9 rounded-2xl border bg-gray-50 flex items-center justify-center">
                        <Eye size={18} className="text-gray-800" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Read-only</div>
                        <div className="text-xs text-gray-600">You can’t edit settings without settings:write.</div>
                      </div>
                    </>
                  ) : isDirty ? (
                    <>
                      <div className="h-9 w-9 rounded-2xl border bg-amber-50 flex items-center justify-center">
                        <AlertTriangle size={18} className="text-amber-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">Unsaved changes</div>
                        <div className="text-xs text-gray-600">Save to apply and create an audit entry.</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="h-9 w-9 rounded-2xl border bg-emerald-50 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-emerald-700" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">All changes saved</div>
                        <div className="text-xs text-gray-600">You’re up to date.</div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition disabled:opacity-60"
                    onClick={() => {
                      if (busy) return;
                      const initial = q.data?.data ? normalizeSettings(q.data.data) : normalizeSettings({});
                      setForm(initial);
                      initialRef.current = stableStringify(initial);
                      toast.info("Reverted", { description: "Changes have been discarded." });
                    }}
                    disabled={!isDirty || busy || readOnly}
                  >
                    Discard
                  </button>

                  <button
                    type="button"
                    className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition inline-flex items-center gap-2 disabled:opacity-60"
                    onClick={() => resetMutation.mutate()}
                    disabled={busy || readOnly}
                    title="Restore defaults"
                  >
                    {resetMutation.isPending ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <RotateCcw size={16} />
                    )}
                    Reset
                  </button>

                  <button
                    type="button"
                    className={cx(
                      "rounded-2xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 transition",
                      !readOnly && isDirty && !busy
                        ? "bg-black text-white hover:bg-gray-900"
                        : "bg-gray-200 text-gray-500"
                    )}
                    onClick={() => {
                      if (readOnly || busy || !isDirty) return;
                      saveMutation.mutate(normalizedForm);
                    }}
                    disabled={readOnly || !isDirty || busy}
                  >
                    {saveMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save changes
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
