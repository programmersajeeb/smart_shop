import { Link } from "react-router-dom";
import { HelpCircle, Briefcase, Newspaper, ArrowRight } from "lucide-react";

function SupportCategories() {
  const categories = [
    {
      icon: HelpCircle,
      title: "Customer support",
      description:
        "For help with orders, refunds, payments, returns, or delivery updates.",
      href: "mailto:support@smartshop.com",
      label: "Contact support",
    },
    {
      icon: Briefcase,
      title: "Business inquiries",
      description:
        "For partnerships, collaborations, bulk purchases, or other business requests.",
      href: "mailto:business@smartshop.com",
      label: "Contact business team",
    },
    {
      icon: Newspaper,
      title: "Media and press",
      description:
        "For interviews, brand-related questions, or press communication.",
      href: "mailto:press@smartshop.com",
      label: "Contact press team",
    },
  ];

  return (
    <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Choose the right team
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            Reaching the right team first usually means a faster and more helpful reply.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {categories.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-950">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {item.description}
                </p>

                <a
                  href={item.href}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900 transition hover:text-black"
                >
                  {item.label}
                  <ArrowRight size={16} />
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
          >
            View help resources
          </Link>
        </div>
      </div>
    </section>
  );
}

export default SupportCategories;