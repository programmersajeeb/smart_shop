import { useState } from "react";
import { ChevronDown } from "lucide-react";

function FAQSection() {
  const faqs = [
    {
      q: "How can I track my order?",
      a: "Once your order is shipped, you will receive a tracking link via email and SMS. You can also track your order from your account dashboard."
    },
    {
      q: "What is the return and refund policy?",
      a: "We offer a 7-day return and refund policy for unused items with original packaging. Refunds are processed within 3–5 business days."
    },
    {
      q: "How do I contact customer support?",
      a: "You can contact us at support@smartshop.com or call our hotline at +880 1234-567890 from Sat–Thu, 9 AM–10 PM."
    },
    {
      q: "Do you offer international shipping?",
      a: "Yes, we ship globally. Shipping time varies based on destination, typically 5–12 business days."
    },
    {
      q: "Can I modify or cancel my order?",
      a: "Orders can be cancelled or modified within the first 30 minutes after placing them. After that, processing begins."
    }
  ];

  const [active, setActive] = useState(null);

  const toggleFAQ = (index) => {
    setActive(active === index ? null : index);
  };

  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Frequently Asked Questions
        </h2>

        <div className="mx-auto max-w-3xl space-y-4">
          {faqs.map((item, index) => (
            <div
              key={index}
              className="cursor-pointer rounded-xl border bg-gray-50 p-5 transition hover:shadow"
              onClick={() => toggleFAQ(index)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {item.q}
                </h3>

                <ChevronDown
                  size={22}
                  className={`transition-transform ${
                    active === index ? "rotate-180" : ""
                  }`}
                />
              </div>

              {active === index && (
                <p className="mt-3 text-sm leading-relaxed text-gray-600">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;