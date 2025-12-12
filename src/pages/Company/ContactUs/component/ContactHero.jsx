import { Mail, Phone, MessageCircle } from "lucide-react";

function ContactHero() {
  return (
    <section className="w-full py-20 md:py-28 bg-gray-50 border-b">
      <div className="container mx-auto px-6 text-center">

        {/* ICON */}
        <div className="flex justify-center mb-6">
          <MessageCircle size={52} className="text-black opacity-90" />
        </div>

        {/* TITLE */}
        <h1 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight">
          Contact Smart Shop
        </h1>

        {/* SUBTEXT */}
        <p className="text-gray-600 max-w-2xl mx-auto mt-4 text-base md:text-lg">
          Have questions? Need help with an order?  
          Our friendly support team is always here to assist you—quickly and professionally.
        </p>

        {/* QUICK CONTACT BUTTONS / SHORTCUTS */}
        <div className="flex justify-center flex-wrap gap-4 mt-8">

          <a
            href="mailto:support@smartshop.com"
            className="
              flex items-center gap-2
              px-5 py-3
              bg-white border
              rounded-xl shadow-sm
              hover:shadow-md transition
            "
          >
            <Mail size={20} />
            Email Support
          </a>

          <a
            href="tel:+8801234567890"
            className="
              flex items-center gap-2
              px-5 py-3
              bg-white border
              rounded-xl shadow-sm
              hover:shadow-md transition
            "
          >
            <Phone size={20} />
            Call Us
          </a>
        </div>

      </div>
    </section>
  );
}

export default ContactHero;
