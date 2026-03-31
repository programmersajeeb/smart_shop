import { Mail, MessageCircle } from "lucide-react";

function FinalContactCTA() {
  return (
    <section className="w-full bg-black py-20 text-center text-white md:py-28">
      <div className="site-shell">
        <h2 className="text-3xl font-bold leading-tight md:text-4xl">
          Still Need Help?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
          Our support team is available to assist you with any questions or issues.
          We're here to make sure your experience with Smart Shop is smooth and enjoyable.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <button
            className="
              flex items-center gap-2
              rounded-xl bg-white px-6 py-3
              text-lg font-semibold text-black
              transition hover:bg-gray-200
              md:px-8 md:py-4
            "
          >
            <MessageCircle size={22} />
            Live Chat Support
          </button>

          <a
            href="mailto:support@smartshop.com"
            className="
              flex items-center gap-2
              rounded-xl border border-gray-400
              px-6 py-3 text-lg font-semibold text-white
              transition hover:bg-white hover:text-black
              md:px-8 md:py-4
            "
          >
            <Mail size={22} />
            Email Us
          </a>
        </div>
      </div>
    </section>
  );
}

export default FinalContactCTA;