import { useState } from "react";

function Newsletter({ data, loading, error }) {
  const [email, setEmail] = useState("");

  const title = data?.title || "Join Our Newsletter";
  const description =
    data?.description ||
    "Subscribe and get updates about new arrivals, exclusive offers, and more.";
  const placeholder = data?.placeholder || "Enter your email";
  const buttonLabel = data?.buttonLabel || "Subscribe";

  function handleSubmit(e) {
    e.preventDefault();
  }

  return (
    <section
      className="container mx-auto mt-24 mb-20 px-4"
      aria-label="Newsletter"
    >
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-black/5 bg-gradient-to-br from-white via-[#faf7f2] to-[#f3f4f6] shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="grid grid-cols-1 gap-8 px-6 py-8 md:px-10 md:py-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-12 lg:py-12">
          <div>
            <div className="inline-flex rounded-full border border-black/10 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-600">
              Stay connected
            </div>

            <h2 className="mt-4 text-3xl font-semibold text-gray-950 md:text-4xl lg:text-5xl">
              {title}
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 md:text-base">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5">
                New arrivals
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5">
                Exclusive offers
              </span>
              <span className="rounded-full bg-white px-4 py-2 text-sm text-gray-700 ring-1 ring-black/5">
                Curated updates
              </span>
            </div>

            {!loading && error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                Failed to load newsletter content
                {error?.message ? ` (${error.message})` : ""}
              </div>
            )}
          </div>

          <div className="rounded-[28px] border border-black/5 bg-white/95 p-5 shadow-sm md:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-gray-800">
                  Email address
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-2xl border border-gray-300 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-black"
                />
              </label>

              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-2xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                {buttonLabel}
              </button>

              <div className="rounded-2xl bg-gray-50 px-4 py-4 ring-1 ring-black/5">
                <p className="text-xs leading-5 text-gray-600">
                  Newsletter form UI is ready. Connect this button to your
                  subscriber API or email platform to activate real subscriptions.
                </p>
              </div>

              <p className="text-[11px] leading-5 text-gray-400">
                By subscribing, customers can receive launch updates, seasonal
                drops, and curated product highlights.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Newsletter;