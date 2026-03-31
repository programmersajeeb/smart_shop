function BrandStory() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell grid grid-cols-1 items-center gap-12 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
            Our Journey Towards
            <span className="mt-1 block text-black">
              A Better Shopping Experience
            </span>
          </h2>

          <p className="mt-6 max-w-lg text-base leading-relaxed text-gray-600 md:text-lg">
            Smart Shop began with a simple vision: to make premium-quality fashion
            accessible to everyone. What started as a small idea quickly evolved
            into a modern e-commerce brand trusted by thousands of customers around
            the world.
          </p>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-600 md:text-lg">
            Our journey is fueled by innovation, design, and a deep commitment to
            customer satisfaction. We believe shopping should be effortless—
            combining style, quality, and fast delivery into one seamless experience.
          </p>

          <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-600 md:text-lg">
            Today, Smart Shop continues to grow, shaping the future of modern
            online shopping with better products, better service, and better
            technology.
          </p>
        </div>

        <div className="w-full">
          <img
            src="https://images.unsplash.com/photo-1523170380059-3fdfb1235f79?auto=format&fit=crop&w=900&q=80"
            alt="Brand Story"
            className="h-[350px] w-full rounded-2xl object-cover shadow-lg md:h-[450px]"
          />
        </div>
      </div>
    </section>
  );
}

export default BrandStory;