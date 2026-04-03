import React, { useEffect, useMemo, useRef, useState } from "react";
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
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Store,
  User,
  CreditCard,
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

function lockBodyScroll(lock) {
  const body = document.body;
  if (!body) return;

  if (lock) {
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
  } else {
    body.style.overflow = "";
    body.style.touchAction = "";
  }
}

function useOutsideClick(ref, onOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) onOutside?.();
    }

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, onOutside, enabled]);
}

function SidebarAvatar({ photoURL, fallbackText, collapsed = false }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoURL]);

  if (!photoURL || failed) {
    return (
      <div
        className={cx(
          "flex items-center justify-center border border-gray-200 bg-gray-100 font-bold text-gray-800",
          collapsed ? "h-12 w-12 rounded-2xl" : "h-14 w-14 rounded-[22px]"
        )}
      >
        {initials(fallbackText)}
      </div>
    );
  }

  return (
    <img
      src={photoURL}
      alt="Profile"
      className={cx(
        "border border-gray-200 object-cover",
        collapsed ? "h-12 w-12 rounded-2xl" : "h-14 w-14 rounded-[22px]"
      )}
      referrerPolicy="no-referrer"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function SectionTitle({ children, collapsed = false }) {
  if (collapsed) {
    return <div className="my-4 border-t border-gray-200" />;
  }

  return (
    <div className="mb-2 mt-6 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
      {children}
    </div>
  );
}

function SidebarNavItem({ to, label, icon, end = false, collapsed = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        cx(
          "group relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          collapsed ? "justify-center" : "justify-between",
          isActive
            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
            : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900"
        )
      }
    >
      {({ isActive }) => (
        <>
          {!collapsed && isActive ? (
            <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-white/90" />
          ) : null}

          <div className={cx("flex min-w-0 items-center gap-3", collapsed && "justify-center")}>
            <div
              className={cx(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
                isActive
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-gray-200 bg-white text-gray-700 group-hover:bg-gray-100"
              )}
            >
              {icon}
            </div>

            {!collapsed ? <span className="truncate">{label}</span> : null}
          </div>

          {!collapsed ? (
            <ChevronRight size={16} className={isActive ? "text-white/80" : "text-gray-400"} />
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function SidebarSection({ title, items, collapsed = false }) {
  if (!items?.length) return null;

  return (
    <>
      <SectionTitle collapsed={collapsed}>{title}</SectionTitle>
      <div className="space-y-2">
        {items.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            end={item.end}
            collapsed={collapsed}
          />
        ))}
      </div>
    </>
  );
}

function SidebarProfile({
  displayName,
  displayEmail,
  photoURL,
  isAdmin,
  collapsed = false,
}) {
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <SidebarAvatar
          photoURL={photoURL}
          fallbackText={displayName || displayEmail}
          collapsed
        />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
      <div className="flex items-start gap-3">
        <SidebarAvatar photoURL={photoURL} fallbackText={displayName || displayEmail} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            Account Center
            <Sparkles size={14} className="opacity-70" />
          </div>

          <div className="mt-1 truncate text-base font-bold text-gray-900">{displayName}</div>

          {displayEmail ? (
            <div className="mt-1 truncate text-sm text-gray-500">{displayEmail}</div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
              {isAdmin ? "Admin Access" : "Customer Account"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
              <ShieldCheck size={12} />
              Secure session
            </span>
          </div>
        </div>
      </div>
    </div>
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
          <div className="mt-3 text-2xl font-bold tracking-tight text-gray-900">{value}</div>
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

function MobileOrderCards({ orders = [] }) {
  if (!orders.length) return null;

  return (
    <div className="space-y-3 md:hidden">
      {orders.map((o) => (
        <div key={o._id} className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900">
                #{String(o._id).slice(-6).toUpperCase()}
              </div>
              <div className="mt-1 text-xs text-gray-500">{formatDate(o.createdAt)}</div>
            </div>

            <span
              className={cx(
                "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                statusBadgeClass(o.status)
              )}
            >
              {o.status}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Items
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {o.items?.length || 0}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-3 text-right">
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500">
                Total
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {formatMoney(o.total)}
              </div>
            </div>
          </div>

          <Link
            to={`/account/orders/${o._id}`}
            className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            View order
          </Link>
        </div>
      ))}
    </div>
  );
}

export default function AccountLayout() {
  const navigate = useNavigate();
  const loc = useLocation();
  const { user, setUser, logout, isAuthed } = useAuth();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const drawerRef = useRef(null);
  const mainScrollRef = useRef(null);

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

  useEffect(() => {
    setDrawerOpen(false);
  }, [loc.pathname]);

  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "auto" });
  }, [loc.pathname]);

  useEffect(() => {
    lockBodyScroll(drawerOpen);
    return () => lockBodyScroll(false);
  }, [drawerOpen]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setDrawerOpen(false);
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useOutsideClick(drawerRef, () => setDrawerOpen(false), drawerOpen);

  const displayName = useMemo(() => {
    return user?.displayName || user?.name || user?.fullName || user?.email || "My Account";
  }, [user]);

  const displayEmail = useMemo(() => user?.email || "", [user]);
  const photoURL = useMemo(() => user?.photoURL || "", [user]);
  const role = useMemo(() => String(user?.role || "user").toLowerCase(), [user]);

  const isUserLoading = !user && meQuery.isPending;
  const isAdmin = role === "admin" || role === "superadmin";

  const navGroups = useMemo(() => {
    const account = [
      {
        to: "/account",
        label: "Overview",
        icon: <UserCircle size={18} />,
        end: true,
      },
      {
        to: "/account/orders",
        label: "Orders",
        icon: <ClipboardList size={18} />,
      },
      {
        to: "/account/profile",
        label: "Profile & Security",
        icon: <Settings size={18} />,
      },
    ];

    const access = isAdmin
      ? [
          {
            to: "/admin",
            label: "Admin Dashboard",
            icon: <LayoutDashboard size={18} />,
          },
        ]
      : [];

    return { account, access };
  }, [isAdmin]);

  const currentTitle = useMemo(() => {
    const all = [...navGroups.account, ...navGroups.access];
    const path = loc.pathname || "/account";

    let best = { label: "My Account", len: 0 };

    for (const item of all) {
      const to = item.to;

      if (item.end) {
        if (path === to && to.length > best.len) {
          best = { label: item.label, len: to.length };
        }
      } else if (path === to || path.startsWith(to + "/")) {
        if (to.length > best.len) {
          best = { label: item.label, len: to.length };
        }
      }
    }

    return best.label;
  }, [loc.pathname, navGroups]);

  async function onLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  const sidebarContent = isUserLoading ? (
    <div className="p-4">
      <AccountSidebarSkeleton />
    </div>
  ) : (
    <div className="flex h-full flex-col">
      <div className={sidebarCollapsed ? "p-3" : "p-4"}>
        <SidebarProfile
          displayName={displayName}
          displayEmail={displayEmail}
          photoURL={photoURL}
          isAdmin={isAdmin}
          collapsed={sidebarCollapsed}
        />

        {!sidebarCollapsed ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Store size={16} />
              Shop
            </Link>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              to="/shop"
              title="Open shop"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Store size={18} />
            </Link>

            <button
              type="button"
              onClick={onLogout}
              title="Logout"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <SidebarSection
          title="Account"
          items={navGroups.account}
          collapsed={sidebarCollapsed}
        />

        {navGroups.access.length ? (
          <SidebarSection
            title="Access"
            items={navGroups.access}
            collapsed={sidebarCollapsed}
          />
        ) : null}

        {!sidebarCollapsed ? (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-900">Helpful note</div>
            <div className="mt-1 leading-5">
              Review your latest orders, update profile details, and move between account
              sections smoothly across desktop, tablet, and mobile.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.96),rgba(243,244,246,1)_32%,rgba(229,231,235,1)_100%)] lg:h-screen lg:overflow-hidden">
      <style>{`
        :root { scrollbar-gutter: stable; }
      `}</style>

      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-xl lg:hidden">
        <div className="site-shell flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="Open account menu"
            aria-expanded={drawerOpen}
            aria-controls="account-mobile-drawer"
          >
            <Menu size={22} />
          </button>

          <Link to="/account" className="max-w-[55%] truncate text-sm font-semibold text-gray-900">
            {currentTitle}
          </Link>

          <Link
            to="/shop"
            className="rounded-xl p-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="Open shop"
          >
            <ShoppingBag size={22} />
          </Link>
        </div>
      </div>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[999] lg:hidden">
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 h-full w-full bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />

          <div
            id="account-mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Account navigation"
            className="absolute left-0 top-0 h-full w-[90%] max-w-sm overflow-hidden border-r border-gray-200 bg-white shadow-2xl animate-[drawerIn_0.22s_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div className="text-base font-bold text-gray-900">
                Account<span className="text-gray-500">Panel</span>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl p-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="Close account menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="h-[calc(100%-65px)] p-4">{sidebarContent}</div>
          </div>
        </div>
      ) : null}

      <div className="hidden h-full lg:block">
        <div className="site-shell flex h-full gap-5 py-5 2xl:py-6">
          <aside
            className={cx(
              "h-full shrink-0 rounded-[30px] border border-gray-200 bg-white/92 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300",
              sidebarCollapsed ? "w-[104px]" : "w-[320px]"
            )}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Navigation</div>
                    <div className="mt-1 text-xs text-gray-500">My account</div>
                  </div>
                ) : (
                  <div className="mx-auto text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                    Nav
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setSidebarCollapsed((prev) => !prev)}
                  className="rounded-xl border border-gray-200 bg-white p-2 text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
                </button>
              </div>

              <div className="min-h-0 flex-1">{sidebarContent}</div>
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <header className="flex shrink-0 items-center justify-between rounded-[26px] border border-gray-200 bg-white/90 px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] backdrop-blur">
              <div className="min-w-0">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
                  Account workspace
                </div>
                <h1 className="mt-1 truncate text-[28px] font-bold tracking-tight text-gray-900">
                  {currentTitle}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-right xl:block">
                  <div className="text-xs font-medium text-gray-500">Signed in as</div>
                  <div className="text-sm font-semibold text-gray-900">{displayName}</div>
                </div>

                <Link
                  to="/shop"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <ShoppingBag size={16} />
                  Shop
                </Link>
              </div>
            </header>

            <main className="min-h-0 flex-1 overflow-hidden rounded-[30px] border border-gray-200 bg-white/92 shadow-[0_12px_32px_rgba(15,23,42,0.05)]">
              <div ref={mainScrollRef} className="h-full overflow-y-auto p-5 xl:p-6 2xl:p-7">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>

      <div className="site-shell py-6 lg:hidden">
        <div className="mb-4 rounded-[28px] border border-gray-200 bg-white/85 p-4 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <SidebarAvatar photoURL={photoURL} fallbackText={displayName || displayEmail} />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
                My account
              </div>
              <div className="truncate text-base font-bold text-gray-900">{displayName}</div>
              {displayEmail ? (
                <div className="truncate text-sm text-gray-500">{displayEmail}</div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to="/account/orders"
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
            >
              <CreditCard size={18} />
              <div>
                <div className="text-sm font-semibold text-gray-900">Orders</div>
                <div className="text-xs text-gray-500">Track purchases</div>
              </div>
            </Link>

            <Link
              to="/account/profile"
              className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:bg-gray-50"
            >
              <Settings size={18} />
              <div>
                <div className="text-sm font-semibold text-gray-900">Profile</div>
                <div className="text-xs text-gray-500">Manage account</div>
              </div>
            </Link>
          </div>
        </div>

        <Outlet />
      </div>

      <style>
        {`
          @keyframes drawerIn {
            from {
              transform: translateX(-18px);
              opacity: 0.95;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
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
  const name = user?.displayName || user?.name || user?.fullName || user?.email || "Account";
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
              Keep track of recent orders, review account activity, and manage profile details
              from one polished workspace built for desktop and mobile.
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
              <div className="text-xs uppercase tracking-wide text-gray-400">Total orders</div>
              <div className="mt-2 text-2xl font-bold text-white">{totalOrders}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">Last order</div>
              <div className="mt-2 text-2xl font-bold text-white">
                {lastOrder ? formatMoney(lastOrder.total) : "৳0"}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">Delivered</div>
              <div className="mt-2 text-2xl font-bold text-white">{deliveredCount}</div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
              <div className="text-xs uppercase tracking-wide text-gray-400">Session</div>
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
          hint="All purchases linked to your account"
          icon={ClipboardList}
        />
        <StatCard
          label="Last order status"
          value={lastOrder?.status ? String(lastOrder.status) : "—"}
          hint={lastOrder?.createdAt ? formatDate(lastOrder.createdAt) : "No recent order yet"}
          icon={Clock3}
          tone="info"
        />
        <StatCard
          label="Recent spend"
          value={lastOrder ? formatMoney(lastOrder.total) : "৳0"}
          hint="Calculated from your latest order"
          icon={WalletCards}
          tone="success"
        />
      </div>

      <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-6">
          <div>
            <div className="text-sm font-semibold text-gray-900">Recent orders</div>
            <div className="mt-1 text-xs text-gray-500">A quick look at your latest purchases</div>
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
                Start shopping to see your orders, updates, and purchase history here.
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
          <>
            <MobileOrderCards orders={recent} />

            <div className="hidden overflow-x-auto p-6 md:block">
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
                    <tr key={o._id} className="border-b border-gray-100 last:border-b-0">
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
          </>
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
                Review delivery progress and previous purchases
              </div>
            </Link>

            <Link
              to="/account/profile"
              className="rounded-2xl border border-gray-200 bg-gray-50 p-4 transition hover:bg-white"
            >
              <div className="text-sm font-semibold text-gray-900">Update profile</div>
              <div className="mt-1 text-xs text-gray-500">
                Edit your name, avatar, and account details
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
            This workspace is designed to make order follow-up, account updates, and
            profile management feel fast, clear, and consistent on every screen size.
          </div>
        </div>
      </div>
    </div>
  );
}