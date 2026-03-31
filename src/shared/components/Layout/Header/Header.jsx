import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Search,
  User,
  Menu,
  X,
  ShoppingBag,
  UserCircle,
  Settings,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Boxes,
  Tag,
  LifeBuoy,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Store,
  Home,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { useCart } from "../../../hooks/useCart";

function useOutsideClick(refs, onOutside, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    function handler(e) {
      const el = e.target;
      const inside = refs.some((r) => r.current && r.current.contains(el));
      if (!inside) onOutside?.();
    }

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [refs, onOutside, enabled]);
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

function CartBadge({ hydrated, count }) {
  if (!hydrated) {
    return (
      <span
        className="absolute -right-1 -top-1 skeleton h-4 w-7 rounded-full"
        aria-label="Cart loading"
      />
    );
  }

  if (!count || count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span className="absolute -right-1 -top-1 rounded-full bg-black px-[6px] py-[1px] text-[10px] text-white shadow-sm">
      {label}
    </span>
  );
}

function normalizeRole(u) {
  return String(u?.role || "").trim().toLowerCase();
}

function normalizePermissions(u) {
  const list = Array.isArray(u?.permissions) ? u.permissions : [];
  const out = [];
  const seen = new Set();

  for (const raw of list) {
    const value = String(raw || "").trim().toLowerCase();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
}

function getRoleLevel(u) {
  const value = Number(u?.roleLevel || 0);
  return Number.isFinite(value) ? value : 0;
}

function canAccessAdminArea(user) {
  if (!user) return false;

  const role = normalizeRole(user);
  const roleLevel = getRoleLevel(user);
  const permissions = normalizePermissions(user);

  if (role === "superadmin") return true;
  if (roleLevel >= 100) return true;
  if (permissions.includes("*")) return true;
  if (permissions.includes("admin:access")) return true;
  if (roleLevel > 0) return true;

  return false;
}

function canAny({ userPerms, isSuper }, perms = []) {
  if (isSuper) return true;
  if (!Array.isArray(perms) || perms.length === 0) return true;
  if (userPerms.includes("*")) return true;

  return perms.some((perm) =>
    userPerms.includes(String(perm || "").trim().toLowerCase())
  );
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

  const minLevelOk =
    item.minLevel != null ? canMinLevel(ctx.roleLevel, item.minLevel) : true;
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

function buildReturnTo(loc) {
  const pathname = loc?.pathname || "/";
  const search = loc?.search || "";
  const hash = loc?.hash || "";
  const full = `${pathname}${search}${hash}`;
  return full.startsWith("/") ? full : "/";
}

function getSearchValueFromLocation(location) {
  try {
    const params = new URLSearchParams(location?.search || "");
    return String(params.get("q") || params.get("search") || "").trim();
  } catch {
    return "";
  }
}

function MenuSectionTitle({ children }) {
  return (
    <div className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
      {children}
    </div>
  );
}

function UserMenuLink({
  to,
  icon: Icon,
  label,
  hint,
  badge,
  onClick,
  className = "",
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={[
        "group flex items-start gap-3 rounded-2xl px-4 py-3 text-sm transition",
        "text-gray-800 hover:bg-gray-50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
        className,
      ].join(" ")}
    >
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-700 transition group-hover:bg-gray-100">
        <Icon size={17} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium">{label}</span>
          {badge ? (
            <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
              {badge}
            </span>
          ) : null}
        </div>

        {hint ? <div className="mt-0.5 text-xs text-gray-500">{hint}</div> : null}
      </div>
    </Link>
  );
}

export default function Header() {
  const location = useLocation();
  const nav = useNavigate();
  const { user, isAuthed, logout, booting } = useAuth();

  const role = useMemo(() => normalizeRole(user), [user]);
  const roleLevel = useMemo(() => getRoleLevel(user), [user]);
  const userPerms = useMemo(() => normalizePermissions(user), [user]);

  const isSuper = useMemo(
    () => role === "superadmin" || roleLevel >= 100 || userPerms.includes("*"),
    [role, roleLevel, userPerms]
  );

  const isAdmin = useMemo(() => canAccessAdminArea(user), [user]);
  const roleLabel = useMemo(() => getRoleLabel(role, roleLevel), [role, roleLevel]);

  const isInAdmin = useMemo(
    () => String(location.pathname || "").startsWith("/admin"),
    [location.pathname]
  );

  const returnTo = useMemo(() => buildReturnTo(location), [location]);

  const { count: cartCount, hydrated: cartHydrated } = useCart();

  const [openMenu, setOpenMenu] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const userWrapRef = useRef(null);
  const menuPanelRef = useRef(null);
  const searchPanelRef = useRef(null);

  const accessCtx = useMemo(
    () => ({
      userPerms,
      isSuper,
      role,
      roleLevel,
    }),
    [userPerms, isSuper, role, roleLevel]
  );

  const storeNavItems = useMemo(
    () => [
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      { name: "Collections", path: "/collections" },
      { name: "About", path: "/about" },
      { name: "Contact", path: "/contact" },
    ],
    []
  );

  const adminNavItems = useMemo(() => {
    const items = [
      {
        name: "Dashboard",
        path: "/admin",
        icon: LayoutDashboard,
        minLevel: 1,
      },
      {
        name: "Shop Control",
        path: "/admin/shop-control",
        icon: Store,
        minLevel: 1,
      },
      {
        name: "Home Config",
        path: "/admin/home-config",
        icon: Home,
        requiresAny: ["settings:read", "settings:write"],
      },
      {
        name: "Orders",
        path: "/admin/orders",
        icon: ClipboardList,
        requiresAny: ["orders:read", "orders:write"],
      },
      {
        name: "Products",
        path: "/admin/products",
        icon: Package,
        requiresAny: ["products:read", "products:write"],
      },
      {
        name: "Customers",
        path: "/admin/customers",
        icon: Users,
        requiresAny: ["users:read", "users:write"],
      },
      {
        name: "Inventory",
        path: "/admin/inventory",
        icon: Boxes,
        requiresAny: ["products:read", "products:write"],
      },
      {
        name: "Categories",
        path: "/admin/categories",
        icon: Tag,
        requiresAny: ["products:read", "products:write"],
      },
      {
        name: "Roles",
        path: "/admin/roles",
        icon: ShieldCheck,
        requiresAny: ["users:read", "users:write"],
        minLevel: 20,
      },
      {
        name: "Audit Logs",
        path: "/admin/audit-logs",
        icon: FileText,
        requiresAny: ["audit:read"],
      },
      {
        name: "Settings",
        path: "/admin/settings",
        icon: Settings,
        requiresAny: ["settings:read", "settings:write"],
      },
      {
        name: "Support",
        path: "/admin/support",
        icon: LifeBuoy,
        requiresAny: ["users:read", "users:write", "orders:read"],
      },
    ];

    return items.filter((item) => canAccessNav(accessCtx, item));
  }, [accessCtx]);

  const navItems = useMemo(() => {
    if (isInAdmin) return adminNavItems;
    return storeNavItems;
  }, [isInAdmin, adminNavItems, storeNavItems]);

  const isActive = (path) => {
    const p = String(path || "/");
    const cur = String(location.pathname || "/");
    if (p === "/") return cur === "/";
    return cur === p || cur.startsWith(p + "/");
  };

  const closeAll = () => {
    setOpenMenu(false);
    setOpenUser(false);
    setOpenSearch(false);
  };

  const displayName = useMemo(() => {
    if (!user) return "";
    return user?.name || user?.displayName || user?.fullName || user?.email || "";
  }, [user]);

  const displayEmail = useMemo(() => {
    if (!user) return "";
    return user?.email || "";
  }, [user]);

  const menuSections = useMemo(() => {
    const personal = [];

    if (isAdmin) {
      personal.push({
        label: "Workspace Overview",
        to: "/admin",
        icon: LayoutDashboard,
        hint: "Admin workspace entry point",
      });
    } else {
      personal.push({
        label: "My Account",
        to: "/account",
        icon: UserCircle,
        hint: "Overview and personal dashboard",
      });
    }

    personal.push(
      {
        label: "Order History",
        to: "/account/orders",
        icon: ShoppingBag,
        hint: "Track and review past orders",
      },
      {
        label: "Profile Settings",
        to: "/account/profile",
        icon: Settings,
        hint: "Update profile and account details",
      }
    );

    const manage = [
      {
        label: "Overview",
        to: "/admin",
        icon: LayoutDashboard,
        hint: "Dashboard and performance overview",
        minLevel: 1,
      },
      {
        label: "Orders",
        to: "/admin/orders",
        icon: ClipboardList,
        hint: "Fulfillment and order operations",
        requiresAny: ["orders:read", "orders:write"],
      },
      {
        label: "Products",
        to: "/admin/products",
        icon: Package,
        hint: "Catalog and product management",
        requiresAny: ["products:read", "products:write"],
      },
      {
        label: "Categories",
        to: "/admin/categories",
        icon: Tag,
        hint: "Product grouping and taxonomy",
        requiresAny: ["products:read", "products:write"],
      },
      {
        label: "Inventory",
        to: "/admin/inventory",
        icon: Boxes,
        hint: "Stock and inventory status",
        requiresAny: ["products:read", "products:write"],
      },
      {
        label: "Customers",
        to: "/admin/customers",
        icon: Users,
        hint: "Customer data and user access",
        requiresAny: ["users:read", "users:write"],
      },
    ].filter((item) => canAccessNav(accessCtx, item));

    const system = [
      {
        label: "Shop Control",
        to: "/admin/shop-control",
        icon: Store,
        hint: "Storewide operational controls",
        minLevel: 1,
      },
      {
        label: "Home Config",
        to: "/admin/home-config",
        icon: Home,
        hint: "Homepage content and blocks",
        requiresAny: ["settings:read", "settings:write"],
      },
      {
        label: "Roles & Permissions",
        to: "/admin/roles",
        icon: ShieldCheck,
        hint: "RBAC and role governance",
        requiresAny: ["users:read", "users:write"],
        minLevel: 20,
      },
      {
        label: "Audit Logs",
        to: "/admin/audit-logs",
        icon: FileText,
        hint: "Compliance and activity visibility",
        requiresAny: ["audit:read"],
      },
      {
        label: "Settings",
        to: "/admin/settings",
        icon: Settings,
        hint: "System and store configuration",
        requiresAny: ["settings:read", "settings:write"],
      },
      isInAdmin
        ? {
            label: "View Storefront",
            to: "/",
            icon: ArrowUpRight,
            hint: "Switch back to customer-facing site",
          }
        : {
            label: "Open Admin Workspace",
            to: "/admin",
            icon: ArrowUpRight,
            hint: "Go to role-based admin workspace",
          },
    ]
      .filter(Boolean)
      .filter((item) => canAccessNav(accessCtx, item));

    return {
      personal,
      manage: isAdmin ? manage : [],
      system: isAdmin ? system : [],
    };
  }, [isAdmin, isInAdmin, accessCtx]);

  async function handleLogout() {
    closeAll();
    try {
      await logout();
    } finally {
      nav("/", { replace: true });
    }
  }

  function openSearchModal() {
    if (isInAdmin) return;
    setSearchTerm(getSearchValueFromLocation(location));
    setOpenSearch(true);
    setOpenMenu(false);
    setOpenUser(false);
  }

  function submitSearch() {
    if (isInAdmin) return;
    const q = String(searchTerm || "").trim();
    closeAll();
    nav(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  useEffect(() => {
    closeAll();
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    if (openMenu) setOpenUser(false);
  }, [openMenu]);

  useEffect(() => {
    if (openSearch) setOpenUser(false);
  }, [openSearch]);

  useEffect(() => {
    const lock = openMenu || openSearch;
    lockBodyScroll(lock);
    return () => lockBodyScroll(false);
  }, [openMenu, openSearch]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAll();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useOutsideClick([userWrapRef], () => setOpenUser(false), openUser);
  useOutsideClick([menuPanelRef], () => setOpenMenu(false), openMenu);
  useOutsideClick([searchPanelRef], () => setOpenSearch(false), openSearch);

  const brandHref = isInAdmin ? "/admin" : "/";
  const primaryHref = isAdmin ? "/admin" : "/account";
  const primaryLabel = isAdmin ? "Workspace" : "My account";
  const profileHref = isAdmin ? "/admin/settings" : "/account/profile";

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/75 backdrop-blur-2xl">
        <div className="site-shell py-3">
          <div className="flex items-center justify-between gap-3 rounded-[24px] border border-black/5 bg-white/85 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-5">
            <div className="flex min-w-0 items-center gap-4">
              <Link
                to={brandHref}
                className="shrink-0 select-none leading-none"
                aria-label="SmartShop Home"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white shadow-sm">
                    SS
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-lg font-semibold tracking-tight text-gray-950 sm:text-xl">
                      SmartShop
                    </div>
                    <div className="hidden text-[11px] uppercase tracking-[0.22em] text-gray-400 sm:block">
                      {isInAdmin ? "Admin Console" : "Premium Storefront"}
                    </div>
                  </div>
                </div>
              </Link>

              <nav className="hidden items-center gap-2 lg:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={[
                      "rounded-full px-4 py-2.5 text-sm font-medium transition",
                      isActive(item.path)
                        ? "bg-black text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100 hover:text-black",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                    ].join(" ")}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {!isInAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={openSearchModal}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    aria-label="Open search"
                  >
                    <Search size={19} />
                  </button>

                  <Link
                    to="/cart"
                    className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    aria-label="Open cart"
                  >
                    <ShoppingBag size={19} />
                    <CartBadge hydrated={cartHydrated} count={cartCount} />
                  </Link>
                </>
              ) : (
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="View storefront"
                >
                  View store <ArrowUpRight size={16} />
                </Link>
              )}

              <div className="relative" ref={userWrapRef}>
                <button
                  type="button"
                  onClick={() => setOpenUser((v) => !v)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Open user menu"
                  aria-expanded={openUser ? "true" : "false"}
                >
                  <User size={19} />
                </button>

                {openUser && (
                  <div className="absolute right-0 z-50 mt-3 w-[22rem] overflow-hidden rounded-3xl border border-black/5 bg-white shadow-2xl animate-[fadeIn_0.18s_ease-out]">
                    <div className="border-b border-black/5 bg-gradient-to-br from-gray-50 to-white px-5 py-4">
                      {booting ? (
                        <div className="space-y-2">
                          <div className="skeleton h-3 w-20 rounded-md" />
                          <div className="skeleton h-4 w-40 rounded-md" />
                          <div className="skeleton h-3 w-28 rounded-md" />
                        </div>
                      ) : isAuthed ? (
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-gray-400">
                            <span>Signed in</span>
                            <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-gray-500">
                              {roleLabel}
                            </span>
                            {isAdmin ? (
                              <span className="rounded-full border border-gray-200 bg-white px-2 py-1 text-[10px] font-semibold tracking-[0.08em] text-gray-500">
                                Level {roleLevel}
                              </span>
                            ) : null}
                          </div>

                          <div className="truncate text-sm font-semibold text-gray-900">
                            {displayName || "Account"}
                          </div>

                          {displayEmail ? (
                            <div className="truncate text-xs text-gray-500">{displayEmail}</div>
                          ) : null}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500">Account</div>
                      )}
                    </div>

                    {!booting && !isAuthed ? (
                      <div className="p-3">
                        <Link
                          to="/signin"
                          state={{ from: returnTo }}
                          onClick={closeAll}
                          className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                          <User size={18} /> Sign In
                        </Link>

                        <Link
                          to="/signup"
                          state={{ from: returnTo }}
                          onClick={closeAll}
                          className="mt-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
                        >
                          <UserCircle size={18} /> Sign Up
                        </Link>
                      </div>
                    ) : !booting && isAuthed ? (
                      <div className="max-h-[32rem] overflow-y-auto p-3">
                        {menuSections.personal.length ? (
                          <div className="space-y-2">
                            <MenuSectionTitle>Account</MenuSectionTitle>
                            <div className="space-y-1">
                              {menuSections.personal.map((item) => (
                                <UserMenuLink
                                  key={item.to}
                                  {...item}
                                  onClick={closeAll}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {menuSections.manage.length ? (
                          <div className="mt-4 space-y-2">
                            <div className="h-px bg-black/5" />
                            <MenuSectionTitle>Workspace</MenuSectionTitle>
                            <div className="space-y-1">
                              {menuSections.manage.map((item) => (
                                <UserMenuLink
                                  key={item.to}
                                  {...item}
                                  onClick={closeAll}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}

                        {menuSections.system.length ? (
                          <div className="mt-4 space-y-2">
                            <div className="h-px bg-black/5" />
                            <MenuSectionTitle>System</MenuSectionTitle>
                            <div className="space-y-1">
                              {menuSections.system.map((item) => (
                                <UserMenuLink
                                  key={item.to}
                                  {...item}
                                  onClick={closeAll}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}

                        <div className="my-4 h-px bg-black/5" />

                        <button
                          type="button"
                          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium text-red-600 transition hover:bg-red-50"
                          onClick={handleLogout}
                        >
                          <LogOut size={18} /> Logout
                        </button>
                      </div>
                    ) : (
                      <div className="px-4 pb-4">
                        <div className="skeleton h-10 w-full rounded-xl" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 md:hidden">
              {!isInAdmin ? (
                <>
                  <button
                    type="button"
                    onClick={openSearchModal}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    aria-label="Open search"
                  >
                    <Search size={20} />
                  </button>

                  <Link
                    to="/cart"
                    className="relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                    aria-label="Open cart"
                  >
                    <ShoppingBag size={20} />
                    <CartBadge hydrated={cartHydrated} count={cartCount} />
                  </Link>
                </>
              ) : (
                <Link
                  to="/"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="View storefront"
                >
                  <ArrowUpRight size={20} />
                </Link>
              )}

              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-700 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                onClick={() => setOpenMenu((v) => !v)}
                aria-label={openMenu ? "Close menu" : "Open menu"}
                aria-expanded={openMenu ? "true" : "false"}
              >
                {openMenu ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {openMenu && (
        <div className="fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 h-full w-full bg-black/45 backdrop-blur-sm"
            onClick={() => setOpenMenu(false)}
          />

          <div
            ref={menuPanelRef}
            className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col border-l border-black/5 bg-white shadow-2xl animate-[drawerIn_0.22s_ease-out]"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black text-sm font-bold text-white">
                  SS
                </div>
                <div>
                  <div className="font-semibold text-gray-950">SmartShop</div>
                  <div className="text-[11px] uppercase tracking-[0.18em] text-gray-400">
                    {isInAdmin ? "Admin Console" : "Storefront"}
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="rounded-2xl p-2 transition hover:bg-gray-100"
                onClick={() => setOpenMenu(false)}
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>

            <div className="border-b border-black/5 px-5 py-4">
              {booting ? (
                <div className="space-y-2">
                  <div className="skeleton h-4 w-40 rounded-lg" />
                  <div className="skeleton h-3 w-52 rounded-lg" />
                  <div className="skeleton h-10 w-full rounded-2xl" />
                </div>
              ) : !isAuthed ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/signin"
                    state={{ from: returnTo }}
                    onClick={() => setOpenMenu(false)}
                    className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold transition hover:bg-gray-50"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    state={{ from: returnTo }}
                    onClick={() => setOpenMenu(false)}
                    className="rounded-2xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>Signed in</span>
                      <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                        {roleLabel}
                      </span>
                      {isAdmin ? (
                        <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[11px] font-semibold text-gray-700">
                          Level {roleLevel}
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-2 truncate text-sm font-semibold text-gray-900">
                      {displayName || "Account"}
                    </div>

                    {displayEmail ? (
                      <div className="truncate text-xs text-gray-500">{displayEmail}</div>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={primaryHref}
                      onClick={() => setOpenMenu(false)}
                      className="rounded-2xl bg-black px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-gray-900"
                    >
                      {primaryLabel}
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold text-red-600 transition hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to={profileHref}
                      onClick={() => setOpenMenu(false)}
                      className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                    >
                      {isAdmin ? "Settings" : "Profile"}
                    </Link>

                    {isInAdmin ? (
                      <Link
                        to="/"
                        onClick={() => setOpenMenu(false)}
                        className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        View store
                      </Link>
                    ) : isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setOpenMenu(false)}
                        className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Admin
                      </Link>
                    ) : (
                      <Link
                        to="/account/orders"
                        onClick={() => setOpenMenu(false)}
                        className="rounded-2xl border border-black/10 px-4 py-3 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                      >
                        Orders
                      </Link>
                    )}
                  </div>

                  {(menuSections.personal.length ||
                    menuSections.manage.length ||
                    menuSections.system.length) ? (
                    <div className="space-y-4 border-t border-black/5 pt-4">
                      {menuSections.personal.length ? (
                        <div className="space-y-2">
                          <MenuSectionTitle>Account</MenuSectionTitle>
                          <div className="space-y-1">
                            {menuSections.personal.map((item) => (
                              <UserMenuLink
                                key={`mobile-${item.to}`}
                                {...item}
                                onClick={() => setOpenMenu(false)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {menuSections.manage.length ? (
                        <div className="space-y-2">
                          <MenuSectionTitle>Workspace</MenuSectionTitle>
                          <div className="space-y-1">
                            {menuSections.manage.map((item) => (
                              <UserMenuLink
                                key={`mobile-${item.to}`}
                                {...item}
                                onClick={() => setOpenMenu(false)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {menuSections.system.length ? (
                        <div className="space-y-2">
                          <MenuSectionTitle>System</MenuSectionTitle>
                          <div className="space-y-1">
                            {menuSections.system.map((item) => (
                              <UserMenuLink
                                key={`mobile-${item.to}`}
                                {...item}
                                onClick={() => setOpenMenu(false)}
                              />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <nav className="flex flex-col gap-2 overflow-auto px-5 py-5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setOpenMenu(false)}
                    className={[
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-base transition",
                      isActive(item.path)
                        ? "bg-black text-white font-semibold shadow-sm"
                        : "text-gray-800 hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {Icon ? (
                      <Icon
                        size={18}
                        className={isActive(item.path) ? "text-white" : "text-gray-500"}
                      />
                    ) : null}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto border-t border-black/5 px-5 py-5 text-xs text-gray-500">
              Tip: Press <span className="font-semibold">Esc</span> to close
            </div>
          </div>
        </div>
      )}

      {!isInAdmin && openSearch && (
        <div className="fixed inset-0 z-[1000]">
          <button
            type="button"
            aria-label="Close search backdrop"
            className="absolute inset-0 h-full w-full bg-black/55 backdrop-blur-md"
            onClick={() => setOpenSearch(false)}
          />

          <div className="absolute inset-0 flex items-start justify-center px-4 pt-24 md:pt-32">
            <div ref={searchPanelRef} className="w-full max-w-2xl">
              <div className="mb-4 flex justify-end">
                <button
                  onClick={() => setOpenSearch(false)}
                  className="rounded-full bg-white p-2 shadow transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Close search"
                  type="button"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="rounded-[28px] border border-black/5 bg-white p-4 shadow-2xl md:p-5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitSearch();
                  }}
                  className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3"
                >
                  <Search className="text-gray-500" size={20} />
                  <input
                    autoFocus
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search for products..."
                    className="w-full text-base text-gray-700 outline-none md:text-lg"
                    aria-label="Search products"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900"
                  >
                    Search
                  </button>
                </form>

                <div className="mt-3 text-center text-xs text-gray-500">
                  Press <span className="font-semibold">Enter</span> to search,{" "}
                  <span className="font-semibold">Esc</span> to close
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes drawerIn {
            from { transform: translateX(18px); opacity: 0.96; }
            to   { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </>
  );
}