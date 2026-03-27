import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Users,
  Search,
  RefreshCcw,
  Loader2,
  Eye,
  X,
  Save,
  Ban,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronUp,
  Filter,
  ArrowUpDown,
  CheckSquare,
  Square,
  Shield,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import { useAuth } from "../../shared/hooks/useAuth";

const ROLE_OPTIONS = [
  { value: "user", label: "user", defaultLevel: 0 },
  { value: "auditor", label: "auditor", defaultLevel: 10 },
  { value: "editor", label: "editor", defaultLevel: 20 },
  { value: "support", label: "support", defaultLevel: 30 },
  { value: "manager", label: "manager", defaultLevel: 40 },
  { value: "admin", label: "admin", defaultLevel: 50 },
  { value: "superadmin", label: "superadmin", defaultLevel: 100 },
];

const DEFAULT_PERMISSION_GROUPS = [
  {
    name: "Core",
    items: ["admin:access", "*"],
  },
  {
    name: "Users",
    items: ["users:read", "users:write"],
  },
  {
    name: "Orders",
    items: ["orders:read", "orders:write"],
  },
  {
    name: "Products",
    items: ["products:read", "products:write"],
  },
  {
    name: "Audit",
    items: ["audit:read"],
  },
  {
    name: "System",
    items: ["settings:read", "settings:write"],
  },
];

const DEFAULT_TEMPLATE_MAP = {
  "Admin Access Only": ["admin:access"],
  "User Manager": ["admin:access", "users:read", "users:write"],
  "Order Manager": ["admin:access", "orders:read", "orders:write"],
  "Catalog Manager": ["admin:access", "products:read", "products:write"],
  Auditor: ["admin:access", "audit:read"],
  "Support Staff": ["admin:access", "users:read", "orders:read"],
  "Read Only Admin": [
    "admin:access",
    "users:read",
    "orders:read",
    "products:read",
    "settings:read",
    "audit:read",
  ],
};

const PERMISSION_DEPENDENCIES = {
  "users:write": ["users:read"],
  "orders:write": ["orders:read"],
  "products:write": ["products:read"],
  "settings:write": ["settings:read"],
};

function getErrorMessage(err) {
  const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
  return msg ? String(msg) : "Something went wrong.";
}

function normalizePermissions(list) {
  const arr = Array.isArray(list) ? list : [];
  const out = [];
  const seen = new Set();

  for (const raw of arr) {
    const p = String(raw || "").trim();
    if (!p) continue;
    const k = p.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }

  return out.sort((a, b) => a.localeCompare(b));
}

function withPermissionDependencies(list) {
  const next = new Set(normalizePermissions(list));
  let changed = true;

  while (changed) {
    changed = false;
    for (const key of Array.from(next)) {
      const deps = PERMISSION_DEPENDENCIES[key] || [];
      for (const dep of deps) {
        if (!next.has(dep)) {
          next.add(dep);
          changed = true;
        }
      }
    }
  }

  if (next.has("*")) {
    next.add("admin:access");
  }

  return normalizePermissions(Array.from(next));
}

function buildPermissionGroups(catalog) {
  const groups =
    Array.isArray(catalog?.groups) && catalog.groups.length
      ? catalog.groups
      : DEFAULT_PERMISSION_GROUPS;

  const flat = Array.isArray(catalog?.permissions) ? catalog.permissions : [];

  if (groups.length) return groups;

  return [
    {
      name: "Permissions",
      items: normalizePermissions(flat),
    },
  ];
}

function buildTemplates(catalog) {
  const raw = catalog?.templates;
  if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length) {
    return raw;
  }
  return DEFAULT_TEMPLATE_MAP;
}

