import { ShieldCheck, Truck, BadgeCheck, HeartHandshake } from "lucide-react";

function CoreValues() {
  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 text-center">

        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          Our Core Values
        </h2>

        {/* Values Grid */}
        <div className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-4 
          gap-8 
          md:gap-12
        ">

          {/* Value 1 */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <HeartHandshake size={40} className="text-black" />
            </div>
            <h3 className="font-semibold text-xl text-gray-900">
              Customer First
            </h3>
            <p className="text-gray-600 text-sm mt-3">
              Every decision we make is focused on delivering the best for our customers.
            </p>
          </div>

          {/* Value 2 */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <ShieldCheck size={40} className="text-black" />
            </div>
            <h3 className="font-semibold text-xl text-gray-900">
              Trusted Quality
            </h3>
            <p className="text-gray-600 text-sm mt-3">
              We ensure premium, reliable products that meet high international standards.
            </p>
          </div>

          {/* Value 3 */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <Truck size={40} className="text-black" />
            </div>
            <h3 className="font-semibold text-xl text-gray-900">
              Fast Delivery
            </h3>
            <p className="text-gray-600 text-sm mt-3">
              Quick and secure shipping so your products reach you on time.
            </p>
          </div>

          {/* Value 4 */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <BadgeCheck size={40} className="text-black" />
            </div>
            <h3 className="font-semibold text-xl text-gray-900">
              Transparent Business
            </h3>
            <p className="text-gray-600 text-sm mt-3">
              Honest pricing, clear policies, and a commitment to fairness.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default CoreValues;
