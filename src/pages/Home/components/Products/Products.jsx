import React from 'react'

export default function Products() {
  return (
    <div className="container mx-auto px-4 my-20">
  <h2 className="text-3xl md:text-4xl font-bold mb-10 text-center">
    Best Sellers
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    
    {[1,2,3,4].map((item) => (
      <div
        key={item}
        className="card shadow-lg rounded-xl group cursor-pointer overflow-hidden"
      >
        <figure className="relative">
          <img
            src={`/images/product-${item}.jpg`}
            alt="Product"
            className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
          />

          <button className="hidden group-hover:flex absolute bottom-3 left-1/2 -translate-x-1/2 btn btn-sm bg-black text-white border-none">
            Add to Cart
          </button>
        </figure>

        <div className="p-4">
          <h3 className="font-semibold text-lg mb-1">Premium Jacket</h3>
          <p className="text-gray-600 mb-1">$129</p>

          <div className="rating rating-sm">
            <input type="radio" className="mask mask-star-2 bg-orange-400" />
            <input type="radio" className="mask mask-star-2 bg-orange-400" />
            <input type="radio" className="mask mask-star-2 bg-orange-400" />
            <input type="radio" className="mask mask-star-2 bg-orange-400" />
            <input type="radio" className="mask mask-star-2 bg-orange-400" />
          </div>
        </div>
      </div>
    ))}

  </div>
</div>

  )
}
