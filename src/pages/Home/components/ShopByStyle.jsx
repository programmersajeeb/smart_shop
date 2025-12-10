function ShopByStyle() {
  const styles = [
    {
      label: "Casual",
      img: "https://images.unsplash.com/photo-1520974735194-3b1c3ac20740?auto=format&fit=crop&w=900&q=80",
    },
    {
      label: "Formal",
      img: "https://images.unsplash.com/photo-1520975692194-e75c31d08b06?auto=format&fit=crop&w=900&q=80",
    },
    {
      label: "Streetwear",
      img: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=900&q=80",
    },
    {
      label: "Sportswear",
      img: "https://images.unsplash.com/photo-1562157873-818bc0726f8f?auto=format&fit=crop&w=900&q=80",
    },
  ];

  return (
    <div className="container mx-auto px-4 mt-24 mb-20">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
        Shop by Style
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {styles.map((item, index) => (
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

export default ShopByStyle;
