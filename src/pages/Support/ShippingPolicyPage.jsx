import { Link } from "react-router-dom";
import {
  Truck,
  MapPinned,
  Clock3,
  PackageSearch,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";

const POLICY_CARDS = [
  {
    title: "Delivery timing",
    description:
      "Most orders are delivered within 2 to 7 business days depending on destination, courier coverage, and order processing volume.",
    icon: Clock3,
  },
  {
    title: "Shipping coverage",
    description:
      "Standard delivery is focused on Bangladesh unless a separate shipping arrangement is clearly stated for a specific order or campaign.",
    icon: MapPinned,
  },
  {
    title: "Tracking updates",
    description:
      "Once your order moves forward in processing, shipping-related updates may be reflected through order status and support communication.",
    icon: PackageSearch,
  },
];

const SHIPPING_NOTES = [
  "Processing time may vary during campaigns, holidays, or high-volume sales periods.",
  "Shipping fees, if applicable, may vary depending on item type, order size, and delivery location.",
  "A failed delivery attempt or incorrect address can delay dispatch or require support follow-up.",
  "For urgent order-related help, contacting support with the order reference is always recommended.",
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

export default function ShippingPolicyPage() {
  return (
    <div className="bg-white">
      <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
        <div className="site-shell">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              Delivery information
            </div>

            <h1 className="mt-5 text-3xl font-bold tracking-tight text-gray-950 md:text-5xl">
              Shipping policy
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              We aim to keep shipping clear, dependable, and easy to understand. This page
              covers delivery timing, shipping coverage, order tracking expectations, and
              helpful notes before you contact support.
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
            {POLICY_CARDS.map((item) => {
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
                  <p className="mt-2 text-sm leading-6 text-gray-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
        <div className="site-shell">
          <SectionTitle
            eyebrow="What to expect"
            title="A simple guide to delivery and shipping flow"
            description="Shipping timelines can vary depending on location, operational volume, and courier handling, but the general process remains straightforward."
          />

          <div className="mx-auto mt-10 max-w-5xl grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
                <ShieldCheck size={20} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-950">Order confirmation</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                After checkout, your order is recorded and moves into the normal review or
                processing queue.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
                <Truck size={20} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-950">Dispatch and movement</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                Once the order is ready, status updates can reflect its progress toward
                shipment and delivery.
              </p>
            </div>

            <div className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
                <PackageSearch size={20} />
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-950">Status review</h3>
              <p className="mt-2 text-sm leading-7 text-gray-600">
                You can review order status from the Track Order page using your order ID and
                phone number.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white py-16 md:py-24">
        <div className="site-shell">
          <SectionTitle
            eyebrow="Important notes"
            title="Things worth keeping in mind"
            description="These details help avoid confusion and set the right expectation before a support request is needed."
          />

          <div className="mx-auto mt-10 max-w-4xl rounded-[30px] border border-black/5 bg-gray-50 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8 md:p-10">
            <div className="space-y-4">
              {SHIPPING_NOTES.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border border-black/5 bg-white p-4"
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

      <section className="w-full border-t border-black/5 bg-white py-16 md:py-24">
        <div className="site-shell">
          <div className="rounded-[32px] border border-black/5 bg-gray-950 px-6 py-10 text-white shadow-[0_20px_50px_rgba(15,23,42,0.16)] sm:px-8 md:px-10">
            <div className="mx-auto max-w-3xl text-center">
              <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
                Delivery support
              </div>

              <h2 className="mt-5 text-2xl font-bold tracking-tight md:text-4xl">
                Need help with a delivery issue?
              </h2>

              <p className="mt-4 text-sm leading-7 text-white/75 md:text-[15px]">
                Use the Track Order page first. If something still looks unclear, contact us
                with your order reference so the support team can check it faster.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/track-order"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
                >
                  <PackageSearch size={18} />
                  Track order
                </Link>

                <Link
                  to="/contact"
                  className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <ArrowRight size={18} />
                  Contact support
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}