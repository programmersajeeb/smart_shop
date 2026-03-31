function WhyChooseUs({ data, loading, error }) {
  const fallbackItems = [
    {
      id: "delivery",
      icon: "🚚",
      title: "Fast Delivery",
      description: "Quick and reliable delivery straight to your doorstep.",
    },
    {
      id: "payments",
      icon: "💳",
      title: "Secure Payments",
      description: "Your transactions are encrypted for maximum safety.",
    },
    {
      id: "returns",
      icon: "🔄",
      title: "Easy Returns",
      description: "Hassle-free 30-day return and exchange policy.",
    },
    {
      id: "quality",
      icon: "⭐",
      title: "Premium Quality",
      description: "Only the highest-quality products curated for you.",
    },
  ];

  const items =
    Array.isArray(data?.items) && data.items.length > 0
      ? data.items.slice(0, 4).map((item, index) => ({
          id: item?.id || `why-${index + 1}`,
          icon:
            item?.icon ||
            fallbackItems[index % fallbackItems.length]?.icon ||
            "✓",
          title: item?.title || "Why choose us",
          description: item?.description || item?.desc || "",
        }))
      : fallbackItems;

  const title = data?.title || "Why Choose Us";
  const subtitle =
    data?.subtitle ||
    "Clear trust signals that help customers feel confident about shopping, checkout, and fulfillment.";

  return (
    <section
      className="site-shell py-10 sm:py-12 md:py-14 lg:py-16"
      aria-label="Why choose us"
    >
      <div className="mb-8 text-center sm:mb-10 md:mb-12">
        <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl md:text-4xl">
          {title}
        </h2>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
          {subtitle}
        </p>
      </div>

      {!loading && error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load trust highlights
          {error?.message ? ` (${error.message})` : ""}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:gap-6 xl:grid-cols-4">
        {items.map((item, i) => (
          <article
            key={item?.id || i}
            className="group h-full rounded-[22px] border border-black/5 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md sm:rounded-[24px] sm:p-6 lg:rounded-[28px] lg:p-7"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100 text-xl transition group-hover:bg-black group-hover:text-white sm:mb-5 sm:h-14 sm:w-14 sm:text-2xl">
              {item?.icon}
            </div>

            <h3 className="text-lg font-semibold leading-7 text-gray-950 sm:text-xl">
              {item?.title}
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              {item?.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default WhyChooseUs;