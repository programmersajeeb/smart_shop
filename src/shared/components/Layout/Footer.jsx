import { useState } from "react";
import { Facebook, Instagram, Youtube, Linkedin, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../../services/apiClient";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function Footer() {
  const year = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({
    type: "",
    message: "",
  });

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

  async function handleSubmit(e) {
    e.preventDefault();

    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      setSubmitState({
        type: "error",
        message: "Please enter your email address.",
      });
      return;
    }

    if (!EMAIL_RE.test(normalizedEmail)) {
      setSubmitState({
        type: "error",
        message: "Please enter a valid email address.",
      });
      return;
    }

    try {
      setSubmitting(true);
      setSubmitState({ type: "", message: "" });

      const response = await api.post("/newsletter/subscribe", {
        email: normalizedEmail,
        source: "footer_newsletter",
      });

      const message =
        response?.data?.message ||
        "Subscription completed successfully. You will receive future updates in your inbox.";

      setSubmitState({
        type: "success",
        message,
      });

      setEmail("");
    } catch (submitError) {
      const message =
        submitError?.response?.data?.message ||
        submitError?.response?.data?.error ||
        "We could not complete your subscription right now. Please try again.";

      setSubmitState({
        type: "error",
        message: String(message),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="mt-12 bg-black text-white sm:mt-14 lg:mt-16">
      <div className="site-shell py-12 sm:py-14 lg:py-16">
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
                  <Link to={item.to} className="transition hover:text-white">
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
                  <Link to={item.to} className="transition hover:text-white">
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

            <form className="mt-4" onSubmit={handleSubmit} noValidate>
              <label className="sr-only" htmlFor="footer-email">
                Email address
              </label>

              <div className="flex items-center overflow-hidden rounded-2xl border border-white/10 bg-white">
                <Mail className="ml-4 shrink-0 text-black" size={18} />
                <input
                  id="footer-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (submitState.type) {
                      setSubmitState({ type: "", message: "" });
                    }
                  }}
                  placeholder="Enter your email"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={submitState.type === "error"}
                  aria-describedby="footer-newsletter-feedback"
                  disabled={submitting}
                  className="w-full border-0 bg-transparent px-3 py-3.5 text-sm text-black outline-none placeholder:text-gray-500 disabled:cursor-not-allowed disabled:bg-gray-100"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {submitting ? "Subscribing..." : "Subscribe"}
              </button>

              {submitState.message ? (
                <div
                  id="footer-newsletter-feedback"
                  className={[
                    "mt-3 rounded-2xl px-4 py-3 text-sm",
                    submitState.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-red-200 bg-red-50 text-red-700",
                  ].join(" ")}
                >
                  {submitState.message}
                </div>
              ) : null}
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