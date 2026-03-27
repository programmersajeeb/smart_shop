import { useEffect, useMemo, useRef, useState } from "react";

function renderStars(rating = 5) {
  const safe = Math.max(0, Math.min(5, Number(rating) || 0));

  return (
    <div className="flex items-center gap-1" aria-label={`${safe} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, idx) => (
        <span
          key={idx}
          className={idx < safe ? "text-lg text-amber-400" : "text-lg text-gray-300"}
        >
          ★
        </span>
      ))}
    </div>
  );
}

export default function Testimonials({ data, loading, error }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const items = useMemo(() => {
    const incoming = Array.isArray(data?.items) ? data.items : [];

    if (incoming.length > 0) {
      return incoming.slice(0, 8).map((item, index) => ({
        id: item?.id || `testimonial-${index + 1}`,
        name: item?.name || "Customer",
        quote: item?.quote || "Great experience.",
        rating: Number(item?.rating || 5),
      }));
    }

    return [
      {
        id: "fallback-1",
        name: "Sarah M.",
        quote: "Amazing quality! The materials feel premium and the delivery was fast.",
        rating: 5,
      },
      {
        id: "fallback-2",
        name: "David L.",
        quote: "Great shopping experience. Loved the clean UI and fast checkout.",
        rating: 5,
      },
      {
        id: "fallback-3",
        name: "Jessica R.",
        quote: "The products are exactly as shown and the storefront feels trustworthy.",
        rating: 4,
      },
      {
        id: "fallback-4",
        name: "Michael P.",
        quote: "Customer support was super helpful. Very satisfied with the process.",
        rating: 5,
      },
      {
        id: "fallback-5",
        name: "Emily W.",
        quote: "Stylish collection and good prices. I’ll definitely shop again.",
        rating: 4,
      },
    ];
  }, [data]);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;

    if (!container || !track) return;

    const checkWidth = () => {
      const totalWidth = track.scrollWidth;
      const visibleWidth = container.clientWidth;
      setShouldAnimate(totalWidth > visibleWidth + 8);
    };

    checkWidth();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(checkWidth);
      resizeObserver.observe(container);
      resizeObserver.observe(track);
    } else {
      window.addEventListener("resize", checkWidth);
    }

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener("resize", checkWidth);
      }
    };
  }, [items]);

  const duplicatedItems = shouldAnimate ? [...items, ...items] : items;
  const title = data?.title || "Customer Reviews";
  const subtitle =
    data?.subtitle ||
    "Real feedback presentation designed to strengthen trust and improve storefront credibility.";

  return (
    <>
      <style>{`
        @keyframes testimonialMarquee {
          0% { transform: translate3d(0, 0, 0); }
          100% { transform: translate3d(-50%, 0, 0); }
        }

        .testimonial-marquee {
          width: max-content;
          will-change: transform;
          animation: testimonialMarquee 30s linear infinite;
        }

        .testimonial-marquee:hover {
          animation-play-state: paused;
        }

        @media (prefers-reduced-motion: reduce) {
          .testimonial-marquee {
            animation: none !important;
          }
        }
      `}</style>

      <section
        className="container mx-auto px-4 py-10 sm:py-12 md:py-14 lg:py-16"
        aria-label="Testimonials"
      >
        <div className="mb-8 text-center sm:mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-gray-950 sm:text-3xl md:text-4xl">
            {title}
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
            {subtitle}
          </p>
        </div>

        {!loading && error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            Failed to load testimonials
            {error?.message ? ` (${error.message})` : ""}
          </div>
        )}

        <div
          ref={containerRef}
          className="overflow-hidden rounded-[24px] border border-black/5 bg-gradient-to-b from-white to-gray-50 px-3 py-4 sm:rounded-[28px] sm:px-4 sm:py-5"
        >
          <div
            ref={trackRef}
            className={`flex gap-4 sm:gap-5 lg:gap-6 ${
              shouldAnimate
                ? "testimonial-marquee"
                : "flex-wrap justify-center"
            }`}
          >
            {duplicatedItems.map((item, i) => (
              <article
                key={`${item?.id || "testimonial"}-${i}`}
                className="min-w-[260px] max-w-[300px] rounded-2xl border border-black/5 bg-white p-4 shadow-sm sm:min-w-[280px] sm:max-w-[320px] sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-gray-900">
                      {item?.name || "Customer"}
                    </p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-gray-400">
                      Verified-style feedback
                    </p>
                  </div>

                  <div className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-semibold text-gray-600">
                    Review
                  </div>
                </div>

                <div className="mt-4">{renderStars(item?.rating)}</div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  “{item?.quote || "Great experience."}”
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}