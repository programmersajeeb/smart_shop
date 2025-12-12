import { ArrowRight } from "lucide-react";

function FinalCTA() {
  return (
    <section className="w-full py-24 md:py-32 bg-black text-white text-center">
      <div className="container mx-auto px-6">

        {/* TITLE */}
        <h2 className="text-3xl md:text-5xl font-bold leading-tight">
          Join Our Journey Towards a Smarter Shopping Experience
        </h2>

        {/* SUBTEXT */}
        <p className="text-gray-300 max-w-2xl mx-auto mt-6 text-base md:text-lg leading-relaxed">
          Discover premium quality, modern design, and a seamless shopping flow—crafted 
          to give you confidence every day.
        </p>

        {/* CTA BUTTON */}
        <button
          className="
            mt-10 px-7 py-3 md:px-10 md:py-4 
            bg-white text-black 
            rounded-xl 
            text-lg md:text-xl 
            font-semibold 
            hover:bg-gray-200 
            transition 
            inline-flex items-center gap-2
          "
        >
          Explore Our Collections
          <ArrowRight size={22} />
        </button>

      </div>
    </section>
  );
}

export default FinalCTA;
