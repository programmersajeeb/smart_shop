import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { useState } from "react";
import ProductGrid from "./ProductGrid";

function AdvancedFilterPanel() {
  const [openMobileFilter, setOpenMobileFilter] = useState(false);

  return (
    <section className="w-full bg-white border-b">
      <div className="container mx-auto px-6 py-4">

        {/* TOP BAR (Mobile + Desktop) */}
        <div className="flex items-center justify-between gap-4">

          {/* MOBILE FILTER BUTTON */}
          <button
            onClick={() => setOpenMobileFilter(true)}
            className="
              flex items-center gap-2
              px-4 py-2 rounded-lg border
              md:hidden
            "
          >
            <SlidersHorizontal size={18} />
            Filters
          </button>

          {/* RESULT COUNT */}
          <p className="text-sm text-gray-600 hidden md:block">
            Showing 120 Products
          </p>

          {/* SORT DROPDOWN */}
          <div className="relative">
            <select
              className="
                select select-bordered select-sm
                focus:outline-none
              "
            >
              <option>Sort by: Newest</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
              <option>Best Selling</option>
              <option>Top Rated</option>
            </select>
          </div>
        </div>

        {/* DESKTOP FILTER SIDEBAR */}
        <div className="hidden md:grid grid-cols-4 gap-10 mt-8">

          {/* FILTERS */}
          <aside className="col-span-1 space-y-8">

            {/* PRICE */}
            <div>
              <h4 className="font-semibold mb-3">Price Range</h4>
              <input type="range" min="0" max="500" className="range range-sm" />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$0</span>
                <span>$500</span>
              </div>
            </div>

            {/* CATEGORY */}
            <div>
              <h4 className="font-semibold mb-3">Category</h4>
              <div className="space-y-2 text-sm">
                {["Men", "Women", "Accessories", "Kids"].map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="checkbox checkbox-sm" />
                    {c}
                  </label>
                ))}
              </div>
            </div>

            {/* SIZE */}
            <div>
              <h4 className="font-semibold mb-3">Size</h4>
              <div className="flex flex-wrap gap-2">
                {["S", "M", "L", "XL"].map((s) => (
                  <button
                    key={s}
                    className="px-3 py-1 border rounded-md text-sm hover:bg-black hover:text-white transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* AVAILABILITY */}
            <div>
              <h4 className="font-semibold mb-3">Availability</h4>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="checkbox checkbox-sm" />
                In Stock Only
              </label>
            </div>

            {/* CLEAR */}
            <button className="text-sm text-red-500 hover:underline">
              Clear All Filters
            </button>
          </aside>

          {/* PRODUCT GRID PLACEHOLDER */}
          <div className="col-span-3">
            {/* Product grid will be here */}
            <ProductGrid />
          </div>

        </div>
      </div>

      {/* MOBILE FILTER DRAWER */}
      {openMobileFilter && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden">
          <div className="absolute bottom-0 w-full bg-white rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Filters</h3>
              <button onClick={() => setOpenMobileFilter(false)}>✕</button>
            </div>

            {/* PRICE */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Price Range</h4>
              <input type="range" min="0" max="500" className="range range-sm" />
            </div>

            {/* CATEGORY */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Category</h4>
              {["Men", "Women", "Accessories", "Kids"].map((c) => (
                <label key={c} className="flex items-center gap-2 mb-2">
                  <input type="checkbox" className="checkbox checkbox-sm" />
                  {c}
                </label>
              ))}
            </div>

            {/* APPLY */}
            <button
              onClick={() => setOpenMobileFilter(false)}
              className="
                w-full bg-black text-white py-3
                rounded-xl font-semibold
              "
            >
              Apply Filters
            </button>

          </div>
        </div>
      )}
    </section>
  );
}

export default AdvancedFilterPanel;
