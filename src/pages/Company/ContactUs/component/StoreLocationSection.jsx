import { MapPin } from "lucide-react";

function StoreLocationSection() {
  return (
    <section className="w-full border-y bg-gray-50 py-20 md:py-28">
      <div className="site-shell">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Visit Our Office
        </h2>

        <div className="mx-auto mb-10 max-w-3xl rounded-2xl border bg-white p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <MapPin size={40} className="mt-1 text-black" />

            <div>
              <h3 className="mb-1 text-xl font-semibold text-gray-900">
                Smart Shop Headquarters
              </h3>
              <p className="leading-relaxed text-gray-600">
                221B Baker Street, Marylebone London, NW1 6XE United Kingdom
              </p>

              <p className="mt-2 text-sm text-gray-500">
                (Open: Monday – Friday, 9:00 AM – 6:00 PM UK Time)
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-2xl border shadow-md">
          <iframe
            title="Google Map Location"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9935.157749400081!2d-0.16318989999999998!3d51.523767399999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761ad5486a0d21%3A0xc8a51e3b0b90c7d!2s221B%20Baker%20St%2C%20London%20NW1%206XE%2C%20UK!5e0!3m2!1sen!2suk!4v1700000000001"
            width="100%"
            height="380"
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  );
}

export default StoreLocationSection;