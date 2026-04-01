import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

function AboutHero() {
  return (
    <section className="w-full border-b border-black/5 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.98),rgba(249,250,251,0.96)_36%,rgba(243,244,246,0.92)_100%)] py-16 md:py-24">
      <div className="site-shell">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="rounded-[30px] border border-black/5 bg-white/90 p-6 shadow-[0_18px_40px_rgba(15,23,42,0.05)] backdrop-blur sm:p-8 lg:p-10">
            <p className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gray-600">
              About Smart Shop
            </p>

            <h1 className="mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-gray-950 md:text-5xl">
              We are building an easier and more thoughtful way to shop online.
            </h1>

            <p className="mt-5 max-w-2xl text-sm leading-7 text-gray-600 md:text-[15px]">
              Smart Shop started with a simple goal: make everyday online shopping
              feel easier, cleaner, and more reliable. From product discovery to
              delivery, we focus on the details that make the experience better.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/shop"
                className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                Shop now
                <ArrowRight size={18} />
              </Link>

              <Link
                to="/collections"
                className="inline-flex min-h-[50px] items-center justify-center rounded-2xl border border-black/10 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
              >
                View collections
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-black/5 bg-white shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <img
              src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=80"
              alt="Smart Shop team and workspace"
              className="h-[300px] w-full object-cover sm:h-[380px] lg:h-[460px]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutHero;