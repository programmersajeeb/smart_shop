import { Mail, Phone, MapPin, Clock } from "lucide-react";

function ContactInfoCards() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <h2 className="mb-12 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Get In Touch With Us
        </h2>

        <div
          className="
            grid
            grid-cols-1
            gap-6
            sm:grid-cols-2
            md:grid-cols-4
          "
        >
          <div className="rounded-2xl border bg-gray-50 p-8 text-center shadow-sm transition hover:shadow-md">
            <Mail size={38} className="mx-auto mb-4 text-black" />
            <h3 className="text-lg font-semibold text-gray-900">Email Us</h3>
            <p className="mt-1 text-sm text-gray-600">support@smartshop.com</p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 text-center shadow-sm transition hover:shadow-md">
            <Phone size={38} className="mx-auto mb-4 text-black" />
            <h3 className="text-lg font-semibold text-gray-900">Call Support</h3>
            <p className="mt-1 text-sm text-gray-600">+880 1234-567890</p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 text-center shadow-sm transition hover:shadow-md">
            <MapPin size={38} className="mx-auto mb-4 text-black" />
            <h3 className="text-lg font-semibold text-gray-900">Our Office</h3>
            <p className="mt-1 text-sm text-gray-600">Dhaka, Bangladesh</p>
          </div>

          <div className="rounded-2xl border bg-gray-50 p-8 text-center shadow-sm transition hover:shadow-md">
            <Clock size={38} className="mx-auto mb-4 text-black" />
            <h3 className="text-lg font-semibold text-gray-900">Support Hours</h3>
            <p className="mt-1 text-sm text-gray-600">Sat–Thu: 9:00AM–10:00PM</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactInfoCards;