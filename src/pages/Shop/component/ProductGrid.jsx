import { Heart, ShoppingCart, Star } from "lucide-react";

function ProductGrid() {
  const products = [
    {
      id: 1,
      name: "Premium Cotton T-Shirt",
      price: 29,
      oldPrice: 39,
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1520974735194-9c7e2c97f4c1?auto=format&fit=crop&w=600&q=80",
      badge: "-25%",
    },
    {
      id: 2,
      name: "Stylish Leather Watch",
      price: 89,
      oldPrice: 119,
      rating: 4.6,
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
      badge: "New",
    },
    {
      id: 3,
      name: "Modern Sneakers",
      price: 120,
      oldPrice: 150,
      rating: 4.9,
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80",
      badge: "-20%",
    },
    {
      id: 4,
      name: "Elegant Handbag",
      price: 75,
      oldPrice: 95,
      rating: 4.7,
      image:
        "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?auto=format&fit=crop&w=600&q=80",
      badge: "Hot",
    },
  ];

  return (
    <section className="w-full py-10 md:py-14">
      <div className="container mx-auto px-6">

        {/* GRID */}
        <div
          className="
            grid grid-cols-2 
            md:grid-cols-3 
            lg:grid-cols-4 
            gap-6
          "
        >
          {products.map((product) => (
            <div
              key={product.id}
              className="
                group relative bg-white 
                rounded-2xl border 
                overflow-hidden 
                hover:shadow-lg transition
              "
            >
              {/* BADGE */}
              {product.badge && (
                <span
                  className="
                    absolute top-3 left-3 z-10 
                    bg-black text-white 
                    text-xs px-2 py-1 rounded-full
                  "
                >
                  {product.badge}
                </span>
              )}

              {/* WISHLIST */}
              <button
                className="
                  absolute top-3 right-3 z-10 
                  bg-white p-2 rounded-full 
                  shadow hover:bg-black hover:text-white transition
                "
              >
                <Heart size={16} />
              </button>

              {/* IMAGE */}
              <div className="overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="
                    w-full h-[220px] object-cover 
                    group-hover:scale-105 transition duration-300
                  "
                />
              </div>

              {/* CONTENT */}
              <div className="p-4">

                {/* TITLE */}
                <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {product.name}
                </h3>

                {/* RATING */}
                <div className="flex items-center gap-1 mt-2 text-yellow-500">
                  <Star size={14} fill="currentColor" />
                  <span className="text-xs text-gray-600">
                    {product.rating}
                  </span>
                </div>

                {/* PRICE */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="font-semibold text-gray-900">
                    ${product.price}
                  </span>
                  <span className="text-sm text-gray-400 line-through">
                    ${product.oldPrice}
                  </span>
                </div>

                {/* ADD TO CART */}
                <button
                  className="
                    mt-4 w-full flex items-center 
                    justify-center gap-2 
                    bg-black text-white 
                    py-2 rounded-xl text-sm 
                    hover:bg-neutral-900 transition
                  "
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default ProductGrid;
