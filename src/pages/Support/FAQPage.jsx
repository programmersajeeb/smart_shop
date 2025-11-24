export default function FAQPage() {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold text-center mb-10">Smart Shop – FAQs</h1>

        <div className="space-y-4">
          <div className="collapse collapse-arrow bg-base-100 shadow">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium">
              How long does delivery take?
            </div>
            <div className="collapse-content">
              <p>Smart Shop usually delivers within 2–7 business days depending on your location.</p>
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 shadow">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium">
              What payment methods do you accept?
            </div>
            <div className="collapse-content">
              <p>We accept Credit/Debit Cards, Mobile Banking, and Cash on Delivery.</p>
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 shadow">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium">
              How can I cancel my order?
            </div>
            <div className="collapse-content">
              <p>You can request cancellation from your order details page before shipping.</p>
            </div>
          </div>

          <div className="collapse collapse-arrow bg-base-100 shadow">
            <input type="checkbox" />
            <div className="collapse-title text-lg font-medium">
              Do you offer warranty?
            </div>
            <div className="collapse-content">
              <p>Many of our products come with warranty depending on the seller and category.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
