import { Mail, Phone } from "lucide-react";

const fallbackImage =
  "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "#") {
  const href = String(value || "").trim();
  return href || fallback;
}

function ContactHero({ data }) {
  const eyebrow = normalizeText(data?.eyebrow, "Contact us");
  const title = normalizeText(
    data?.title,
    "Need help? We are here to make things easier."
  );
  const description = normalizeText(
    data?.description,
    "Whether you have a question about an order, need support, or want to reach the right team, you can contact Smart Shop in the way that works best for you."
  );

  const image = normalizeText(data?.image, fallbackImage);

  const primaryLabel = normalizeText(data?.primaryLabel, "Email support");
  const primaryHref = normalizeHref(data?.primaryHref, "mailto:support@smartshop.com");

  const secondaryLabel = normalizeText(data?.secondaryLabel, "Call us");
  const secondaryHref = normalizeHref(data?.secondaryHref, "tel:+8801234567890");

  return (
    <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
      <div className="site-shell">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="rounded-[30px] border border-black/5 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-8 lg:p-10">
            <div className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              {eyebrow}
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-gray-950 md:text-5xl">
              {title}
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              {description}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={primaryHref}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Mail size={18} />
                {primaryLabel}
              </a>

              <a
                href={secondaryHref}
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Phone size={18} />
                {secondaryLabel}
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <img
              src={image}
              alt="Customer support workspace"
              className="h-[300px] w-full object-cover sm:h-[360px] lg:h-[440px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactHero;