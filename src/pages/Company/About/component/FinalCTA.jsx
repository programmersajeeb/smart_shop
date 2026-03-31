import { ArrowRight } from "lucide-react";

function FinalCTA() {
  return (
    <section className="w-full bg-black py-24 text-center text-white md:py-32">
      <div className="site-shell">
        <h2 className="text-3xl font-bold leading-tight md:text-5xl">
          Join Our Journey Towards a Smarter Shopping Experience
        </h2>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
          Discover premium quality, modern design, and a seamless shopping flow—crafted
          to give you confidence every day.
        </p>

        <button
          className="
            mt-10 inline-flex items-center gap-2 rounded-xl
            bg-white px-7 py-3 text-lg font-semibold text-black
            transition hover:bg-gray-200
            md:px-10 md:py-4 md:text-xl
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