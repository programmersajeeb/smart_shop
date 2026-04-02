import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Store,
  Package,
  ClipboardList,
  Users,
  Boxes,
  Tag,
  LifeBuoy,
  Settings,
  ShieldCheck,
  FileText,
  Menu,
  X,
  LogOut,
  User,
  Sparkles,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Home,
  Mail,
  Phone,
} from "lucide-react";
import { useAuth } from "../../shared/hooks/useAuth";

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

function canAny({ userPerms, isSuper }, perms = []) {
  if (isSuper) return true;
  if (!Array.isArray(perms) || perms.length === 0) return true;
  if (userPerms.includes("*")) return true;

  return perms.some((p) => userPerms.includes(String(p || "").trim().toLowerCase()));
}

function canMinLevel(roleLevel, minLevel) {
  const current = Number(roleLevel || 0);
  const target = Number(minLevel || 0);
  if (!Number.isFinite(target)) return true;
  return Number.isFinite(current) && current >= target;
}

function canAccessNav(ctx, item) {
  if (!item) return false;

  const roleOk =
    Array.isArray(item.roles) && item.roles.length
      ? item.roles.includes(String(ctx.role || "").toLowerCase())
      : true;

  const minLevelOk = item.minLevel != null ? canMinLevel(ctx.roleLevel, item.minLevel) : true;
  const permOk = canAny(ctx, item.requiresAny);

  return roleOk && minLevelOk && permOk;
}

function getRoleLabel(role, roleLevel) {
  const r = String(role || "").toLowerCase();
  const lvl = Number(roleLevel || 0);

  if (lvl >= 100) return "Super Admin";
  if (r === "manager") return "Manager";
  if (r === "support") return "Support";
  if (r === "editor") return "Editor";
  if (r === "auditor") return "Auditor";
  if (r === "admin") return "Admin";
  return "User";
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

function NavItem({ to, icon: Icon, label, end, badge, collapsed = false }) {
  return (
    <NavLink
      to={to}
      end={end}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "group relative flex items-center gap-3 rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
          collapsed ? "justify-center" : "justify-between",
          isActive
            ? "border-gray-900 bg-gray-900 text-white shadow-sm"
            : "border-transparent text-gray-700 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          {!collapsed && isActive ? (
            <span className="absolute inset-y-2 left-1 w-1 rounded-full bg-white/90" />
          ) : null}

          <div
            className={[
              "flex min-w-0 items-center gap-3",
              collapsed ? "justify-center" : "",
            ].join(" ")}
          >
            <div
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition",
                isActive
                  ? "border-white/15 bg-white/10 text-white"
                  : "border-gray-200 bg-white text-gray-700 group-hover:bg-gray-100",
              ].join(" ")}
            >
              <Icon size={18} className="shrink-0" />
            </div>

            {!collapsed ? <span className="truncate">{label}</span> : null}
          </div>

          {!collapsed ? (
            <div className="flex shrink-0 items-center gap-2">
              {badge ? (
                <span
                  className={[
                    "rounded-full border px-2 py-1 text-[11px] font-semibold",
                    isActive
                      ? "border-white/20 bg-white/10 text-white"
                      : "border-gray-200 bg-gray-100 text-gray-600",
                  ].join(" ")}
                >
                  {badge}
                </span>
              ) : (
                <ChevronRight
                  size={15}
                  className={isActive ? "text-white/80" : "text-gray-400"}
                />
              )}
            </div>
          ) : null}
        </>
      )}
    </NavLink>
  );
}

