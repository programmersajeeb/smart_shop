import { SlidersHorizontal } from "lucide-react";

function SidebarFilter() {
  return (
    <aside className="hidden md:block w-full max-w-[260px]">
      <div className="sticky top-24">

        {/* HEADER */}
        <div className="flex items-center gap-2 mb-6">
          <SlidersHorizontal size={18} />
          <h3 className="font-semibold text-lg">Filters</h3>
        </div>

        {/* CATEGORY */}
        <div className="mb-8">
          <h4 className="font-medium mb-3">Category</h4>
          <div className="space-y-2 text-sm">
            {["Men", "Women", "Accessories", "Kids"].map((c) => (
              <label
                key={c}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input type="checkbox" className="checkbox checkbox-sm" />
                {c}
              </label>
            ))}
          </div>
        </div>

        {/* PRICE */}
        <div className="mb-8">
          <h4 className="font-medium mb-3">Price Range</h4>
          <input type="range" min="0" max="500" className="range range-sm" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$0</span>
            <span>$500</span>
          </div>
        </div>

        {/* SIZE */}
        <div className="mb-8">
          <h4 className="font-medium mb-3">Size</h4>
          <div className="flex flex-wrap gap-2">
            {["S", "M", "L", "XL"].map((s) => (
              <button
                key={s}
                className="
                  px-3 py-1 text-sm border rounded-md
                  hover:bg-black hover:text-white transition
                "
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* COLOR */}
        <div className="mb-8">
          <h4 className="font-medium mb-3">Color</h4>
          <div className="flex gap-3">
            {["black", "gray", "red", "blue"].map((color) => (
              <span
                key={color}
                className="w-6 h-6 rounded-full border cursor-pointer"
                style={{ backgroundColor: color }}
              ></span>
            ))}
          </div>
        </div>

        {/* BRAND */}
        <div className="mb-8">
          <h4 className="font-medium mb-3">Brand</h4>
          <div className="space-y-2 text-sm">
            {["Nike", "Adidas", "Zara", "H&M"].map((b) => (
              <label
                key={b}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input type="checkbox" className="checkbox checkbox-sm" />
                {b}
              </label>
            ))}
          </div>
        </div>

        {/* AVAILABILITY */}
        <div className="mb-8">
          <h4 className="font-medium mb-3">Availability</h4>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="checkbox checkbox-sm" />
            In Stock Only
          </label>
        </div>

        {/* CLEAR FILTER */}
        <button className="text-sm text-red-500 hover:underline">
          Clear All Filters
        </button>

      </div>
    </aside>
  );
}

export default SidebarFilter;
