import { Mail, User, MessageSquare } from "lucide-react";

function ContactFormSection() {
  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="container mx-auto px-6">

        {/* Section Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-10">
          Send Us a Message
        </h2>

        {/* FORM CARD */}
        <div className="max-w-3xl mx-auto bg-gray-50 p-8 md:p-10 rounded-2xl border shadow-sm">

          <form className="space-y-6">

            {/* Name Field */}
            <div>
              <label className="text-gray-700 font-medium">Your Name</label>
              <div className="
                flex items-center 
                bg-white border rounded-xl 
                px-4 py-3 mt-2
                focus-within:ring-2 focus-within:ring-black
              ">
                <User size={20} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="ml-3 w-full outline-none text-gray-700 bg-transparent"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="text-gray-700 font-medium">Email Address</label>
              <div className="
                flex items-center 
                bg-white border rounded-xl 
                px-4 py-3 mt-2
                focus-within:ring-2 focus-within:ring-black
              ">
                <Mail size={20} className="text-gray-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="ml-3 w-full outline-none text-gray-700 bg-transparent"
                />
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label className="text-gray-700 font-medium">Your Message</label>
              <div className="
                flex items-start 
                bg-white border rounded-xl 
                px-4 py-3 mt-2
                focus-within:ring-2 focus-within:ring-black
              ">
                <MessageSquare size={20} className="text-gray-500 mt-1" />
                <textarea
                  placeholder="Write your message here..."
                  rows="4"
                  className="ml-3 w-full outline-none text-gray-700 bg-transparent resize-none"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="
                w-full bg-black text-white 
                py-3 rounded-xl 
                font-semibold text-lg 
                hover:bg-neutral-900 transition
              "
            >
              Send Message
            </button>

          </form>

        </div>
      </div>
    </section>
  );
}

export default ContactFormSection;
