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
        className="absolute -top-1 -right-1 skeleton h-4 w-7 rounded-full"
        aria-label="Cart loading"
      />
    );
  }

  if (!count || count <= 0) return null;

  const label = count > 99 ? "99+" : String(count);

  return (
    <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] px-[6px] py-[1px] rounded-full">
      {label}
    </span>
  );
}

function normalizeRole(u) {
  return String(u?.role || "").trim().toLowerCase();
}

function isAdminRole(role) {
  return role === "admin" || role === "superadmin";
}

// ✅ NEW: safe returnTo builder (internal only)
function buildReturnTo(loc) {
  const pathname = loc?.pathname || "/";
  const search = loc?.search || "";
  const hash = loc?.hash || "";
  const full = `${pathname}${search}${hash}`;
  return full.startsWith("/") ? full : "/";
}

export default function Header() {
  const location = useLocation();
  const nav = useNavigate();
  const { user, isAuthed, logout, booting } = useAuth();

  const role = useMemo(() => normalizeRole(user), [user]);
  const isAdmin = useMemo(() => isAdminRole(role), [role]);
  const isInAdmin = useMemo(
    () => String(location.pathname || "").startsWith("/admin"),
    [location.pathname]
  );

  // ✅ NEW: this is what we will pass to /signin & /signup
  const returnTo = useMemo(() => buildReturnTo(location), [location]);

  // Cart is storefront-only UX
  const { count: cartCount, hydrated: cartHydrated } = useCart();

  const [openMenu, setOpenMenu] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const userWrapRef = useRef(null);
  const menuPanelRef = useRef(null);
  const searchPanelRef = useRef(null);

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

  const adminNavItems = useMemo(
    () => [
      { name: "Dashboard", path: "/admin", icon: LayoutDashboard },
      { name: "Orders", path: "/admin/orders", icon: ClipboardList },
      { name: "Products", path: "/admin/products", icon: Package },
      { name: "Customers", path: "/admin/customers", icon: Users },
      { name: "Inventory", path: "/admin/inventory", icon: Boxes },
      { name: "Promotions", path: "/admin/promotions", icon: Tag },
      { name: "Support", path: "/admin/support", icon: LifeBuoy },
      { name: "Settings", path: "/admin/settings", icon: Settings },
    ],
    []
  );

  const navItems = useMemo(() => {
    // In admin area: show admin nav
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

  async function handleLogout() {
    closeAll();
    try {
      await logout();
    } finally {
      nav("/", { replace: true });
    }
  }

  function openSearchModal() {
    if (isInAdmin) return; // storefront-only
    setSearchTerm("");
    setOpenSearch(true);
    setOpenMenu(false);
    setOpenUser(false);
  }

  function submitSearch() {
    if (isInAdmin) return;
    const q = String(searchTerm || "").trim();
    closeAll();
    // Safe: if shop page ignores query param, it still works.
    nav(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  }

  useEffect(() => {
    closeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (openMenu) setOpenUser(false);
  }, [openMenu]);

  useEffect(() => {
    const lock = openMenu || openSearch;
    lockBodyScroll(lock);
    return () => lockBodyScroll(false);
  }, [openMenu, openSearch]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") closeAll();
      if (e.key === "Enter" && openSearch) submitSearch();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openSearch, searchTerm]);

  useOutsideClick([userWrapRef], () => setOpenUser(false), openUser);
  useOutsideClick([menuPanelRef], () => setOpenMenu(false), openMenu);
  useOutsideClick([searchPanelRef], () => setOpenSearch(false), openSearch);

  const brandHref = isInAdmin ? "/admin" : "/";

  return (
    <>
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            to={brandHref}
            className="text-2xl sm:text-3xl font-bold tracking-tight select-none"
            aria-label="SmartShop Home"
          >
            Smart<span className="text-gray-800">Shop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={[
                  "text-sm tracking-wide transition rounded px-2 py-1",
                  isActive(item.path)
                    ? "text-black font-semibold"
                    : "text-gray-700 hover:text-black hover:bg-gray-50",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                ].join(" ")}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 sm:gap-4">
            {/* Storefront-only: Search + Cart */}
            {!isInAdmin ? (
              <>
                <button
                  type="button"
                  onClick={openSearchModal}
                  className="p-2 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Open search"
                >
                  <Search size={22} />
                </button>

                <Link
                  to="/cart"
                  className="relative p-2 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Open cart"
                >
                  <ShoppingBag size={22} />
                  <CartBadge hydrated={cartHydrated} count={cartCount} />
                </Link>
              </>
            ) : (
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-2xl border bg-white hover:bg-gray-50 transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="View storefront"
              >
                View store <ArrowUpRight size={16} />
              </Link>
            )}

            {/* User menu */}
            <div className="relative" ref={userWrapRef}>
              <button
                type="button"
                onClick={() => setOpenUser((v) => !v)}
                className="p-2 rounded-full hover:bg-gray-100 transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="Open user menu"
                aria-expanded={openUser ? "true" : "false"}
              >
                <User size={22} />
              </button>

              {openUser && (
                <div className="absolute right-0 mt-2 w-64 bg-white border shadow-xl rounded-2xl z-50 overflow-hidden animate-[fadeIn_0.18s_ease-out]">
                  <div className="px-4 pt-3 pb-2 text-xs text-gray-500">
                    {booting ? (
                      <div className="space-y-2">
                        <div className="skeleton h-3 w-20 rounded-md" />
                        <div className="skeleton h-4 w-40 rounded-md" />
                        <div className="skeleton h-3 w-28 rounded-md" />
                      </div>
                    ) : isAuthed ? (
                      <div className="space-y-0.5">
                        <div className="text-[11px] uppercase tracking-wide">
                          Signed in {isAdmin ? "(Admin)" : ""}
                        </div>
                        <div className="text-sm text-gray-800 font-semibold truncate">
                          {displayName || "Account"}
                        </div>
                        {displayEmail ? (
                          <div className="text-xs text-gray-500 truncate">{displayEmail}</div>
                        ) : null}
                      </div>
                    ) : (
                      "Account"
                    )}
                  </div>

                  {!booting && !isAuthed ? (
                    <>
                      {/* ✅ FIX: pass state.from */}
                      <Link
                        to="/signin"
                        state={{ from: returnTo }}
                        onClick={closeAll}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <User size={18} /> Sign In
                      </Link>

                      <Link
                        to="/signup"
                        state={{ from: returnTo }}
                        onClick={closeAll}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <UserCircle size={18} /> Sign Up
                      </Link>
                    </>
                  ) : !booting && isAuthed ? (
                    <>
                      {isAdmin ? (
                        <Link
                          to="/admin"
                          onClick={closeAll}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <LayoutDashboard size={18} /> Admin Dashboard
                        </Link>
                      ) : (
                        <Link
                          to="/account"
                          onClick={closeAll}
                          className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                        >
                          <UserCircle size={18} /> My Account
                        </Link>
                      )}

                      <Link
                        to={isAdmin ? "/admin/settings" : "/settings"}
                        onClick={closeAll}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <Settings size={18} /> Settings
                      </Link>

                      <div className="h-px bg-gray-100" />

                      <button
                        type="button"
                        className="w-full text-left flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-red-600"
                        onClick={handleLogout}
                      >
                        <LogOut size={18} /> Logout
                      </button>
                    </>
                  ) : (
                    <div className="px-4 pb-4">
                      <div className="skeleton h-10 w-full rounded-xl" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            {!isInAdmin ? (
              <>
                <button
                  type="button"
                  onClick={openSearchModal}
                  className="p-2 rounded-lg hover:bg-gray-100 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Open search"
                >
                  <Search size={24} />
                </button>

                <Link
                  to="/cart"
                  className="relative p-2 rounded-lg hover:bg-gray-100 transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Open cart"
                >
                  <ShoppingBag size={24} />
                  <CartBadge hydrated={cartHydrated} count={cartCount} />
                </Link>
              </>
            ) : (
              <Link
                to="/"
                className="p-2 rounded-lg hover:bg-gray-100 transition
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                aria-label="View storefront"
              >
                <ArrowUpRight size={24} />
              </Link>
            )}

            <button
              type="button"
              className="p-2 rounded-lg hover:bg-gray-100 transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              onClick={() => setOpenMenu((v) => !v)}
              aria-label={openMenu ? "Close menu" : "Open menu"}
              aria-expanded={openMenu ? "true" : "false"}
            >
              {openMenu ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {openMenu && (
        <div className="fixed inset-0 z-[999]">
          <button
            type="button"
            aria-label="Close menu backdrop"
            className="absolute inset-0 w-full h-full bg-black/45 backdrop-blur-sm"
            onClick={() => setOpenMenu(false)}
          />

          <div
            ref={menuPanelRef}
            className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-l
                       animate-[drawerIn_0.22s_ease-out] flex flex-col"
          >
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div className="font-bold text-lg">
                Smart<span className="text-gray-800">Shop</span>
              </div>
              <button
                type="button"
                className="p-2 rounded-lg hover:bg-gray-100 transition"
                onClick={() => setOpenMenu(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Account / Admin quick actions */}
            <div className="px-5 py-4 border-b">
              {booting ? (
                <div className="space-y-2">
                  <div className="skeleton h-4 w-40 rounded-lg" />
                  <div className="skeleton h-3 w-52 rounded-lg" />
                  <div className="skeleton h-10 w-full rounded-2xl" />
                </div>
              ) : !isAuthed ? (
                <div className="grid grid-cols-2 gap-3">
                  {/* ✅ FIX: pass state.from */}
                  <Link
                    to="/signin"
                    state={{ from: returnTo }}
                    onClick={() => setOpenMenu(false)}
                    className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition text-center"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/signup"
                    state={{ from: returnTo }}
                    onClick={() => setOpenMenu(false)}
                    className="rounded-2xl bg-black text-white px-4 py-3 text-sm font-semibold hover:bg-gray-900 transition text-center"
                  >
                    Sign up
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-gray-500">
                    Signed in {isAdmin ? "(Admin)" : ""}
                  </div>
                  <div className="text-sm font-semibold text-gray-900 truncate">
                    {displayName || "Account"}
                  </div>
                  {displayEmail ? (
                    <div className="text-xs text-gray-500 truncate">{displayEmail}</div>
                  ) : null}

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {isAdmin ? (
                      <Link
                        to="/admin"
                        onClick={() => setOpenMenu(false)}
                        className="rounded-2xl bg-black text-white px-4 py-3 text-sm font-semibold hover:bg-gray-900 transition text-center"
                      >
                        Admin panel
                      </Link>
                    ) : (
                      <Link
                        to="/account"
                        onClick={() => setOpenMenu(false)}
                        className="rounded-2xl bg-black text-white px-4 py-3 text-sm font-semibold hover:bg-gray-900 transition text-center"
                      >
                        My account
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-2xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 transition text-center text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="px-5 py-5 flex flex-col gap-2 overflow-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setOpenMenu(false)}
                    className={[
                      "text-gray-800 text-base py-3 px-4 rounded-2xl transition text-left flex items-center gap-3",
                      isActive(item.path) ? "bg-gray-100 font-semibold" : "hover:bg-gray-50",
                    ].join(" ")}
                  >
                    {Icon ? <Icon size={18} className="text-gray-600" /> : null}
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto px-5 py-5 border-t text-xs text-gray-500">
              Tip: Press <span className="font-semibold">Esc</span> to close
            </div>
          </div>
        </div>
      )}

      {/* Search Modal (storefront only) */}
      {!isInAdmin && openSearch && (
        <div className="fixed inset-0 z-[1000]">
          <button
            type="button"
            aria-label="Close search backdrop"
            className="absolute inset-0 w-full h-full bg-black/55 backdrop-blur-md"
            onClick={() => setOpenSearch(false)}
          />

          <div className="absolute inset-0 flex items-center justify-center">
            <div ref={searchPanelRef} className="w-full max-w-xl px-6">
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setOpenSearch(false)}
                  className="p-2 rounded-full bg-white hover:bg-gray-100 shadow transition
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                  aria-label="Close search"
                  type="button"
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex items-center bg-white rounded-2xl px-4 py-3 shadow-lg border">
                <Search className="text-gray-500" size={20} />
                <input
                  autoFocus
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search for products..."
                  className="ml-3 w-full outline-none text-gray-700 text-lg"
                  aria-label="Search products"
                />
                <button
                  type="button"
                  onClick={submitSearch}
                  className="ml-3 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-900 transition"
                >
                  Search
                </button>
              </div>

              <div className="mt-3 text-center text-xs text-white/80">
                Press <span className="font-semibold">Enter</span> to search,{" "}
                <span className="font-semibold">Esc</span> to close
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-2px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes drawerIn {
            from { transform: translateX(18px); opacity: 0.95; }
            to   { transform: translateX(0); opacity: 1; }
          }
        `}
      </style>
    </>
  );
}
