import { useState } from "react";
import { 
  Search, User, Menu, X, ShoppingBag, 
  UserCircle, Settings, LogOut 
} from "lucide-react";

function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  const navItems = ["Home", "Shop", "Collections", "About", "Contact"];

  return (
    <>
      {/* ─── HEADER ─────────────────────────────── */}
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          {/* LOGO */}
          <div className="text-3xl font-bold tracking-tight cursor-pointer">
            Smart<span className="text-gray-800">Shop</span>
          </div>

          {/* ─── DESKTOP NAVIGATION ───────────────── */}
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <a 
                key={item}
                href="#"
                className="text-gray-700 hover:text-black transition text-sm tracking-wide"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* ─── DESKTOP RIGHT ICONS ─────────────── */}
          <div className="hidden md:flex items-center gap-6">

            {/* Search Button */}
            <button
              onClick={() => setOpenSearch(true)}
              className="text-gray-700 hover:text-black transition"
            >
              <Search size={22} />
            </button>

            {/* USER DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => setOpenUser(!openUser)}
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <User size={22} />
              </button>

              {openUser && (
                <div className="
                  absolute right-0 mt-2 w-56 
                  bg-white border shadow-xl 
                  rounded-xl z-50 
                  animate-[fadeIn_0.25s_ease-out]
                ">
                  {/* Sign In */}
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <User size={18} /> Sign In
                  </a>

                  {/* Sign Up */}
                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <UserCircle size={18} /> Sign Up
                  </a>

                  <hr />

                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <UserCircle size={18} /> My Account
                  </a>

                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <Settings size={18} /> Settings
                  </a>

                  <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-red-600">
                    <LogOut size={18} /> Logout
                  </a>
                </div>
              )}
            </div>

            {/* Cart */}
            <button className="relative text-gray-700 hover:text-black transition">
              <ShoppingBag size={22} />
              <span className="
                absolute -top-2 -right-2 
                bg-black text-white text-[10px] 
                px-[6px] py-[1px] rounded-full
              ">
                2
              </span>
            </button>
          </div>

          {/* ─── MOBILE MENU BUTTON ──────────────── */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setOpenMenu(!openMenu)}
          >
            {openMenu ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* ─── MOBILE DROPDOWN ───────────────────── */}
        {openMenu && (
          <div className="md:hidden bg-white border-t shadow-sm p-5 animate-[fadeIn_0.25s_ease-out]">
            
            {/* Mobile Search */}
            <div className="flex items-center gap-2 border rounded-xl px-4 py-3 mb-6">
              <Search className="text-gray-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent outline-none text-sm"
              />
            </div>

            {/* Mobile Nav */}
            <nav className="flex flex-col gap-5">
              {navItems.map((item) => (
                <a 
                  key={item}
                  href="#" 
                  className="text-gray-700 text-lg hover:text-black transition"
                >
                  {item}
                </a>
              ))}
            </nav>

            {/* Mobile User */}
            <div className="flex items-center gap-6 mt-6 border-t pt-5">
              <User size={24} />
              <ShoppingBag size={24} />
            </div>
          </div>
        )}
      </header>

      {/* ─── SEARCH OVERLAY ─────────────────────── */}
      {openSearch && (
        <div className="
          fixed inset-0 bg-black/50 backdrop-blur-md 
          flex flex-col items-center justify-center 
          z-[999] animate-[fadeIn_0.25s_ease-out]
        ">
          <div className="w-full max-w-xl px-6">

            {/* Close Search */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setOpenSearch(false)}
                className="p-2 rounded-full bg-white hover:bg-gray-100 shadow transition"
              >
                <X size={22} />
              </button>
            </div>

            {/* Search Box */}
            <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-lg">
              <Search className="text-gray-500" size={20} />
              <input
                autoFocus
                type="text"
                placeholder="Search for products..."
                className="ml-3 w-full outline-none text-gray-700 text-lg"
              />
            </div>

          </div>
        </div>
      )}
    </>
  );
}

export default Header;