function SidebarSection({ title, items, collapsed }) {
  if (!items?.length) return null;

  return (
    <>
      <SectionTitle collapsed={collapsed}>{title}</SectionTitle>
      <div className="space-y-2">
        {items.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </div>
    </>
  );
}

function SidebarProfile({ name, role, roleLevel, collapsed }) {
  if (collapsed) {
    return (
      <div className="flex justify-center">
        <div
          className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-800"
          title={`${name} • ${getRoleLabel(role, roleLevel)}`}
        >
          <User size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-sm">
          <LayoutDashboard size={18} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            Admin Dashboard
            <Sparkles size={14} className="opacity-70" />
          </div>

          <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <User size={12} />
            <span className="truncate">{name}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
              {getRoleLabel(role, roleLevel)}
            </span>
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-700">
              Level {roleLevel}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const drawerRef = useRef(null);
  const mainScrollRef = useRef(null);

  const name = useMemo(() => {
    return user?.displayName || user?.name || user?.email || "Admin";
  }, [user]);

  const roleLevel = useMemo(() => {
    const n = Number(user?.roleLevel || 0);
    return Number.isFinite(n) ? n : 0;
  }, [user]);

  const role = useMemo(() => String(user?.role || "").toLowerCase(), [user]);
  const userPerms = useMemo(() => normalizePermissions(user), [user]);

  const isSuper = role === "superadmin" || roleLevel >= 100 || userPerms.includes("*");

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

  async function handleLogout() {
    try {
      await logout();
    } finally {
      nav("/", { replace: true });
    }
  }

  const menu = useMemo(() => {
    const ctx = { userPerms, isSuper, role, roleLevel };

    const core = [
      {
        to: "/admin",
        end: true,
        icon: LayoutDashboard,
        label: "Overview",
        minLevel: 1,
      },
      {
        to: "/admin/shop-control",
        icon: Store,
        label: "Shop Control",
        minLevel: 1,
      },
      {
        to: "/admin/home-config",
        icon: Home,
        label: "Home Config",
        requiresAny: ["settings:read", "settings:write"],
      },
      {
        to: "/admin/orders",
        icon: ClipboardList,
        label: "Orders",
        requiresAny: ["orders:read", "orders:write"],
      },
    ].filter((it) => canAccessNav(ctx, it));

    const commerce = [
      {
        to: "/admin/customers",
        icon: Users,
        label: "Customers",
        requiresAny: ["users:read", "users:write"],
      },
      {
        to: "/admin/categories",
        icon: Tag,
        label: "Categories",
        requiresAny: ["products:read", "products:write"],
      },
      {
        to: "/admin/inventory",
        icon: Boxes,
        label: "Inventory",
        requiresAny: ["products:read", "products:write"],
      },
      {
        to: "/admin/products",
        icon: Package,
        label: "Products",
        requiresAny: ["products:read", "products:write"],
      },
    ].filter((it) => canAccessNav(ctx, it));

    const marketing = [
      {
        to: "/admin/promotions",
        icon: Tag,
        label: "Promotions",
        requiresAny: ["settings:write"],
      },
      {
        to: "/admin/newsletter",
        icon: Mail,
        label: "Newsletter",
        requiresAny: ["newsletter:read", "newsletter:write"],
      },
      {
        to: "/admin/contact-control",
        icon: Phone,
        label: "Contact Control",
        requiresAny: ["settings:read", "settings:write"],
      },
    ].filter((it) => canAccessNav(ctx, it));

    const operations = [
      {
        to: "/admin/support",
        icon: LifeBuoy,
        label: "Support",
        requiresAny: ["users:read", "users:write", "orders:read"],
      },
    ].filter((it) => canAccessNav(ctx, it));

    const system = [
      {
        to: "/admin/roles",
        icon: ShieldCheck,
        label: "Roles & Permissions",
        requiresAny: ["users:read", "users:write"],
        minLevel: 20,
      },
      {
        to: "/admin/audit-logs",
        icon: FileText,
        label: "Audit Logs",
        requiresAny: ["audit:read"],
      },
      {
        to: "/admin/settings",
        icon: Settings,
        label: "Settings",
        requiresAny: ["settings:read", "settings:write"],
      },
    ].filter((it) => canAccessNav(ctx, it));

    return { core, commerce, marketing, operations, system };
  }, [userPerms, isSuper, role, roleLevel]);

  const currentTitle = useMemo(() => {
    const all = [
      ...menu.core,
      ...menu.commerce,
      ...menu.marketing,
      ...menu.operations,
      ...menu.system,
    ];

    const path = loc.pathname || "/admin";
    let best = { label: "Admin Dashboard", len: 0 };

    for (const it of all) {
      const to = it.to;

      if (it.end) {
        if (path === to && to.length > best.len) {
          best = { label: it.label, len: to.length };
        }
      } else if (path === to || path.startsWith(to + "/")) {
        if (to.length > best.len) {
          best = { label: it.label, len: to.length };
        }
      }
    }

    return best.label || "Admin Dashboard";
  }, [loc.pathname, menu]);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className={sidebarCollapsed ? "p-3" : "p-4"}>
        <SidebarProfile
          name={name}
          role={role}
          roleLevel={roleLevel}
          collapsed={sidebarCollapsed}
        />

        {!sidebarCollapsed ? (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Store size={16} />
              View store
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col items-center gap-3">
            <Link
              to="/"
              title="View store"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <Store size={18} />
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-700 transition hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4">
        <SidebarSection title="Core" items={menu.core} collapsed={sidebarCollapsed} />
        <SidebarSection title="Commerce" items={menu.commerce} collapsed={sidebarCollapsed} />
        <SidebarSection title="Marketing" items={menu.marketing} collapsed={sidebarCollapsed} />
        <SidebarSection title="Operations" items={menu.operations} collapsed={sidebarCollapsed} />
        <SidebarSection title="System" items={menu.system} collapsed={sidebarCollapsed} />

        {!sidebarCollapsed ? (
          <div className="mt-6 rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 text-xs text-gray-600">
            <div className="font-semibold text-gray-900">Access notice</div>
            <div className="mt-1 leading-5">
              Navigation is filtered based on the current operator role and permissions. Server
              rules remain the source of truth for all protected actions and routes.
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.95),rgba(243,244,246,1)_32%,rgba(229,231,235,1)_100%)] lg:h-screen lg:overflow-hidden">
      <style>{`
        :root { scrollbar-gutter: stable; }
      `}</style>

      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/85 backdrop-blur-xl lg:hidden">
        <div className="site-shell flex items-center justify-between py-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="rounded-xl p-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="Open admin menu"
            aria-expanded={drawerOpen}
            aria-controls="admin-mobile-drawer"
          >
            <Menu size={22} />
          </button>

          <Link to="/admin" className="max-w-[55%] truncate text-sm font-semibold text-gray-900">
            {currentTitle}
          </Link>

          <Link
            to="/"
            className="rounded-xl p-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="View store"
          >
            <Store size={22} />
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
            id="admin-mobile-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Admin navigation"
            className="absolute left-0 top-0 h-full w-[90%] max-w-sm overflow-hidden border-r border-gray-200 bg-white shadow-2xl animate-[drawerIn_0.22s_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <div className="text-base font-bold text-gray-900">
                Admin<span className="text-gray-500">Panel</span>
              </div>

              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="rounded-xl p-2 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="Close admin menu"
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
            className={[
              "h-full shrink-0 rounded-[30px] border border-gray-200 bg-white/92 shadow-[0_10px_28px_rgba(15,23,42,0.05)] backdrop-blur transition-all duration-300",
              sidebarCollapsed ? "w-[104px]" : "w-[320px]",
            ].join(" ")}
          >
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
                {!sidebarCollapsed ? (
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">Navigation</div>
                    <div className="mt-1 text-xs text-gray-500">Control panel</div>
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
                  Admin workspace
                </div>
                <h1 className="mt-1 truncate text-[28px] font-bold tracking-tight text-gray-900">
                  {currentTitle}
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-right xl:block">
                  <div className="text-xs font-medium text-gray-500">Signed in as</div>
                  <div className="text-sm font-semibold text-gray-900">{name}</div>
                </div>

                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                >
                  <Store size={16} />
                  Store
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