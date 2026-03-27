import React, { useDeferredValue, useState } from "react";
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
  const value = String(type || "").toLowerCase();

  if (value === "admin") return "bg-black text-white border-black";
  if (value === "user") return "bg-gray-50 text-gray-800 border-gray-200";
  if (value === "blocked") return "bg-rose-50 text-rose-800 border-rose-200";
  if (value === "active") return "bg-emerald-50 text-emerald-800 border-emerald-200";

  return "bg-gray-50 text-gray-700 border-gray-200";
}

function Avatar({ src, name }) {
  const letter = String(name || "?").trim().slice(0, 1).toUpperCase() || "?";

  return (
    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
      {src ? (
        <img
          src={src}
          alt={name || "User"}
          className="h-full w-full object-cover"
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

  const title = user?.displayName || user?.email || user?.phone || "Customer";
  const isBlocked = Boolean(user?.isBlocked);

  return (
    <div className="fixed inset-0 z-[9999]">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close overlay"
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-xl overflow-auto border-l border-gray-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
              <Users size={14} />
              Customers
            </div>

            <div className="mt-1 truncate text-lg font-semibold text-gray-900">
              {title}
            </div>

            <div className="mt-1 break-all font-mono text-xs text-gray-500">
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
            className="rounded-2xl p-2 transition hover:bg-gray-50"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-semibold text-gray-900">Profile</div>

            <div className="mt-4 flex items-center gap-4">
              <Avatar src={user?.photoURL} name={title} />

              <div className="min-w-0">
                <div className="truncate font-semibold text-gray-900">{title}</div>
                <div className="truncate text-sm text-gray-600">
                  {user?.email || user?.phone || "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <div className="text-gray-600">
                Email:{" "}
                <span className="font-medium text-gray-900">{user?.email || "—"}</span>
              </div>
              <div className="text-gray-600">
                Phone:{" "}
                <span className="font-medium text-gray-900">{user?.phone || "—"}</span>
              </div>
              <div className="text-gray-600">
                Firebase UID:{" "}
                <span className="font-medium text-gray-900">
                  {user?.firebaseUid || "—"}
                </span>
              </div>
              <div className="text-gray-600">
                Last login:{" "}
                <span className="font-medium text-gray-900">
                  {formatDate(user?.lastLoginAt)}
                </span>
              </div>
              <div className="text-gray-600">
                Joined:{" "}
                <span className="font-medium text-gray-900">
                  {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                onClick={onViewOrders}
              >
                View orders
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                onClick={onOpenRbac}
              >
                <ShieldCheck size={16} />
                Manage RBAC
              </button>
            </div>
          </div>

          <div className="rounded-[28px] border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
            <div className="font-semibold text-gray-900">Note</div>
            <div className="mt-1">
              Use the roles page to manage permissions, role level and access state. This
              screen is intended for customer lookup and quick operational actions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminCustomersPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [blocked, setBlocked] = useState("");

  const deferredQuery = useDeferredValue(q);

  const [drawerUser, setDrawerUser] = useState(null);

  const [confirm, setConfirm] = useState({
    open: false,
    title: "",
    description: "",
    payload: null,
  });

  const listQuery = useQuery({
    queryKey: ["admin-customers", page, limit, role, blocked, deferredQuery],
    queryFn: async ({ signal }) => {
      const params = { page, limit };

      if (deferredQuery) params.q = deferredQuery;
      if (role) params.role = role;
      if (blocked !== "") params.blocked = blocked;

      const { data } = await api.get("/users/admin/list", { params, signal });
      return data;
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
      await queryClient.cancelQueries({ queryKey: ["admin-customers"] });

      const prev = queryClient.getQueryData([
        "admin-customers",
        page,
        limit,
        role,
        blocked,
        deferredQuery,
      ]);

      queryClient.setQueryData(
        ["admin-customers", page, limit, role, blocked, deferredQuery],
        (old) => {
          if (!old?.users) return old;
          return {
            ...old,
            users: old.users.map((user) =>
              user._id === id ? { ...user, isBlocked: nextBlocked } : user
            ),
          };
        }
      );

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) {
        queryClient.setQueryData(
          ["admin-customers", page, limit, role, blocked, deferredQuery],
          ctx.prev
        );
      }
      toast.error(getErrorMessage(err));
    },
    onSuccess: (_data, vars) => {
      toast.success(vars.nextBlocked ? "User blocked" : "User unblocked");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
    },
  });

  const busy = listQuery.isFetching || blockMutation.isPending;

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function goPrev() {
    setPage((prev) => clamp(prev - 1, 1, pages));
  }

  function goNext() {
    setPage((prev) => clamp(prev + 1, 1, pages));
  }

  function requestBlockToggle(user) {
    const id = user?._id;
    if (!id) return;

    const nextBlocked = !Boolean(user?.isBlocked);

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
    const payload = confirm.payload;
    if (!payload?.id) return;

    blockMutation.mutate(
      { id: payload.id, nextBlocked: payload.nextBlocked },
      {
        onSettled: () =>
          setConfirm({
            open: false,
            title: "",
            description: "",
            payload: null,
          }),
      }
    );
  }

  function onCloseConfirm() {
    if (blockMutation.isPending) return;

    setConfirm({
      open: false,
      title: "",
      description: "",
      payload: null,
    });
  }

  function copyId(id) {
    const value = String(id || "").trim();
    if (!value) return;

    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success("Copied"))
      .catch(() => toast.error("Copy failed"));
  }

  const empty = !listQuery.isPending && users.length === 0;

  return (
    <div className="space-y-5">
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
          const value = String(emailOrPhone || "").trim();
          navigate(value ? `/admin/orders?q=${encodeURIComponent(value)}` : "/admin/orders");
        }}
        onOpenRbac={() => navigate("/admin/roles")}
      />

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
              <Users size={14} />
              Customers
            </div>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-gray-950 md:text-3xl">
              Customers
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Total users: <span className="font-semibold text-gray-900">{total}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
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
      </div>

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <div className="text-sm font-semibold text-gray-900">Search</div>
            <div className="mt-2 flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3">
              <Search size={18} className="text-gray-400" />

              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                className="w-full bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
                placeholder="Search by email, phone, name or Firebase UID"
              />

              {q ? (
                <button
                  type="button"
                  className="rounded-xl p-1 transition hover:bg-gray-50"
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
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
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
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
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
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:ring-2 focus:ring-black focus:ring-offset-2"
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

      <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-6">
          <div>
            <div className="text-sm font-semibold text-gray-900">User list</div>
            <div className="mt-1 text-xs text-gray-500">
              Debounced search with cached pagination
            </div>
          </div>

          <div className="text-xs text-gray-500">
            Page {page} / {pages}
          </div>
        </div>

        {listQuery.isPending ? (
          <AdminUsersTableSkeleton rows={10} />
        ) : empty ? (
          <div className="p-8 text-center text-gray-600">No users found.</div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[980px]">
              <thead className="border-b border-gray-100 bg-gray-50/80">
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                  <th className="px-4 py-4 font-semibold">User</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Last login</th>
                  <th className="px-4 py-4 font-semibold">Joined</th>
                  <th className="px-4 py-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => {
                  const title = user.displayName || user.email || user.phone || "User";
                  const isBlocked = Boolean(user.isBlocked);

                  return (
                    <tr
                      key={user._id}
                      className="border-b border-gray-100 transition hover:bg-gray-50/70 last:border-b-0"
                    >
                      <td className="min-w-[320px] px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={user.photoURL} name={title} />

                          <div className="min-w-0">
                            <div className="truncate font-semibold text-gray-900">
                              {title}
                            </div>
                            <div className="truncate text-sm text-gray-600">
                              {user.email || user.phone || "—"}
                            </div>
                            <div className="truncate font-mono text-xs text-gray-500">
                              {String(user._id || "")}
                            </div>
                          </div>

                          <button
                            type="button"
                            className="ml-auto inline-flex items-center justify-center rounded-2xl border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50"
                            onClick={() => copyId(user._id)}
                            title="Copy user id"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={[
                            "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                            badgeClass(user.role),
                          ].join(" ")}
                        >
                          {String(user.role || "user")}
                          <span className="ml-2 opacity-70">
                            lvl {Number(user.roleLevel || 0)}
                          </span>
                        </span>
                      </td>

                      <td className="px-4 py-4">
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

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <div className="inline-flex justify-end gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-2xl border border-gray-200 px-3 py-2 text-gray-700 transition hover:bg-gray-50"
                            onClick={() => setDrawerUser(user)}
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
                                ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                : "border-rose-200 text-rose-600 hover:bg-rose-50",
                            ].join(" ")}
                            onClick={() => requestBlockToggle(user)}
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

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span> /{" "}
            <span className="font-semibold text-gray-900">{pages}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:opacity-50"
              onClick={goPrev}
              disabled={page <= 1}
            >
              Prev
            </button>

            <button
              type="button"
              className="rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:opacity-50"
              onClick={goNext}
              disabled={page >= pages}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">Shortcuts</div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => navigate("/admin/roles")}
          >
            <ShieldCheck size={16} />
            Roles & Permissions
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            onClick={() => navigate("/admin/orders")}
          >
            View orders module
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}