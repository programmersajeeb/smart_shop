import { useEffect, useState } from "react";

function FlashSale() {

  // Sale end time — Today 11:59 PM
  const saleEnd = new Date();
  saleEnd.setHours(23, 59, 59, 999);

  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const diff = saleEnd - now;

      if (diff <= 0) {
        clearInterval(timer);
        return;
      }

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 mt-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-3xl md:text-4xl font-bold">Flash Sale</h2>

        {/* Timer */}
        <div className="flex gap-3 mt-3 md:mt-0">
          <div className="text-center">
            <p className="bg-black text-white px-3 py-1 rounded text-lg font-semibold">
              {String(timeLeft.hours).padStart(2, "0")}
            </p>
            <span className="text-xs text-gray-600">Hours</span>
          </div>

          <div className="text-center">
            <p className="bg-black text-white px-3 py-1 rounded text-lg font-semibold">
              {String(timeLeft.minutes).padStart(2, "0")}
            </p>
            <span className="text-xs text-gray-600">Minutes</span>
          </div>

          <div className="text-center">
            <p className="bg-black text-white px-3 py-1 rounded text-lg font-semibold">
              {String(timeLeft.seconds).padStart(2, "0")}
            </p>
            <span className="text-xs text-gray-600">Seconds</span>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">

        {/* Card 1 */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-white group cursor-pointer">
          <img
            src="https://i.ibb.co/WW3n1g60/women.jpg"
            className="h-56 w-full object-cover group-hover:scale-105 transition duration-500"
            alt="Product"
          />
          <div className="p-3">
            <p className="font-semibold">Women's Blazer</p>
            <p className="text-red-600 font-bold text-sm">$89 
              <span className="text-gray-400 line-through ml-1">$129</span>
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-white group cursor-pointer">
          <img
            src="https://i.ibb.co/0jp07SkZ/men.jpg"
            className="h-56 w-full object-cover group-hover:scale-105 transition duration-500"
            alt="Product"
          />
          <div className="p-3">
            <p className="font-semibold">Men's Jacket</p>
            <p className="text-red-600 font-bold text-sm">$99 
              <span className="text-gray-400 line-through ml-1">$149</span>
            </p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-white group cursor-pointer">
          <img
            src="https://i.ibb.co/bRMdDF5G/accessories.jpg"
            className="h-56 w-full object-cover group-hover:scale-105 transition duration-500"
            alt="Product"
          />
          <div className="p-3">
            <p className="font-semibold">Accessories</p>
            <p className="text-red-600 font-bold text-sm">$39 
              <span className="text-gray-400 line-through ml-1">$59</span>
            </p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="rounded-xl overflow-hidden shadow-sm bg-white group cursor-pointer">
          <img
            src="https://i.ibb.co/0jp07SkZ/men.jpg"
            className="h-56 w-full object-cover group-hover:scale-105 transition duration-500"
            alt="Product"
          />
          <div className="p-3">
            <p className="font-semibold">Hoodie</p>
            <p className="text-red-600 font-bold text-sm">$49 
              <span className="text-gray-400 line-through ml-1">$89</span>
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default FlashSale;
