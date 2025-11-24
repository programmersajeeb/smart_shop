import { Link } from "react-router-dom";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 text-center">
      <div className="max-w-md">
        <h1 className="text-4xl font-bold mb-4">🛠️ Smart Shop</h1>
        <p className="text-xl font-semibold mb-2">We’ll be back soon!</p>
        <p className="opacity-70 mb-6">
          Smart Shop is currently undergoing scheduled maintenance to improve your shopping experience.
          Please check back shortly.
        </p>

        <div className="mt-4">
          <Link to="/" className="btn btn-primary">Go to Homepage</Link>
        </div>
      </div>
    </div>
  );
}
