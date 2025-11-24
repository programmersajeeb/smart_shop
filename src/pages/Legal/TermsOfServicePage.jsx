import React from "react";

const TermsOfServicePage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body prose dark:prose-invert">
          <h1>Smart Shop – Terms of Service</h1>

          <p>
            These Terms of Service govern your use of Smart Shop’s website and
            services. By using our platform, you agree to follow the rules listed
            below.
          </p>

          <h2>1. Account Requirements</h2>
          <p>
            You must provide accurate information when creating an account and
            keep your login credentials secure.
          </p>

          <h2>2. Orders & Payments</h2>
          <p>
            By placing an order, you authorize Smart Shop to process your payment.
            Refunds follow our refund policy.
          </p>

          <h2>3. Intellectual Property</h2>
          <p>
            All content, branding, and materials on Smart Shop are protected by
            copyright laws.
          </p>

          <h2>4. Account Termination</h2>
          <p>
            Smart Shop reserves the right to suspend or terminate accounts that
            violate our policies or applicable laws.
          </p>

          <footer className="mt-8 text-sm opacity-70">
            © {new Date().getFullYear()} Smart Shop — All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
