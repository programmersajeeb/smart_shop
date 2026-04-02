import { Link } from "react-router-dom";
import { HelpCircle, Briefcase, Newspaper, ArrowRight } from "lucide-react";

const ICONS = [HelpCircle, Briefcase, Newspaper];

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function isInternalPath(value) {
  const href = String(value || "").trim();
  return href.startsWith("/");
}

function resolveHref(value, fallback = "#") {
  const href = String(value || "").trim();
  return href || fallback;
}

function SupportCategories({ data }) {
  const title = normalizeText(data?.title, "Choose the right team");
  const subtitle = normalizeText(
    data?.subtitle,
    "Reaching the right team first usually means a faster and more helpful reply."
  );

  const categories = Array.isArray(data?.items) && data.items.length
    ? data.items
    : [
        {
          title: "Customer support",
          description:
            "For help with orders, refunds, payments, returns, or delivery updates.",
          href: "mailto:support@smartshop.com",
          label: "Contact support",
        },
        {
          title: "Business inquiries",
          description:
            "For partnerships, collaborations, bulk purchases, or other business requests.",
          href: "mailto:business@smartshop.com",
          label: "Contact business team",
        },
        {
          title: "Media and press",
          description:
            "For interviews, brand-related questions, or press communication.",
          href: "mailto:press@smartshop.com",
          label: "Contact press team",
        },
      ];

  const resourceButtonLabel = normalizeText(
    data?.resourceButtonLabel,
    "View help resources"
  );
  const resourceButtonHref = resolveHref(data?.resourceButtonHref, "/faq");

  return (
    <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            {title}
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            {subtitle}
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {categories.map((item, index) => {
            const Icon = ICONS[index] || HelpCircle;
            const itemTitle = normalizeText(item?.title, `Category ${index + 1}`);
            const itemDescription = normalizeText(item?.description);
            const itemHref = resolveHref(item?.href);
            const itemLabel = normalizeText(item?.label, "Open");

            return (
              <div
                key={`${itemTitle}-${index}`}
                className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-950">
                  {itemTitle}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {itemDescription}
                </p>

                {isInternalPath(itemHref) ? (
                  <Link
                    to={itemHref}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-black"
                  >
                    {itemLabel}
                    <ArrowRight size={16} />
                  </Link>
                ) : (
                  <a
                    href={itemHref}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-black"
                  >
                    {itemLabel}
                    <ArrowRight size={16} />
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          {isInternalPath(resourceButtonHref) ? (
            <Link
              to={resourceButtonHref}
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              {resourceButtonLabel}
            </Link>
          ) : (
            <a
              href={resourceButtonHref}
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
            >
              {resourceButtonLabel}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default SupportCategories;