import { Link } from "react-router-dom";
import { Shirt, ShoppingBag, Watch, Gem, Baby, Gift } from "lucide-react";

function CategoryFilterBar() {
  const categories = [
    { name: "All", icon: ShoppingBag, url: "/shop" },
    { name: "Men", icon: Shirt, url: "/shop/men" },
    { name: "Women", icon: ShoppingBag, url: "/shop/women" },
    { name: "Accessories", icon: Watch, url: "/shop/accessories" },
    { name: "Jewelry", icon: Gem, url: "/shop/jewelry" },
    { name: "Kids", icon: Baby, url: "/shop/kids" },
    { name: "Gifts", icon: Gift, url: "/shop/gifts" },
  ];

  return (
    <section className="w-full bg-white py-4 border-b">
      <div className="container mx-auto px-6">

        {/* SCROLLABLE CATEGORY BAR */}
        <div className="
          flex gap-3 overflow-x-auto scrollbar-hide 
          md:justify-center md:gap-6
          py-2
        ">

          {categories.map((cat, index) => {
            const Icon = cat.icon;

            return (
              <Link
                key={index}
                to={cat.url}
                className="
                  flex items-center gap-2
                  px-4 py-2 rounded-full 
                  border bg-gray-50 
                  text-gray-700 text-sm font-medium
                  hover:bg-black hover:text-white hover:border-black
                  transition whitespace-nowrap
                "
              >
                <Icon size={18} />
                {cat.name}
              </Link>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default CategoryFilterBar;
