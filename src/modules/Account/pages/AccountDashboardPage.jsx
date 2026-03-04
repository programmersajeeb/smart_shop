import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Home,
  UserCircle,
  ClipboardList,
  Settings,
  LogOut,
  ChevronRight,
  ShieldCheck,
  ShoppingBag,
  LayoutDashboard,
} from "lucide-react";

import api from "../../../services/apiClient";
import { useAuth } from "../../../shared/hooks/useAuth";

import AccountSidebarSkeleton from "../../../shared/components/ui/skeletons/AccountSidebarSkeleton";
import AccountOverviewSkeleton from "../../../shared/components/ui/skeletons/AccountOverviewSkeleton";
import RecentOrdersTableSkeleton from "../../../shared/components/ui/skeletons/RecentOrdersTableSkeleton";

function cx(...a) {
  return a.filter(Boolean).join(" ");
}

function initials(nameOrEmail = "") {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase()).join("");
}

function formatDate(d) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(d));
  } catch {
    return "";
  }
}

function formatMoney(n) {
  const v = Number(n || 0);
  if (Number.isNaN(v)) return "৳0";
  return `৳${v.toFixed(0)}`;
}

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "delivered") return "badge-success";
  if (s === "processing") return "badge-info";
  if (s === "shipped") return "badge-primary";
  if (s === "cancelled") return "badge-error";
  return "badge-warning";
}

function getErrorMessage(error) {
  const serverMessage =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message;

  return serverMessage ? String(serverMessage) : "Something went wrong.";
}

function SidebarAvatar({ photoURL, fallbackText }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoURL]);

  if (!photoURL || failed) {
    return (
      <div className="w-14 h-14 rounded-2xl bg-gray-100 border flex items-center justify-center font-bold text-gray-800">
        {initials(fallbackText)}
      </div>
    );
  }

  return (
    <img
      src={photoURL}
      alt="Profile"
      className="w-14 h-14 rounded-2xl object-cover border"
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

export default function AccountLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { user, setUser, logout, isAuthed } = useAuth();

  const meQuery = useQuery({
    queryKey: ["auth-me"],
    enabled: !!isAuthed && !user,
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/auth/me", { signal });
      return data;
    },
    staleTime: 60_000,
    retry: 1,
  });

  useEffect(() => {
    if (meQuery.data && !user) setUser(meQuery.data);
  }, [meQuery.data, setUser, user]);

  const displayName = useMemo(() => {
    return user?.displayName || user?.name || user?.fullName || user?.email || "My Account";
  }, [user]);

  const displayEmail = useMemo(() => user?.email || "", [user]);
  const photoURL = useMemo(() => user?.photoURL || "", [user]);

  const isUserLoading = !user && meQuery.isPending;

  const navItems = useMemo(() => {
    const items = [
      { to: "/account", label: "Overview", icon: <UserCircle size={18} /> },
      { to: "/account/orders", label: "Orders", icon: <ClipboardList size={18} /> },
      { to: "/account/profile", label: "Profile & Security", icon: <Settings size={18} /> },
    ];

    // ✅ Admin হলে sidebar এ Admin Dashboard দেখাবে
    if (String(user?.role || "").toLowerCase() === "admin") {
      items.push({ to: "/admin", label: "Admin Dashboard", icon: <LayoutDashboard size={18} /> });
    }

    return items;
  }, [user?.role]);

  async function onLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gray-50">
      {/* Top bar */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="breadcrumbs text-sm">
            <ul>
              <li>
                <Home size={16} />
                <Link to="/">Home</Link>
              </li>
              <li className="font-semibold">My account</li>
            </ul>
          </div>

          {meQuery.isError ? (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Failed to load your profile. {getErrorMessage(meQuery.error)}
            </div>
          ) : null}
        </div>
      </div>

      {/* Layout */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Sidebar */}
          <aside className="lg:col-span-4 xl:col-span-3">
            {isUserLoading ? (
              <AccountSidebarSkeleton />
            ) : (
              <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
                <div className="p-6 border-b">
                  <div className="flex items-center gap-4">
                    <SidebarAvatar photoURL={photoURL} fallbackText={displayName || displayEmail} />

                    <div className="min-w-0">
                      <div className="font-bold text-gray-900 truncate">{displayName}</div>
                      {displayEmail ? (
                        <div className="text-sm text-gray-500 truncate">{displayEmail}</div>
                      ) : null}

                      <div className="mt-2 inline-flex items-center gap-2 text-xs text-gray-600">
                        <ShieldCheck size={14} />
                        Secure session
                      </div>
                    </div>
                  </div>
                </div>

                <nav className="p-3">
                  {navItems.map((it) => (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.to === "/account"}
                      className={({ isActive }) =>
                        cx(
                          "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                          isActive ? "bg-gray-100 text-gray-900 font-semibold" : "hover:bg-gray-50"
                        )
                      }
                      state={{ from: loc.pathname }}
                    >
                      <span className="flex items-center gap-3">
                        {it.icon}
                        {it.label}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </NavLink>
                  ))}

                  <div className="h-px bg-gray-100 my-3" />

                  <button
                    type="button"
                    onClick={onLogout}
                    className={cx(
                      "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition text-red-600",
                      "hover:bg-red-50",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <LogOut size={18} />
                      Logout
                    </span>
                    <ChevronRight size={16} className="text-red-300" />
                  </button>
                </nav>
              </div>
            )}

            {/* Mobile quick actions */}
            <div className="mt-4 lg:hidden grid grid-cols-2 gap-3">
              <Link
                to="/account/orders"
                className="rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 transition"
              >
                <ShoppingBag size={18} />
                <div>
                  <div className="font-semibold text-sm">Orders</div>
                  <div className="text-xs text-gray-500">Track & history</div>
                </div>
              </Link>

              <Link
                to="/account/profile"
                className="rounded-2xl border bg-white p-4 shadow-sm flex items-center gap-3 hover:bg-gray-50 transition"
              >
                <Settings size={18} />
                <div>
                  <div className="font-semibold text-sm">Profile</div>
                  <div className="text-xs text-gray-500">Security</div>
                </div>
              </Link>
            </div>
          </aside>

          {/* Content */}
          <section className="lg:col-span-8 xl:col-span-9">
            <Outlet />
          </section>
        </div>
      </div>
    </div>
  );
}

