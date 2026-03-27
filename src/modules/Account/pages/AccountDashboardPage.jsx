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
  Sparkles,
  ArrowUpRight,
  PackageCheck,
  Clock3,
  WalletCards,
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

function statusBadgeClass(status) {
  const s = String(status || "").toLowerCase();
  if (s === "paid" || s === "delivered") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (s === "processing") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }
  if (s === "shipped") {
    return "border-indigo-200 bg-indigo-50 text-indigo-700";
  }
  if (s === "cancelled") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
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
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 bg-gray-100 font-bold text-gray-800">
        {initials(fallbackText)}
      </div>
    );
  }

  return (
    <img
      src={photoURL}
      alt="Profile"
      className="h-14 w-14 rounded-2xl border border-gray-200 object-cover"
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function SidebarNavItem({ to, label, icon, end = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          "group flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          isActive
            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
            : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className="flex min-w-0 items-center gap-3">
            <span
              className={cx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
                isActive
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-gray-200 bg-white text-gray-700 group-hover:bg-gray-100"
              )}
            >
              {icon}
            </span>
            <span className="truncate">{label}</span>
          </span>

          <ChevronRight
            size={16}
            className={isActive ? "text-white/80" : "text-gray-400"}
          />
        </>
      )}
    </NavLink>
  );
}

