import { ArrowRight } from "lucide-react";

function AboutHero() {
  return (
    <section className="w-full bg-gray-50 py-20 md:py-28 border-b">
      <div className="container mx-auto px-6 flex flex-col items-center text-center">

        {/* TOP SMALL TITLE */}
        <p className="text-sm uppercase tracking-widest text-gray-500 mb-3">
          About Us
        </p>

        {/* MAIN HEADING */}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-snug">
          Building the Future of  
          <span className="text-black block md:inline"> Modern Shopping</span>
        </h1>

        {/* SUB TEXT */}
        <p className="mt-6 text-gray-600 max-w-2xl text-base md:text-lg leading-relaxed">
          Smart Shop is redefining how people discover and experience fashion.  
          We combine innovation, quality, and exceptional customer experience  
          to build a brand trusted by thousands.
        </p>

        {/* BUTTON */}
        <button
          className="
            mt-8 px-6 py-3 md:px-8 md:py-4 
            bg-black text-white rounded-xl 
            flex items-center gap-2 
            hover:bg-neutral-900 
            transition-all font-semibold
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
