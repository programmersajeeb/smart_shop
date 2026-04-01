function AchievementsTimeline() {
  const milestones = [
    {
      year: "2021",
      title: "Smart Shop launched",
      description:
        "We started with a small product range and a clear focus on making shopping simpler.",
    },
    {
      year: "2022",
      title: "Customer base grew",
      description:
        "More customers began returning for the smoother experience, product mix, and support.",
    },
    {
      year: "2023",
      title: "More categories added",
      description:
        "We expanded the catalog and improved browsing so customers could find products faster.",
    },
    {
      year: "2024",
      title: "Store experience improved",
      description:
        "We refined site performance, product discovery, and service workflows across the store.",
    },
    {
      year: "2025",
      title: "Operations scaled further",
      description:
        "The team, product range, and delivery flow continued to grow with the business.",
    },
  ];

  return (
    <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Milestones along the way
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            A few of the moments that helped shape where the brand is today.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <div className="relative border-l border-gray-300 pl-6 sm:pl-8">
            {milestones.map((item) => (
              <div key={item.year} className="relative pb-10 last:pb-0">
                <div className="absolute -left-[33px] top-1 h-4 w-4 rounded-full border border-black/10 bg-white sm:-left-[41px]" />

                <div className="rounded-[24px] border border-black/5 bg-white p-5 shadow-[0_12px_28px_rgba(15,23,42,0.04)] sm:p-6">
                  <div className="text-sm font-semibold uppercase tracking-[0.14em] text-gray-400">
                    {item.year}
                  </div>

                  <h3 className="mt-2 text-xl font-semibold text-gray-950">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default AchievementsTimeline;