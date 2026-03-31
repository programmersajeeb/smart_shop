import { Target, Eye } from "lucide-react";

function MissionVision() {
  return (
    <section className="w-full border-y bg-gray-50 py-20 md:py-28">
      <div className="site-shell text-center">
        <h2 className="mb-12 text-3xl font-bold text-gray-900 md:text-4xl">
          Our Mission & Vision
        </h2>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-16">
          <div className="rounded-2xl border bg-white p-10 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <Target size={36} className="text-black" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Our Mission
            </h3>

            <p className="mx-auto mt-4 max-w-md leading-relaxed text-gray-600">
              To create a seamless shopping experience that blends premium quality,
              modern design, and fast delivery—ensuring every customer feels valued,
              confident, and satisfied.
            </p>
          </div>

          <div className="rounded-2xl border bg-white p-10 shadow-sm transition hover:shadow-md">
            <div className="mb-4 flex justify-center">
              <Eye size={36} className="text-black" />
            </div>

            <h3 className="text-xl font-semibold text-gray-900 md:text-2xl">
              Our Vision
            </h3>

            <p className="mx-auto mt-4 max-w-md leading-relaxed text-gray-600">
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