function StatCard({ label, value, hint, icon: Icon, tone = "default" }) {
  const wrap =
    tone === "success"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
      : tone === "warning"
      ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
      : tone === "info"
      ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
      : "border-gray-200 bg-white";

  const iconTone =
    tone === "success"
      ? "border-emerald-200 bg-emerald-100 text-emerald-700"
      : tone === "warning"
      ? "border-amber-200 bg-amber-100 text-amber-700"
      : tone === "info"
      ? "border-blue-200 bg-blue-100 text-blue-700"
      : "border-gray-200 bg-gray-50 text-gray-700";

  return (
    <div className={cx("rounded-3xl border p-5 shadow-sm", wrap)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {label}
          </div>
          <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </div>
          {hint ? <div className="mt-2 text-xs text-gray-500">{hint}</div> : null}
        </div>

        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border",
            iconTone
          )}
        >
          <Icon size={20} />
        </div>
      </div>
    </div>
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
  const role = useMemo(() => String(user?.role || "user").toLowerCase(), [user]);

  const isUserLoading = !user && meQuery.isPending;
  const isAdmin = role === "admin" || role === "superadmin";

  const navItems = useMemo(() => {
    const items = [
      { to: "/account", label: "Overview", icon: <UserCircle size={18} />, end: true },
      { to: "/account/orders", label: "Orders", icon: <ClipboardList size={18} /> },
      { to: "/account/profile", label: "Profile & Security", icon: <Settings size={18} /> },
    ];

    if (isAdmin) {
      items.push({
        to: "/admin",
        label: "Admin Dashboard",
        icon: <LayoutDashboard size={18} />,
      });
    }

    return items;
  }, [isAdmin]);

  async function onLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(243,244,246,1)_32%,rgba(229,231,235,1)_100%)]">
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 sm:px-6">
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

      <div className="container mx-auto px-4 py-6 sm:px-6 lg:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-4 xl:col-span-3">
            {isUserLoading ? (
              <AccountSidebarSkeleton />
            ) : (
              <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white/90 shadow-[0_10px_35px_rgba(15,23,42,0.06)] backdrop-blur">
                <div className="border-b border-gray-100 p-6">
                  <div className="flex items-start gap-4">
                    <SidebarAvatar
                      photoURL={photoURL}
                      fallbackText={displayName || displayEmail}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        Account Center
                        <Sparkles size={14} className="opacity-70" />
                      </div>

                      <div className="mt-1 truncate text-base font-bold text-gray-900">
                        {displayName}
                      </div>

                      {displayEmail ? (
                        <div className="mt-1 truncate text-sm text-gray-500">
                          {displayEmail}
                        </div>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                          {isAdmin ? "Admin Access" : "Customer Account"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                          <ShieldCheck size={12} />
                          Secure session
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <nav className="p-4">
                  <div className="space-y-2">
                    {navItems.map((it) => (
                      <SidebarNavItem
                        key={it.to}
                        to={it.to}
                        label={it.label}
                        icon={it.icon}
                        end={it.end}
                        state={{ from: loc.pathname }}
                      />
                    ))}
                  </div>

                  <div className="my-4 h-px bg-gray-100" />

                  <button
                    type="button"
                    onClick={onLogout}
                    className={cx(
                      "group flex w-full items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition",
                      "hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-red-200 bg-white">
                        <LogOut size={18} />
                      </span>
                      Logout
                    </span>
                    <ChevronRight size={16} className="text-red-300" />
                  </button>
                </nav>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3 lg:hidden">
              <Link
                to="/account/orders"
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
              >
                <ShoppingBag size={18} />
                <div>
                  <div className="text-sm font-semibold">Orders</div>
                  <div className="text-xs text-gray-500">Track & history</div>
                </div>
              </Link>

              <Link
                to="/account/profile"
                className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
              >
                <Settings size={18} />
                <div>
                  <div className="text-sm font-semibold">Profile</div>
                  <div className="text-xs text-gray-500">Security</div>
                </div>
              </Link>
            </div>
          </aside>

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
  const role = String(user?.role || "user").toLowerCase();

  const isInitialLoading = ordersQ.isPending && !ordersQ.data;
  const isUpdating = ordersQ.isFetching && !!ordersQ.data;

  const deliveredCount = recent.filter(
    (o) => String(o?.status || "").toLowerCase() === "delivered"
  ).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[30px] border border-gray-200 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-800 p-6 shadow-sm md:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_24%)]" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-gray-200">
                <Sparkles size={14} />
                Account overview
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-wide text-gray-200">
                <ShieldCheck size={14} />
                {role}
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-white md:text-4xl">
              Welcome back, {name}
            </h1>

            <p className="mt-3 max-w-2xl text-sm text-gray-300 md:text-base">
              Track your recent orders, review account details, and manage your
              profile from one clean workspace.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/account/orders"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-100"
              >
                View orders
              </Link>

              <Link
                to="/account/profile"
                className="inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Manage profile
              </Link>

              {role === "admin" || role === "superadmin" ? (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Admin dashboard <ArrowUpRight size={16} />
                </Link>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:min-w-[340px]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Total orders
              </div>
              <div className="mt-2 text-2xl font-bold text-white">{totalOrders}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Last order
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {lastOrder ? formatMoney(lastOrder.total) : "৳0"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Delivered
              </div>
              <div className="mt-2 text-2xl font-bold text-white">
                {deliveredCount}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">
                Session
              </div>
              <div className="mt-2 text-2xl font-bold text-white">Secure</div>
            </div>
          </div>
        </div>

        {isUpdating ? (
          <div className="relative mt-5 inline-flex items-center gap-2 text-xs text-gray-300">
            <span className="inline-block h-3 w-16 animate-pulse rounded-md bg-white/20" />
            Updating...
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total orders"
          value={totalOrders}
          hint="All purchases linked to this account"
          icon={ClipboardList}
        />
        <StatCard
          label="Last order status"
          value={lastOrder?.status ? String(lastOrder.status) : "—"}
          hint={lastOrder?.createdAt ? formatDate(lastOrder.createdAt) : "No recent order"}
          icon={Clock3}
          tone="info"
        />
        <StatCard
          label="Recent spend"
          value={lastOrder ? formatMoney(lastOrder.total) : "৳0"}
          hint="Based on your latest order"
          icon={WalletCards}
          tone="success"
        />
      </div>

      <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-6">
          <div>
            <div className="text-sm font-semibold text-gray-900">Recent orders</div>
            <div className="mt-1 text-xs text-gray-500">Your latest purchases</div>
          </div>

          <Link
            to="/account/orders"
            className="text-sm font-medium text-gray-700 underline-offset-4 hover:text-gray-900 hover:underline"
          >
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
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
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
              <div className="mt-1 text-sm text-gray-600">
                Add products from the shop and complete checkout to see your orders here.
              </div>
              <Link
                to="/shop"
                className="mt-4 inline-flex items-center justify-center rounded-2xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                Start shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto p-6">
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                  <th className="pb-4 pr-4 font-semibold">Order</th>
                  <th className="px-4 pb-4 font-semibold">Date</th>
                  <th className="px-4 pb-4 font-semibold">Status</th>
                  <th className="px-4 pb-4 text-right font-semibold">Total</th>
                  <th className="pl-4 pb-4 text-right font-semibold">Action</th>
                </tr>
              </thead>

              <tbody className={isUpdating ? "opacity-60" : ""}>
                {recent.map((o) => (
                  <tr
                    key={o._id}
                    className="border-b border-gray-100 last:border-b-0"
                  >
                    <td className="py-4 pr-4">
                      <div className="font-medium text-gray-900">
                        #{String(o._id).slice(-6).toUpperCase()}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {o.items?.length || 0} item(s)
                      </div>
                    </td>

                    <td className="px-4 py-4 text-gray-700">{formatDate(o.createdAt)}</td>

                    <td className="px-4 py-4">
                      <span
                        className={cx(
                          "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                          statusBadgeClass(o.status)
                        )}
                      >
                        {o.status}
                      </span>
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {formatMoney(o.total)}
                    </td>

                    <td className="pl-4 py-4 text-right">
                      <Link
                        to={`/account/orders/${o._id}`}
                        className="inline-flex items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <PackageCheck size={18} />
            Quick actions
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to="/account/orders"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-white"
            >
              <div className="text-sm font-semibold text-gray-900">Order history</div>
              <div className="mt-1 text-xs text-gray-500">
                Review previous purchases and statuses
              </div>
            </Link>

            <Link
              to="/account/profile"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-white"
            >
              <div className="text-sm font-semibold text-gray-900">Update profile</div>
              <div className="mt-1 text-xs text-gray-500">
                Manage your name, avatar and account details
              </div>
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShieldCheck size={18} />
            Account note
          </div>

          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 text-gray-600">
            Your account area is designed for quick order review, profile updates,
            and a smooth checkout follow-up experience across desktop and mobile.
          </div>
        </div>
      </div>
    </div>
  );
}