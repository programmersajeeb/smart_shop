function WhyChooseUs() {
  const data = [
    {
      icon: "🚚",
      title: "Fast Delivery",
      desc: "Quick and reliable delivery straight to your doorstep.",
    },
    {
      icon: "💳",
      title: "Secure Payments",
      desc: "Your transactions are encrypted for maximum safety.",
    },
    {
      icon: "🔄",
      title: "Easy Returns",
      desc: "Hassle-free 30-day return & exchange policy.",
    },
    {
      icon: "⭐",
      title: "Premium Quality",
      desc: "Only the highest-quality products curated for you.",
    },
  ];

  return (
    <div className="container mx-auto px-4 mt-20 mb-10">
      
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
        Why Choose Us
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {data.map((item, i) => (
          <div
            key={i}
            className="
              bg-white/80 
              backdrop-blur-md 
              border border-gray-200 
              rounded-2xl 
              p-8 
              shadow-sm 
              hover:shadow-md 
              transition-all 
              duration-300 
              hover:-translate-y-1 
              text-center
            "
          >
            {/* Icon Circle */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-3xl">
              {item.icon}
            </div>

            <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default WhyChooseUs;
