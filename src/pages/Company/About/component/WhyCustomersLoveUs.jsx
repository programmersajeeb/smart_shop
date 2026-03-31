import { Star, Users, ShoppingBag, HeartHandshake } from "lucide-react";

function WhyCustomersLoveUs() {
  return (
    <section className="w-full border-y bg-gray-50 py-20 md:py-28">
      <div className="site-shell text-center">
        <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
          Why Customers Love Us
        </h2>

        <p className="mx-auto mb-14 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
          Thousands of customers trust Smart Shop every day — because we deliver quality,
          reliability, and a premium shopping experience without compromise.
        </p>

        <div
          className="
            grid
            grid-cols-1
            gap-8
            sm:grid-cols-2
            md:grid-cols-4
            md:gap-12
          "
        >
          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <Star size={42} className="text-yellow-500" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">4.9 / 5.0</h3>
            <p className="mt-2 text-sm text-gray-600">Average Customer Rating</p>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <Users size={42} className="text-black" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">120K+</h3>
            <p className="mt-2 text-sm text-gray-600">Happy Customers Worldwide</p>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <ShoppingBag size={42} className="text-black" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">350K+</h3>
            <p className="mt-2 text-sm text-gray-600">Orders Successfully Delivered</p>
          </div>

          <div className="rounded-2xl border bg-white p-8 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <HeartHandshake size={42} className="text-black" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">Top-Rated Support</h3>
            <p className="mt-2 text-sm text-gray-600">Fast & Friendly Customer Service</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyCustomersLoveUs;