import { Leaf, Recycle, Globe2, HandHeart } from "lucide-react";

function SustainabilitySection() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell text-center">
        <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
          Sustainability & Ethical Commitment
        </h2>

        <p className="mx-auto mb-14 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
          At Smart Shop, we believe in building a future where fashion and sustainability
          go hand in hand. Every step we take is guided by responsible choices, ethical
          sourcing, and a strong commitment to protecting our planet.
        </p>

        <div
          className="
            grid
            grid-cols-1
            gap-10
            sm:grid-cols-2
            md:grid-cols-4
            md:gap-12
          "
        >
          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <Leaf size={42} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Eco-Friendly Materials
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              We prioritize sustainable fabrics and environmentally conscious materials
              for a better planet.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <Recycle size={42} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Recyclable Packaging
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              All our packaging is designed to be fully recyclable and minimally
              impactful on the environment.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <HandHeart size={42} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Ethical Sourcing
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              We partner only with responsible suppliers who follow fair labor
              standards and humane working conditions.
            </p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 transition hover:shadow-md">
            <Globe2 size={42} className="mx-auto mb-4 text-green-600" />
            <h3 className="text-xl font-semibold text-gray-900">
              Carbon Footprint Reduction
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
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