import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  HelpCircle,
  PackageSearch,
  RotateCcw,
  Truck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const DEFAULT_FAQS = [
  {
    q: "How can I track my order after placing it?",
    a: "You can track your order from the Track Order page using your order ID and the phone number used during checkout. If you signed in before placing the order, you can also review your order details from your account.",
  },
  {
    q: "How long does delivery usually take?",
    a: "Most deliveries are completed within 2 to 7 business days, depending on your delivery location, order volume, and courier coverage in your area.",
  },
  {
    q: "Can I cancel or change my order?",
    a: "If your order has not moved into processing or shipping yet, our team may still be able to help. Contact support as early as possible with your order reference.",
  },
  {
    q: "What payment methods do you accept?",
    a: "Available payment methods may include cash on delivery, card payments, and supported digital payment options depending on checkout availability.",
  },
  {
    q: "When am I eligible for a return or refund?",
    a: "Unused items in their original condition may be eligible for return within the approved return window. Damaged, wrong, or incomplete deliveries should be reported as soon as possible for faster support.",
  },
  {
    q: "Do I need an order reference when contacting support?",
    a: "For delivery issues, returns, refunds, payment problems, or order-related requests, sharing your order reference helps the support team review your request much faster.",
  },
  {
    q: "What should I do if I received the wrong or damaged item?",
    a: "Please contact us as soon as possible through the Contact Us page and include your order reference, a clear explanation of the issue, and any helpful photos if available.",
  },
  {
    q: "Do you ship outside Bangladesh?",
    a: "At the moment, standard shipping is focused on Bangladesh unless a separate arrangement is clearly stated for a specific order or campaign.",
  },
];

const QUICK_LINKS = [
  {
    title: "Track your order",
    description: "Check the current order status using your order ID and phone number.",
    to: "/track-order",
    icon: PackageSearch,
  },
  {
    title: "Return and refund help",
    description: "Review return conditions, refund timing, and the next steps.",
    to: "/returns",
    icon: RotateCcw,
  },
  {
    title: "Shipping policy",
    description: "Read delivery timing, shipping coverage, and important notes.",
    to: "/shipping-policy",
    icon: Truck,
  },
];

function normalizeText(value, fallback = "") {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text || fallback;
}

export default function FAQPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  const faqs = useMemo(
    () =>
      DEFAULT_FAQS.map((item, index) => ({
        q: normalizeText(item?.q, `Question ${index + 1}`),
        a: normalizeText(item?.a),
      })),
    []
  );

  function toggle(index) {
    setActiveIndex((prev) => (prev === index ? null : index));
  }

  return (
    <div className="bg-white">
      <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
        <div className="site-shell">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              Support center
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
              Frequently asked questions
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              Find quick answers to the most common questions about orders, delivery,
              returns, payments, and customer support before reaching out to the team.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/track-order"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                <PackageSearch size={18} />
                Track order
              </Link>

              <Link
                to="/contact"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                <MessageSquare size={18} />
                Contact support
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-14 md:py-20">
        <div className="site-shell">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  className="rounded-[28px] border border-black/5 bg-gray-50 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                    <Icon size={20} />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-gray-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-gray-900">
                    Open page
                    <ArrowRight size={16} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
        <div className="site-shell">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
              <HelpCircle size={20} />
            </div>

            <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
              Answers that help you move faster
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
              These are the questions customers ask most often when they need help with an
              order, a delivery update, or a return request.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-4xl space-y-4">
            {faqs.map((item, index) => {
              const isOpen = activeIndex === index;

              return (
                <div
                  key={`${item.q}-${index}`}
                  className="overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.03)]"
                >
                  <button
                    type="button"
                    onClick={() => toggle(index)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left sm:px-6"
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
                    <div
                      id={`faq-answer-${index}`}
                      className="border-t border-black/5 px-5 py-4 sm:px-6"
                    >
                      <p className="text-sm leading-7 text-gray-600">{item.a}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-16 md:py-24">
        <div className="site-shell">
          <div className="rounded-[32px] border border-black/5 bg-gray-950 px-6 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:px-8 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
                Still need help?
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
                We are here when you need personal support
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/75 md:text-[15px]">
                If your question is specific to an order, refund, payment issue, or delivery
                problem, contact us with your order reference so the team can review it
                faster.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
                >
                  <MessageSquare size={18} />
                  Contact us
                </Link>

                <Link
                  to="/returns"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <RotateCcw size={18} />
                  View return policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}