import React from "react";

export default function Trend({ item }) {
  if (!item) return null;

  const { title, price, images } = item;
  const img = images?.[0] || "https://placehold.co/600x600?text=Product";

  return (
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md bg-white">
      <div className="relative">
        <img
          src={img}
          className="h-64 w-full object-cover group-hover:scale-105 transition duration-500"
          alt={title || "Trending Product"}
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg line-clamp-2">{title}</h3>
        <p className="text-gray-600 text-sm mt-1">${price}</p>
      </div>
    </div>
  );
}
