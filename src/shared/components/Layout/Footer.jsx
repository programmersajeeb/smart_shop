import { Facebook, Instagram, Youtube, Linkedin, Mail } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-10">
      <div className="container mx-auto px-6">

        {/* TOP GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-16">

          {/* BRAND INFO */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Smart Shop</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted destination for premium fashion, accessories, and lifestyle
              products with a seamless shopping experience.
            </p>
          </div>

          {/* SHOP LINKS */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Shop</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><a className="hover:text-white transition">Men's Fashion</a></li>
              <li><a className="hover:text-white transition">Women's Fashion</a></li>
              <li><a className="hover:text-white transition">Accessories</a></li>
              <li><a className="hover:text-white transition">New Arrivals</a></li>
            </ul>
          </div>

          {/* SUPPORT LINKS */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><a className="hover:text-white transition">Contact Us</a></li>
              <li><a className="hover:text-white transition">FAQ</a></li>
              <li><a className="hover:text-white transition">Return & Refund</a></li>
              <li><a className="hover:text-white transition">Shipping Policy</a></li>
              <li><a className="hover:text-white transition">Track Order</a></li>
            </ul>
          </div>

          {/* NEWSLETTER */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Stay Updated</h3>
            <p className="text-gray-300 text-sm mb-3">
              Subscribe to get exclusive offers, updates & more.
            </p>

            <div className="flex items-center bg-white rounded-xl overflow-hidden">
              <Mail className="text-black ml-3" size={20} />
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full px-3 py-3 outline-none text-black"
              />
            </div>

            <button className="
              mt-3 w-full bg-white text-black py-3 
              rounded-xl font-semibold hover:bg-gray-200 transition
            ">
              Subscribe
            </button>
          </div>
        </div>

        {/* DIVIDER */}
        <div className="w-full h-px bg-gray-700 my-10"></div>

        {/* BOTTOM ROW */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">

          {/* COPYRIGHT */}
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Smart Shop. All Rights Reserved.
          </p>

          {/* SOCIAL ICONS */}
          <div className="flex gap-4">
            <a className="p-2 rounded-full bg-gray-800 hover:bg-white hover:text-black transition">
              <Facebook size={20} />
            </a>
            <a className="p-2 rounded-full bg-gray-800 hover:bg-white hover:text-black transition">
              <Instagram size={20} />
            </a>
            <a className="p-2 rounded-full bg-gray-800 hover:bg-white hover:text-black transition">
              <Youtube size={20} />
            </a>
            <a className="p-2 rounded-full bg-gray-800 hover:bg:white hover:text-black transition">
              <Linkedin size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
