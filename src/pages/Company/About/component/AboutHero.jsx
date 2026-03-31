import { ArrowRight } from "lucide-react";

function AboutHero() {
  return (
    <section className="w-full border-b bg-gray-50 py-20 md:py-28">
      <div className="site-shell flex flex-col items-center text-center">
        <p className="mb-3 text-sm uppercase tracking-widest text-gray-500">
          About Us
        </p>

        <h1 className="text-3xl font-bold leading-snug text-gray-900 md:text-5xl">
          Building the Future of
          <span className="block text-black md:inline"> Modern Shopping</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
          Smart Shop is redefining how people discover and experience fashion.
          We combine innovation, quality, and exceptional customer experience
          to build a brand trusted by thousands.
        </p>

        <button
          className="
            mt-8 flex items-center gap-2 rounded-xl
            bg-black px-6 py-3 text-white
            transition-all hover:bg-neutral-900
            font-semibold md:px-8 md:py-4
          "
        >
          Explore Our Journey
          <ArrowRight size={18} />
        </button>
      </div>
    </section>
  );
}

export default AboutHero;