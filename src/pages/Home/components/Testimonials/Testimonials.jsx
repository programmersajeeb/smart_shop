import { useEffect, useRef, useState } from "react";

function Testimonials() {
  const containerRef = useRef(null);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const reviews = [
    {
      name: "Sarah M.",
      review: "Amazing quality! The materials feel premium and the delivery was fast.",
      rating: 5,
    },
    {
      name: "David L.",
      review: "Great shopping experience. Loved the clean UI and fast checkout.",
      rating: 5,
    },
    {
      name: "Jessica R.",
      review: "The products are exactly as shown! Highly recommended.",
      rating: 4,
    },
    {
      name: "Michael P.",
      review: "Customer support was super helpful. Very satisfied.",
      rating: 5,
    },
    {
      name: "Emily W.",
      review: "Stylish collection and good prices. Will shop again.",
      rating: 4,
    },
  ];

  useEffect(() => {
    const el = containerRef.current;
    const checkWidth = () => {
      const needsScroll = el.scrollWidth > el.clientWidth + 4;
      setShouldAnimate(needsScroll);
    };
    checkWidth();

    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
    <>
      {/* CSS DIRECTLY INSIDE THIS FILE */}
      <style>{`
        @keyframes testimonialMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .testimonial-marquee {
          animation: testimonialMarquee 25s linear infinite;
        }
      `}</style>

      <div className="container mx-auto px-4 mt-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
          Customer Reviews
        </h2>

        <div ref={containerRef} className="overflow-hidden py-4">
          <div
            className={`flex gap-6 ${
              shouldAnimate ? "testimonial-marquee" : ""
            }`}
          >
            {reviews.map((item, i) => (
              <div
                key={i}
                className="min-w-[260px] bg-white rounded-xl shadow p-5 border border-gray-100"
              >
                <p className="font-semibold text-gray-800 mb-2">{item.name}</p>

                <div className="flex mb-2">
                  {Array.from({ length: item.rating }).map((_, idx) => (
                    <span key={idx} className="text-yellow-400 text-lg">★</span>
                  ))}
                  {Array.from({ length: 5 - item.rating }).map((_, idx) => (
                    <span key={idx} className="text-gray-300 text-lg">★</span>
                  ))}
                </div>

                <p className="text-gray-600 text-sm">{item.review}</p>
              </div>
            ))}

            {/* Duplicate for infinite loop */}
            {shouldAnimate &&
              reviews.map((item, i) => (
                <div
                  key={"dup-" + i}
                  className="min-w-[260px] bg-white rounded-xl shadow p-5 border border-gray-100"
                >
                  <p className="font-semibold text-gray-800 mb-2">{item.name}</p>
                  <div className="flex mb-2">
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <span key={idx} className="text-yellow-400 text-lg">★</span>
                    ))}
                    {Array.from({ length: 5 - item.rating }).map((_, idx) => (
                      <span key={idx} className="text-gray-300 text-lg">★</span>
                    ))}
                  </div>
                  <p className="text-gray-600 text-sm">{item.review}</p>
                </div>
              ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Testimonials;
