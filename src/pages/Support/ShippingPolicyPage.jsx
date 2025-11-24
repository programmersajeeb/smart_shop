export default function ShippingPolicyPage() {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-6">Smart Shop – Shipping Policy</h1>

        <h2 className="text-2xl font-semibold mt-6 mb-3">Delivery Time</h2>
        <p className="opacity-70">
          Orders are delivered within 2–7 business days depending on the city or region.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">Shipping Charges</h2>
        <p className="opacity-70">Shipping fees vary based on product size and delivery location.</p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">Order Tracking</h2>
        <p className="opacity-70">
          Once your order is shipped, you will receive an SMS or email with a tracking link.
        </p>

        <h2 className="text-2xl font-semibold mt-6 mb-3">International Shipping</h2>
        <p className="opacity-70">Currently, Smart Shop ships only within Bangladesh.</p>
      </div>
    </div>
  );
}
