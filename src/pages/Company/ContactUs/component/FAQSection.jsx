import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

function FAQSection({ data }) {
  const faqs = useMemo(() => {
    if (Array.isArray(data?.items) && data.items.length) {
      return data.items.map((item, index) => ({
        q: normalizeText(item?.q, `Question ${index + 1}`),
        a: normalizeText(item?.a),
      }));
    }

    return [
      {
        q: "How can I track my order?",
        a: "Once your order is shipped, we send a tracking update by email or SMS. You can also check your order status from your account.",
      },
      {
        q: "What is your return policy?",
        a: "Unused items in their original condition can usually be returned within 7 days. Refund timing may vary depending on the payment method.",
      },
      {
        q: "How do I contact customer support?",
        a: "You can email us at support@smartshop.com or call +880 1234-567890 during support hours.",
      },
      {
        q: "Do you offer international shipping?",
        a: "Yes, international shipping is available in selected cases. Delivery time depends on the destination and shipping option.",
      },
      {
        q: "Can I modify or cancel my order?",
        a: "If your order has not moved into processing yet, our team may still be able to help. Contact support as soon as possible.",
      },
    ];
  }, [data]);

  const title = normalizeText(data?.title, "Frequently asked questions");
  const subtitle = normalizeText(
    data?.subtitle,
    "A few common questions customers usually ask before reaching out."
  );

  const [active, setActive] = useState(0);

  function toggleFAQ(index) {
    setActive((prev) => (prev === index ? null : index));
  }

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            {title}
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            {subtitle}
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-4">
          {faqs.map((item, index) => {
            const isOpen = active === index;

            return (
              <div
                key={`${item.q}-${index}`}
                className="overflow-hidden rounded-[24px] border border-black/5 bg-gray-50 shadow-[0_10px_24px_rgba(15,23,42,0.03)]"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
                  aria-expanded={isOpen}
                >
                  <span className="text-base font-semibold text-gray-950 sm:text-lg">
                    {item.q}
                  </span>

                  <ChevronDown
                    size={20}
                    className={`shrink-0 text-gray-500 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen ? (
                  <div className="border-t border-black/5 px-5 py-4 sm:px-6">
                    <p className="text-sm leading-7 text-gray-600">{item.a}</p>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default FAQSection;