export function AccountOverviewPage() {
  const { user, isAuthed } = useAuth();

  // If user is not ready yet, show a full overview skeleton (smooth enterprise UX).
  if (!user) {
    return <AccountOverviewSkeleton />;
  }

  const ordersQ = useQuery({
    queryKey: ["my-orders-overview", { page: 1, limit: 5 }],
    enabled: !!isAuthed,
    queryFn: async ({ signal }) => {
      const { data } = await api.get("/orders", {
        params: { page: 1, limit: 5 },
        signal,
      });
      return data;
    },
    placeholderData: (prev) => prev,
    staleTime: 10_000,
    retry: 1,
  });

  const recent = ordersQ.data?.orders || [];
  const totalOrders = ordersQ.data?.total ?? 0;

  const lastOrder = recent[0] || null;

  const name = user?.displayName || user?.email || "Account";
  const role = user?.role || "user";

  const isInitialLoading = ordersQ.isPending && !ordersQ.data;
  const isUpdating = ordersQ.isFetching && !!ordersQ.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-sm text-gray-500">Account overview</div>

            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                Welcome, {name}
              </h1>

              {isUpdating ? (
                <span className="text-xs text-gray-500 flex items-center gap-2">
                  <span className="h-3 w-16 skeleton rounded-md" />
                  Updating...
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex items-center gap-2">
              <span className={cx("badge", role === "admin" ? "badge-neutral" : "badge-ghost")}>
                {role}
              </span>
              {user?.email ? <span className="text-sm text-gray-500">{user.email}</span> : null}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {role === "admin" ? (
              <Link
                to="/admin"
                className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
              >
                Admin dashboard
              </Link>
            ) : null}

            <Link
              to="/account/orders"
              className="btn btn-outline rounded-2xl bg-white hover:bg-gray-50 border-gray-200"
            >
              View orders
            </Link>

            <Link
              to="/account/profile"
              className="btn rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
            >
              Manage profile
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-500">Total orders</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">{totalOrders}</div>
          <div className="mt-2 text-sm text-gray-500">All time</div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-500">Last order status</div>
          <div className="mt-2 flex items-center gap-2">
            <span className={cx("badge", statusBadge(lastOrder?.status))}>
              {lastOrder?.status || "—"}
            </span>
            {lastOrder?.createdAt ? (
              <span className="text-sm text-gray-500">{formatDate(lastOrder.createdAt)}</span>
            ) : null}
          </div>
          <div className="mt-3 text-sm text-gray-500">
            {lastOrder ? `Total: ${formatMoney(lastOrder.total)}` : "No recent order"}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="text-xs text-gray-500">Security</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">Good</div>
          <div className="mt-2 text-sm text-gray-500">
            Google/Firebase verified session
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-900">Recent orders</div>
            <div className="text-xs text-gray-500">Your latest purchases</div>
          </div>

          <Link to="/account/orders" className="text-sm underline text-gray-700 hover:text-gray-900">
            See all
          </Link>
        </div>

        {isInitialLoading ? (
          <RecentOrdersTableSkeleton rows={5} />
        ) : ordersQ.isError ? (
          <div className="p-6">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <div className="font-semibold">Failed to load recent orders.</div>
              <div className="mt-1">{getErrorMessage(ordersQ.error)}</div>

              <button
                type="button"
                className="btn btn-sm mt-4 rounded-xl bg-black text-white hover:bg-gray-900 border-0"
                onClick={() => ordersQ.refetch()}
              >
                Try again
              </button>
            </div>
          </div>
        ) : recent.length === 0 ? (
          <div className="p-6">
            <div className="rounded-2xl border bg-gray-50 p-5">
              <div className="font-semibold text-gray-900">No orders yet</div>
              <div className="text-sm text-gray-600 mt-1">
                Add products from the shop and complete checkout to see your order here.
              </div>
              <Link
                to="/shop"
                className="btn mt-4 rounded-2xl bg-black text-white hover:bg-gray-900 border-0"
              >
                Start shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-6 overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th className="text-right">Total</th>
                  <th></th>
                </tr>
              </thead>

              <tbody className={isUpdating ? "opacity-60" : ""}>
                {recent.map((o) => (
                  <tr key={o._id}>
                    <td className="font-medium">
                      #{String(o._id).slice(-6).toUpperCase()}
                      <div className="text-xs text-gray-500">{o.items?.length || 0} items</div>
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>
                      <span className={cx("badge", statusBadge(o.status))}>{o.status}</span>
                    </td>
                    <td className="text-right font-semibold">{formatMoney(o.total)}</td>
                    <td className="text-right">
                      <Link
                        to={`/account/orders/${o._id}`}
                        className="btn btn-sm btn-outline rounded-xl bg-white hover:bg-gray-50 border-gray-200"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
