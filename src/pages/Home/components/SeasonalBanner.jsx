function SeasonalBanner() {
  return (
    <div className="container mx-auto px-4 mt-24">
      <div
        className="
          relative 
          rounded-3xl 
          overflow-hidden 
          shadow-sm 
        "
      >
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1600&q=80"
          className="w-full h-[280px] md:h-[380px] object-cover"
          alt="Seasonal Banner"
        />

        {/* Overlay */}
        <div
          className="
            absolute 
            inset-0 
            bg-black/40 
            md:bg-black/30 
            flex 
            flex-col 
            items-center 
            justify-center 
            text-center 
            px-4
          "
        >
          <h2 className="text-white text-3xl md:text-5xl font-bold mb-3">
            Winter Collection 2025
          </h2>

          <p className="text-gray-200 md:text-lg mb-6 max-w-xl">
            Discover our latest premium styles crafted for comfort & elegance.
          </p>

          <button
            className="
              bg-white 
              text-black 
              px-6 
              py-3 
              rounded-xl 
              font-semibold 
              hover:bg-gray-100 
              transition
            "
          >
            Shop Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default SeasonalBanner;
