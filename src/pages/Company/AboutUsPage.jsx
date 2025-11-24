export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-3xl text-center">
        <h1 className="text-4xl font-bold mb-4">About Smart Shop</h1>
        <p className="opacity-70 text-lg leading-relaxed">
          Smart Shop is a modern e-commerce platform dedicated to delivering the best
          online shopping experience. Our mission is to connect customers with high-quality
          products at affordable prices — quickly, safely, and reliably.
        </p>

        <p className="opacity-70 mt-4 text-lg leading-relaxed">
          Since launching, Smart Shop has grown into a trusted brand by focusing on customer
          satisfaction, smooth delivery, secure payments, and excellent product quality.
        </p>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-2">Our Values</h2>
          <ul className="list-disc list-inside text-left mx-auto max-w-md opacity-80">
            <li>Customer First</li>
            <li>Transparent Business</li>
            <li>Fast Delivery</li>
            <li>Reliable Support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
