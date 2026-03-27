import { Facebook, Instagram, Youtube, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";

function Footer() {
  const year = new Date().getFullYear();

  const shopLinks = [
    { label: "Men's Fashion", to: "/shop?category=Men" },
    { label: "Women's Fashion", to: "/shop?category=Women" },
    { label: "Accessories", to: "/shop?category=Accessories" },
    { label: "New Arrivals", to: "/shop?sort=latest" },
  ];

  const supportLinks = [
    { label: "Contact Us", to: "/contact" },
    { label: "FAQ", to: "/faq" },
    { label: "Return & Refund", to: "/returns" },
    { label: "Shipping Policy", to: "/shipping-policy" },
    { label: "Track Order", to: "/track-order" },
  ];

  const socialLinks = [
    {
      label: "Facebook",
      href: "https://facebook.com",
      icon: <Facebook size={18} />,
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: <Instagram size={18} />,
    },
    {
      label: "YouTube",
      href: "https://youtube.com",
      icon: <Youtube size={18} />,
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com",
      icon: <Linkedin size={18} />,
    },
  ];

  return (
    <footer className="mt-12 bg-black text-white sm:mt-14 lg:mt-16">
      <div className="container mx-auto px-4 py-12 sm:px-6 sm:py-14 lg:py-16">
        <div className="grid grid-cols-1 gap-10 sm:gap-12 md:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_0.8fr_1fr] xl:gap-14">
          <div className="max-w-sm">
            <Link to="/" className="inline-block">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Smart Shop
              </h2>
            </Link>

            <p className="mt-4 text-sm leading-7 text-gray-300 sm:text-[15px]">
              Your trusted destination for premium fashion, accessories, and
              lifestyle products with a seamless shopping experience.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Shop</h3>

            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              {shopLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Support</h3>

            <ul className="mt-4 space-y-3 text-sm text-gray-300">
              {supportLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className="transition hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">Stay Updated</h3>

            <p className="mt-4 text-sm leading-6 text-gray-300">
              Subscribe to get exclusive offers, updates, and new arrivals.
            </p>

            <form
              className="mt-4"
              onSubmit={(e) => e.preventDefault()}
            >
              <label className="sr-only" htmlFor="footer-email">
                Email address
              </label>

              <div className="flex items-center rounded-2xl border border-white/10 bg-white overflow-hidden">
                <Mail className="ml-4 shrink-0 text-black" size={18} />
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border-0 bg-transparent px-3 py-3.5 text-sm text-black outline-none placeholder:text-gray-500"
                />
              </div>

              <button
                type="submit"
                className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-white/10 sm:my-10" />

        <div className="flex flex-col gap-4 sm:gap-5 md:flex-row md:items-center md:justify-between">
          <p className="text-center text-sm text-gray-400 md:text-left">
            © {year} Smart Shop. All Rights Reserved.
          </p>

          <div className="flex items-center justify-center gap-3 md:justify-end">
            {socialLinks.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 text-white transition hover:bg-white hover:text-black"
              >
                {item.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;