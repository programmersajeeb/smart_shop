import { HelpCircle, Briefcase, Newspaper } from "lucide-react";

function SupportCategories() {
  return (
    <section className="w-full py-16 md:py-24 bg-gray-50 border-y">
      <div className="container mx-auto px-6">

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
          Choose Your Support Category
        </h2>

        {/* Support Grid */}
        <div className="
          grid 
          grid-cols-1 
          md:grid-cols-3 
          gap-8
        ">

          {/* Customer Support */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <HelpCircle size={40} className="text-black mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Customer Support</h3>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              For order issues, refunds, payment help, or delivery questions.
            </p>
            <a
              href="mailto:support@smartshop.com"
              className="inline-block mt-4 text-blue-600 font-medium hover:underline"
            >
              Contact Customer Support →
            </a>
          </div>

          {/* Business Inquiries */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <Briefcase size={40} className="text-black mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Business Inquiries</h3>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              For partnerships, collaborations, bulk orders, and corporate deals.
            </p>
            <a
              href="mailto:business@smartshop.com"
              className="inline-block mt-4 text-blue-600 font-medium hover:underline"
            >
              Contact Business Team →
            </a>
          </div>

          {/* Media & Press */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <Newspaper size={40} className="text-black mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">Media & Press</h3>
            <p className="text-gray-600 text-sm mt-2 leading-relaxed">
              For media interviews, brand stories, and PR-related communication.
            </p>
            <a
              href="mailto:press@smartshop.com"
              className="inline-block mt-4 text-blue-600 font-medium hover:underline"
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
