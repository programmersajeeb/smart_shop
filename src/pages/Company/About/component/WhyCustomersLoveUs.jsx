import { Star, Users, ShoppingBag, HeartHandshake } from "lucide-react";

function WhyCustomersLoveUs() {
  return (
    <section className="w-full py-20 md:py-28 bg-gray-50 border-y">
      <div className="container mx-auto px-6 text-center">

        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Why Customers Love Us
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg mb-14 leading-relaxed">
          Thousands of customers trust Smart Shop every day — because we deliver quality, 
          reliability, and a premium shopping experience without compromise.
        </p>

        {/* Stats Grid */}
        <div className="
          grid 
          grid-cols-1 
          sm:grid-cols-2 
          md:grid-cols-4 
          gap-8 
          md:gap-12
        ">
          
          {/* Rating */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <Star size={42} className="text-yellow-500" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">4.9 / 5.0</h3>
            <p className="text-gray-600 mt-2 text-sm">Average Customer Rating</p>
          </div>

          {/* Customers */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <Users size={42} className="text-black" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">120K+</h3>
            <p className="text-gray-600 mt-2 text-sm">Happy Customers Worldwide</p>
          </div>

          {/* Orders */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <ShoppingBag size={42} className="text-black" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">350K+</h3>
            <p className="text-gray-600 mt-2 text-sm">Orders Successfully Delivered</p>
          </div>

          {/* Service Quality */}
          <div className="bg-white p-8 rounded-2xl border shadow-sm hover:shadow-md transition">
            <div className="flex justify-center mb-4">
              <HeartHandshake size={42} className="text-black" />
            </div>

            <h3 className="text-2xl font-bold text-gray-900">Top-Rated Support</h3>
            <p className="text-gray-600 mt-2 text-sm">Fast & Friendly Customer Service</p>
          </div>

        </div>

      </div>
    </section>
  );
}

export default WhyCustomersLoveUs;
