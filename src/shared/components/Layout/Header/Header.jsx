import { Link } from "react-router-dom";
import { 
  Search, User, Menu, X, ShoppingBag, 
  UserCircle, Settings, LogOut 
} from "lucide-react";
import { useState } from "react";

function Header() {
  const [openMenu, setOpenMenu] = useState(false);
  const [openUser, setOpenUser] = useState(false);
  const [openSearch, setOpenSearch] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Collections", path: "/collections" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <>
      <header className="border-b bg-white/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">

          {/* LOGO */}
          <Link to="/" className="text-3xl font-bold tracking-tight cursor-pointer">
            Smart<span className="text-gray-800">Shop</span>
          </Link>

          {/* DESKTOP NAV */}
          <nav className="hidden md:flex items-center gap-10">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-gray-700 hover:text-black transition text-sm tracking-wide"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* DESKTOP RIGHT ICONS */}
          <div className="hidden md:flex items-center gap-6">

            <button onClick={() => setOpenSearch(true)} className="text-gray-700 hover:text-black transition">
              <Search size={22} />
            </button>

            <div className="relative">
              <button onClick={() => setOpenUser(!openUser)} className="p-2 rounded-full hover:bg-gray-100 transition">
                <User size={22} />
              </button>

              {openUser && (
                <div className="absolute right-0 mt-2 w-56 bg-white border shadow-xl rounded-xl z-50 animate-[fadeIn_0.25s_ease-out]">

                  <Link to="/signin" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <User size={18} /> Sign In
                  </Link>

                  <Link to="/signup" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <UserCircle size={18} /> Sign Up
                  </Link>

                  <hr />

                  <Link to="/account" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <UserCircle size={18} /> My Account
                  </Link>

                  <Link to="/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                    <Settings size={18} /> Settings
                  </Link>

                  <button className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition text-red-600">
                    <LogOut size={18} /> Logout
                  </button>
                </div>
              )}
            </div>

            <button className="relative text-gray-700 hover:text-black transition">
              <ShoppingBag size={22} />
              <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] px-[6px] py-[1px] rounded-full">2</span>
            </button>
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            onClick={() => setOpenMenu(!openMenu)}
          >
            {openMenu ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* MOBILE DROPDOWN MENU */}
        {openMenu && (
          <div className="md:hidden bg-white border-t shadow-sm p-5 animate-[fadeIn_0.25s_ease-out]">

            {/* Mobile Nav */}
            <nav className="flex flex-col gap-5">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setOpenMenu(false)}
                  className="text-gray-700 text-lg hover:text-black transition"
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-6 mt-6 border-t pt-5">
              <User size={24} />
              <ShoppingBag size={24} />
            </div>
          </div>
        )}
      </header>

      {/* SEARCH OVERLAY */}
      {openSearch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex flex-col items-center justify-center z-[999] animate-[fadeIn_0.25s_ease-out]">
          <div className="w-full max-w-xl px-6">
            <div className="flex justify-end mb-4">
              <button onClick={() => setOpenSearch(false)} className="p-2 rounded-full bg-white hover:bg-gray-100 shadow transition">
                <X size={22} />
              </button>
            </div>

            <div className="flex items-center bg-white rounded-xl px-4 py-3 shadow-lg">
              <Search className="text-gray-500" size={20} />
              <input autoFocus type="text" placeholder="Search for products..." className="ml-3 w-full outline-none text-gray-700 text-lg" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;
