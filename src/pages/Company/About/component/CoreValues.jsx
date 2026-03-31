import { ShieldCheck, Truck, BadgeCheck, HeartHandshake } from "lucide-react";

function CoreValues() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell text-center">
        <h2 className="mb-12 text-3xl font-bold text-gray-900 md:text-4xl">
          Our Core Values
        </h2>

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
          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <HeartHandshake size={40} className="text-black" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Customer First
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Every decision we make is focused on delivering the best for our customers.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <ShieldCheck size={40} className="text-black" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Trusted Quality
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              We ensure premium, reliable products that meet high international standards.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <Truck size={40} className="text-black" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Fast Delivery
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Quick and secure shipping so your products reach you on time.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <BadgeCheck size={40} className="text-black" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900">
              Transparent Business
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Honest pricing, clear policies, and a commitment to fairness.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CoreValues;