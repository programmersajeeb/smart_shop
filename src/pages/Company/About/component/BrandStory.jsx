function BrandStory() {
  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

        {/* LEFT — TEXT CONTENT */}
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
            Our Journey Towards  
            <span className="text-black block mt-1">A Better Shopping Experience</span>
          </h2>

          <p className="mt-6 text-gray-600 text-base md:text-lg leading-relaxed max-w-lg">
            Smart Shop began with a simple vision: to make premium-quality fashion  
            accessible to everyone. What started as a small idea quickly evolved  
            into a modern e-commerce brand trusted by thousands of customers around  
            the world.
          </p>

          <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed max-w-lg">
            Our journey is fueled by innovation, design, and a deep commitment to  
            customer satisfaction. We believe shopping should be effortless—  
            combining style, quality, and fast delivery into one seamless experience.
          </p>

          <p className="mt-4 text-gray-600 text-base md:text-lg leading-relaxed max-w-lg">
            Today, Smart Shop continues to grow, shaping the future of modern  
            online shopping with better products, better service, and better  
            technology.
          </p>

        </div>

        {/* RIGHT — IMAGE */}
        <div className="w-full">
          <img
            src="https://images.unsplash.com/photo-1523170380059-3fdfb1235f79?auto=format&fit=crop&w=900&q=80"
            alt="Brand Story"
            className="w-full h-[350px] md:h-[450px] object-cover rounded-2xl shadow-lg"
          />
        </div>

      </div>
    </section>
  );
}

export default BrandStory;
