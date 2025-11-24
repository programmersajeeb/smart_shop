import React from "react";

const CookiePolicyPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body prose dark:prose-invert">
          <h1>Smart Shop – Cookie Policy</h1>

          <p>
            This Cookie Policy explains how Smart Shop uses cookies and tracking
            technologies to enhance your browsing experience.
          </p>

          <h2>What Are Cookies?</h2>
          <p>
            Cookies are small text files stored on your device that help websites
            remember your preferences and improve functionality.
          </p>

          <h2>How Smart Shop Uses Cookies</h2>
          <ul>
            <li>To remember user preferences and login sessions</li>
            <li>To analyze website traffic and performance</li>
            <li>To offer personalized product recommendations</li>
          </ul>

          <h2>Managing Cookies</h2>
          <p>
            You may disable cookies in your browser settings. However, some
            features of Smart Shop may not function properly without cookies.
          </p>

          <footer className="mt-8 text-sm opacity-70">
            © {new Date().getFullYear()} Smart Shop — All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
