import { Link } from "react-router-dom";
import { Mail, MessageCircle } from "lucide-react";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function normalizeHref(value, fallback = "") {
  const href = String(value || "").trim();
  return href || fallback;
}

function isInternalHref(value) {
  const href = String(value || "").trim();
  return href.startsWith("/");
}

function FinalContactCTA({ data }) {
  const eyebrow = normalizeText(data?.eyebrow, "Need more help?");
  const title = normalizeText(
    data?.title,
    "We are ready to help you with the next step."
  );
  const description = normalizeText(
    data?.description,
    "Reach out if you still need support, have a question about your order, or want help from the team directly."
  );

  const primaryLabel = normalizeText(data?.primaryLabel, "Live chat support");
  const primaryHref = normalizeHref(data?.primaryHref, "");

  const secondaryLabel = normalizeText(data?.secondaryLabel, "Email us");
  const secondaryHref = normalizeHref(
    data?.secondaryHref,
    "mailto:support@smartshop.com"
  );

  const renderPrimaryAction = () => {
    if (!primaryHref) {
      return (
        <button
          type="button"
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
        >
          <MessageCircle size={18} />
          {primaryLabel}
        </button>
      );
    }

    if (isInternalHref(primaryHref)) {
      return (
        <Link
          to={primaryHref}
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
        >
          <MessageCircle size={18} />
          {primaryLabel}
        </Link>
      );
    }

    return (
      <a
        href={primaryHref}
        className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
      >
        <MessageCircle size={18} />
        {primaryLabel}
      </a>
    );
  };

  const renderSecondaryAction = () => {
    if (isInternalHref(secondaryHref)) {
      return (
        <Link
          to={secondaryHref}
          className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
        >
          <Mail size={18} />
          {secondaryLabel}
        </Link>
      );
    }

    return (
      <a
        href={secondaryHref}
        className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
      >
        <Mail size={18} />
        {secondaryLabel}
      </a>
    );
  };

  return (
    <section className="w-full bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#1f2937_100%)] py-20 text-white md:py-28">
      <div className="site-shell">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur sm:p-10 md:p-12">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
            {eyebrow}
          </div>

          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            {title}
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 md:text-[15px]">
            {description}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {renderPrimaryAction()}
            {renderSecondaryAction()}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalContactCTA;