import {MapPin} from "lucide-react";

function StoreLocationSection() {
    return (
        <section className="w-full py-20 md:py-28 bg-gray-50 border-y">
            <div className="container mx-auto px-6">

                {/* Section Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
                    Visit Our Office
                </h2>

                {/* Address Card */}
                <div
                    className="max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-sm border mb-10">
                    <div className="flex items-start gap-4">

                        <MapPin size={40} className="text-black mt-1"/>

                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                Smart Shop Headquarters
                            </h3>
                            <p className="text-gray-600 leading-relaxed">
                                221B Baker Street, Marylebone London, NW1 6XE United Kingdom
                            </p>

                            <p className="text-gray-500 mt-2 text-sm">
                                (Open: Monday – Friday, 9:00 AM – 6:00 PM UK Time)
                            </p>
                        </div>
                    </div>
                </div>

                {/* GOOGLE MAP (RESPONSIVE) */}
                <div
                    className="w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-md border">
                    <iframe
                        title="Google Map Location"
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d9935.157749400081!2d-0.16318989999999998!3d51.523767399999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x48761ad5486a0d21%3A0xc8a51e3b0b90c7d!2s221B%20Baker%20St%2C%20London%20NW1%206XE%2C%20UK!5e0!3m2!1sen!2suk!4v1700000000001"
                        width="100%"
                        height="380"
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"></iframe>

                </div>

            </div>
        </section>
    );
}

export default StoreLocationSection;
