import { Users, ShoppingBag, HeartHandshake, CheckCircle2 } from "lucide-react";

function WhyChooseUs() {
  const items = [
    {
      icon: CheckCircle2,
      value: "4.9 / 5.0",
      label: "Average customer rating",
    },
    {
      icon: Users,
      value: "120K+",
      label: "Customers reached",
    },
    {
      icon: ShoppingBag,
      value: "350K+",
      label: "Orders completed",
    },
    {
      icon: HeartHandshake,
      value: "Fast support",
      label: "Helpful response when customers need it",
    },
  ];

  return (
    <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Why customers keep choosing us
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            We focus on the things shoppers care about most: clear product browsing,
            dependable service, and an experience that feels easy from start to finish.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-[26px] border border-black/5 bg-white p-6 text-center shadow-[0_12px_30px_rgba(15,23,42,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-black/5 bg-gray-50 text-gray-900">
                  <Icon size={20} />
                </div>

                <h3 className="mt-5 text-2xl font-bold tracking-tight text-gray-950">
                  {item.value}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-600">{item.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default WhyChooseUs;