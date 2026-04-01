function MissionVision() {
  const items = [
    {
      title: "Our Mission",
      text: "Make online shopping easier to trust, easier to use, and easier to enjoy through better service, better product presentation, and a smoother experience from start to finish.",
    },
    {
      title: "Our Vision",
      text: "Build a shopping brand people come back to because it feels clear, reliable, and genuinely useful in everyday life.",
    },
  ];

  return (
    <section className="w-full border-y border-black/5 bg-gray-50 py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Mission and Vision
          </h2>
          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            The way we build, improve, and serve customers is guided by a simple
            long-term direction.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8"
            >
              <div className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
                {item.title}
              </div>

              <p className="mt-5 text-sm leading-7 text-gray-600 md:text-[15px]">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default MissionVision;