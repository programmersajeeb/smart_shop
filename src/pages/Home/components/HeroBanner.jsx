import React from 'react';

export default function HeroBanner() {
    const heroImage = 'https://images.unsplash.com/photo-1568252748074-f9c8d964e834?q=80&w=1200&auto=format&fit=crop';
    return (
        <section className='container mx-auto px-4 py-8' aria-label="Hero — New season collection">
            {/* Main Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 bg-[#F9F4EF] rounded-lg overflow-hidden min-h-[500px]">
                <div className="flex flex-col justify-center items-start px-8 py-12 md:px-16 md:py-0 order-2 md:order-1">
                    <span className="text-sm font-bold tracking-widest uppercase text-gray-500 mb-2">
                        Summer 2025
                    </span>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-black leading-tight mb-6">
                        New Season’s<br />Collection
                    </h1>
                    <p className="text-gray-600 mb-8 max-w-md text-base md:text-lg">
                        Explore our latest arrival of premium clothing designed for comfort and style.
                    </p>
                    <a 
                        href="/shop" 
                        className="px-10 py-4 bg-black text-white hover:bg-gray-800 transition-colors uppercase text-sm tracking-widest font-medium"
                    >
                        Shop Now
                    </a>
                </div>
                <div className="relative w-full h-[350px] md:h-full order-1 md:order-2 bg-gray-200">
                    <img
                        src={heroImage}
                        alt="Woman wearing stylish beige outfit"
                        // SEO & Performance Optimization
                        loading="eager"
                        fetchPriority="high"
                        width="800"
                        height="800"
                        className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    />
                </div>
            </div>
        </section>
    );
}