function InstagramFeed() {
  const images = [
    "https://images.unsplash.com/photo-1520970014086-2208d0858db2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520960579280-8c46f15d8d20?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520970014086-2208d0858db2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80",
  ];

  return (
    <div className="container mx-auto px-4 mt-24 mb-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        Follow Us on Instagram
      </h2>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {images.map((src, index) => (
          <div
            key={index}
            className="
              overflow-hidden 
              rounded-xl 
              group 
              cursor-pointer
            "
          >
            <img
              src={src}
              className="
                w-full 
                h-40 
                md:h-48 
                object-cover 
                group-hover:scale-110 
                transition 
                duration-500
              "
              alt="Instagram"
            />
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="text-center mt-8">
        <a
          href="#"
          className="
            inline-block 
            px-6 
            py-3 
            rounded-xl 
            bg-black 
            text-white 
            font-semibold 
            hover:bg-gray-900 
            transition
          "
        >
          @yourinstagram
        </a>
      </div>
    </div>
  );
}

export default InstagramFeed;
