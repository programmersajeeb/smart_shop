import { Leaf, Recycle, Globe2, HandHeart } from "lucide-react";

function SustainabilitySection() {
  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 text-center">

        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Sustainability & Ethical Commitment
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg mb-14 leading-relaxed">
          At Smart Shop, we believe in building a future where fashion and sustainability 
          go hand in hand. Every step we take is guided by responsible choices, ethical 
          sourcing, and a strong commitment to protecting our planet.
        </p>

        {/* Grid */}
        <div
          className="
            grid 
            grid-cols-1 
            sm:grid-cols-2 
            md:grid-cols-4 
            gap-10 md:gap-12
          "
        >

          {/* Eco Friendly Materials */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <Leaf size={42} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">
              Eco-Friendly Materials
            </h3>
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">
              We prioritize sustainable fabrics and environmentally conscious materials 
              for a better planet.
            </p>
          </div>

          {/* Recyclable Packaging */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <Recycle size={42} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">
              Recyclable Packaging
            </h3>
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">
              All our packaging is designed to be fully recyclable and minimally 
              impactful on the environment.
            </p>
          </div>

          {/* Ethical Sourcing */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <HandHeart size={42} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">
              Ethical Sourcing
            </h3>
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">
              We partner only with responsible suppliers who follow fair labor 
              standards and humane working conditions.
            </p>
          </div>

          {/* Carbon Reduction */}
          <div className="bg-gray-50 p-8 rounded-2xl border hover:shadow-md transition">
            <Globe2 size={42} className="text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900">
              Carbon Footprint Reduction
            </h3>
            <p className="text-gray-600 text-sm mt-3 leading-relaxed">
              Our logistics and sourcing strategies are optimized to minimize carbon 
              emissions and environmental harm.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default SustainabilitySection;
