import React from "react";

const PrivacyPolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body prose dark:prose-invert">
          <h1>Smart Shop – Privacy Policy</h1>

          <p>
            At Smart Shop, your privacy is important to us. This policy describes
            how we collect, use, and protect your personal information.
          </p>

          <h2>Information We Collect</h2>
          <ul>
            <li>Name, email, phone, and account details</li>
            <li>Order and purchase history</li>
            <li>Browser, device, and analytics data</li>
          </ul>

          <h2>How Smart Shop Uses Your Information</h2>
          <ul>
            <li>To process and deliver your orders</li>
            <li>To improve customer service and user experience</li>
            <li>To send updates, offers, and personalized suggestions</li>
          </ul>

          <h2>Data Protection</h2>
          <p>
            Smart Shop implements security measures to prevent unauthorized
            access, misuse, or disclosure of your information.
          </p>

          <h2>Your Rights</h2>
          <p>
            You can request access, update, or deletion of your personal data at
            any time by contacting our support team.
          </p>

          <footer className="mt-8 text-sm opacity-70">
            © {new Date().getFullYear()} Smart Shop — All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
