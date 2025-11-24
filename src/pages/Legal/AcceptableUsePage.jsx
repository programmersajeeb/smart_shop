import React from "react";

const AcceptableUsePage = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body prose dark:prose-invert">
          <h1>Smart Shop – Acceptable Use Policy</h1>

          <p>
            This Acceptable Use Policy outlines the rules and restrictions for
            using Smart Shop’s website and services. By accessing or using our
            platform, you agree to follow the policies listed here.
          </p>

          <h2>1. Prohibited Activities</h2>
          <ul>
            <li>Illegal, fraudulent, or harmful activities</li>
            <li>Spamming, phishing, or unauthorized data collection</li>
            <li>Uploading or distributing malware, viruses, or harmful scripts</li>
            <li>Attempting to hack, exploit, or disrupt Smart Shop systems</li>
          </ul>

          <h2>2. User Responsibilities</h2>
          <p>
            You must comply with all applicable laws and ensure that the
            information you provide to Smart Shop is accurate and up to date.
          </p>

          <h2>3. Enforcement</h2>
          <p>
            Smart Shop reserves the right to suspend or terminate accounts,
            restrict access, or take legal action against users who violate this
            policy.
          </p>

          <footer className="mt-8 text-sm opacity-70">
            © {new Date().getFullYear()} Smart Shop — All rights reserved.
          </footer>
        </div>
      </div>
    </div>
  );
};

export default AcceptableUsePage;
