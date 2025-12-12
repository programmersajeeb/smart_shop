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
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">

        {/* Section Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
          Frequently Asked Questions
        </h2>

        {/* FAQ LIST */}
        <div className="max-w-3xl mx-auto space-y-4">

          {faqs.map((item, index) => (
            <div
              key={index}
              className="bg-gray-50 border rounded-xl p-5 cursor-pointer hover:shadow transition"
              onClick={() => toggleFAQ(index)}
            >
              {/* Question Row */}
              <div className="flex justify-between items-center">
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

              {/* Answer */}
              {active === index && (
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
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
