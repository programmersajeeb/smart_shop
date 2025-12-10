import React from 'react'

export default function Trending() {
  return (
    <div className="container mx-auto mt-20 px-4">
  <h2 className="text-3xl md:text-4xl font-bold text-center mb-10">
    Trending Now
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
    
    {/* Product 1 */}
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md bg-white">
      <div className="relative">
        <img
          src="https://i.ibb.co/WW3n1g60/women.jpg"
          className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
          alt="Trending Product"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">Women's Blazer</h3>
        <p className="text-gray-600 text-sm mt-1">$129</p>
      </div>
    </div>

    {/* Product 2 */}
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md bg-white">
      <img
        src="https://i.ibb.co/0jp07SkZ/men.jpg"
        className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
        alt="Trending Product"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">Men's Jacket</h3>
        <p className="text-gray-600 text-sm mt-1">$149</p>
      </div>
    </div>

    {/* Product 3 */}
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md bg-white">
      <img
        src="https://i.ibb.co/bRMdDF5G/accessories.jpg"
        className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
        alt="Trending Product"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">Leather Accessories</h3>
        <p className="text-gray-600 text-sm mt-1">$59</p>
      </div>
    </div>

    {/* Product 4 */}
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md bg-white">
      <img
        src="https://i.ibb.co/0jp07SkZ/men.jpg"
        className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
        alt="Trending Product"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">Classic Hoodie</h3>
        <p className="text-gray-600 text-sm mt-1">$89</p>
      </div>
    </div>

  </div>
</div>
  )
}
