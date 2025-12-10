import { useState } from "react";

export default function MegaMenu() {
  const menus = [
    "NEW IN",
    "CLOTHING",
    "SHOES",
    "ACCESSORIES",
    "FACE + BODY",
    "SPORTSWEAR",
    "TOPSHOP",
    "BRANDS",
    "OUTLET",
  ];

  return (
    <div className="w-full bg-white border-t shadow-sm">
      {/* Desktop Menu */}
      <div className="hidden lg:flex gap-8 px-10 py-3 text-sm font-semibold relative">
        {menus.map((item, i) => (
          <div key={i} className="group relative cursor-pointer">
            <span className="hover:text-gray-600">{item}</span>

            {/* Hover Dropdown */}
            <div className="absolute left-0 top-full w-[900px] bg-white border shadow-xl hidden group-hover:block p-6 z-50">
              <div className="grid grid-cols-3 gap-6 text-sm">
                <div>
                  <h3 className="font-bold mb-3">Category</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>New Arrivals</li>
                    <li>Trending Now</li>
                    <li>Best Sellers</li>
                    <li>Limited Stock</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Shop By</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>Clothing</li>
                    <li>Shoes</li>
                    <li>Accessories</li>
                    <li>Beauty Items</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-bold mb-3">Highlights</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li>Flash Deals</li>
                    <li>New Releases</li>
                    <li>Premium Picks</li>
                    <li>Only On SmartShop</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Accordion Menu */}
      <div className="lg:hidden p-4">
        {menus.map((item, i) => (
          <MobileAccordion key={i} title={item} />
        ))}
      </div>
    </div>
  );
}

function MobileAccordion({ title }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b py-3">
      <div
        className="flex justify-between text-sm font-semibold"
        onClick={() => setOpen(!open)}
      >
        <span>{title}</span>
        <span>{open ? "−" : "+"}</span>
      </div>

      {open && (
        <div className="mt-3 text-gray-600 text-sm space-y-2 pl-2">
          <p>New Arrivals</p>
          <p>Trending Now</p>
          <p>Best Sellers</p>
          <p>Limited Stock</p>
        </div>
      )}
    </div>
  );
}
