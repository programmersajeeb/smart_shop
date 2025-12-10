function Newsletter() {
  return (
    <div className="container mx-auto px-4 mt-24 mb-20">
      
      <div className="
        bg-white/80 
        backdrop-blur-md 
        border border-gray-200 
        rounded-2xl 
        p-10 
        shadow-sm 
        text-center
        max-w-2xl 
        mx-auto
      ">
        
        <h2 className="text-3xl md:text-4xl font-bold mb-3">
          Join Our Newsletter
        </h2>

        <p className="text-gray-600 mb-8 text-sm md:text-base">
          Subscribe and get updates about new arrivals, exclusive offers, and more.
        </p>

        {/* Email Form */}
        <div className="flex flex-col md:flex-row gap-3 justify-center">
          <input
            type="email"
            placeholder="Enter your email"
            className="
              w-full 
              md:w-80 
              px-4 
              py-3 
              rounded-xl 
              border border-gray-300 
              focus:outline-none 
              focus:ring-2 
              focus:ring-black 
              transition
            "
          />

          <button
            className="
              px-6 
              py-3 
              bg-black 
              text-white 
              rounded-xl 
              font-semibold 
              hover:bg-gray-900 
              transition
            "
          >
            Subscribe
          </button>
        </div>

      </div>
    </div>
  );
}

export default Newsletter;
