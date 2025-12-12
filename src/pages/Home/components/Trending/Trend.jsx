import React from 'react'

export default function Trend({item}) {
    if (!item) return null; 
    const {title, price, images} = item;
  return (
        <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md bg-white">
      <div className="relative">
        <img
          src={images?.[0]}
          className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
          alt="Trending Product"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-600 text-sm mt-1">${price}</p>
      </div>
    </div>
  )
}
