import { Link } from "react-router-dom";
import {
  RotateCcw,
  ShieldCheck,
  Package,
  Wallet,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const ELIGIBILITY_ITEMS = [
  "The item should be unused, unwashed, and in a resale-ready condition unless the issue is damage or a delivery mistake.",
  "Original packaging, tags, accessories, and any included materials should be kept intact whenever possible.",
  "Return requests should be submitted within the approved return window mentioned for the order or product type.",
  "Proof of purchase, order reference, or the phone number used during checkout may be required for review.",
];

const NON_RETURNABLE_ITEMS = [
  "Personal care or hygiene-sensitive products after opening",
  "Custom, made-to-order, or specially arranged items",
  "Items damaged by misuse, mishandling, or unauthorized repair attempts",
  "Products marked as final sale where that condition was clearly stated",
];

const REFUND_POINTS = [
  {
    title: "Review and approval",
    text: "Once the request is submitted, our team reviews the order details and return reason before confirming the next step.",
    icon: ShieldCheck,
  },
  {
    title: "Pickup or return handoff",
    text: "Depending on the case, you may be asked to arrange a pickup, return the item, or share supporting details for validation.",
    icon: Package,
  },
  {
    title: "Refund processing",
    text: "Approved refunds are processed to the original payment method or the applicable refund channel within the normal processing window.",
    icon: Wallet,
  },
];

function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      {eyebrow ? (
        <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
          {eyebrow}
        </div>
      ) : null}

      <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
        {title}
      </h2>

      {description ? (
        <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">{description}</p>
      ) : null}
    </div>
  );
}

export default function ReturnRefundPage() {
  return (
    <div className="bg-white">
      <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
        <div className="site-shell">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              Support policy
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
              Return and refund policy
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              We want every order to feel reliable and worth your trust. If an item arrives
              damaged, incorrect, incomplete, or does not meet the expected condition,
              contact us and we will review the case carefully.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/contact"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
              >
                <MessageSquare size={18} />
                Request support
              </Link>

              <Link
                to="/track-order"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50"
              >
                <RotateCcw size={18} />
                Track order first
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-14 md:py-20">
        <div className="site-shell">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {REFUND_POINTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-[28px] border border-black/5 bg-gray-50 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                    <Icon size={20} />
                  </div>

                  <h2 className="mt-5 text-lg font-semibold text-gray-950">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
        <div className="site-shell">
          <SectionTitle
            eyebrow="Eligibility"
            title="When a return request is usually accepted"
            description="A request is easier to review when the item condition and supporting information are clear from the beginning."
          />

          <div className="mx-auto mt-10 max-w-4xl rounded-[30px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8 md:p-10">
            <div className="space-y-4">
              {ELIGIBILITY_ITEMS.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-black/5 bg-gray-50 p-4"
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-7 text-gray-600">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-16 md:py-24">
        <div className="site-shell">
          <SectionTitle
            eyebrow="Exceptions"
            title="Items that may not qualify for return"
            description="Some product types or conditions require extra caution, and not every item can be returned after delivery."
          />

          <div className="mx-auto mt-10 max-w-4xl grid grid-cols-1 gap-4 md:grid-cols-2">
            {NON_RETURNABLE_ITEMS.map((item, index) => (
              <div
                key={index}
                className="rounded-[24px] border border-red-100 bg-red-50 p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-red-200 bg-white text-red-700">
                    <AlertTriangle size={18} />
                  </div>

                  <p className="text-sm leading-7 text-gray-700">{item}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-4xl rounded-[24px] border border-black/5 bg-gray-50 p-5 text-sm leading-7 text-gray-600">
            If your case involves a wrong item, damaged delivery, or an order problem that
            needs review, contact support even if you are unsure whether the order qualifies.
            The team can confirm the next step after checking the details.
          </div>
        </div>
      </section>

      <section className="w-full border-t border-black/5 bg-white py-16 md:py-24">
        <div className="site-shell">
          <div className="rounded-[32px] border border-black/5 bg-gray-950 px-6 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:px-8 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
                Need help with a return?
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
                Contact support with your order reference
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/75 md:text-[15px]">
                Sharing your order reference, phone number, and a clear explanation of the
                issue helps the team review your request much faster.
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
                  to="/shipping-policy"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ArrowRight size={18} />
                  Review shipping policy
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}