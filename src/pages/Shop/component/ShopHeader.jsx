import { Home } from "lucide-react";

function ShopHeader() {
  return (
    <section className="w-full py-10 md:py-14 bg-gray-50 border-b">
      <div className="container mx-auto px-6">

        {/* Breadcrumb */}
        <div className="text-sm mb-4">
          <div className="breadcrumbs text-gray-600">
            <ul>
              <li>
                <Home size={16} className="inline-block mr-1" />
                <a href="/">Home</a>
              </li>
              <li className="font-semibold text-black">Shop</li>
            </ul>
          </div>
        </div>

        {/* Page Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Shop All Products
        </h1>

        {/* Subtitle */}
        <p className="text-gray-600 mt-2 max-w-xl">
          Discover our latest collections, trending fashion, accessories, and more.
          Shop with confidence—premium quality guaranteed.
        </p>

      </div>
    </section>
  );
}

export default ShopHeader;
