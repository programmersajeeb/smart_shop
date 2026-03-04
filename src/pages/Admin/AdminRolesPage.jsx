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
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";

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

function Drawer({ open, onClose, user, catalog, onSave, saving }) {
  const [role, setRole] = useState(user?.role || "user");
  const [roleLevel, setRoleLevel] = useState(Number(user?.roleLevel || 0));
  const [blocked, setBlocked] = useState(Boolean(user?.isBlocked));
  const [perms, setPerms] = useState(normalizePermissions(user?.permissions));

  // keep state in sync when switching users
  React.useEffect(() => {
    setRole(user?.role || "user");
    setRoleLevel(Number(user?.roleLevel || 0));
    setBlocked(Boolean(user?.isBlocked));
    setPerms(normalizePermissions(user?.permissions));
  }, [user?._id]);

  if (!open) return null;

  const groups = Array.isArray(catalog?.groups) ? catalog.groups : [];
  const flat = Array.isArray(catalog?.permissions) ? catalog.permissions : [];

  const allPerms = useMemo(() => {
    if (groups.length) {
      const g = [];
      for (const x of groups) for (const it of (x?.items || [])) g.push(it);
      return normalizePermissions(g);
    }
    return normalizePermissions(flat);
  }, [groups, flat]);

  const has = (p) => perms.includes(p);

  function toggle(p) {
    const key = String(p || "").trim();
    if (!key) return;
    if (has(key)) setPerms((prev) => prev.filter((x) => x !== key));
    else setPerms((prev) => normalizePermissions([...prev, key]));
  }

  function applyTemplate(name) {
    const templates = {
      "Order Manager": ["orders:read", "orders:write"],
      "Catalog Manager": ["products:read", "products:write"],
      Auditor: ["audit:read"],
      "User Manager": ["users:read", "users:write"],
      "Admin Access Only": ["admin:access"],
    };
    const t = templates[name] || [];
    setPerms(normalizePermissions(t));
  }

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white border-l shadow-2xl overflow-auto">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
              <ShieldCheck size={14} /> Roles & Permissions
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900 truncate">
              {user?.displayName || user?.email || user?.phone || "User"}
            </div>
            <div className="mt-1 text-xs text-gray-500 font-mono break-all">
              {String(user?._id || "")}
            </div>
          </div>

          <button
            type="button"
            className="p-2 rounded-2xl hover:bg-gray-50 transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Profile */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Profile</div>
            <div className="mt-2 text-sm text-gray-700 space-y-1">
              <div className="text-gray-600">Email: <span className="text-gray-900 font-medium">{user?.email || "—"}</span></div>
              <div className="text-gray-600">Phone: <span className="text-gray-900 font-medium">{user?.phone || "—"}</span></div>
              <div className="text-gray-600">Last login: <span className="text-gray-900 font-medium">{user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "—"}</span></div>
            </div>
          </div>

          {/* RBAC */}
          <div className="rounded-3xl border bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-900">RBAC Settings</div>
              <div className={["text-xs px-3 py-1 rounded-full border inline-flex items-center gap-2",
                blocked ? "bg-rose-50 border-rose-200 text-rose-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
              ].join(" ")}>
                {blocked ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                {blocked ? "Blocked" : "Active"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Role</div>
                <select
                  className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
                <div className="mt-2 text-xs text-gray-500">
                  *Enterprise tip: staff admin হলে role=admin রেখে roleLevel কমিয়ে + permissions দিন।
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Role Level</div>
                <input
                  className="input input-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
                  type="number"
                  value={roleLevel}
                  onChange={(e) => setRoleLevel(Number(e.target.value || 0))}
                  min={0}
                  max={100}
                />
                <div className="mt-2 text-xs text-gray-500">
                  100 = Super Admin • 50 = Staff Admin • 0 = User
                </div>
              </div>

              <div className="md:col-span-4">
                <div className="text-sm font-semibold text-gray-900">Block user</div>
                <button
                  type="button"
                  className={["btn w-full rounded-2xl mt-2 border-0",
                    blocked ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"
                  ].join(" ")}
                  onClick={() => setBlocked((b) => !b)}
                >
                  {blocked ? "Unblock" : "Block"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <KeyRound size={16} /> Permission Templates
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {["Order Manager", "Catalog Manager", "Auditor", "User Manager", "Admin Access Only"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    className="btn btn-sm rounded-xl bg-white border-gray-200 hover:bg-gray-50"
                    onClick={() => applyTemplate(t)}
                  >
                    {t}
                  </button>
                ))}
                <button
                  type="button"
                  className="btn btn-sm rounded-xl bg-white border-gray-200 hover:bg-gray-50"
                  onClick={() => setPerms([])}
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="text-sm font-semibold text-gray-900">Permissions</div>
            <div className="text-xs text-gray-500">
              *`*` (wildcard) দিলে সব permission পেয়ে যাবে — শুধু super admin এর জন্য।
            </div>

            {groups.length ? (
              <div className="space-y-4">
                {groups.map((g) => (
                  <div key={g?.name} className="rounded-2xl border p-4">
                    <div className="text-sm font-semibold">{g?.name || "Group"}</div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {(g?.items || []).map((p) => (
                        <label key={p} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={has(p)}
                            onChange={() => toggle(p)}
                          />
                          <span className="font-mono text-[13px]">{p}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {allPerms.map((p) => (
                    <label key={p} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={has(p)}
                        onChange={() => toggle(p)}
                      />
                      <span className="font-mono text-[13px]">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border bg-gray-50 p-4">
              <div className="text-sm font-semibold text-gray-900">Selected</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {perms.length ? perms.map((p) => (
                  <span key={p} className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-mono">
                    {p}
                    <button type="button" className="opacity-70 hover:opacity-100" onClick={() => toggle(p)}>
                      <X size={12} />
                    </button>
                  </span>
                )) : (
                  <span className="text-xs text-gray-500">No permissions selected</span>
                )}
              </div>
            </div>

            <button
              type="button"
              className="btn w-full rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
              disabled={saving}
              onClick={() =>
                onSave?.({
                  role,
                  roleLevel,
                  blocked,
                  permissions: perms,
                })
              }
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save changes
            </button>
          </div>

          <div className="rounded-3xl border bg-gray-50 p-5 text-xs text-gray-600">
            <div className="font-semibold text-gray-800 flex items-center gap-2">
              <ShieldCheck size={14} /> Enterprise note
            </div>
            <div className="mt-1">
              Server will enforce RBAC using DB-loaded permissions & roleLevel (not only token).
              Every admin change is audit-log ready.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TableSkeleton({ rows = 10 }) {
  return (
    <div className="p-6 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 rounded-2xl border bg-gray-50 animate-pulse" />
      ))}
    </div>
  );
}

export default function AdminRolesPage() {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [blocked, setBlocked] = useState("");

  const dq = useDeferredValue(q);

  const [drawerUser, setDrawerUser] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    description: "",
    payload: null,
  });

  const catalogQuery = useQuery({
    queryKey: ["rbac-permissions-catalog"],
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/users/admin/permissions", { signal });
      return data; // { groups, permissions }
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const listQuery = useQuery({
    queryKey: ["admin-users", page, limit, role, blocked, dq],
    queryFn: async ({ signal }) => {
      const params = { page, limit };
      if (dq) params.q = dq;
      if (role) params.role = role;
      if (blocked !== "") params.blocked = blocked;
      const { data } = await api.get("/users/admin/list", { params, signal });
      return data; // { users, total, page, pages }
    },
    staleTime: 8_000,
    keepPreviousData: true,
    retry: 1,
  });

  const users = listQuery.data?.users || [];
  const total = listQuery.data?.total || 0;
  const pages = listQuery.data?.pages || 1;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }
  function goPage(p) {
    setPage(clamp(Number(p || 1), 1, Math.max(1, pages)));
  }

  const saveMutation = useMutation({
    mutationFn: async ({ id, next }) => {
      // 1) role/roleLevel
      await api.patch(`/users/admin/${id}/role`, {
        role: next.role,
        roleLevel: next.roleLevel,
      });

      // 2) permissions
      await api.patch(`/users/admin/${id}/permissions`, {
        permissions: next.permissions,
      });

      // 3) block/unblock
      await api.patch(`/users/admin/${id}/block`, {
        blocked: next.blocked,
      });

      return true;
    },
    onMutate: async ({ id, next }) => {
      await qc.cancelQueries({ queryKey: ["admin-users"] });

      const prev = qc.getQueryData(["admin-users", page, limit, role, blocked, dq]);

      qc.setQueryData(["admin-users", page, limit, role, blocked, dq], (old) => {
        if (!old?.users) return old;
        return {
          ...old,
          users: old.users.map((u) =>
            u._id === id
              ? {
                  ...u,
                  role: next.role,
                  roleLevel: next.roleLevel,
                  permissions: next.permissions,
                  isBlocked: next.blocked,
                }
              : u
          ),
        };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-users", page, limit, role, blocked, dq], ctx.prev);
      toast.error(getErrorMessage(err));
    },
    onSuccess: () => {
      toast.success("RBAC updated");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
  });

  function requestSave(user, next) {
    const id = user?._id;
    if (!id) return;

    // confirm for dangerous actions
    const isBlock = Boolean(next.blocked) && !Boolean(user?.isBlocked);
    const demote = String(user?.role || "") === "admin" && String(next.role || "") === "user";

    if (isBlock || demote) {
      setConfirm({
        open: true,
        title: isBlock ? "Block this user?" : "Demote admin to user?",
        description: isBlock
          ? "This will prevent the user from accessing the system."
          : "This will remove admin privileges from this account.",
        payload: { id, next },
      });
      return;
    }

    saveMutation.mutate({ id, next });
  }

  function onConfirm() {
    const p = confirm.payload;
    if (!p?.id || !p?.next) return;
    saveMutation.mutate({ id: p.id, next: p.next });
    setConfirm({ open: false, title: "", description: "", payload: null });
  }

  function onCloseConfirm() {
    if (saveMutation.isPending) return;
    setConfirm({ open: false, title: "", description: "", payload: null });
  }

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText="Yes, continue"
        cancelText="Cancel"
        tone="danger"
        busy={saveMutation.isPending}
        onConfirm={onConfirm}
        onClose={onCloseConfirm}
      />

      <Drawer
        open={!!drawerUser}
        user={drawerUser}
        catalog={catalogQuery.data}
        saving={saveMutation.isPending}
        onClose={() => setDrawerUser(null)}
        onSave={(next) => requestSave(drawerUser, next)}
      />

      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Users size={16} />
            <span>Admin • Roles & Permissions</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            RBAC Management
          </h1>
          <div className="text-sm text-gray-600 mt-2">
            Total users: <span className="font-semibold text-gray-900">{total}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
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
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-3xl border bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="mt-2 relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input input-bordered w-full rounded-2xl bg-white border-gray-200 pl-11"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by email / phone / name / firebase uid"
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Role</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Status</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
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

          <div className="lg:col-span-2">
            <div className="text-sm font-semibold text-gray-900">Per page</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
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
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500">
          <div>
            Page: <span className="font-semibold text-gray-900">{page}</span> /{" "}
            <span className="font-semibold text-gray-900">{pages}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
              onClick={() => goPage(page - 1)}
              disabled={page <= 1 || listQuery.isFetching}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
              onClick={() => goPage(page + 1)}
              disabled={page >= pages || listQuery.isFetching}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        {listQuery.isPending ? (
          <TableSkeleton rows={10} />
        ) : listQuery.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
              <div className="font-semibold">Failed to load users</div>
              <div className="mt-1">{getErrorMessage(listQuery.error)}</div>
              <button
                type="button"
                className="btn btn-sm mt-4 rounded-xl bg-black text-white hover:bg-gray-900 border-0"
                onClick={() => listQuery.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto mb-3 w-fit rounded-full border px-3 py-1 text-sm bg-gray-50">
              No users
            </div>
            <div className="text-2xl font-bold text-gray-900">No results found</div>
            <div className="mt-2 text-gray-600">
              Try changing filters or search term.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Level</th>
                  <th>Permissions</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u?._id}>
                    <td>
                      <div className="font-semibold text-gray-900 truncate max-w-[260px]">
                        {u?.displayName || "—"}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-[260px]">
                        {u?.email || u?.phone || "—"}
                      </div>
                      <div className="text-xs text-gray-500 font-mono truncate max-w-[260px]">
                        {String(u?._id || "")}
                      </div>
                    </td>
                    <td className="font-semibold">{String(u?.role || "user")}</td>
                    <td className="font-semibold">{Number(u?.roleLevel || 0)}</td>
                    <td className="text-sm">
                      {Array.isArray(u?.permissions) && u.permissions.length
                        ? `${u.permissions.length} permission(s)`
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={[
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                          u?.isBlocked
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : "bg-emerald-50 border-emerald-200 text-emerald-800",
                        ].join(" ")}
                      >
                        {u?.isBlocked ? "BLOCKED" : "ACTIVE"}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                        onClick={() => setDrawerUser(u)}
                      >
                        <Eye size={16} /> Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t text-xs text-gray-500 flex flex-wrap items-center justify-between gap-3">
              <div>
                Showing{" "}
                <span className="font-semibold text-gray-900">{users.length}</span>{" "}
                user(s) on this page • Total:{" "}
                <span className="font-semibold text-gray-900">{total}</span>
              </div>
              <div className="inline-flex items-center gap-2">
                {listQuery.isFetching ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" /> Updating...
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
