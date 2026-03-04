import React, { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCcw,
  Loader2,
  Eye,
  Ban,
  CheckCircle2,
  Copy,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../services/apiClient";
import ConfirmDialog from "../../shared/ui/ConfirmDialog";
import AdminUsersTableSkeleton from "../../shared/components/ui/skeletons/AdminUsersTableSkeleton";

function getErrorMessage(err) {
  const msg =
    err?.response?.data?.message || err?.response?.data?.error || err?.message;
  return msg ? String(msg) : "Something went wrong.";
}

function formatDate(iso) {
  try {
    if (!iso) return "—";
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function badgeClass(type) {
  const t = String(type || "").toLowerCase();
  if (t === "admin") return "bg-black text-white border-black";
  if (t === "user") return "bg-gray-50 text-gray-800 border-gray-200";
  if (t === "blocked") return "bg-rose-50 text-rose-800 border-rose-200";
  if (t === "active") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  return "bg-gray-50 text-gray-700 border-gray-200";
}

function Avatar({ src, name }) {
  const letter = String(name || "?").trim().slice(0, 1).toUpperCase() || "?";
  return (
    <div className="w-10 h-10 rounded-2xl border bg-gray-100 overflow-hidden flex items-center justify-center">
      {src ? (
        <img
          src={src}
          alt={name || "User"}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="text-sm font-bold text-gray-700">{letter}</span>
      )}
    </div>
  );
}

function Drawer({ open, onClose, user, onViewOrders, onOpenRbac }) {
  if (!open) return null;

  const title =
    user?.displayName || user?.email || user?.phone || "Customer";
  const isBlocked = Boolean(user?.isBlocked);

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close overlay"
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-xl bg-white border-l shadow-2xl overflow-auto">
        <div className="p-5 border-b flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-gray-500 flex items-center gap-2">
              <Users size={14} /> Customers
            </div>
            <div className="mt-1 text-lg font-semibold text-gray-900 truncate">
              {title}
            </div>
            <div className="mt-1 text-xs text-gray-500 font-mono break-all">
              {String(user?._id || "")}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  badgeClass(user?.role),
                ].join(" ")}
              >
                <ShieldCheck size={14} />
                {String(user?.role || "user")}
                <span className="opacity-70">lvl {Number(user?.roleLevel || 0)}</span>
              </span>

              <span
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                  isBlocked ? badgeClass("blocked") : badgeClass("active"),
                ].join(" ")}
              >
                {isBlocked ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                {isBlocked ? "Blocked" : "Active"}
              </span>
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

        <div className="p-5 space-y-5">
          <div className="rounded-3xl border bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Profile</div>

            <div className="mt-4 flex items-center gap-4">
              <Avatar src={user?.photoURL} name={title} />
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{title}</div>
                <div className="text-sm text-gray-600 truncate">
                  {user?.email || user?.phone || "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm text-gray-700 space-y-2">
              <div className="text-gray-600">
                Email: <span className="text-gray-900 font-medium">{user?.email || "—"}</span>
              </div>
              <div className="text-gray-600">
                Phone: <span className="text-gray-900 font-medium">{user?.phone || "—"}</span>
              </div>
              <div className="text-gray-600">
                Firebase UID:{" "}
                <span className="text-gray-900 font-medium">{user?.firebaseUid || "—"}</span>
              </div>
              <div className="text-gray-600">
                Last login:{" "}
                <span className="text-gray-900 font-medium">{formatDate(user?.lastLoginAt)}</span>
              </div>
              <div className="text-gray-600">
                Joined:{" "}
                <span className="text-gray-900 font-medium">{formatDate(user?.createdAt)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-900 transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                onClick={onViewOrders}
              >
                View orders <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                onClick={onOpenRbac}
              >
                <ShieldCheck size={16} /> Manage RBAC
              </button>
            </div>
          </div>

          <div className="rounded-3xl border bg-gray-50 p-5 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Tip</div>
            <div className="mt-1">
              “Manage RBAC” থেকে role/permissions/block সব সেট করা যায়। Customers page
              মূলত CRM view + দ্রুত order workflow এর জন্য।
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  const nav = useNavigate();
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
    payload: null, // { id, nextBlocked }
  });

  const listQuery = useQuery({
    queryKey: ["admin-customers", page, limit, role, blocked, dq],
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
  const pages = Math.max(1, Number(listQuery.data?.pages || 1));

  const blockMutation = useMutation({
    mutationFn: async ({ id, nextBlocked }) => {
      const { data } = await api.patch(`/users/admin/${id}/block`, {
        blocked: nextBlocked,
      });
      return data;
    },
    onMutate: async ({ id, nextBlocked }) => {
      await qc.cancelQueries({ queryKey: ["admin-customers"] });

      const prev = qc.getQueryData(["admin-customers", page, limit, role, blocked, dq]);

      qc.setQueryData(["admin-customers", page, limit, role, blocked, dq], (old) => {
        if (!old?.users) return old;
        return {
          ...old,
          users: old.users.map((u) =>
            u._id === id ? { ...u, isBlocked: nextBlocked } : u
          ),
        };
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        qc.setQueryData(["admin-customers", page, limit, role, blocked, dq], ctx.prev);
      }
      toast.error(getErrorMessage(err));
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.nextBlocked ? "User blocked" : "User unblocked");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const busy = listQuery.isFetching || blockMutation.isPending;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function goPrev() {
    setPage((p) => clamp(p - 1, 1, pages));
  }
  function goNext() {
    setPage((p) => clamp(p + 1, 1, pages));
  }

  function requestBlockToggle(u) {
    const id = u?._id;
    if (!id) return;

    const nextBlocked = !Boolean(u?.isBlocked);

    setConfirm({
      open: true,
      title: nextBlocked ? "Block this user?" : "Unblock this user?",
      description: nextBlocked
        ? "This will prevent the user from accessing the system."
        : "This will restore access for this user.",
      payload: { id, nextBlocked },
    });
  }

  function onConfirm() {
    const p = confirm.payload;
    if (!p?.id) return;
    blockMutation.mutate(
      { id: p.id, nextBlocked: p.nextBlocked },
      {
        onSettled: () => setConfirm({ open: false, title: "", description: "", payload: null }),
      }
    );
  }

  function onCloseConfirm() {
    if (blockMutation.isPending) return;
    setConfirm({ open: false, title: "", description: "", payload: null });
  }

  function copyId(id) {
    const v = String(id || "").trim();
    if (!v) return;
    navigator.clipboard
      ?.writeText(v)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Copy failed"));
  }

  const empty = !listQuery.isPending && users.length === 0;

  return (
    <div className="space-y-6">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        description={confirm.description}
        confirmText="Yes, continue"
        cancelText="Cancel"
        tone="danger"
        busy={blockMutation.isPending}
        onConfirm={onConfirm}
        onClose={onCloseConfirm}
      />

      <Drawer
        open={!!drawerUser}
        user={drawerUser}
        onClose={() => setDrawerUser(null)}
        onViewOrders={() => {
          const emailOrPhone = drawerUser?.email || drawerUser?.phone || "";
          const q = String(emailOrPhone || "").trim();
          nav(q ? `/admin/orders?q=${encodeURIComponent(q)}` : "/admin/orders");
        }}
        onOpenRbac={() => nav("/admin/roles")}
      />

      {/* Header */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Users size={16} />
            <span>Admin • Customers</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
            Customers
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
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border bg-white px-4 py-3">
              <Search size={18} className="text-gray-400" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="w-full outline-none text-sm"
                placeholder="Search by email, phone, name, firebase UID..."
              />
              {q ? (
                <button
                  type="button"
                  className="p-1 rounded-xl hover:bg-gray-50"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  aria-label="Clear"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              ) : null}
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
            <div className="text-sm font-semibold text-gray-900">Limit</div>
            <select
              className="select select-bordered w-full rounded-2xl bg-white border-gray-200 mt-2"
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value || 20));
                setPage(1);
              }}
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">User list</div>
            <div className="text-xs text-gray-500 mt-1">
              Smooth UX: debounced search + cached pagination
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Page {page} / {pages}
          </div>
        </div>

        {listQuery.isPending ? (
          <AdminUsersTableSkeleton rows={10} />
        ) : empty ? (
          <div className="p-8 text-center text-gray-600">
            No users found.
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last login</th>
                  <th>Joined</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((u) => {
                  const title = u.displayName || u.email || u.phone || "User";
                  const isBlocked = Boolean(u.isBlocked);

                  return (
                    <tr key={u._id}>
                      <td className="min-w-[320px]">
                        <div className="flex items-center gap-3">
                          <Avatar src={u.photoURL} name={title} />
                          <div className="min-w-0">
                            <div className="font-semibold text-gray-900 truncate">
                              {title}
                            </div>
                            <div className="text-sm text-gray-600 truncate">
                              {u.email || u.phone || "—"}
                            </div>
                            <div className="text-xs text-gray-500 font-mono truncate">
                              {String(u._id || "")}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="ml-auto inline-flex items-center justify-center rounded-2xl border px-3 py-2 hover:bg-gray-50 transition"
                            onClick={() => copyId(u._id)}
                            title="Copy user id"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>

                      <td>
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                            badgeClass(u.role),
                          ].join(" ")}
                        >
                          {String(u.role || "user")}{" "}
                          <span className="ml-2 opacity-70">
                            lvl {Number(u.roleLevel || 0)}
                          </span>
                        </span>
                      </td>

                      <td>
                        <span
                          className={[
                            "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
                            isBlocked ? badgeClass("blocked") : badgeClass("active"),
                          ].join(" ")}
                        >
                          {isBlocked ? <Ban size={14} /> : <CheckCircle2 size={14} />}
                          {isBlocked ? "Blocked" : "Active"}
                        </span>
                      </td>

                      <td className="text-sm text-gray-700">
                        {formatDate(u.lastLoginAt)}
                      </td>

                      <td className="text-sm text-gray-700">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="text-right">
                        <div className="inline-flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-2xl border px-3 py-2 hover:bg-gray-50 transition"
                            onClick={() => setDrawerUser(u)}
                            disabled={busy}
                            title="View"
                          >
                            <Eye size={18} />
                          </button>

                          <button
                            type="button"
                            className={[
                              "inline-flex items-center justify-center rounded-2xl border px-3 py-2 transition",
                              isBlocked
                                ? "hover:bg-emerald-50 text-emerald-700"
                                : "hover:bg-rose-50 text-rose-600",
                            ].join(" ")}
                            onClick={() => requestBlockToggle(u)}
                            disabled={busy}
                            title={isBlocked ? "Unblock" : "Block"}
                          >
                            {isBlocked ? <CheckCircle2 size={18} /> : <Ban size={18} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="mt-4 text-xs text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </div>
          </div>
        )}

        <div className="p-6 border-t bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> /{" "}
            <span className="font-semibold text-gray-900">{pages}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-white transition"
              onClick={goPrev}
              disabled={page <= 1}
            >
              Prev
            </button>

            <button
              type="button"
              className="rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-white transition"
              onClick={goNext}
              disabled={page >= pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">Shortcuts</div>
        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
            onClick={() => nav("/admin/roles")}
          >
            <ShieldCheck size={16} /> Roles & Permissions
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition"
            onClick={() => nav("/admin/orders")}
          >
            View orders module <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
