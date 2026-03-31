import { Mail, User, MessageSquare } from "lucide-react";

function ContactFormSection() {
  return (
    <section className="w-full bg-white py-20 md:py-28">
      <div className="site-shell">
        <h2 className="mb-10 text-center text-2xl font-bold text-gray-900 md:text-3xl">
          Send Us a Message
        </h2>

        <div className="mx-auto max-w-3xl rounded-2xl border bg-gray-50 p-8 shadow-sm md:p-10">
          <form className="space-y-6">
            <div>
              <label className="font-medium text-gray-700">Your Name</label>
              <div
                className="
                  mt-2 flex items-center
                  rounded-xl border bg-white
                  px-4 py-3
                  focus-within:ring-2 focus-within:ring-black
                "
              >
                <User size={20} className="text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="ml-3 w-full bg-transparent text-gray-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700">Email Address</label>
              <div
                className="
                  mt-2 flex items-center
                  rounded-xl border bg-white
                  px-4 py-3
                  focus-within:ring-2 focus-within:ring-black
                "
              >
                <Mail size={20} className="text-gray-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="ml-3 w-full bg-transparent text-gray-700 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-medium text-gray-700">Your Message</label>
              <div
                className="
                  mt-2 flex items-start
                  rounded-xl border bg-white
                  px-4 py-3
                  focus-within:ring-2 focus-within:ring-black
                "
              >
                <MessageSquare size={20} className="mt-1 text-gray-500" />
                <textarea
                  placeholder="Write your message here..."
                  rows="4"
                  className="ml-3 w-full resize-none bg-transparent text-gray-700 outline-none"
                ></textarea>
              </div>
            </div>

            <button
              type="submit"
              className="
                w-full rounded-xl bg-black py-3
                text-lg font-semibold text-white
                transition hover:bg-neutral-900
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