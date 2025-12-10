import React from 'react'
import men from '../../../assets/men.png';
import women from '../../../assets/women.png';
import accessories from '../../../assets/accessories.png';

export default function Collections() {
  return (
    <>
         <div className="container mx-auto my-16 px-4">
    <h2 className="text-3xl md:text-4xl font-serif font-bold mb-10 text-center">
        Explore Our Collections
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Women's */}
        <div className="relative group cursor-pointer rounded-xl overflow-hidden">
            <img
                src={women}
                className="w-full h-[380px] object-cover group-hover:scale-110 transition duration-500"
                alt="Women"/>
            <div
                className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition duration-500 flex items-center justify-center">
                <h3 className="text-white text-3xl font-semibold">Women's</h3>
            </div>
        </div>

        {/* Men's */}
        <div className="relative group cursor-pointer rounded-xl overflow-hidden">
            <img
                src={men}
                className="w-full h-[380px] object-cover group-hover:scale-110 transition duration-500"
                alt="Men"/>
            <div
                className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition duration-500 flex items-center justify-center">
                <h3 className="text-white text-3xl font-semibold">Men's</h3>
            </div>
        </div>

        {/* Accessories */}
        <div className="relative group cursor-pointer rounded-xl overflow-hidden">
            <img
                src={accessories}
                className="w-full h-[380px] object-cover group-hover:scale-110 transition duration-500"
                alt="Accessories"/>
            <div
                className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition duration-500 flex items-center justify-center">
                <h3 className="text-white text-3xl font-semibold">Accessories</h3>
            </div>
        </div>

    </div>
</div>

    </>
  )
}
