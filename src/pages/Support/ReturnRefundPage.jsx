export default function ReturnRefundPage() {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-3xl">
        <h1 className="text-4xl font-bold text-center mb-6">Smart Shop – Return & Refund Policy</h1>
        <p className="opacity-70 leading-relaxed">
          At Smart Shop, we want every customer to be satisfied with their purchase.
          If you receive a damaged, defective, or incorrect item, you can request a return or refund.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Eligibility for Returns</h2>
        <ul className="list-disc list-inside opacity-80">
          <li>Product must be unused and in original packaging</li>
          <li>Return request must be submitted within 7 days</li>
          <li>Proof of purchase is required</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Refund Processing</h2>
        <p className="opacity-70">
          Refunds are processed within 3–10 business days depending on the payment method.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-3">Non-returnable Items</h2>
        <ul className="list-disc list-inside opacity-80">
          <li>Personal care items</li>
          <li>Opened electronics</li>
          <li>Custom or special order items</li>
        </ul>
      </div>
    </div>
  );
}
