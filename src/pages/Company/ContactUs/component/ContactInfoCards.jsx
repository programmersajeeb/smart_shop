import { Mail, Phone, MapPin, Clock } from "lucide-react";

function ContactInfoCards() {
  return (
    <section className="w-full py-16 md:py-24 bg-white">
      <div className="container mx-auto px-6">

        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12">
          Get In Touch With Us
        </h2>

        {/* CARD GRID */}
        <div
          className="
            grid 
            grid-cols-1 
            sm:grid-cols-2 
            md:grid-cols-4 
            gap-6 
          "
        >

          {/* EMAIL CARD */}
          <div className="bg-gray-50 p-8 rounded-2xl border shadow-sm hover:shadow-md transition text-center">
            <Mail size={38} className="mx-auto text-black mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Email Us</h3>
            <p className="text-gray-600 mt-1 text-sm">support@smartshop.com</p>
          </div>

          {/* PHONE CARD */}
          <div className="bg-gray-50 p-8 rounded-2xl border shadow-sm hover:shadow-md transition text-center">
            <Phone size={38} className="mx-auto text-black mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Call Support</h3>
            <p className="text-gray-600 mt-1 text-sm">+880 1234-567890</p>
          </div>

          {/* LOCATION CARD */}
          <div className="bg-gray-50 p-8 rounded-2xl border shadow-sm hover:shadow-md transition text-center">
            <MapPin size={38} className="mx-auto text-black mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Our Office</h3>
            <p className="text-gray-600 mt-1 text-sm">Dhaka, Bangladesh</p>
          </div>

          {/* HOURS CARD */}
          <div className="bg-gray-50 p-8 rounded-2xl border shadow-sm hover:shadow-md transition text-center">
            <Clock size={38} className="mx-auto text-black mb-4" />
            <h3 className="font-semibold text-lg text-gray-900">Support Hours</h3>
            <p className="text-gray-600 mt-1 text-sm">Sat–Thu: 9:00AM–10:00PM</p>
          </div>

        </div>
      </div>
    </section>
  );
}

export default ContactInfoCards;
