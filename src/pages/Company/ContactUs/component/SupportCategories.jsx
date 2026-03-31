import { HelpCircle, Briefcase, Newspaper } from "lucide-react";

function SupportCategories() {
  return (
    <section className="w-full border-y bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Choose Your Support Category
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-8
            md:grid-cols-3
          "
        >
          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <HelpCircle size={40} className="mb-4 text-black" />
            <h3 className="text-xl font-semibold text-gray-900">Customer Support</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              For order issues, refunds, payment help, or delivery questions.
            </p>
            <a
              href="mailto:support@smartshop.com"
              className="mt-4 inline-block font-medium text-blue-600 hover:underline"
            >
              Contact Customer Support →
            </a>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <Briefcase size={40} className="mb-4 text-black" />
            <h3 className="text-xl font-semibold text-gray-900">Business Inquiries</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              For partnerships, collaborations, bulk orders, and corporate deals.
            </p>
            <a
              href="mailto:business@smartshop.com"
              className="mt-4 inline-block font-medium text-blue-600 hover:underline"
            >
              Contact Business Team →
            </a>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <Newspaper size={40} className="mb-4 text-black" />
            <h3 className="text-xl font-semibold text-gray-900">Media & Press</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              For media interviews, brand stories, and PR-related communication.
            </p>
            <a
              href="mailto:press@smartshop.com"
              className="mt-4 inline-block font-medium text-blue-600 hover:underline"
            >
              Contact PR Team →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SupportCategories;