function PressFeaturedIn() {
  return (
    <section className="w-full py-20 md:py-28 bg-gray-50 border-y">
      <div className="container mx-auto px-6 text-center">

        {/* Section Title */}
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
          Featured In
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto text-base md:text-lg mb-12 leading-relaxed">
          Smart Shop has been highlighted by leading publications and media platforms 
          for innovation, customer experience, and brand excellence.
        </p>

        {/* Logo Grid */}
        <div className="
          grid 
          grid-cols-2 
          sm:grid-cols-3 
          md:grid-cols-5 
          gap-10 
          items-center
        ">

          {/* Logo 1 */}
          <img 
            src="https://cdn.freebiesupply.com/logos/large/2x/forbes-logo-png-transparent.png"
            alt="Forbes"
            className="w-28 mx-auto opacity-70 hover:opacity-100 transition"
          />

          {/* Logo 2 */}
          <img 
            src="https://cdn.freebiesupply.com/logos/large/2x/vogue-logo-png-transparent.png"
            alt="Vogue"
            className="w-28 mx-auto opacity-70 hover:opacity-100 transition"
          />

          {/* Logo 3 */}
          <img 
            src="https://cdn.freebiesupply.com/logos/large/2x/techcrunch-logo-png-transparent.png"
            alt="TechCrunch"
            className="w-28 mx-auto opacity-70 hover:opacity-100 transition"
          />

          {/* Logo 4 */}
          <img 
            src="https://cdn.freebiesupply.com/logos/large/2x/bbc-logo-png-transparent.png"
            alt="BBC"
            className="w-24 mx-auto opacity-70 hover:opacity-100 transition"
          />

          {/* Logo 5 */}
          <img 
            src="https://cdn.freebiesupply.com/logos/large/2x/guardian-logo-png-transparent.png"
            alt="The Guardian"
            className="w-28 mx-auto opacity-70 hover:opacity-100 transition"
          />

        </div>

      </div>
    </section>
  );
}

export default PressFeaturedIn;
