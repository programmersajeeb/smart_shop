import { Mail, User, MessageSquare } from "lucide-react";

function ContactFormSection() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-950 md:text-4xl">
            Send us a message
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600 md:text-[15px]">
            Fill out the form below and our team will get back to you as soon as possible.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-[30px] border border-black/5 bg-gray-50 p-6 shadow-[0_14px_34px_rgba(15,23,42,0.05)] sm:p-8 md:p-10">
          <form className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-gray-800">Your name</label>
              <div className="mt-2 flex min-h-[56px] items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 shadow-sm transition-colors transition-shadow focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]">
                <User size={18} className="shrink-0 text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter your name"
                  className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800">
                Email address
              </label>
              <div className="mt-2 flex min-h-[56px] items-center gap-3 rounded-[20px] border border-black/10 bg-white px-4 shadow-sm transition-colors transition-shadow focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]">
                <Mail size={18} className="shrink-0 text-gray-500" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-800">Message</label>
              <div className="mt-2 flex items-start gap-3 rounded-[20px] border border-black/10 bg-white px-4 py-4 shadow-sm transition-colors transition-shadow focus-within:border-black/25 focus-within:shadow-[0_0_0_4px_rgba(17,24,39,0.06)]">
                <MessageSquare size={18} className="mt-1 shrink-0 text-gray-500" />
                <textarea
                  placeholder="Write your message here..."
                  rows="5"
                  className="w-full resize-none border-0 bg-transparent text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:outline-none focus:ring-0 focus-visible:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            >
              Send message
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default ContactFormSection;