import { Mail, Phone, MessageCircle } from "lucide-react";

function ContactHero() {
  return (
    <section className="w-full border-b bg-gray-50 py-20 md:py-28">
      <div className="site-shell text-center">
        <div className="mb-6 flex justify-center">
          <MessageCircle size={52} className="text-black opacity-90" />
        </div>

        <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
          Contact Smart Shop
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 md:text-lg">
          Have questions? Need help with an order?
          Our friendly support team is always here to assist you—quickly and professionally.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a
            href="mailto:support@smartshop.com"
            className="
              flex items-center gap-2
              rounded-xl border bg-white
              px-5 py-3 shadow-sm
              transition hover:shadow-md
            "
          >
            <Mail size={20} />
            Email Support
          </a>

          <a
            href="tel:+8801234567890"
            className="
              flex items-center gap-2
              rounded-xl border bg-white
              px-5 py-3 shadow-sm
              transition hover:shadow-md
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