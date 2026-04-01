import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function FinalCTA() {
  return (
    <section className="w-full bg-[linear-gradient(135deg,#111827_0%,#0f172a_55%,#1f2937_100%)] py-20 text-white md:py-28">
      <div className="site-shell">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_18px_40px_rgba(15,23,42,0.14)] backdrop-blur sm:p-10 md:p-12">
          <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/85">
            Start shopping
          </div>

          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight md:text-5xl">
            See what Smart Shop has been building.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/75 md:text-[15px]">
            Browse the shop, explore collections, and discover products in a store
            experience designed to feel clear, smooth, and easy to use.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/shop"
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
            >
              Go to shop
              <ArrowRight size={18} />
            </Link>

            <Link
              to="/collections"
              className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/30"
            >
              View collections
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;