function sortUsers(users, sortBy, sortDir) {
  const arr = Array.isArray(users) ? [...users] : [];

  const getVal = (u) => {
    switch (sortBy) {
      case "name":
        return String(u?.displayName || u?.email || u?.phone || "").toLowerCase();
      case "role":
        return String(u?.role || "user").toLowerCase();
      case "level":
        return Number(u?.roleLevel || 0);
      case "status":
        return u?.isBlocked ? 1 : 0;
      case "permissions":
        return Array.isArray(u?.permissions) ? u.permissions.length : 0;
      case "lastLogin":
        return u?.lastLoginAt ? new Date(u.lastLoginAt).getTime() : 0;
      default:
        return String(u?.displayName || u?.email || u?.phone || "").toLowerCase();
    }
  };

  arr.sort((a, b) => {
    const av = getVal(a);
    const bv = getVal(b);

    if (typeof av === "number" && typeof bv === "number") {
      return sortDir === "asc" ? av - bv : bv - av;
    }

    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  return arr;
}

function getDiffSummary(originalUser, next) {
  const changes = [];
  const prevRole = String(originalUser?.role || "user");
  const prevLevel = Number(originalUser?.roleLevel || 0);
  const prevBlocked = Boolean(originalUser?.isBlocked);
  const prevPerms = normalizePermissions(originalUser?.permissions);
  const nextPerms = normalizePermissions(next?.permissions);

  if (prevRole !== String(next?.role || "user")) {
    changes.push({
      type: "role",
      label: `Role: ${prevRole} → ${String(next?.role || "user")}`,
    });
  }

  if (prevLevel !== Number(next?.roleLevel || 0)) {
    changes.push({
      type: "level",
      label: `Role level: ${prevLevel} → ${Number(next?.roleLevel || 0)}`,
    });
  }

  if (prevBlocked !== Boolean(next?.blocked)) {
    changes.push({
      type: "status",
      label: prevBlocked ? "User will be unblocked" : "User will be blocked",
    });
  }

  const added = nextPerms.filter((p) => !prevPerms.includes(p));
  const removed = prevPerms.filter((p) => !nextPerms.includes(p));

  for (const p of added) {
    changes.push({ type: "permission-add", label: `Add permission: ${p}` });
  }

  for (const p of removed) {
    changes.push({ type: "permission-remove", label: `Remove permission: ${p}` });
  }

  return { changes, added, removed };
}

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function getRoleLevel(user) {
  const n = Number(user?.roleLevel || 0);
  return Number.isFinite(n) ? n : 0;
}

function getVisibleRoleOptions(actorUser, targetUser) {
  const actorRole = normalizeRole(actorUser?.role);
  const actorLevel = getRoleLevel(actorUser);
  const targetId = String(targetUser?._id || "");
  const actorId = String(actorUser?._id || actorUser?.id || "");
  const isSelfEdit = actorId && targetId && actorId === targetId;
  const actorIsSuper = actorRole === "superadmin" || actorLevel >= 100;

  if (isSelfEdit) {
    return ROLE_OPTIONS.filter((opt) => {
      const v = normalizeRole(opt.value);

      if (actorIsSuper) return v === "superadmin";
      if (actorRole === "admin") return v === "admin";

      return opt.defaultLevel >= actorLevel && opt.defaultLevel <= actorLevel;
    });
  }

  return ROLE_OPTIONS.filter((opt) => {
    const v = normalizeRole(opt.value);

    if (v === "superadmin" && !actorIsSuper) return false;
    if (opt.defaultLevel >= actorLevel) return false;

    return true;
  });
}

function HeaderSortButton({ label, value, sortBy, sortDir, onChange }) {
  const active = sortBy === value;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 hover:text-gray-900"
      onClick={() => onChange(value)}
    >
      <span>{label}</span>
      <ArrowUpDown size={14} className={active ? "text-gray-900" : "text-gray-400"} />
      {active ? <span className="text-[10px] uppercase">{sortDir}</span> : null}
    </button>
  );
}

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-2xl border bg-gray-50" />
      ))}
    </div>
  );
}

