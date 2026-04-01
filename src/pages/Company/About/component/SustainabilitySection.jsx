import { Leaf, Recycle, HandHeart, Globe2 } from "lucide-react";

function SustainabilitySection() {
  const items = [
    {
      icon: Leaf,
      title: "Better material choices",
      description:
        "Where possible, we look for options that are more practical and responsible over time.",
    },
    {
      icon: Recycle,
      title: "Smarter packaging",
      description:
        "We aim to keep packaging simple, useful, and easier to recycle where possible.",
    },
    {
      icon: HandHeart,
      title: "Responsible sourcing",
      description:
        "We care about working with suppliers who follow fair and responsible practices.",
    },
    {
      icon: Globe2,
      title: "Lower-impact operations",
      description:
        "We continue looking for ways to reduce waste and improve how products move through the business.",
    },
  ];

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Thoughtful choices behind the scenes
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            We know long-term trust is built not only through products and service,
            but also through how a business makes decisions behind the scenes.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[26px] border border-black/5 bg-gray-50 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-950">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default SustainabilitySection;