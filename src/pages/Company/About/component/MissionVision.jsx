import { Target, Eye } from "lucide-react";

function MissionVision() {
  return (
    <section className="w-full py-20 md:py-28 bg-gray-50 border-y">
      <div className="container mx-auto px-6 text-center">

        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12">
          Our Mission & Vision
        </h2>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16">

          {/* Mission */}
          <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-md transition border">
            <div className="flex justify-center mb-4">
              <Target size={36} className="text-black" />
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
              Our Mission
            </h3>

            <p className="mt-4 text-gray-600 leading-relaxed max-w-md mx-auto">
              To create a seamless shopping experience that blends premium quality,
              modern design, and fast delivery—ensuring every customer feels valued,
              confident, and satisfied.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white p-10 rounded-2xl shadow-sm hover:shadow-md transition border">
            <div className="flex justify-center mb-4">
              <Eye size={36} className="text-black" />
            </div>

            <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
              Our Vision
            </h3>

            <p className="mt-4 text-gray-600 leading-relaxed max-w-md mx-auto">
              To become a globally recognized brand that transforms the way people
              shop online—through innovation, sustainability, and world-class customer
              experience.
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default MissionVision;
