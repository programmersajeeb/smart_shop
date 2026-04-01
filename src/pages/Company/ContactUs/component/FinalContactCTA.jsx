import { Mail, MessageCircle } from "lucide-react";

function FinalContactCTA() {
  return (
    <section className="w-full bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#1f2937_100%)] py-20 text-white md:py-28">
      <div className="site-shell">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur sm:p-10 md:p-12">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
            Need more help?
          </div>

          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            We are ready to help you with the next step.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 md:text-[15px]">
            Reach out if you still need support, have a question about your order, or
            want help from the team directly.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
            >
              <MessageCircle size={18} />
              Live chat support
            </button>

            <a
              href="mailto:support@smartshop.com"
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
            >
              <Mail size={18} />
              Email us
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalContactCTA;