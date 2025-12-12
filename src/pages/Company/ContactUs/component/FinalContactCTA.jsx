import { Mail, MessageCircle } from "lucide-react";

function FinalContactCTA() {
  return (
    <section className="w-full py-20 md:py-28 bg-black text-white text-center">
      <div className="container mx-auto px-6">

        {/* TITLE */}
        <h2 className="text-3xl md:text-4xl font-bold leading-tight">
          Still Need Help?
        </h2>

        {/* SUBTEXT */}
        <p className="text-gray-300 max-w-2xl mx-auto mt-4 text-base md:text-lg leading-relaxed">
          Our support team is available to assist you with any questions or issues.  
          We're here to make sure your experience with Smart Shop is smooth and enjoyable.
        </p>

        {/* BUTTONS */}
        <div className="flex justify-center flex-wrap gap-4 mt-10">

          {/* Chat Button */}
          <button
            className="
              flex items-center gap-2
              bg-white text-black 
              px-6 py-3 md:px-8 md:py-4 
              rounded-xl text-lg font-semibold 
              hover:bg-gray-200 transition
            "
          >
            <MessageCircle size={22} />
            Live Chat Support
          </button>

          {/* Email Button */}
          <a
            href="mailto:support@smartshop.com"
            className="
              flex items-center gap-2
              border border-gray-400
              text-white px-6 py-3 md:px-8 md:py-4 
              rounded-xl text-lg font-semibold 
              hover:bg-white hover:text-black 
              transition
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
