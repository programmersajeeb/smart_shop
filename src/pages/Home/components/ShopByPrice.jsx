function ShopByPrice() {
  const priceRanges = [
    {
      label: "Under $50",
      img: "https://images.unsplash.com/photo-1520975918318-3f8cbc7b6217?auto=format&fit=crop&w=900&q=80",
    },
    {
      label: "Under $100",
      img: "https://images.unsplash.com/photo-1503342394128-c104d54dba01?auto=format&fit=crop&w=900&q=80",
    },
    {
      label: "Premium Picks",
      img: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="container mx-auto px-4 mt-24 mb-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        Shop by Price
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {priceRanges.map((item, index) => (
          <div
            key={index}
            className="
              relative 
              rounded-3xl 
              overflow-hidden 
              group 
              cursor-pointer 
              shadow-sm 
              hover:shadow-md 
              transition-all 
              duration-300
            "
          >
            <img
              src={item.img}
              alt={item.label}
              className="
                w-full 
                h-[240px] 
                md:h-[300px] 
                object-cover 
                group-hover:scale-105 
                transition 
                duration-500
              "
            />

            <div
              className="
                absolute 
                inset-0 
                bg-black/40 
                flex 
                items-center 
                justify-center 
                text-center
                transition 
                duration-300
              "
            >
              <h3 className="text-white text-2xl md:text-3xl font-semibold">
                {item.label}
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ShopByPrice;