function Drawer({ open, onClose, user, catalog, onSave, saving, actorUser }) {
  const [role, setRole] = useState(user?.role || "user");
  const [roleLevel, setRoleLevel] = useState(Number(user?.roleLevel || 0));
  const [blocked, setBlocked] = useState(Boolean(user?.isBlocked));
  const [perms, setPerms] = useState(normalizePermissions(user?.permissions));
  const [permSearch, setPermSearch] = useState("");
  const [collapsed, setCollapsed] = useState({});
  const [templateApplied, setTemplateApplied] = useState("");

  React.useEffect(() => {
    setRole(user?.role || "user");
    setRoleLevel(Number(user?.roleLevel || 0));
    setBlocked(Boolean(user?.isBlocked));
    setPerms(normalizePermissions(user?.permissions));
    setPermSearch("");
    setTemplateApplied("");
  }, [user?._id, user?.role, user?.roleLevel, user?.isBlocked, user?.permissions]);

  const groups = useMemo(() => buildPermissionGroups(catalog), [catalog]);
  const templateMap = useMemo(() => buildTemplates(catalog), [catalog]);
  const flat = Array.isArray(catalog?.permissions) ? catalog.permissions : [];
  const visibleRoleOptions = useMemo(
    () => getVisibleRoleOptions(actorUser, user),
    [actorUser, user]
  );

  useMemo(() => {
    if (!groups.length) return normalizePermissions(flat);
    const merged = [];
    for (const group of groups) {
      for (const item of group?.items || []) merged.push(item);
    }
    return normalizePermissions(merged.length ? merged : flat);
  }, [groups, flat]);

  const has = (p) => perms.includes(p);

  function toggle(p) {
    const key = String(p || "").trim();
    if (!key) return;

    if (has(key)) {
      setPerms((prev) => prev.filter((x) => x !== key));
    } else {
      setPerms((prev) => withPermissionDependencies([...prev, key]));
    }
  }

  function setGroupItems(items, mode) {
    const normalized = normalizePermissions(items);

    if (mode === "add") {
      setPerms((prev) => withPermissionDependencies([...prev, ...normalized]));
      return;
    }

    if (mode === "remove") {
      setPerms((prev) => prev.filter((x) => !normalized.includes(x)));
    }
  }

  function applyTemplate(name) {
    const template = templateMap[name] || [];
    setTemplateApplied(name);
    setPerms(withPermissionDependencies(template));
  }

  function handleRoleChange(nextRole) {
    setRole(nextRole);
    const found = ROLE_OPTIONS.find((x) => x.value === nextRole);

    if (found) {
      setRoleLevel((prev) => {
        const current = Number(prev || 0);
        if ([0, 10, 20, 30, 40, 50, 100].includes(current)) {
          return found.defaultLevel;
        }
        return current;
      });
    }
  }

  const filteredGroups = useMemo(() => {
    const term = String(permSearch || "").trim().toLowerCase();
    if (!term) return groups;

    return groups
      .map((group) => ({
        ...group,
        items: (group?.items || []).filter((p) => String(p).toLowerCase().includes(term)),
      }))
      .filter(
        (group) =>
          group.items.length > 0 || String(group?.name || "").toLowerCase().includes(term)
      );
  }, [groups, permSearch]);

  const diff = useMemo(
    () =>
      getDiffSummary(user, {
        role,
        roleLevel,
        blocked,
        permissions: perms,
      }),
    [user, role, roleLevel, blocked, perms]
  );

  React.useEffect(() => {
    if (!visibleRoleOptions.length) return;

    const exists = visibleRoleOptions.some((opt) => opt.value === role);
    if (!exists) {
      const fallback = visibleRoleOptions[0];
      setRole(fallback.value);
      setRoleLevel(Number(fallback.defaultLevel || 0));
    }
  }, [visibleRoleOptions, role]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close overlay"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-3xl overflow-auto border-l bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
              <ShieldCheck size={14} />
              Roles & Permissions
            </div>

            <div className="mt-1 truncate text-lg font-semibold text-gray-900">
              {user?.displayName || user?.email || user?.phone || "User"}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="break-all font-mono text-xs text-gray-500">
                {String(user?._id || "")}
              </span>

              <span
                className={[
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  blocked
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800",
                ].join(" ")}
              >
                {blocked ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                {blocked ? "Blocked" : "Active"}
              </span>

              <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-800">
                <Shield size={12} />
                {role} • L{roleLevel}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="rounded-2xl p-2 transition hover:bg-gray-50"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div className="rounded-[28px] border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Profile</div>

            <div className="mt-3 grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2">
              <div className="rounded-2xl border bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Email</div>
                <div className="break-all font-medium text-gray-900">{user?.email || "—"}</div>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Phone</div>
                <div className="font-medium text-gray-900">{user?.phone || "—"}</div>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Last login</div>
                <div className="font-medium text-gray-900">
                  {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}
                </div>
              </div>

              <div className="rounded-2xl border bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Current permissions</div>
                <div className="font-medium text-gray-900">
                  {Array.isArray(user?.permissions) ? user.permissions.length : 0}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-[28px] border bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">RBAC Settings</div>

              <div
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  blocked
                    ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-emerald-200 bg-emerald-50 text-emerald-800",
                ].join(" ")}
              >
                {blocked ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                {blocked ? "Blocked" : "Active"}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Role</div>
                <select
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  value={role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                >
                  {visibleRoleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  Only assignable roles are shown here.
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Role Level</div>
                <input
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                  type="number"
                  value={roleLevel}
                  onChange={(e) => setRoleLevel(Number(e.target.value || 0))}
                  min={0}
                  max={100}
                />
                <div className="mt-2 text-xs text-gray-500">
                  100 = Super Admin • 50 = Admin • 40 = Manager • 0 = User
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Block user</div>
                <button
                  type="button"
                  className={[
                    "mt-2 w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition",
                    blocked
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-rose-600 hover:bg-rose-700",
                  ].join(" ")}
                  onClick={() => setBlocked((prev) => !prev)}
                >
                  {blocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={14} />
                Permission safety notes
              </div>
              <div className="mt-1">
                Write permissions automatically include their matching read permissions.
                Wildcard permission should only be used for true super admin accounts.
              </div>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <KeyRound size={16} />
                Permission Templates
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {Object.keys(templateMap).map((template) => (
                  <button
                    key={template}
                    type="button"
                    className={[
                      "rounded-xl border px-3 py-2 text-xs font-semibold transition",
                      templateApplied === template
                        ? "bg-black text-white"
                        : "border-gray-200 bg-white hover:bg-gray-50",
                    ].join(" ")}
                    onClick={() => applyTemplate(template)}
                  >
                    {template}
                  </button>
                ))}

                <button
                  type="button"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-gray-50"
                  onClick={() => {
                    setTemplateApplied("");
                    setPerms([]);
                  }}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-gray-900">Permissions</div>
                <div className="text-xs text-gray-500">
                  Search, select by group and review changes before saving.
                </div>
              </div>

              <div className="relative w-full sm:w-80">
                <Search
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-black"
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  placeholder="Search permissions"
                />
              </div>
            </div>

            <div className="space-y-4">
              {filteredGroups.length ? (
                filteredGroups.map((group) => {
                  const name = String(group?.name || "Group");
                  const items = normalizePermissions(group?.items || []);
                  const selectedCount = items.filter((p) => has(p)).length;
                  const isCollapsed = Boolean(collapsed[name]);

                  return (
                    <div key={name} className="rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <button
                          type="button"
                          className="flex items-center gap-2 text-left"
                          onClick={() =>
                            setCollapsed((prev) => ({ ...prev, [name]: !prev[name] }))
                          }
                        >
                          {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}

                          <div>
                            <div className="text-sm font-semibold text-gray-900">{name}</div>
                            <div className="text-xs text-gray-500">
                              {selectedCount}/{items.length} selected
                            </div>
                          </div>
                        </button>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-gray-50"
                            onClick={() => setGroupItems(items, "add")}
                          >
                            Select all
                          </button>

                          <button
                            type="button"
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold transition hover:bg-gray-50"
                            onClick={() => setGroupItems(items, "remove")}
                          >
                            Clear group
                          </button>
                        </div>
                      </div>

                      {!isCollapsed ? (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {items.map((permission) => (
                            <label
                              key={permission}
                              className="flex items-center gap-2 rounded-xl border bg-gray-50 px-3 py-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                className="checkbox checkbox-sm"
                                checked={has(permission)}
                                onChange={() => toggle(permission)}
                              />
                              <span className="font-mono text-[13px]">{permission}</span>
                            </label>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border bg-gray-50 p-4 text-sm text-gray-600">
                  No matching permissions found.
                </div>
              )}
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-gray-900">Selected</div>
                <div className="text-xs text-gray-500">
                  {perms.length} permission(s) selected
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {perms.length ? (
                  perms.map((permission) => (
                    <span
                      key={permission}
                      className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-mono"
                    >
                      {permission}
                      <button
                        type="button"
                        className="opacity-70 transition hover:opacity-100"
                        onClick={() => toggle(permission)}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-gray-500">No permissions selected</span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-4">
              <div className="text-sm font-semibold text-gray-900">Change summary</div>

              {diff.changes.length ? (
                <div className="mt-3 space-y-2">
                  {diff.changes.map((item, index) => (
                    <div
                      key={`${item.type}-${index}`}
                      className="rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-2 text-xs text-gray-500">No changes yet</div>
              )}
            </div>

            <button
              type="button"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
              disabled={saving}
              onClick={() =>
                onSave?.({
                  role,
                  roleLevel,
                  blocked,
                  permissions: withPermissionDependencies(perms),
                })
              }
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save changes
            </button>
          </div>

          <div className="rounded-[28px] border bg-gray-50 p-5 text-xs text-gray-600">
            <div className="flex items-center gap-2 font-semibold text-gray-800">
              <ShieldCheck size={14} />
              Access note
            </div>
            <div className="mt-1">
              Final RBAC enforcement happens on the server using DB-loaded role, role level
              and permissions. This UI only manages the configuration safely.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminRolesPage() {
  const qc = useQueryClient();
  const { user: actorUser } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [blocked, setBlocked] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkTemplate, setBulkTemplate] = useState("");
  const [bulkAction, setBulkAction] = useState("");

  const dq = useDeferredValue(q);
  const [drawerUser, setDrawerUser] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    description: "",
    payload: null,
  });

  const listQueryKey = ["admin-users", page, limit, role, blocked, dq, sortBy, sortDir];

  const catalogQuery = useQuery({
    queryKey: ["rbac-permissions-catalog"],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/users/admin/permissions", { signal });
      return data;
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const templateMap = useMemo(() => buildTemplates(catalogQuery.data), [catalogQuery.data]);

  const listQuery = useQuery({
    queryKey: listQueryKey,
    queryFn: async ({ signal }) => {
      const params = { page, limit };

      if (dq) params.q = dq;
      if (role) params.role = role;
      if (blocked !== "") params.blocked = blocked;

      const sortByMap = {
        name: "displayName",
        role: "role",
        level: "roleLevel",
        status: "isBlocked",
        lastLogin: "lastLoginAt",
      };

      if (sortByMap[sortBy]) {
        params.sortBy = sortByMap[sortBy];
        params.sortDir = sortDir;
      }

      const { data } = await api.get("/users/admin/list", { params, signal });
      return data;
    },
    staleTime: 8_000,
    keepPreviousData: true,
    retry: 1,
  });

  const users = useMemo(() => {
    if (sortBy === "permissions") {
      return sortUsers(listQuery.data?.users || [], sortBy, sortDir);
    }
    return Array.isArray(listQuery.data?.users) ? listQuery.data.users : [];
  }, [listQuery.data?.users, sortBy, sortDir]);

  const total = listQuery.data?.total || 0;
  const pages = listQuery.data?.pages || 1;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function goPage(p) {
    setPage(clamp(Number(p || 1), 1, Math.max(1, pages)));
  }

  function toggleSort(nextKey) {
    if (sortBy === nextKey) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(nextKey);
    setSortDir(
      nextKey === "level" || nextKey === "permissions" || nextKey === "lastLogin"
        ? "desc"
        : "asc"
    );
  }

  function resetFilters() {
    setQ("");
    setRole("");
    setBlocked("");
    setSortBy("name");
    setSortDir("asc");
    setPage(1);
  }

  function isSelected(id) {
    return selectedIds.includes(String(id || ""));
  }

  function toggleSelect(id) {
    const key = String(id || "");
    if (!key) return;

    setSelectedIds((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  }

  function toggleSelectAllOnPage() {
    const pageIds = users.map((u) => String(u?._id || "")).filter(Boolean);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  }

  function mergeUpdatedUserIntoCaches(updatedUser) {
    if (!updatedUser?._id && !updatedUser?.id) return;

    const userId = String(updatedUser?._id || updatedUser?.id || "");

    qc.setQueriesData({ queryKey: ["admin-users"] }, (old) => {
      if (!old?.users) return old;
      return {
        ...old,
        users: old.users.map((u) =>
          String(u?._id || "") === userId
            ? {
                ...u,
                ...updatedUser,
                _id: u?._id || updatedUser?._id || updatedUser?.id,
              }
            : u
        ),
      };
    });

    setDrawerUser((prev) => {
      if (!prev?._id) return prev;
      return String(prev._id) === userId
        ? {
            ...prev,
            ...updatedUser,
            _id: prev._id || updatedUser?._id || updatedUser?.id,
          }
        : prev;
    });
  }

  React.useEffect(() => {
    setSelectedIds([]);
  }, [page, limit, role, blocked, dq, sortBy, sortDir]);

  const saveMutation = useMutation({
    mutationFn: async ({ id, next }) => {
      const payload = {
        role: next.role,
        roleLevel: next.roleLevel,
        blocked: next.blocked,
        permissions: withPermissionDependencies(next.permissions),
      };

      const { data } = await api.patch(`/users/admin/${id}/rbac`, payload);
      return { data, payload, id };
    },
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });

      const prev = qc.getQueryData(listQueryKey);

      qc.setQueryData(listQueryKey, (old) => {
        if (!old?.users) return old;
        return {
          ...old,
          users: old.users.map((u) =>
            String(u?._id || "") === String(id)
              ? {
                  ...u,
                  role: next.role,
                  roleLevel: next.roleLevel,
                  permissions: withPermissionDependencies(next.permissions),
                  isBlocked: next.blocked,
                }
              : u
          ),
        };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(listQueryKey, ctx.prev);
      }
      toast.error(getErrorMessage(err));
    },
    onSuccess: ({ data, payload, id }) => {
      const serverUser = data?.user || null;
      const updatedUser = serverUser
        ? {
            ...serverUser,
            _id: serverUser?._id || serverUser?.id || id,
            permissions: Array.isArray(serverUser?.permissions)
              ? serverUser.permissions
              : withPermissionDependencies(payload.permissions),
            isBlocked:
              typeof serverUser?.isBlocked === "boolean"
                ? serverUser.isBlocked
                : Boolean(payload.blocked),
          }
        : {
            _id: id,
            role: payload.role,
            roleLevel: payload.roleLevel,
            permissions: withPermissionDependencies(payload.permissions),
            isBlocked: Boolean(payload.blocked),
          };

      mergeUpdatedUserIntoCaches(updatedUser);
      toast.success("RBAC updated");
      setDrawerUser(null);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ action, userIds, templateName }) => {
      if (!Array.isArray(userIds) || !userIds.length) return true;

      let payload = {
        action,
        userIds,
      };

      if (action === "apply-template" && templateName) {
        payload = {
          action: "set-permissions",
          userIds,
          permissions: withPermissionDependencies(templateMap[templateName] || []),
        };
      } else if (action === "grant-admin-readonly") {
        payload = {
          action: "set-rbac",
          userIds,
          role: "admin",
          roleLevel: 20,
          blocked: false,
          permissions: withPermissionDependencies(templateMap["Read Only Admin"] || []),
        };
      }

      const { data } = await api.patch("/users/admin/bulk-rbac", payload);
      return data;
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
    onSuccess: (data, vars) => {
      const count = Number(data?.successCount || 0);
      const failed = Number(data?.failedCount || 0);

      if (failed > 0) {
        toast.success(`Bulk update completed: ${count} success, ${failed} failed`);
      } else {
        const totalChanged = Array.isArray(vars?.userIds) ? vars.userIds.length : count;
        toast.success(`Bulk update completed for ${totalChanged} user(s)`);
      }

      setSelectedIds([]);
      setBulkAction("");
      setBulkTemplate("");
      setDrawerUser(null);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  function requestSave(user, next) {
    const id = user?._id;
    if (!id) return;

    const isBlock = Boolean(next.blocked) && !Boolean(user?.isBlocked);
    const demote =
      String(user?.role || "") === "admin" &&
      (String(next.role || "") === "user" || Number(next.roleLevel || 0) === 0);

    if (isBlock || demote) {
      setConfirm({
        open: true,
        title: isBlock ? "Block this user?" : "Demote admin access?",
        description: isBlock
          ? "This will prevent the user from accessing the system."
          : "This change may remove privileged access from this account.",
        payload: { type: "single-save", id, next },
      });
      return;
    }

    saveMutation.mutate({ id, next });
  }

  function requestBulkAction() {
    if (!selectedIds.length || !bulkAction) {
      toast.error("Select user(s) and a bulk action first.");
      return;
    }

    const danger =
      bulkAction === "block" ||
      bulkAction === "make-user" ||
      bulkAction === "clear-permissions";

    const labelMap = {
      block: "Block selected users?",
      unblock: "Unblock selected users?",
      "make-admin": "Promote selected users to admin?",
      "make-user": "Demote selected users to user?",
      "clear-permissions": "Clear permissions for selected users?",
      "apply-template": "Apply permission template to selected users?",
      "grant-admin-readonly": "Grant read-only admin access to selected users?",
    };

    const descMap = {
      block: "Selected accounts will be blocked from accessing the system.",
      unblock: "Selected accounts will regain access to the system.",
      "make-admin": "Selected accounts will get admin role and elevated access.",
      "make-user": "Selected accounts will lose admin-style role access.",
      "clear-permissions": "Selected accounts will lose all explicit permissions.",
      "apply-template": `Template "${bulkTemplate || "—"}" will be applied to selected users.`,
      "grant-admin-readonly":
        "Selected accounts will receive a read-only admin permission set.",
    };

    if (bulkAction === "apply-template" && !bulkTemplate) {
      toast.error("Choose a template first.");
      return;
    }

    if (danger) {
      setConfirm({
        open: true,
        title: labelMap[bulkAction] || "Run bulk action?",
        description: descMap[bulkAction] || "This will update selected users.",
        payload: {
          type: "bulk-action",
          action: bulkAction,
          userIds: selectedIds,
          templateName: bulkTemplate,
        },
      });
      return;
    }

    bulkMutation.mutate({
      action: bulkAction,
      userIds: selectedIds,
      templateName: bulkTemplate,
    });
  }

  function onConfirm() {
    const payload = confirm.payload;

    if (payload?.type === "single-save" && payload?.id && payload?.next) {
      saveMutation.mutate({ id: payload.id, next: payload.next });
    }

    if (payload?.type === "bulk-action" && payload?.action && Array.isArray(payload?.userIds)) {
      bulkMutation.mutate({
        action: payload.action,
        userIds: payload.userIds,
        templateName: payload.templateName,
      });
    }

    setConfirm({ open: false, title: "", description: "", payload: null });
  }

  function onCloseConfirm() {
    if (saveMutation.isPending || bulkMutation.isPending) return;
    setConfirm({ open: false, title: "", description: "", payload: null });
  }

  const allPageSelected =
    users.length > 0 && users.every((u) => selectedIds.includes(String(u?._id || "")));

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText="Yes, continue"
        cancelText="Cancel"
        tone="danger"
        busy={saveMutation.isPending || bulkMutation.isPending}
        onConfirm={onConfirm}
        onClose={onCloseConfirm}
      />

      <Drawer
        open={!!drawerUser}
        user={drawerUser}
        catalog={catalogQuery.data}
        saving={saveMutation.isPending}
        actorUser={actorUser}
        onClose={() => {
          if (saveMutation.isPending) return;
          setDrawerUser(null);
        }}
        onSave={(next) => requestSave(drawerUser, next)}
      />

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <Users size={14} />
              Roles & Permissions
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              RBAC Management
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              <span>
                Total users: <span className="font-semibold text-gray-900">{total}</span>
              </span>
              <span>
                Selected: <span className="font-semibold text-gray-900">{selectedIds.length}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              onClick={() => listQuery.refetch()}
              disabled={listQuery.isFetching}
            >
              {listQuery.isFetching ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <RefreshCcw size={16} />
              )}
              Refresh
            </button>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              onClick={resetFilters}
            >
              <Trash2 size={16} />
              Reset filters
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="relative mt-2">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="w-full rounded-2xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-black"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by name, email, phone or firebase uid"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Role</div>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Status</div>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              value={blocked}
              onChange={(e) => {
                setBlocked(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="false">Active</option>
              <option value="true">Blocked</option>
            </select>
          </div>

          <div className="lg:col-span-1">
            <div className="text-sm font-semibold text-gray-900">Per page</div>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value || 20));
                setPage(1);
              }}
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Filter size={14} />
              Sort by
            </div>
            <select
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              value={`${sortBy}:${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = String(e.target.value || "name:asc").split(":");
                setSortBy(sb || "name");
                setSortDir(sd || "asc");
              }}
            >
              <option value="name:asc">Name (A-Z)</option>
              <option value="name:desc">Name (Z-A)</option>
              <option value="role:asc">Role (A-Z)</option>
              <option value="role:desc">Role (Z-A)</option>
              <option value="level:desc">Level (High-Low)</option>
              <option value="level:asc">Level (Low-High)</option>
              <option value="permissions:desc">Permissions (Most)</option>
              <option value="permissions:asc">Permissions (Least)</option>
              <option value="status:asc">Status (Active first)</option>
              <option value="status:desc">Status (Blocked first)</option>
              <option value="lastLogin:desc">Last login (Newest)</option>
              <option value="lastLogin:asc">Last login (Oldest)</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 text-xs text-gray-500 xl:flex-row xl:items-center xl:justify-between">
          <div>
            Page: <span className="font-semibold text-gray-900">{page}</span> /{" "}
            <span className="font-semibold text-gray-900">{pages}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1 || listQuery.isFetching}
            >
              Prev
            </button>

            <button
              type="button"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
              onClick={() => goPage(page + 1)}
              disabled={page >= pages || listQuery.isFetching}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Bulk actions</div>
            <div className="mt-1 text-xs text-gray-500">
              Select users from the table and apply an action.
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-12 xl:w-auto">
            <div className="md:col-span-5">
              <select
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
              >
                <option value="">Choose bulk action</option>
                <option value="block">Block selected</option>
                <option value="unblock">Unblock selected</option>
                <option value="make-admin">Make admin</option>
                <option value="make-user">Make user</option>
                <option value="clear-permissions">Clear permissions</option>
                <option value="apply-template">Apply template</option>
                <option value="grant-admin-readonly">Grant read-only admin</option>
              </select>
            </div>

            <div className="md:col-span-4">
              <select
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black disabled:opacity-60"
                value={bulkTemplate}
                onChange={(e) => setBulkTemplate(e.target.value)}
                disabled={bulkAction !== "apply-template"}
              >
                <option value="">Choose template</option>
                {Object.keys(templateMap).map((template) => (
                  <option key={template} value={template}>
                    {template}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3">
              <button
                type="button"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 disabled:opacity-60"
                onClick={requestBulkAction}
                disabled={!selectedIds.length || bulkMutation.isPending}
              >
                {bulkMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Apply
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
          Selected users: <span className="font-semibold text-gray-900">{selectedIds.length}</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        {listQuery.isPending ? (
          <TableSkeleton rows={10} />
        ) : listQuery.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-semibold">Failed to load users</div>
              <div className="mt-1">{getErrorMessage(listQuery.error)}</div>
              <button
                type="button"
                className="mt-4 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
                onClick={() => listQuery.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-700">
              No users
            </div>
            <div className="text-2xl font-semibold text-gray-900">No results found</div>
            <div className="mt-2 text-gray-600">Try changing filters or search term.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1180px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                  <th className="px-4 py-4 font-semibold">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2"
                      onClick={toggleSelectAllOnPage}
                    >
                      {allPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                      <span>Select</span>
                    </button>
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    <HeaderSortButton
                      label="User"
                      value="name"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onChange={toggleSort}
                    />
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    <HeaderSortButton
                      label="Role"
                      value="role"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onChange={toggleSort}
                    />
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    <HeaderSortButton
                      label="Level"
                      value="level"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onChange={toggleSort}
                    />
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    <HeaderSortButton
                      label="Permissions"
                      value="permissions"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onChange={toggleSort}
                    />
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    <HeaderSortButton
                      label="Status"
                      value="status"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onChange={toggleSort}
                    />
                  </th>

                  <th className="px-4 py-4 font-semibold">
                    <HeaderSortButton
                      label="Last login"
                      value="lastLogin"
                      sortBy={sortBy}
                      sortDir={sortDir}
                      onChange={toggleSort}
                    />
                  </th>

                  <th className="px-4 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => (
                  <tr
                    key={u?._id}
                    className="border-b border-gray-100 transition hover:bg-gray-50/70 last:border-b-0"
                  >
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        className="inline-flex items-center justify-center"
                        onClick={() => toggleSelect(u?._id)}
                        aria-label="Select row"
                      >
                        {isSelected(u?._id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>

                    <td className="px-4 py-4">
                      <div className="max-w-[260px] truncate font-semibold text-gray-900">
                        {u?.displayName || "—"}
                      </div>
                      <div className="max-w-[260px] truncate text-sm text-gray-500">
                        {u?.email || u?.phone || "—"}
                      </div>
                      <div className="max-w-[260px] truncate font-mono text-xs text-gray-500">
                        {String(u?._id || "")}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {String(u?.role || "user")}
                    </td>

                    <td className="px-4 py-4 font-semibold text-gray-900">
                      {Number(u?.roleLevel || 0)}
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-700">
                      {Array.isArray(u?.permissions) && u.permissions.length
                        ? `${u.permissions.length} permission(s)`
                        : "—"}
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          u?.isBlocked
                            ? "border-rose-200 bg-rose-50 text-rose-800"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800",
                        ].join(" ")}
                      >
                        {u?.isBlocked ? "BLOCKED" : "ACTIVE"}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-sm text-gray-600">
                      {u?.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                    </td>

                    <td className="px-4 py-4 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                        onClick={() => setDrawerUser(u)}
                      >
                        <Eye size={16} />
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 p-4 text-xs text-gray-500">
              <div>
                Showing <span className="font-semibold text-gray-900">{users.length}</span> user(s)
                on this page • Total: <span className="font-semibold text-gray-900">{total}</span>
              </div>

              <div className="inline-flex items-center gap-3">
                <span>
                  Selected: <span className="font-semibold text-gray-900">{selectedIds.length}</span>
                </span>

                {listQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Updating...
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}