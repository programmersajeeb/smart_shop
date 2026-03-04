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

function SectionTitle({ children }) {
  return (
    <div className="mt-6 mb-2 px-2 text-[11px] uppercase tracking-wide text-gray-500">
      {children}
    </div>
  );
}

function NavItem({ to, icon: Icon, label, end, badge }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition",
          isActive ? "bg-black text-white" : "hover:bg-gray-100 text-gray-800",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <div className="flex items-center gap-3 min-w-0">
            <Icon size={18} className="shrink-0" />
            <span className="text-sm font-medium truncate">{label}</span>
          </div>

          {/* ✅ keep right side stable (prevents tiny jitter) */}
          <div className="shrink-0">
            {badge ? (
              <span
                className={[
                  "text-[11px] px-2 py-1 rounded-full border",
                  isActive
                    ? "bg-white/15 border-white/20 text-white"
                    : "bg-gray-100 border-gray-200 text-gray-600",
                ].join(" ")}
              >
                {badge}
              </span>
            ) : null}
          </div>
        </>
      )}
    </NavLink>
  );
}

/** ✅ Enterprise RBAC helper: case-insensitive match */
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

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const [drawerOpen, setDrawerOpen] = useState(false);
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

  // ✅ Admin role = super by default (enterprise UX friendly)
  const isSuper = role === "admin" || role === "superadmin" || roleLevel >= 100 || userPerms.includes("*");


  // Close drawer on route change (mobile UX)
  useEffect(() => {
    setDrawerOpen(false);
  }, [loc.pathname]);

  // ✅ Desktop: route change -> scroll main content to top (stable)
  useEffect(() => {
    const el = mainScrollRef.current;
    if (!el) return;
    el.scrollTo({ top: 0, behavior: "auto" });
  }, [loc.pathname]);

  // Lock body scroll when drawer open
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
    const ctx = { userPerms, isSuper };

    const core = [
      { to: "/admin", end: true, icon: LayoutDashboard, label: "Overview" },
      {
        to: "/admin/orders",
        icon: ClipboardList,
        label: "Orders",
        requiresAny: ["orders:read", "orders:write"],
      },
    ].filter((it) => canAny(ctx, it.requiresAny));

    // ✅ ENTERPRISE ORDER (as you said): Customers → Categories → Inventory
    const commerce = [
      {
        to: "/admin/customers",
        icon: Users,
        label: "Customers",
        badge: "Soon",
        requiresAny: ["users:read", "users:write"],
      },
      {
        to: "/admin/categories",
        icon: Boxes,
        label: "Categories",
        // ✅ live now -> no "Soon"
        requiresAny: ["products:read", "products:write"],
      },
      {
        to: "/admin/inventory",
        icon: Boxes,
        label: "Inventory",
        // ✅ live now -> no "Soon"
        requiresAny: ["products:read", "products:write"],
      },
      {
        to: "/admin/products",
        icon: Package,
        label: "Products",
        requiresAny: ["products:read", "products:write"],
      },
    ].filter((it) => canAny(ctx, it.requiresAny));

    const marketing = [
      {
        to: "/admin/promotions",
        icon: Tag,
        label: "Promotions",
        badge: "Soon",
        requiresAny: ["settings:write"],
      },
    ].filter((it) => canAny(ctx, it.requiresAny));

    const operations = [
      {
        to: "/admin/support",
        icon: LifeBuoy,
        label: "Support",
        badge: "Soon",
        requiresAny: ["users:read", "users:write"],
      },
    ].filter((it) => canAny(ctx, it.requiresAny));

    const system = [
      {
        to: "/admin/roles",
        icon: ShieldCheck,
        label: "Roles & Permissions",
        requiresAny: ["users:read", "users:write"],
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
        // ✅ UPDATED: Settings is live now, so no "Soon" badge
        badge: null,
        // ✅ UPDATED: allow read-only access too
        requiresAny: ["settings:read", "settings:write"],
      },
    ].filter((it) => canAny(ctx, it.requiresAny));

    return { core, commerce, marketing, operations, system };
  }, [userPerms, isSuper]);

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
        if (path === to && to.length > best.len) best = { label: it.label, len: to.length };
      } else {
        if (path === to || path.startsWith(to + "/")) {
          if (to.length > best.len) best = { label: it.label, len: to.length };
        }
      }
    }

    return best.label || "Admin Dashboard";
  }, [loc.pathname, menu]);

  /**
   * ✅ Enterprise Sidebar
   * - Fixed header/actions
   * - Only menu area scrolls (no jitter)
   */
  const Sidebar = (
    <div className="h-full bg-white border rounded-3xl shadow-sm flex flex-col">
      {/* Header (fixed) */}
      <div className="p-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-black text-white flex items-center justify-center">
            <LayoutDashboard size={18} />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold flex items-center gap-2">
              Admin Dashboard <Sparkles size={14} className="opacity-70" />
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
              <User size={12} /> <span className="truncate">{name}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/"
            className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition text-center
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <Store size={16} /> View store
            </span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition text-center text-red-600
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center justify-center gap-2">
              <LogOut size={16} /> Logout
            </span>
          </button>
        </div>
      </div>

      {/* Scrollable menu */}
      <div className="flex-1 min-h-0 overflow-y-scroll px-5 pb-5">
        {menu.core.length ? (
          <>
            <SectionTitle>Core</SectionTitle>
            <div className="space-y-2">
              {menu.core.map((it) => (
                <NavItem key={it.to} {...it} />
              ))}
            </div>
          </>
        ) : null}

        {menu.commerce.length ? (
          <>
            <SectionTitle>Commerce</SectionTitle>
            <div className="space-y-2">
              {menu.commerce.map((it) => (
                <NavItem key={it.to} {...it} />
              ))}
            </div>
          </>
        ) : null}

        {menu.marketing.length ? (
          <>
            <SectionTitle>Marketing</SectionTitle>
            <div className="space-y-2">
              {menu.marketing.map((it) => (
                <NavItem key={it.to} {...it} />
              ))}
            </div>
          </>
        ) : null}

        {menu.operations.length ? (
          <>
            <SectionTitle>Operations</SectionTitle>
            <div className="space-y-2">
              {menu.operations.map((it) => (
                <NavItem key={it.to} {...it} />
              ))}
            </div>
          </>
        ) : null}

        {menu.system.length ? (
          <>
            <SectionTitle>System</SectionTitle>
            <div className="space-y-2">
              {menu.system.map((it) => (
                <NavItem key={it.to} {...it} />
              ))}
            </div>
          </>
        ) : null}

        <div className="mt-6 rounded-2xl border bg-gray-50 p-4 text-xs text-gray-600">
          <div className="font-semibold text-gray-800">Enterprise note</div>
          <div className="mt-1">
            ✅ Orders module is live (server-connected list + status update). ✅ Audit Logs is live
            (server-generated logs + filters + pagination). ✅ Roles & Permissions is live (RBAC management).
            ✅ Settings is live (server-stored config + audit logging + versioning). Next: exports (CSV),
            retention policy, and stricter per-page permission gates.
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 lg:h-screen lg:overflow-hidden">
      {/* ✅ Stable scrollbar to reduce layout shifting */}
      <style>{`
        :root { scrollbar-gutter: stable; }
      `}</style>

      {/* Mobile admin topbar */}
      <div className="lg:hidden sticky top-0 z-40 border-b bg-white/80 backdrop-blur-xl">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-gray-100 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="Open admin menu"
          >
            <Menu size={22} />
          </button>

          <Link to="/admin" className="text-sm font-semibold truncate max-w-[55%]">
            {currentTitle}
          </Link>

          <Link
            to="/"
            className="p-2 rounded-xl hover:bg-gray-100 transition
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            aria-label="View store"
          >
            <Store size={22} />
          </Link>
        </div>
      </div>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="lg:hidden fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 w-full h-full bg-black/45 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            ref={drawerRef}
            className="absolute left-0 top-0 h-full w-[88%] max-w-sm bg-white shadow-2xl border-r
                       animate-[drawerIn_0.22s_ease-out] overflow-hidden"
          >
            <div className="px-4 py-4 border-b flex items-center justify-between">
              <div className="font-bold">
                Admin<span className="text-gray-700">Panel</span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="Close admin menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 h-[calc(100%-64px)]">{Sidebar}</div>
          </div>
        </div>
      ) : null}

      {/* ✅ Desktop enterprise shell: fixed sidebar width + internal scrolling */}
      <div className="hidden lg:block h-full">
        <div className="mx-auto max-w-7xl h-full px-6 py-6">
          <div className="grid grid-cols-[340px_minmax(0,1fr)] gap-6 h-full">
            {/* Sidebar fixed width */}
            <aside className="h-full overflow-hidden">
              {Sidebar}
            </aside>

            {/* Main content: always scroll (prevents layout jump) */}
            <main className="h-full min-w-0 overflow-hidden rounded-3xl bg-white border shadow-sm">
              <div ref={mainScrollRef} className="h-full overflow-y-scroll p-6">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile main content (normal scroll) */}
      <div className="lg:hidden px-4 sm:px-6 py-6">
        <Outlet />
      </div>

      <style>
        {`
          @keyframes drawerIn {
            from { transform: translateX(-18px); opacity: 0.95; }
            to   { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
