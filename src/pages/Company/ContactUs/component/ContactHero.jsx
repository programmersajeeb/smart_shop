import { Mail, Phone } from "lucide-react";

function ContactHero() {
  return (
    <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
      <div className="site-shell">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.12fr_0.88fr] lg:items-center">
          <div className="rounded-[30px] border border-black/5 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-8 lg:p-10">
            <div className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              Contact us
            </div>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-gray-950 md:text-5xl">
              Need help? We are here to make things easier.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              Whether you have a question about an order, need support, or want to
              reach the right team, you can contact Smart Shop in the way that works
              best for you.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="mailto:support@smartshop.com"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Mail size={18} />
                Email support
              </a>

              <a
                href="tel:+8801234567890"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                <Phone size={18} />
                Call us
              </a>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <img
              src="https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80"
              alt="Customer support workspace"
              className="h-[300px] w-full object-cover sm:h-[360px] lg:h-[440px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ContactHero;