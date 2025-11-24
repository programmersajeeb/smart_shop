export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-base-200 px-6 py-16 flex items-center justify-center">
      <div className="max-w-xl w-full">
        <h1 className="text-4xl font-bold text-center mb-6">Contact Smart Shop</h1>
        <p className="text-center opacity-70 mb-8">
          Have questions? Need help? Our support team is here for you.
        </p>

        <form className="bg-base-100 p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="label">
              <span className="label-text">Your Name</span>
            </label>
            <input type="text" className="input input-bordered w-full" placeholder="Enter your name" />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Email Address</span>
            </label>
            <input type="email" className="input input-bordered w-full" placeholder="Enter your email" />
          </div>

          <div>
            <label className="label">
              <span className="label-text">Message</span>
            </label>
            <textarea className="textarea textarea-bordered w-full" rows="4" placeholder="Write your message"></textarea>
          </div>

          <button className="btn btn-primary w-full">Send Message</button>
        </form>

        <div className="text-center mt-6 opacity-70">
          <p>Email: support@smartshop.com</p>
          <p>Phone: +880 1234-567890</p>
        </div>
      </div>
    </div>
  );
}
