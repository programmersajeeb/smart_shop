function BrandStory() {
  return (
    <div className="container mx-auto px-4 mt-24 mb-20">
      
      <div className="
        rounded-3xl 
        bg-white/80 
        backdrop-blur-md 
        border border-gray-200 
        shadow-sm 
        p-10 
        md:p-16
        flex 
        flex-col 
        md:flex-row 
        items-center 
        gap-10
      ">
        
        {/* Brand Image */}
        <img
          src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80"
          alt="Brand Story"
          className="rounded-2xl w-full md:w-1/2 h-64 object-cover shadow"
        />

        {/* Text Content */}
        <div className="md:w-1/2 text-center md:text-left">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Our Story
          </h2>

          <p className="text-gray-600 leading-relaxed mb-6">
            Smart Shop was founded with a simple idea: to bring premium fashion 
            closer to everyone. We craft timeless pieces with care, focusing on 
            quality, comfort, and modern design — because you deserve to feel 
            confident every day.
          </p>

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
            Learn More
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrandStory;
