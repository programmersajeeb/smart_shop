function BrandStory() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="site-shell grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        <div className="overflow-hidden rounded-[28px] border border-black/5 bg-white shadow-[0_14px_34px_rgba(15,23,42,0.05)]">
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=900&q=80"
            alt="Smart Shop brand story"
            className="h-[320px] w-full object-cover md:h-[440px]"
          />
        </div>

        <div>
          <div className="inline-flex rounded-full border border-black/10 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gray-600">
            Our story
          </div>

          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-gray-950 md:text-4xl">
            We started with one idea: shopping online should feel simple and dependable.
          </h2>

          <p className="mt-5 max-w-xl text-sm leading-7 text-gray-600 md:text-[15px]">
            Smart Shop began as a small effort to bring better product selection,
            cleaner browsing, and a smoother buying experience into one place.
          </p>

          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 md:text-[15px]">
            Over time, that idea grew into a brand focused on making everyday
            shopping easier, from finding the right item to receiving it without
            unnecessary friction.
          </p>

          <p className="mt-4 max-w-xl text-sm leading-7 text-gray-600 md:text-[15px]">
            We keep improving the experience by paying attention to product quality,
            site usability, fast support, and the small details customers notice.
          </p>
        </div>
      </div>
    </section>
  );
}

export default BrandStory;