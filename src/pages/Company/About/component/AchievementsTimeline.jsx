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
    <section className="w-full border-y bg-gray-50 py-20 md:py-28">
      <div className="site-shell">
        <h2 className="mb-16 text-center text-3xl font-bold text-gray-900 md:text-4xl">
          Our Achievements & Milestones
        </h2>

        <div className="relative ml-4 border-l-2 border-gray-300 md:ml-8">
          {milestones.map((m, index) => (
            <div key={index} className="mb-12 ml-6">
              <div
                className="
                  absolute -left-3 md:-left-4 h-8 w-8
                  rounded-full bg-black text-white
                  flex items-center justify-center
                  shadow
                "
              >
                <CheckCircle2 size={16} />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 md:text-2xl">
                {m.year}
              </h3>

              <h4 className="mt-1 text-lg font-medium text-gray-800">
                {m.title}
              </h4>

              <p className="mt-2 max-w-xl leading-relaxed text-gray-600">
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