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

export default function Header() {
  const location = useLocation();
  const nav = useNavigate();
  const { user, isAuthed, logout, booting } = useAuth();
  const { count: cartCount } = useCart();

  const [openMenu, setOpenMenu] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  const userWrapRef = useRef(null);
  const menuPanelRef = useRef(null);
  const searchPanelRef = useRef(null);

  const navItems = useMemo(
    () => [
      { name: "Home", path: "/" },
      { name: "Shop", path: "/shop" },
      { name: "Collections", path: "/collections" },
      { name: "About", path: "/about" },
      { name: "Contact", path: "/contact" },
    ],
    []
  );

  const isActive = (path) => location.pathname === path;

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
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useOutsideClick([userWrapRef], () => setOpenUser(false), openUser);
  useOutsideClick([menuPanelRef], () => setOpenMenu(false), openMenu);
  useOutsideClick([searchPanelRef], () => setOpenSearch(false), openSearch);

  return (
    <>
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <Link
            to="/"
            className="text-2xl sm:text-3xl font-bold tracking-tight select-none"
            aria-label="SmartShop Home"
          >
            Smart<span className="text-gray-800">Shop</span>
          </Link>

          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={[
                  "text-sm tracking-wide transition rounded",
                  isActive(item.path)
                    ? "text-black font-semibold"
                    : "text-gray-700 hover:text-black",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
                ].join(" ")}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => {
                setOpenSearch(true);
                setOpenMenu(false);
                setOpenUser(false);
              }}
              className="p-2 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              aria-label="Open search"
            >
              <Search size={22} />
            </button>

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
                <div className="absolute right-0 mt-2 w-60 bg-white border shadow-xl rounded-2xl z-50 overflow-hidden animate-[fadeIn_0.18s_ease-out]">
                  <div className="px-4 pt-3 pb-2 text-xs text-gray-500">
                    {booting ? (
                      <div className="space-y-2">
                        <div className="skeleton h-3 w-20 rounded-md" />
                        <div className="skeleton h-4 w-40 rounded-md" />
                        <div className="skeleton h-3 w-28 rounded-md" />
                      </div>
                    ) : isAuthed ? (
                      <div className="space-y-0.5">
                        <div className="text-[11px] uppercase tracking-wide">Signed in</div>
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
                      <Link
                        to="/signin"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <User size={18} /> Sign In
                      </Link>

                      <Link
                        to="/signup"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <UserCircle size={18} /> Sign Up
                      </Link>
                    </>
                  ) : !booting && isAuthed ? (
                    <>
                      <Link
                        to="/account"
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition"
                      >
                        <UserCircle size={18} /> My Account
                      </Link>

                      <Link
                        to="/settings"
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

            <Link
              to="/cart"
              className="relative p-2 rounded-full text-gray-700 hover:text-black hover:bg-gray-100 transition
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              aria-label="Open cart"
            >
              <ShoppingBag size={22} />
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] px-[6px] py-[1px] rounded-full">
                  {cartCount}
                </span>
              ) : null}
            </Link>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOpenSearch(true);
                setOpenMenu(false);
                setOpenUser(false);
              }}
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
              {cartCount > 0 ? (
                <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] px-[6px] py-[1px] rounded-full">
                  {cartCount}
                </span>
              ) : null}
            </Link>

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

            <nav className="px-5 py-5 flex flex-col gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setOpenMenu(false)}
                  className={[
                    "text-gray-800 text-base py-3 px-4 rounded-2xl transition text-left",
                    isActive(item.path) ? "bg-gray-100 font-semibold" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="mt-auto px-5 py-5 border-t text-xs text-gray-500">
              Tip: Press <span className="font-semibold">Esc</span> to close
            </div>
          </div>
        </div>
      )}

      {openSearch && (
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
                  placeholder="Search for products..."
                  className="ml-3 w-full outline-none text-gray-700 text-lg"
                  aria-label="Search products"
                />
              </div>

              <div className="mt-3 text-center text-xs text-white/80">
                Press <span className="font-semibold">Esc</span> to close
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
