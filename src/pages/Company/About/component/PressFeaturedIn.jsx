function PressFeaturedIn() {
  return (
    <section className="w-full border-y bg-gray-50 py-20 md:py-28">
      <div className="site-shell text-center">
        <h2 className="mb-6 text-3xl font-bold text-gray-900 md:text-4xl">
          Featured In
        </h2>

        <p className="mx-auto mb-12 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
          Smart Shop has been highlighted by leading publications and media platforms
          for innovation, customer experience, and brand excellence.
        </p>

        <div
          className="
            grid
            grid-cols-2
            items-center
            gap-10
            sm:grid-cols-3
            md:grid-cols-5
          "
        >
          <img
            src="https://cdn.freebiesupply.com/logos/large/2x/forbes-logo-png-transparent.png"
            alt="Forbes"
            className="mx-auto w-28 opacity-70 transition hover:opacity-100"
          />

          <img
            src="https://cdn.freebiesupply.com/logos/large/2x/vogue-logo-png-transparent.png"
            alt="Vogue"
            className="mx-auto w-28 opacity-70 transition hover:opacity-100"
          />

          <img
            src="https://cdn.freebiesupply.com/logos/large/2x/techcrunch-logo-png-transparent.png"
            alt="TechCrunch"
            className="mx-auto w-28 opacity-70 transition hover:opacity-100"
          />

          <img
            src="https://cdn.freebiesupply.com/logos/large/2x/bbc-logo-png-transparent.png"
            alt="BBC"
            className="mx-auto w-24 opacity-70 transition hover:opacity-100"
          />

          <img
            src="https://cdn.freebiesupply.com/logos/large/2x/guardian-logo-png-transparent.png"
            alt="The Guardian"
            className="mx-auto w-28 opacity-70 transition hover:opacity-100"
          />
        </div>
      </div>
    </section>
  );
}

export default PressFeaturedIn;