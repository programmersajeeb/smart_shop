import { ShieldCheck, Truck, BadgeCheck, HeartHandshake } from "lucide-react";

function CoreValues() {
  const values = [
    {
      icon: HeartHandshake,
      title: "Customer First",
      description:
        "We try to make decisions that remove friction and make shopping easier for real people.",
    },
    {
      icon: ShieldCheck,
      title: "Reliable Quality",
      description:
        "We care about product standards, clear presentation, and building trust over time.",
    },
    {
      icon: Truck,
      title: "Fast Fulfillment",
      description:
        "From checkout to delivery, we focus on keeping the process smooth and dependable.",
    },
    {
      icon: BadgeCheck,
      title: "Clear Policies",
      description:
        "Simple pricing, straightforward communication, and honest service matter to us.",
    },
  ];

  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            What matters to us
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            These are the values we come back to when we think about products,
            service, and the overall customer experience.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {values.map((value) => {
            const Icon = value.icon;

            return (
              <div
                key={value.title}
                className="rounded-[26px] border border-black/5 bg-gray-50 p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-white text-gray-900">
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-xl font-semibold text-gray-950">
                  {value.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-600">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CoreValues;