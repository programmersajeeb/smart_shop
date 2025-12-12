import { CheckCircle2 } from "lucide-react";

function AchievementsTimeline() {
  const milestones = [
    {
      year: "2021",
      title: "Brand Launched",
      description:
        "Smart Shop began its journey with a vision to redefine modern online shopping.",
    },
    {
      year: "2022",
      title: "Reached 100K+ Customers",
      description:
        "Our customer base grew rapidly with exceptional service and premium products.",
    },
    {
      year: "2023",
      title: "Expanded Internationally",
      description:
        "We started shipping globally and introduced new product categories.",
    },
    {
      year: "2024",
      title: "AI-Powered Shopping Experience",
      description:
        "Smart Shop integrated AI to offer smarter recommendations and faster service.",
    },
    {
      year: "2025",
      title: "Award-Winning E-Commerce Brand",
      description:
        "Recognized as one of the fastest-growing online retail brands worldwide.",
    },
  ];

  return (
    <section className="w-full py-20 md:py-28 bg-gray-50 border-y">
      <div className="container mx-auto px-6">

        {/* Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-16">
          Our Achievements & Milestones
        </h2>

        {/* Timeline */}
        <div className="relative border-l-2 border-gray-300 ml-4 md:ml-8">

          {milestones.map((m, index) => (
            <div key={index} className="mb-12 ml-6">

              {/* Icon */}
              <div className="
                absolute -left-3 md:-left-4 w-8 h-8 
                bg-black text-white rounded-full 
                flex items-center justify-center
                shadow
              ">
                <CheckCircle2 size={16} />
              </div>

              {/* Content */}
              <h3 className="text-xl md:text-2xl font-semibold text-gray-900">
                {m.year}
              </h3>

              <h4 className="text-lg font-medium text-gray-800 mt-1">
                {m.title}
              </h4>

              <p className="text-gray-600 mt-2 leading-relaxed max-w-xl">
                {m.description}
              </p>
            </div>
          ))}

        </div>

      </div>
    </section>
  );
}

export default AchievementsTimeline;
